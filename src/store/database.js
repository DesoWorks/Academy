"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const APP_SCHEMA = 2;
const DB_FILE = "academy.sqlite";
const KEY_MAX = 512;
const VALUE_MAX = 1500000;

class AcademyStoreError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "AcademyStoreError";
    this.code = code;
    this.details = details || null;
  }
}

const MIGRATIONS = [
  {
    version: 1,
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
    }
  },
  {
    version: 2,
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS learner_profile (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS learning_event (
          id INTEGER PRIMARY KEY,
          profile_id INTEGER,
          kind TEXT NOT NULL,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
    }
  }
];

function stamp(now) {
  return now().toISOString().replace(/[:.]/g, "-");
}

function sqlPath(file) {
  return file.replace(/\\/g, "/").replace(/'/g, "''");
}

function readVersion(db) {
  return Number(db.prepare("PRAGMA user_version").get().user_version) || 0;
}

function setVersion(db, version) {
  db.exec(`PRAGMA user_version = ${Number(version)}`);
}

function vacuumInto(db, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  db.exec(`VACUUM INTO '${sqlPath(dest)}'`);
}

function assertKey(key) {
  if (typeof key !== "string" || key.length < 1 || key.length > KEY_MAX) {
    throw new AcademyStoreError("invalid-key", "Der Speicherschlüssel ist ungültig.");
  }
  if (/[\u0000-\u001f]/.test(key)) {
    throw new AcademyStoreError("invalid-key", "Der Speicherschlüssel enthält Steuerzeichen.");
  }
  return key;
}

function assertValue(value) {
  if (typeof value !== "string") {
    throw new AcademyStoreError("invalid-value", "Gespeichert werden nur Texte.");
  }
  if (value.length > VALUE_MAX) {
    throw new AcademyStoreError("invalid-value", "Der Eintrag ist zu groß und wurde nicht gespeichert.");
  }
  return value;
}

function openDatabase(options) {
  const dataDir = path.resolve(options.dataDir);
  const targetSchema = options.targetSchema == null ? APP_SCHEMA : Number(options.targetSchema);
  const now = options.now || (() => new Date());
  const dbPath = path.join(dataDir, DB_FILE);
  const backupDir = path.join(dataDir, "backups");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });

  const existed = fs.existsSync(dbPath);
  if (existed) {
    let probe;
    try {
      probe = new DatabaseSync(dbPath, { readOnly: true });
      const found = readVersion(probe);
      probe.close();
      probe = null;
      if (found > targetSchema) {
        throw new AcademyStoreError(
          "incompatible",
          "Die Lerndaten stammen aus einer neueren Programmversion. Sie wurden nicht verändert und nicht gelöscht.",
          { found, supported: targetSchema, dbPath }
        );
      }
    } catch (error) {
      if (probe) probe.close();
      if (error instanceof AcademyStoreError) throw error;
      throw new AcademyStoreError(
        "corrupt",
        "Die Lerndatenbank lässt sich nicht lesen. Die Datei wurde nicht gelöscht.",
        { dbPath, cause: error.message }
      );
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  const before = readVersion(db);
  const backups = [];
  if (before < targetSchema && existed && before > 0) {
    const dest = path.join(backupDir, `pre-migration-v${before}-to-v${targetSchema}-${stamp(now)}.sqlite`);
    vacuumInto(db, dest);
    backups.push(dest);
  }
  for (const migration of MIGRATIONS) {
    if (migration.version <= before) continue;
    if (migration.version > targetSchema) break;
    migration.up(db);
    setVersion(db, migration.version);
  }

  const api = {
    path: dbPath,
    backupDir,
    schemaVersion: readVersion(db),
    backupsCreated: backups,
    get(key) {
      const row = db.prepare("SELECT value FROM kv WHERE key = ?").get(assertKey(key));
      return row ? row.value : null;
    },
    set(key, value, at) {
      const safeKey = assertKey(key);
      const safeValue = assertValue(value);
      const updated = at || now().toISOString();
      db.prepare(`
        INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(safeKey, safeValue, updated);
      return { ok: true };
    },
    remove(key) {
      db.prepare("DELETE FROM kv WHERE key = ?").run(assertKey(key));
      return { ok: true };
    },
    clear() {
      const backup = api.backup("pre-clear");
      db.exec("DELETE FROM kv");
      return { ok: true, backup };
    },
    all() {
      const items = {};
      for (const row of db.prepare("SELECT key, value FROM kv ORDER BY key").all()) {
        items[row.key] = row.value;
      }
      return items;
    },
    backup(prefix) {
      const dest = path.join(backupDir, `${prefix || "manual"}-${stamp(now)}.sqlite`);
      vacuumInto(db, dest);
      return dest;
    },
    listBackups() {
      return fs.readdirSync(backupDir)
        .filter((name) => name.endsWith(".sqlite"))
        .map((name) => {
          const full = path.join(backupDir, name);
          return { name, path: full, bytes: fs.statSync(full).size, mtimeMs: fs.statSync(full).mtimeMs };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);
    },
    exportJson() {
      return JSON.stringify({ schema: api.schemaVersion, items: api.all() });
    },
    importJson(raw, mode) {
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new AcademyStoreError("invalid-import", "Die Importdatei ist kein gültiges JSON. Es wurde nichts geändert.");
      }
      if (!parsed || typeof parsed.items !== "object" || Array.isArray(parsed.items)) {
        throw new AcademyStoreError("invalid-import", "Die Importdatei enthält keine Einträge. Es wurde nichts geändert.");
      }
      const backup = api.backup("pre-import");
      if (mode === "replace") db.exec("DELETE FROM kv");
      for (const [key, value] of Object.entries(parsed.items)) {
        api.set(key, String(value));
      }
      return { ok: true, backup, count: Object.keys(parsed.items).length };
    },
    close() {
      db.close();
    }
  };

  api.restore = function restore(backupPath) {
    const resolved = path.resolve(backupPath);
    const root = path.resolve(backupDir);
    const relative = path.relative(root, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !resolved.endsWith(".sqlite")) {
      throw new AcademyStoreError("invalid-backup", "Nur Sicherungen aus dem Datenverzeichnis können wiederhergestellt werden.");
    }
    if (!fs.existsSync(resolved)) {
      throw new AcademyStoreError("missing-backup", "Die Sicherung ist nicht vorhanden. Die aktuellen Daten bleiben unverändert.");
    }
    let probe;
    try {
      probe = new DatabaseSync(resolved, { readOnly: true });
      const found = readVersion(probe);
      const integrity = probe.prepare("PRAGMA integrity_check").get().integrity_check;
      probe.close();
      probe = null;
      if (found > targetSchema) {
        throw new AcademyStoreError("incompatible", "Die Sicherung stammt aus einer neueren Programmversion. Die aktuelle Datenbank bleibt unverändert.", { found, supported: targetSchema });
      }
      if (integrity !== "ok") {
        throw new AcademyStoreError("corrupt", "Die Sicherung ist beschädigt. Die aktuelle Datenbank bleibt unverändert.");
      }
    } catch (error) {
      if (probe) probe.close();
      if (error instanceof AcademyStoreError) throw error;
      throw new AcademyStoreError("corrupt", "Die Sicherung lässt sich nicht lesen. Die aktuelle Datenbank bleibt unverändert.", { cause: error.message });
    }
    const safety = api.backup("pre-restore");
    api.close();
    try {
      fs.copyFileSync(resolved, dbPath);
    } catch (error) {
      fs.copyFileSync(safety, dbPath);
      throw new AcademyStoreError("restore-failed", "Die Wiederherstellung ist fehlgeschlagen. Die vorherige Datenbank wurde zurückgelegt.", { cause: error.message });
    }
    return openDatabase({ dataDir, targetSchema, now });
  };

  return api;
}

module.exports = {
  APP_SCHEMA,
  DB_FILE,
  AcademyStoreError,
  MIGRATIONS,
  openDatabase
};
