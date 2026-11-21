"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { DatabaseSync } = require("node:sqlite");
const { openDatabase } = require("../src/store/database");
const { createModuleManager } = require("../src/modules/manager");
const { openRegistry } = require("../src/modules/registry");
const { generateKeyPair, signPackage } = require("../src/modules/signature");
const { forkManifest } = require("../src/modules/spec");
const { buildTutorContext } = require("../src/modules/tutor");
const { prepareWorkspace } = require("../src/modules/ide");
const { readCatalog } = require("../src/modules/catalog");
const { CORE_VERSION } = require("../src/core/version");

const DEMO = path.join(__dirname, "..", "modules", "wissen-weitergeben");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-mod-"));
}

function manager(dir, extra) {
  return createModuleManager(Object.assign({ dataDir: dir, coreVersion: CORE_VERSION }, extra || {}));
}

function course(answer) {
  return {
    offer: { id: "kurs", kind: "self-study", title: "Kurs" },
    path: { id: "pfad", title: "Pfad" },
    area: { id: "gebiet", title: "Gebiet" },
    responsibility: "Beispiel, keine staatliche Qualifikation.",
    tutorPolicy: { revealSolutions: true, level: "ausbildung" },
    sections: [{
      id: "s",
      title: "Abschnitt",
      lessons: [{
        id: "l",
        title: "Lektion",
        objectives: ["Ziel"],
        blocks: [{ type: "task", id: "aufgabe-1", prompt: "Frage", hint: "Hinweis", answer: answer || "antwort" }]
      }]
    }],
    assessment: { id: "p", title: "Prüfung", criteria: ["Kriterium"], questions: [{ id: "frage-1", prompt: "Wahl", choices: ["ja", "nein"], answer: 0 }] }
  };
}

function writePackage(dir, manifest, body) {
  fs.mkdirSync(path.join(dir, "content"), { recursive: true });
  fs.writeFileSync(path.join(dir, "content", "course.json"), JSON.stringify(body || course()));
  manifest.sizeBytes = (manifest.files || ["content/course.json"]).reduce((sum, file) => {
    const full = path.join(dir, file);
    return sum + (fs.existsSync(full) ? fs.statSync(full).size : 0);
  }, 0);
  fs.writeFileSync(path.join(dir, "academy-module.json"), JSON.stringify(manifest));
}

function baseManifest(id) {
  return {
    format: "desoworks.academy.module",
    formatVersion: 1,
    id,
    name: id,
    description: "Testpaket",
    publisher: { id: "example.publisher", name: "Beispiel" },
    version: "1.0.0",
    license: "MIT",
    language: "de",
    core: ">=0.2.0 <0.4.0",
    dependencies: [],
    permissions: ["content.read", "progress.write", "tutor.context"],
    sizeBytes: 0,
    subject: "Test",
    audience: "Selbststudium",
    status: "private",
    review: { state: "private", signed: false },
    trust: "private",
    entry: "content/course.json",
    files: ["content/course.json"]
  };
}

test("Beispielmodul lässt sich installieren, prüfen und isoliert speichern", () => {
  const dir = tempDir();
  const core = openDatabase({ dataDir: dir });
  core.set("it-ausbildung.fortschritt", "unberührt");
  const app = manager(dir);
  const installed = app.installFromDirectory(DEMO);
  assert.equal(installed.id, "example.local.wissen-weitergeben");
  assert.equal(installed.state, "active");
  const opened = app.open(installed.id);
  assert.equal(JSON.stringify(opened.course).includes("academy-module.json"), false);
  assert.equal(opened.course.tutorPolicy.revealSolutions, false);
  const wrong = app.check(installed.id, "aufgabe-1", "browser");
  assert.equal(wrong.correct, false);
  assert.equal(wrong.solution, null);
  assert.equal(wrong.hint.length > 0, true);
  const right = app.check(installed.id, "aufgabe-1", "academy-module.json");
  assert.equal(right.correct, true);
  assert.equal(right.solution, null);
  const otherDir = path.join(dir, "other-src");
  writePackage(otherDir, baseManifest("example.publisher.zweites"), course("anders"));
  app.installFromDirectory(otherDir);
  app.check("example.publisher.zweites", "aufgabe-1", "anders");
  assert.equal(app.progress(installed.id).tasks["aufgabe-1"].correct, true);
  assert.equal(app.progress("example.publisher.zweites").tasks["aufgabe-1"].correct, true);
  const removed = app.uninstall(installed.id, { confirm: true });
  assert.equal(removed.progressKept > 0, true);
  assert.equal(app.progress(installed.id).tasks["aufgabe-1"].correct, true);
  assert.equal(core.get("it-ausbildung.fortschritt"), "unberührt");
  app.close();
  core.close();
});

