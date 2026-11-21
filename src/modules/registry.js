"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { ModuleError } = require("./errors");

const REGISTRY_SCHEMA = 1;
const DB_FILE = "modules.sqlite";

function readVersion(db) {
  return Number(db.prepare("PRAGMA user_version").get().user_version) || 0;
}

function openRegistry(options) {
  const dataDir = path.resolve(options.dataDir);
  const now = options.now || (() => new Date());
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, DB_FILE);
  const existed = fs.existsSync(dbPath);
  if (existed) {
    let probe;
    try {
      probe = new DatabaseSync(dbPath, { readOnly: true });
      const found = readVersion(probe);
      const integrity = probe.prepare("PRAGMA integrity_check").get().integrity_check;
      probe.close();
      probe = null;
      if (found > REGISTRY_SCHEMA) {
        return unavailable(dbPath, "incompatible", "Die Moduldatenbank stammt aus einer neueren Programmversion. Sie wurde nicht verändert und nicht gelöscht.");
      }
      if (integrity !== "ok") {
        return unavailable(dbPath, "corrupt", "Die Moduldatenbank ist beschädigt. Sie wurde nicht gelöscht. Die Lerndaten des Cores bleiben getrennt.");
      }
    } catch (error) {
      if (probe) probe.close();
      return unavailable(dbPath, "corrupt", "Die Moduldatenbank lässt sich nicht lesen. Sie wurde nicht gelöscht.");
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  if (readVersion(db) < 1) {
    db.exec("BEGIN");
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS module_install (
          id TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          trust TEXT NOT NULL,
          state TEXT NOT NULL,
          manifest_json TEXT NOT NULL,
          install_path TEXT NOT NULL,
          installed_at TEXT NOT NULL,
          fault_reason TEXT,
          size_bytes INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS module_kv (
          module_id TEXT NOT NULL,
          key TEXT NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (module_id, key)
        );
        CREATE TABLE IF NOT EXISTS module_notice (
          id INTEGER PRIMARY KEY,
          module_id TEXT,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
      db.exec("PRAGMA user_version = 1");
      db.exec("COMMIT");
    } catch (error) {
      try { db.exec("ROLLBACK"); } catch (rollbackError) { /* Die Datei bleibt liegen. */ }
      db.close();
      throw new ModuleError("registry-failed", "Die Moduldatenbank konnte nicht angelegt werden. Vorhandene Dateien wurden nicht gelöscht.", { cause: error.message });
    }
  }

  return {
    available: true,
    path: dbPath,
    schemaVersion: readVersion(db),
    now,
    db,
    close() {
      db.close();
    }
  };
}

function unavailable(dbPath, code, message) {
  return {
    available: false,
    path: dbPath,
    schemaVersion: null,
    code,
    message,
    close() {}
  };
}

module.exports = { REGISTRY_SCHEMA, DB_FILE, openRegistry };
