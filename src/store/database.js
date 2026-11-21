"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const APP_SCHEMA = 2;
const DB_FILE = "academy.sqlite";
const KEY_MAX = 512;
const VALUE_MAX = 1500000;
const SETTINGS_KEY = "academy.desktop.settings";
const EXPORT_FORMAT = "desoworks.academy.export";
const LEGACY_EXPORT_FORMAT = "desoworks.it-ausbildung.export";
const EXPORT_FORMAT_VERSION = 1;
const DEFAULT_MAX_BACKUPS = 12;
const DEFAULT_INTERVAL_HOURS = 24;

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
  return now().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomBytes(3).toString("hex");
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

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stable(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function checksumOf(body) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(body))).digest("hex");
}

function inspectSqlite(file, targetSchema) {
  let probe;
  try {
    probe = new DatabaseSync(file, { readOnly: true });
    const found = readVersion(probe);
    const integrity = probe.prepare("PRAGMA integrity_check").get().integrity_check;
    probe.close();
    probe = null;
    return {
      ok: integrity === "ok",
      schema: found,
      newer: found > targetSchema,
      integrity
    };
  } catch (error) {
    if (probe) probe.close();
    return { ok: false, schema: null, newer: false, unreadable: true, cause: error.message };
  }
}

function clampPolicy(raw) {
  const intervalHours = Number(raw && raw.intervalHours);
  const maxBackups = Number(raw && raw.maxBackups);
  return {
    intervalHours: Number.isFinite(intervalHours) ? Math.min(8760, Math.max(0, Math.floor(intervalHours))) : DEFAULT_INTERVAL_HOURS,
    maxBackups: Number.isInteger(maxBackups) ? Math.min(100, Math.max(3, maxBackups)) : DEFAULT_MAX_BACKUPS
  };
}