test("fehlerhaftes Modul deaktiviert nur sich selbst", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  const other = path.join(dir, "other-src");
  writePackage(other, baseManifest("example.publisher.stabil"), course("stabil"));
  app.installFromDirectory(other);
  const victim = app.list().installed.find((entry) => entry.id === "example.local.wissen-weitergeben");
  const installedPath = path.join(dir, "module-packages", victim.id, victim.version, "content", "course.json");
  fs.rmSync(installedPath, { force: true });
  assert.throws(() => app.open(victim.id), (error) => error.code === "module-faulted");
  const stable = app.open("example.publisher.stabil");
  assert.equal(stable.module.state, "active");
  assert.equal(app.list().installed.find((entry) => entry.id === victim.id).state, "faulted");
  app.close();
});

test("offizielle Pakete ohne hinterlegten Schlüssel werden abgewiesen", () => {
  const dir = tempDir();
  const app = manager(dir);
  const source = path.join(dir, "src");
  const manifest = baseManifest("example.publisher.official");
  manifest.trust = "official";
  manifest.signature = { algorithm: "ed25519", publicKey: "nicht-hinterlegt", value: "aa" };
  writePackage(source, manifest, course());
  assert.throws(() => app.installFromDirectory(source), (error) => error.code === "signature-rejected");
  assert.equal(app.list().installed.length, 0);
  app.close();
});

test("gültige Signatur gilt nur für den hinterlegten Schlüssel", () => {
  const dir = tempDir();
  const keys = generateKeyPair();
  const source = path.join(dir, "src");
  const manifest = baseManifest("example.publisher.signed");
  manifest.trust = "official";
  manifest.files = ["content/course.json"];
  writePackage(source, manifest, course("signiert"));
  const hash = crypto.createHash("sha256").update(fs.readFileSync(path.join(source, "content", "course.json"))).digest("hex");
  manifest.signature = {
    algorithm: "ed25519",
    publicKey: keys.publicKey,
    value: signPackage(manifest, { "content/course.json": hash }, keys.privateKey)
  };
  fs.writeFileSync(path.join(source, "academy-module.json"), JSON.stringify(manifest));
  const blocked = manager(dir);
  assert.throws(() => blocked.installFromDirectory(source), (error) => error.code === "signature-rejected");
  blocked.close();
  const allowed = manager(dir + "-ok", { trustedKeys: { official: [keys.publicKey], reviewed: [] } });
  const installed = allowed.installFromDirectory(source);
  assert.equal(installed.trust, "official");
  allowed.close();
});

test("Community-Rechte und Skripte werden nicht angenommen", () => {
  const dir = tempDir();
  const app = manager(dir);
  const source = path.join(dir, "src");
  const manifest = baseManifest("example.publisher.community");
  manifest.trust = "community";
  manifest.permissions = ["shell"];
  writePackage(source, manifest, course());
  assert.throws(() => app.installFromDirectory(source), (error) => error.code === "permission-denied");
  const scripted = baseManifest("example.publisher.script");
  scripted.files = ["content/course.json", "run.js"];
  fs.mkdirSync(path.join(dir, "script"), { recursive: true });
  writePackage(path.join(dir, "script"), scripted, course());
  fs.writeFileSync(path.join(dir, "script", "run.js"), "process.exit(0)");
  assert.throws(() => app.installFromDirectory(path.join(dir, "script")), (error) => error.code === "bad-file");
  app.close();
});

