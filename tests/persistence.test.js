"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { AcademyStoreError, EXPORT_FORMAT, openDatabase } = require("../src/store/database");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-persist-"));
}

test("fehlgeschlagene Migration löscht die Datenbank nicht", () => {
  const dir = tempDir();
  const broken = [
    {
      version: 1,
      up(db) {
        db.exec("CREATE TABLE kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");
      }
    },
    {
      version: 2,
      up() {
        throw new Error("migration absichtlich abgebrochen");
      }
    }
  ];
  const first = openDatabase({ dataDir: dir, targetSchema: 1, migrations: broken });
  first.set("fortschritt", "behalten");
  first.close();
  const dbPath = path.join(dir, "academy.sqlite");
  assert.throws(
    () => openDatabase({ dataDir: dir, targetSchema: 2, migrations: broken }),
    (error) => error instanceof AcademyStoreError && error.code === "migration-failed"
  );
  assert.equal(fs.existsSync(dbPath), true);
  const raw = new DatabaseSync(dbPath, { readOnly: true });
  const saved = raw.prepare("SELECT value FROM kv WHERE key = ?").get("fortschritt");
  assert.equal(saved.value, "behalten");
  raw.close();
});

test("unvollständige Sicherung wird nicht eingespielt", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir });
  store.set("fortschritt", "aktuell");
  const broken = path.join(store.backupDir, "manual-unvollstaendig.sqlite");
  fs.writeFileSync(broken, "kein sqlite");
  assert.throws(
    () => store.restore(broken),
    (error) => error instanceof AcademyStoreError && error.code === "corrupt"
  );
  assert.equal(store.get("fortschritt"), "aktuell");
  store.close();
});

test("Export trägt Format, Schema und Prüfsumme, Import ohne Bestätigung ändert nichts", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir, now: () => new Date("2026-03-01T00:00:00Z") });
  store.set("it-ausbildung.fortschritt", JSON.stringify({ modul: "raid-labor", stand: 2 }));
  store.set("it-ausbildung.einstellung", JSON.stringify({ schrift: "gross" }));
  const raw = store.exportBundle("0.2.0");
  const parsed = JSON.parse(raw);
  assert.equal(parsed.format, EXPORT_FORMAT);
  assert.equal(parsed.formatVersion, 1);
  assert.equal(parsed.schemaVersion, 2);
  assert.equal(typeof parsed.checksum, "string");
  store.set("it-ausbildung.fortschritt", JSON.stringify({ modul: "raid-labor", stand: 9 }));
  assert.throws(
    () => store.importBundle(raw, { mode: "replace" }),
    (error) => error.code === "confirm-required"
  );
  assert.equal(JSON.parse(store.get("it-ausbildung.fortschritt")).stand, 9);
  const imported = store.importBundle(raw, { mode: "replace", confirm: true });
  assert.equal(imported.ok, true);
  assert.equal(JSON.parse(store.get("it-ausbildung.fortschritt")).stand, 2);
  assert.equal(JSON.parse(store.get("it-ausbildung.einstellung")).schrift, "gross");
  store.close();
});

test("abgebrochener Import setzt vorhandene Daten zurück", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir });
  store.set("fortschritt", "bleibt");
  const raw = store.exportBundle("0.2.0");
  const parsed = JSON.parse(raw);
  parsed.items.fortschritt = "neu";
  parsed.items.kaputt = 12;
  const body = Object.assign({}, parsed);
  delete body.checksum;
  const { createHash } = require("node:crypto");
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
  parsed.checksum = createHash("sha256").update(JSON.stringify(stable(body))).digest("hex");
  assert.throws(
    () => store.importBundle(JSON.stringify(parsed), { mode: "replace", confirm: true }),
    (error) => error.code === "invalid-import"
  );
  assert.equal(store.get("fortschritt"), "bleibt");
  store.close();
});

test("älterer Export braucht ausdrückliche Freigabe, neueres Format wird nicht gelöscht", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir });
  store.set("fortschritt", "bleibt");
  const legacy = JSON.stringify({ schema: 1, items: { fortschritt: "alt" } });
  assert.throws(() => store.importBundle(legacy, { mode: "merge", confirm: true }), (error) => error.code === "legacy-unconfirmed");
  assert.equal(store.get("fortschritt"), "bleibt");
  const taken = store.importBundle(legacy, { mode: "merge", confirm: true, allowLegacy: true });
  assert.equal(taken.ok, true);
  assert.equal(store.get("fortschritt"), "alt");
  const future = store.exportBundle("0.2.0");
  const parsed = JSON.parse(future);
  parsed.formatVersion = 9;
  assert.throws(
    () => store.importBundle(JSON.stringify(parsed), { mode: "replace", confirm: true }),
    (error) => error.code === "incompatible"
  );
  assert.equal(store.get("fortschritt"), "alt");
  store.close();
});

test("Aufbewahrung löscht keine neuere Sicherung", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir, now: () => new Date("2026-04-01T00:00:00Z") });
  store.writePolicy({ maxBackups: 1, intervalHours: 0 });
  store.set("fortschritt", "eins");
  const newer = store.backup("manual");
  const raw = new DatabaseSync(newer);
  raw.exec("PRAGMA user_version = 9");
  raw.close();
  store.set("fortschritt", "zwei");
  const current = store.backup("manual");
  assert.equal(fs.existsSync(newer), true);
  assert.equal(fs.existsSync(current), true);
  const pruned = store.pruneBackups(1);
  assert.equal(pruned.protected.includes(path.basename(newer)), true);
  assert.equal(fs.existsSync(newer), true);
  store.close();
});

test("falsche Prüfsumme ändert nichts", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir });
  store.set("fortschritt", "bleibt");
  const parsed = JSON.parse(store.exportBundle("0.2.0"));
  parsed.checksum = "a".repeat(64);
  parsed.items.fortschritt = "fremd";
  assert.throws(
    () => store.importBundle(JSON.stringify(parsed), { mode: "replace", confirm: true }),
    (error) => error.code === "invalid-import"
  );
  assert.equal(store.get("fortschritt"), "bleibt");
  store.close();
});
