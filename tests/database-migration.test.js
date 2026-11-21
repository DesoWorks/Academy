"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { AcademyStoreError, openDatabase } = require("../src/store/database");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-db-"));
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

test("Update von Schema A auf Schema B behält Lernfortschritte", () => {
  const dir = tempDir();
  const versionA = openDatabase({ dataDir: dir, targetSchema: 1, now: () => new Date("2026-01-01T00:00:00Z") });
  versionA.set("it-ausbildung.fortschritt", JSON.stringify({ modul: "windows-labor", stand: 4, bewertung: "bestanden" }));
  versionA.set("it-ausbildung.einstellung", JSON.stringify({ schrift: "gross" }));
  assert.equal(versionA.schemaVersion, 1);
  versionA.close();

  const versionB = openDatabase({ dataDir: dir, targetSchema: 2, now: () => new Date("2026-02-01T00:00:00Z") });
  assert.equal(versionB.schemaVersion, 2);
  assert.equal(JSON.parse(versionB.get("it-ausbildung.fortschritt")).stand, 4);
  assert.equal(JSON.parse(versionB.get("it-ausbildung.einstellung")).schrift, "gross");
  assert.equal(versionB.backupsCreated.length, 1);
  const backup = new DatabaseSync(versionB.backupsCreated[0], { readOnly: true });
  const saved = backup.prepare("SELECT value FROM kv WHERE key = ?").get("it-ausbildung.fortschritt");
  assert.equal(JSON.parse(saved.value).bewertung, "bestanden");
  backup.close();
  versionB.close();
});

test("neuere Datenbank wird nicht verändert und nicht gelöscht", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir, targetSchema: 2 });
  store.set("fortschritt", "behalten");
  store.close();
  const dbPath = path.join(dir, "academy.sqlite");
  const raw = new DatabaseSync(dbPath);
  raw.exec("PRAGMA user_version = 9");
  raw.close();
  const before = hashFile(dbPath);
  assert.throws(
    () => openDatabase({ dataDir: dir, targetSchema: 2 }),
    (error) => error instanceof AcademyStoreError && error.code === "incompatible"
  );
  assert.equal(hashFile(dbPath), before);
});

test("beschädigte Datei wird nicht gelöscht", () => {
  const dir = tempDir();
  const dbPath = path.join(dir, "academy.sqlite");
  fs.writeFileSync(dbPath, "das ist keine datenbank");
  const before = hashFile(dbPath);
  assert.throws(
    () => openDatabase({ dataDir: dir }),
    (error) => error instanceof AcademyStoreError && error.code === "corrupt"
  );
  assert.equal(fs.readFileSync(dbPath, "utf8"), "das ist keine datenbank");
  assert.equal(hashFile(dbPath), before);
});

test("Wiederherstellung legt die Sicherung zurück und behält einen Sicherheitsstand", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir, targetSchema: 2 });
  store.set("fortschritt", "alt");
  const backup = store.backup("manual");
  store.set("fortschritt", "neu");
  const restored = store.restore(backup);
  assert.equal(restored.get("fortschritt"), "alt");
  assert.ok(restored.listBackups().some((entry) => entry.name.startsWith("pre-restore-")));
  restored.close();
});

test("neuere Sicherung wird nicht über die aktuelle Datenbank gelegt", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir, targetSchema: 1 });
  store.set("fortschritt", "aktuell");
  const backup = store.backup("manual");
  store.close();
  const raw = new DatabaseSync(backup);
  raw.exec("PRAGMA user_version = 9");
  raw.close();
  const current = openDatabase({ dataDir: dir, targetSchema: 1 });
  assert.throws(
    () => current.restore(backup),
    (error) => error instanceof AcademyStoreError && error.code === "incompatible"
  );
  assert.equal(current.get("fortschritt"), "aktuell");
  current.close();
});

test("Pfad außerhalb der Sicherungen wird abgelehnt", () => {
  const dir = tempDir();
  const store = openDatabase({ dataDir: dir, targetSchema: 2 });
  store.set("fortschritt", "bleibt");
  assert.throws(
    () => store.restore(path.join(dir, "academy.sqlite")),
    (error) => error instanceof AcademyStoreError && error.code === "invalid-backup"
  );
  assert.equal(store.get("fortschritt"), "bleibt");
  store.close();
});