test("inkompatibler Core, Downgrade und fehlende Abhängigkeit stoppen die Installation", () => {
  const dir = tempDir();
  const app = manager(dir);
  const old = path.join(dir, "old");
  const manifest = baseManifest("example.publisher.alt");
  manifest.core = ">=9.0.0 <10.0.0";
  writePackage(old, manifest, course());
  assert.throws(() => app.installFromDirectory(old), (error) => error.code === "incompatible-core");
  const first = path.join(dir, "first");
  writePackage(first, baseManifest("example.publisher.stand"), course());
  app.installFromDirectory(first);
  const older = baseManifest("example.publisher.stand");
  older.version = "0.9.0";
  writePackage(path.join(dir, "older"), older, course());
  assert.throws(() => app.installFromDirectory(path.join(dir, "older")), (error) => error.code === "downgrade-blocked");
  const child = baseManifest("example.publisher.kind");
  child.dependencies = [{ id: "example.publisher.fehlt", version: ">=1.0.0 <2.0.0" }];
  writePackage(path.join(dir, "child"), child, course());
  assert.throws(() => app.installFromDirectory(path.join(dir, "child")), (error) => error.code === "dependency-missing");
  app.close();
});

test("Modulimport überschreibt kein fremdes Modul und eine neuere Moduldatenbank bleibt liegen", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  const raw = app.exportModule("example.local.wissen-weitergeben");
  const other = path.join(dir, "other");
  writePackage(other, baseManifest("example.publisher.ziel"), course("ziel"));
  app.installFromDirectory(other);
  app.progress("example.publisher.ziel", { tasks: { eigen: { correct: true } }, assessment: {} });
  assert.throws(() => app.importModule("example.publisher.ziel", raw, { confirm: true, mode: "replace" }), (error) => error.code === "invalid-import");
  assert.equal(app.progress("example.publisher.ziel").tasks.eigen.correct, true);
  assert.throws(() => app.importModule("example.publisher.ziel", raw, { confirm: false, mode: "merge" }), (error) => error.code === "cancelled");
  app.close();

  const dbPath = path.join(dir, "modules.sqlite");
  const rawDb = new DatabaseSync(dbPath);
  rawDb.exec("PRAGMA user_version = 9");
  rawDb.close();
  const before = crypto.createHash("sha256").update(fs.readFileSync(dbPath)).digest("hex");
  const newer = manager(dir);
  assert.equal(newer.available, false);
  assert.equal(newer.code, "incompatible");
  newer.close();
  const after = crypto.createHash("sha256").update(fs.readFileSync(dbPath)).digest("hex");
  assert.equal(before, after);
  const kept = new DatabaseSync(dbPath, { readOnly: true });
  assert.equal(Number(kept.prepare("PRAGMA user_version").get().user_version), 9);
  kept.close();
});

test("beschädigte Moduldatenbank wird nicht gelöscht und blockiert den Core-Speicher nicht", () => {
  const dir = tempDir();
  const dbPath = path.join(dir, "modules.sqlite");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, "kein-sqlite");
  const app = manager(dir);
  assert.equal(app.available, false);
  assert.equal(fs.existsSync(dbPath), true);
  assert.throws(() => app.installFromDirectory(DEMO), (error) => error.code === "corrupt");
  const core = openDatabase({ dataDir: dir });
  core.set("bleibt", "ja");
  assert.equal(core.get("bleibt"), "ja");
  core.close();
  app.close();
});

test("Fork behält Herkunft, Tutor und IDE geben nichts frei", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  const opened = app.open("example.local.wissen-weitergeben");
  const source = JSON.parse(fs.readFileSync(path.join(DEMO, "academy-module.json"), "utf8"));
  const fork = forkManifest(source, {
    id: "example.publisher.fork",
    version: "1.1.0",
    publisher: { id: "example.publisher", name: "Andere" }
  });
  assert.equal(fork.origin.id, source.id);
  assert.equal(fork.origin.license, source.license);
  assert.equal(fork.trust, "private");
  assert.equal(fork.signature, undefined);
  const context = buildTutorContext(app, opened.module.id, "lektion-1");
  assert.equal(context.enabled, false);
  assert.equal(context.provider, null);
  assert.equal(context.progress, null);
  assert.equal(JSON.stringify(context).includes("academy-module.json"), false);
  const ide = prepareWorkspace(opened.module.id);
  assert.equal(ide.execution, "refused");
  assert.equal(ide.enabled, false);
  app.close();
});