function openDatabase(options) {
  const dataDir = path.resolve(options.dataDir);
  const targetSchema = options.targetSchema == null ? APP_SCHEMA : Number(options.targetSchema);
  const now = options.now || (() => new Date());
  const migrations = options.migrations || MIGRATIONS;
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
    const check = inspectSqlite(dest, targetSchema);
    if (!check.ok) {
      fs.unlinkSync(dest);
      throw new AcademyStoreError(
        "backup-failed",
        "Die Sicherung vor der Migration ist nicht intakt. Die Migration wurde nicht gestartet und nicht als erfolgreich gewertet.",
        { dest }
      );
    }
    backups.push(dest);
  }
  for (const migration of migrations) {
    if (migration.version <= before) continue;
    if (migration.version > targetSchema) break;
    db.exec("BEGIN");
    try {
      migration.up(db);
      setVersion(db, migration.version);
      db.exec("COMMIT");
    } catch (error) {
      try { db.exec("ROLLBACK"); } catch (rollbackError) { /* Die Datei bleibt liegen. */ }
      throw new AcademyStoreError(
        "migration-failed",
        "Die Datenbankmigration ist fehlgeschlagen. Die Datei wurde nicht gelöscht.",
        { cause: error.message, version: migration.version, dbPath }
      );
    }
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
    profiles() {
      if (api.schemaVersion < 2) return [];
      return db.prepare("SELECT id, name, created_at FROM learner_profile ORDER BY id").all();
    },
    events() {
      if (api.schemaVersion < 2) return [];
      return db.prepare("SELECT id, profile_id, kind, payload, created_at FROM learning_event ORDER BY id").all();
    },
    readPolicy() {
      let parsed = {};
      try {
        parsed = JSON.parse(api.get(SETTINGS_KEY) || "{}");
      } catch (error) {
        parsed = {};
      }
      return clampPolicy(parsed);
    },
    writePolicy(partial) {
      const next = clampPolicy(Object.assign({}, api.readPolicy(), partial || {}));
      api.set(SETTINGS_KEY, JSON.stringify(next));
      return next;
    },
    backup(prefix) {
      const dest = path.join(backupDir, `${prefix || "manual"}-${stamp(now)}.sqlite`);
      try {
        vacuumInto(db, dest);
      } catch (error) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        throw new AcademyStoreError(
          "backup-failed",
          "Die Sicherung ist fehlgeschlagen und wird nicht als erfolgreich angezeigt.",
          { cause: error.message }
        );
      }
      const check = inspectSqlite(dest, targetSchema);
      if (!check.ok) {
        fs.unlinkSync(dest);
        throw new AcademyStoreError(
          "backup-failed",
          "Die Sicherung ist nicht intakt und wurde nicht als erfolgreich gespeichert.",
          { integrity: check.integrity || null }
        );
      }
      api.pruneBackups(api.readPolicy().maxBackups);
      if (!fs.existsSync(dest)) {
        throw new AcademyStoreError("backup-failed", "Die neue Sicherung fehlt nach der Prüfung. Es wird kein Erfolg gemeldet.");
      }
      return dest;
    },
    listBackups() {
      return fs.readdirSync(backupDir)
        .filter((name) => name.endsWith(".sqlite"))
        .map((name) => {
          const full = path.join(backupDir, name);
          const stat = fs.statSync(full);
          return { name, path: full, bytes: stat.size, mtimeMs: stat.mtimeMs };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);
    },
    lastBackup() {
      const entries = api.listBackups();
      if (!entries.length) return null;
      const newest = entries[0];
      const check = inspectSqlite(newest.path, targetSchema);
      return {
        name: newest.name,
        bytes: newest.bytes,
        mtimeMs: newest.mtimeMs,
        intact: check.ok === true,
        schema: check.schema
      };
    },
    pruneBackups(maxKeep) {
      const limit = clampPolicy({ maxBackups: maxKeep }).maxBackups;
      const deleted = [];
      const protectedNames = [];
      const candidates = [];
      for (const entry of api.listBackups()) {
        const info = inspectSqlite(entry.path, targetSchema);
        const milestone = /^(pre-migration|pre-update|pre-import|pre-restore)-/.test(entry.name);
        if (!info.ok || info.newer || info.unreadable || milestone) {
          protectedNames.push(entry.name);
          continue;
        }
        candidates.push(entry);
      }
      for (const entry of candidates.slice(limit)) {
        fs.unlinkSync(entry.path);
        deleted.push(entry.name);
      }
      return { deleted, protected: protectedNames };
    },
    ensureScheduledBackup(at) {
      const policy = api.readPolicy();
      if (policy.intervalHours <= 0) return { ok: true, created: false, reason: "disabled" };
      const latest = api.lastBackup();
      const moment = at || now();
      if (latest && latest.intact) {
        const age = moment.getTime() - latest.mtimeMs;
        if (age < policy.intervalHours * 60 * 60 * 1000) {
          return { ok: true, created: false, reason: "fresh", last: latest };
        }
      }
      return { ok: true, created: true, backup: api.backup("interval"), reason: "due" };
    },
    exportBundle(appVersion) {
      const body = {
        format: EXPORT_FORMAT,
        formatVersion: EXPORT_FORMAT_VERSION,
        appVersion: String(appVersion || "0.0.0"),
        schemaVersion: api.schemaVersion,
        exportedAt: now().toISOString(),
        items: api.all(),
        profiles: api.profiles(),
        events: api.events()
      };
      return JSON.stringify(Object.assign({ checksum: checksumOf(body) }, body), null, 2);
    },
    exportJson(appVersion) {
      return api.exportBundle(appVersion);
    },
    importBundle(raw, options) {
      const choice = options || {};
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new AcademyStoreError("invalid-import", "Die Importdatei ist kein gültiges JSON. Es wurde nichts geändert.");
      }
      const normalized = normalizeImport(parsed, choice);
      if (normalized.schemaVersion > targetSchema) {
        throw new AcademyStoreError(
          "incompatible",
          "Der Export stammt aus einer neueren Programmversion. Die vorhandenen Daten bleiben unverändert.",
          { found: normalized.schemaVersion, supported: targetSchema }
        );
      }
      if (choice.mode !== "merge" && choice.mode !== "replace") {
        throw new AcademyStoreError(
          "invalid-import",
          "Der Importmodus fehlt. Erlaubt sind nur Zusammenführen oder Ersetzen. Es wurde nichts geändert."
        );
      }
      const occupied = Object.keys(api.all()).length > 0 || api.profiles().length > 0 || api.events().length > 0;
      if (occupied && choice.confirm !== true) {
        throw new AcademyStoreError(
          "confirm-required",
          "Vorhandene Ausbildungsdaten werden nicht überschrieben. Der Import braucht eine ausdrückliche Bestätigung."
        );
      }
      const backup = api.backup("pre-import");
      db.exec("BEGIN");
      try {
        if (choice.mode === "replace") {
          db.exec("DELETE FROM kv");
          if (api.schemaVersion >= 2) {
            db.exec("DELETE FROM learning_event");
            db.exec("DELETE FROM learner_profile");
          }
        }
        for (const [key, value] of Object.entries(normalized.items)) {
          if (typeof value !== "string") {
            throw new AcademyStoreError("invalid-import", "Ein Eintrag ist kein Text. Der Import wurde zurückgenommen.");
          }
          api.set(key, value);
        }
        if (normalized.profiles.length || normalized.events.length) {
          if (api.schemaVersion < 2) {
            throw new AcademyStoreError("incompatible", "Profile aus dem Export passen nicht zu dieser Datenbank. Es wurde nichts übernommen.");
          }
          const insertProfile = db.prepare("INSERT OR REPLACE INTO learner_profile (id, name, created_at) VALUES (?, ?, ?)");
          for (const profile of normalized.profiles) {
            if (!profile || typeof profile.name !== "string") {
              throw new AcademyStoreError("invalid-import", "Ein Profil im Export ist ungültig. Der Import wurde zurückgenommen.");
            }
            insertProfile.run(Number(profile.id), profile.name, String(profile.created_at || now().toISOString()));
          }
          const insertEvent = db.prepare("INSERT OR REPLACE INTO learning_event (id, profile_id, kind, payload, created_at) VALUES (?, ?, ?, ?, ?)");
          for (const event of normalized.events) {
            if (!event || typeof event.kind !== "string" || typeof event.payload !== "string") {
              throw new AcademyStoreError("invalid-import", "Ein Lernereignis im Export ist ungültig. Der Import wurde zurückgenommen.");
            }
            insertEvent.run(Number(event.id), event.profile_id == null ? null : Number(event.profile_id), event.kind, event.payload, String(event.created_at || now().toISOString()));
          }
        }
        db.exec("COMMIT");
      } catch (error) {
        try { db.exec("ROLLBACK"); } catch (rollbackError) { /* Stand vor dem Import bleibt. */ }
        if (error instanceof AcademyStoreError) throw error;
        throw new AcademyStoreError("import-aborted", "Der Import wurde abgebrochen. Die vorhandenen Daten sind unverändert.", { cause: error.message, backup });
      }
      return { ok: true, backup, count: Object.keys(normalized.items).length, mode: choice.mode };
    },
    importJson(raw, mode) {
      return api.importBundle(raw, { mode: mode === "replace" ? "replace" : "merge", confirm: true });
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
    const check = inspectSqlite(resolved, targetSchema);
    if (check.newer) {
      throw new AcademyStoreError("incompatible", "Die Sicherung stammt aus einer neueren Programmversion. Die aktuelle Datenbank bleibt unverändert.", { found: check.schema, supported: targetSchema });
    }
    if (!check.ok) {
      throw new AcademyStoreError("corrupt", "Die Sicherung ist unvollständig oder beschädigt. Die aktuelle Datenbank bleibt unverändert.");
    }
    const safety = api.backup("pre-restore");
    api.close();
    try {
      fs.copyFileSync(resolved, dbPath);
    } catch (error) {
      fs.copyFileSync(safety, dbPath);
      throw new AcademyStoreError("restore-failed", "Die Wiederherstellung ist fehlgeschlagen. Die vorherige Datenbank wurde zurückgelegt.", { cause: error.message });
    }
    try {
      return openDatabase({ dataDir, targetSchema, now, migrations });
    } catch (error) {
      fs.copyFileSync(safety, dbPath);
      throw new AcademyStoreError("restore-failed", "Die wiederhergestellte Datenbank ließ sich nicht öffnen. Der vorherige Stand wurde zurückgelegt.", { cause: error.message });
    }
  };

  return api;
}