test("Katalogfehler verhindert die lokale Modulnutzung nicht", () => {
  const missing = readCatalog(path.join(tempDir(), "fehlt.json"));
  assert.equal(missing.ok, false);
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  assert.equal(app.open("example.local.wissen-weitergeben").kind, "module");
  app.close();
});

test("fremde Herausgeber und reservierte IDs werden abgewiesen", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  const takeover = baseManifest("example.local.wissen-weitergeben");
  takeover.version = "1.1.0";
  takeover.publisher = { id: "example.attacker", name: "Fremd" };
  writePackage(path.join(dir, "takeover"), takeover, course("fremd"));
  assert.throws(() => app.installFromDirectory(path.join(dir, "takeover")), (error) => error.code === "publisher-mismatch");
  assert.equal(app.list().installed.find((entry) => entry.id === "example.local.wissen-weitergeben").publisher, "DesoWorks Beispiel");
  const reserved = baseManifest("dev.desoworks.demo.fake");
  reserved.publisher = { id: "example.publisher", name: "DesoWorks" };
  writePackage(path.join(dir, "reserved"), reserved, course());
  assert.throws(() => app.installFromDirectory(path.join(dir, "reserved")), (error) => error.code === "reserved-id");
  const bundled = baseManifest("dev.desoworks.it-ausbildung");
  writePackage(path.join(dir, "bundled"), bundled, course());
  assert.throws(() => app.installFromDirectory(path.join(dir, "bundled")), (error) => error.code === "reserved-id");
  app.close();
});

test("deinstallierte Modul-ID bleibt an den bisherigen Herausgeber gebunden", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  app.progress("example.local.wissen-weitergeben", { tasks: { "aufgabe-1": { correct: true } }, assessment: {} });
  const removed = app.uninstall("example.local.wissen-weitergeben", { confirm: true });
  assert.equal(removed.progressKept > 0, true);
  const takeover = baseManifest("example.local.wissen-weitergeben");
  takeover.version = "1.1.0";
  takeover.publisher = { id: "example.attacker", name: "Fremd" };
  writePackage(path.join(dir, "takeover-after"), takeover, course("fremd"));
  assert.throws(() => app.installFromDirectory(path.join(dir, "takeover-after")), (error) => error.code === "publisher-mismatch");
  assert.equal(app.list().installed.some((entry) => entry.id === "example.local.wissen-weitergeben" && entry.state !== "uninstalled"), false);
  app.installFromDirectory(DEMO);
  const kept = app.progress("example.local.wissen-weitergeben");
  assert.equal(kept.tasks["aufgabe-1"].correct, true);
  app.close();
});

test("Deinstallation löscht nichts außerhalb des Modulverzeichnisses", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  const db = new DatabaseSync(path.join(dir, "modules.sqlite"));
  const outside = path.join(dir, "nicht-anfassen");
  fs.writeFileSync(outside, "bleibt");
  db.prepare("UPDATE module_install SET install_path = ? WHERE id = ?").run(outside, "example.local.wissen-weitergeben");
  db.close();
  assert.throws(() => app.uninstall("example.local.wissen-weitergeben", { confirm: true }), (error) => error.code === "bad-path");
  assert.equal(fs.readFileSync(outside, "utf8"), "bleibt");
  app.close();
});

test("Deinstallation ohne Bestätigung löscht nichts", () => {
  const dir = tempDir();
  const app = manager(dir);
  app.installFromDirectory(DEMO);
  assert.throws(() => app.uninstall("example.local.wissen-weitergeben", { confirm: false }), (error) => error.code === "cancelled");
  assert.equal(app.list().installed[0].state, "active");
  app.close();
});

test("die Modulansicht setzt keine Modultexte per innerHTML", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "src", "renderer", "module.js"), "utf8");
  assert.equal(source.includes("innerHTML"), false);
  assert.equal(source.includes("insertAdjacentHTML"), false);
});

test("Registry lässt sich unabhängig öffnen", () => {
  const opened = openRegistry({ dataDir: tempDir() });
  assert.equal(opened.available, true);
  assert.equal(opened.schemaVersion, 1);
  opened.close();
});