function normalizeImport(parsed, choice) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AcademyStoreError("invalid-import", "Die Importdatei hat kein gültiges Format. Es wurde nichts geändert.");
  }
  if (!parsed.format && parsed.items && typeof parsed.items === "object" && !Array.isArray(parsed.items)) {
    if (choice.allowLegacy !== true) {
      throw new AcademyStoreError(
        "legacy-unconfirmed",
        "Das ist ein älterer Export ohne Prüfsumme. Er wird nur nach ausdrücklicher Bestätigung übernommen. Es wurde nichts geändert."
      );
    }
    return {
      formatVersion: 0,
      schemaVersion: Number(parsed.schema) || 1,
      items: parsed.items,
      profiles: [],
      events: []
    };
  }
  const legacyFormat = parsed.format === LEGACY_EXPORT_FORMAT;
  if (legacyFormat && choice.allowLegacy !== true) {
    throw new AcademyStoreError("legacy-unconfirmed", "Das ist ein Export im älteren Format der IT-Ausbildung. Er wird nicht stillschweigend als Academy-Daten übernommen. Es wurde nichts geändert.");
  }
  if (parsed.format !== EXPORT_FORMAT && !legacyFormat) {
    throw new AcademyStoreError("invalid-import", "Die Datei ist kein Export von DesoWorks Academy. Es wurde nichts geändert.");
  }
  const formatVersion = Number(parsed.formatVersion);
  if (!Number.isInteger(formatVersion) || formatVersion < 1) {
    throw new AcademyStoreError("invalid-import", "Die Formatversion fehlt. Es wurde nichts geändert.");
  }
  if (formatVersion > EXPORT_FORMAT_VERSION) {
    throw new AcademyStoreError(
      "incompatible",
      "Der Export verwendet ein neueres Dateiformat. Die vorhandenen Daten bleiben unverändert.",
      { found: formatVersion, supported: EXPORT_FORMAT_VERSION }
    );
  }
  const body = Object.assign({}, parsed);
  delete body.checksum;
  if (typeof parsed.checksum !== "string" || parsed.checksum.toLowerCase() !== checksumOf(body)) {
    throw new AcademyStoreError("invalid-import", "Die Prüfsumme des Exports stimmt nicht. Es wurde nichts geändert.");
  }
  if (!body.items || typeof body.items !== "object" || Array.isArray(body.items)) {
    throw new AcademyStoreError("invalid-import", "Die Importdatei enthält keine Einträge. Es wurde nichts geändert.");
  }
  return {
    formatVersion,
    schemaVersion: Number(body.schemaVersion) || 1,
    items: body.items,
    profiles: Array.isArray(body.profiles) ? body.profiles : [],
    events: Array.isArray(body.events) ? body.events : []
  };
}

module.exports = {
  APP_SCHEMA,
  DB_FILE,
  EXPORT_FORMAT,
  LEGACY_EXPORT_FORMAT,
  EXPORT_FORMAT_VERSION,
  SETTINGS_KEY,
  AcademyStoreError,
  MIGRATIONS,
  inspectSqlite,
  openDatabase
};
