"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createModuleManager } = require("../src/modules/manager");
const { openRegistry } = require("../src/modules/registry");
const { CORE_VERSION } = require("../src/core/version");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-3b-"));
}

// Wie in design-harmony-3-theme-contract.test.js, mit "marker" für abweichenden Inhalt bei gleicher Version.
function writePackage(dir, options) {
  const settings = options || {};
  fs.mkdirSync(path.join(dir, "content"), { recursive: true });
  fs.mkdirSync(path.join(dir, "web"), { recursive: true });
  const page = path.join(dir, "web", "index.html");
  fs.writeFileSync(page, "<!DOCTYPE html><html><head><title>P</title></head><body><p>" + (settings.marker || "x") + "</p></body></html>");
  fs.writeFileSync(path.join(dir, "content", "course.json"), JSON.stringify({
    offer: { id: "probe", kind: "self-study", title: "Probe" },
    path: { id: "pfad", title: "Pfad" },
    area: { id: "gebiet", title: "Gebiet" },
    responsibility: "Probe",
    sections: [{ id: "s", title: "Seiten", lessons: [{ id: "l", title: "Start", blocks: [{ type: "text", id: "seite", text: "index.html" }] }] }]
  }));
  fs.writeFileSync(path.join(dir, "content", "payload-index.json"), JSON.stringify({
    format: "desoworks.academy.payload-index",
    formatVersion: 1,
    files: [{ path: "web/index.html", sha256: crypto.createHash("sha256").update(fs.readFileSync(page)).digest("hex"), size: fs.statSync(page).size }]
  }));
  const files = ["content/course.json", "content/payload-index.json"];
  const runtime = { kind: "hosted-web", entry: "index.html", index: "content/payload-index.json" };
  if (settings.themeContract !== undefined) runtime.themeContract = settings.themeContract;
  fs.writeFileSync(path.join(dir, "academy-module.json"), JSON.stringify({
    format: "desoworks.academy.module",
    formatVersion: 1,
    id: "desoworks.probe",
    name: "Probe",
    description: "Update-Probe",
    publisher: { id: "publisher.desoworks", name: "DesoWorks" },
    version: settings.version || "1.0.0",
    license: "MIT",
    language: "de",
    core: ">=0.3.0 <0.4.0",
    dependencies: [],
    permissions: ["content.read", "progress.write"],
    sizeBytes: files.reduce((sum, file) => sum + fs.statSync(path.join(dir, file)).size, 0),
    subject: "Test",
    audience: "Test",
    status: "private",
    review: { state: "private", signed: false },
    trust: "private",
    entry: "content/course.json",
    files,
    runtime
  }));
}

function manager(data, parent, catalogFile) {
  const options = { dataDir: data, coreVersion: CORE_VERSION, hostedWebRoots: [parent] };
  if (catalogFile) options.catalogFile = catalogFile;
  return createModuleManager(options);
}

const PROGRESS = { tasks: { a: { done: true } }, assessment: {} };

test("gleiche Version mit anderem Inhalt wird vor jeder Dateioperation abgewiesen, Lernstand und Dateien bleiben", () => {
  const parent = tempDir();
  const original = path.join(parent, "original");
  const variant = path.join(parent, "variante");
  const next = path.join(parent, "naechste");
  writePackage(original, { themeContract: 1, version: "1.0.2" });
  writePackage(variant, { themeContract: 1, version: "1.0.2", marker: "anders" });
  writePackage(next, { themeContract: 1, version: "1.0.3" });
  const modules = manager(tempDir(), parent);
  modules.installFromDirectory(original);
  modules.progress("desoworks.probe", PROGRESS);
  const installed = path.join(modules.installPath("desoworks.probe"), "web", "index.html");
  const before = fs.readFileSync(installed, "utf8");

  assert.throws(() => modules.installFromDirectory(variant), (error) => error.code === "same-version-different-content");
  assert.equal(fs.readFileSync(installed, "utf8"), before);
  assert.equal(modules.list().installed[0].version, "1.0.2");
  assert.equal(modules.list().installed[0].state, "active");
  assert.deepEqual(modules.progress("desoworks.probe"), PROGRESS);
  assert.ok(modules.resolveHostedFile("desoworks.probe", "/index.html"));
  assert.equal(fs.existsSync(modules.installPath("desoworks.probe") + ".incoming"), false);

  // Der Fehlschlag ist als Hinweis sichtbar, ohne den Zustand zu ändern.
  const failed = modules.list().installed[0];
  assert.equal(typeof failed.lastUpdateError, "string");
  assert.match(failed.lastUpdateError, /gleicher Versionsnummer/);
  assert.equal(failed.state, "active");

  // Ein späteres erfolgreiches Update löscht den Hinweis und erhält den Lernstand.
  modules.installFromDirectory(next);
  assert.equal(modules.list().installed[0].version, "1.0.3");
  assert.equal(modules.list().installed[0].lastUpdateError, null);
  assert.deepEqual(modules.progress("desoworks.probe"), PROGRESS);
  modules.close();
});

test("identisches Paket gleicher Version ersetzt nichts und liefert die bestehende Zeile", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  writePackage(source, { themeContract: 1, version: "1.0.2" });
  const modules = manager(tempDir(), parent);
  modules.installFromDirectory(source);
  const installed = path.join(modules.installPath("desoworks.probe"), "web", "index.html");
  const stamp = fs.statSync(installed).mtimeMs;
  const row = modules.installFromDirectory(source);
  assert.equal(row.version, "1.0.2");
  assert.equal(row.state, "active");
  assert.equal(fs.statSync(installed).mtimeMs, stamp);
  assert.equal(modules.list().installed[0].lastUpdateError, null);
  modules.close();
});

test("gestörtes Modul wird mit dem identischen Paket repariert, Lernstand bleibt", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  writePackage(source, { themeContract: 1, version: "1.0.2" });
  const modules = manager(tempDir(), parent);
  modules.installFromDirectory(source);
  modules.progress("desoworks.probe", PROGRESS);
  const installed = path.join(modules.installPath("desoworks.probe"), "web", "index.html");
  const good = fs.readFileSync(installed, "utf8");
  fs.writeFileSync(installed, "manipuliert");
  assert.equal(modules.resolveHostedFile("desoworks.probe", "/index.html"), null);
  assert.equal(modules.list().installed[0].state, "faulted");

  const row = modules.installFromDirectory(source);
  assert.equal(row.state, "active");
  assert.equal(fs.readFileSync(installed, "utf8"), good);
  assert.deepEqual(modules.progress("desoworks.probe"), PROGRESS);
  modules.close();
});

test("deinstalliertes Modul lässt sich mit gleicher Version neu installieren, Lernstand bleibt", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  writePackage(source, { themeContract: 1, version: "1.0.2" });
  const modules = manager(tempDir(), parent);
  modules.installFromDirectory(source);
  modules.progress("desoworks.probe", PROGRESS);
  modules.uninstall("desoworks.probe", { confirm: true });
  const row = modules.installFromDirectory(source);
  assert.equal(row.state, "active");
  assert.deepEqual(modules.progress("desoworks.probe"), PROGRESS);
  modules.close();
});

function catalogSetup() {
  const root = tempDir();
  const modulesDir = path.join(root, "modules");
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.mkdirSync(path.join(root, "catalog"), { recursive: true });
  const catalogFile = path.join(root, "catalog", "official.json");
  fs.writeFileSync(catalogFile, JSON.stringify({
    format: "desoworks.academy.catalog",
    formatVersion: 1,
    modules: [{ id: "desoworks.probe", name: "Probe", localPackage: "modules/probe" }]
  }));
  return { root, modulesDir, catalogFile };
}

test("Katalog: neuere kompatible Version meldet Update, gleiche oder ältere nicht, ohne Katalog bleibt null", () => {
  const { modulesDir, catalogFile } = catalogSetup();
  const old = path.join(modulesDir, "alt");
  const offered = path.join(modulesDir, "probe");
  writePackage(old, { themeContract: 1, version: "1.0.2" });
  writePackage(offered, { themeContract: 1, version: "1.0.3" });
  const data = tempDir();
  let modules = manager(data, modulesDir, catalogFile);
  modules.installFromDirectory(old);
  let row = modules.list().installed[0];
  assert.equal(row.updateAvailable, true);
  assert.equal(row.availableVersion, "1.0.3");
  assert.equal(row.canUpdate, true);
  assert.equal(row.compatible, true);

  modules.installFromDirectory(offered);
  row = modules.list().installed[0];
  assert.equal(row.version, "1.0.3");
  assert.equal(row.updateAvailable, false);
  assert.equal(row.availableVersion, null);
  assert.equal(row.canUpdate, false);
  modules.close();

  // Ohne catalogFile bleibt der Updatestand ungeprüft.
  modules = manager(data, modulesDir);
  row = modules.list().installed[0];
  assert.equal(row.updateAvailable, null);
  assert.equal(row.availableVersion, null);
  modules.close();

  // Fehlt die Katalogdatei, gilt false statt eines Absturzes.
  modules = manager(data, modulesDir, path.join(modulesDir, "fehlt.json"));
  row = modules.list().installed[0];
  assert.equal(row.updateAvailable, false);
  assert.equal(row.availableVersion, null);
  modules.close();
});

test("Katalog: inkompatibles installiertes Modul mit kompatiblem neuem Paket bietet das Update an", () => {
  const { modulesDir, catalogFile } = catalogSetup();
  const old = path.join(modulesDir, "alt");
  const offered = path.join(modulesDir, "probe");
  writePackage(old, { themeContract: 1, version: "1.0.2" });
  writePackage(offered, { themeContract: 1, version: "1.0.3" });
  const data = tempDir();
  let modules = manager(data, modulesDir, catalogFile);
  modules.installFromDirectory(old);
  modules.progress("desoworks.probe", PROGRESS);
  modules.close();

  // Altbestand nachstellen: installiertes Manifest ohne Theme-Vertrag.
  const registry = openRegistry({ dataDir: data });
  const current = registry.db.prepare("SELECT manifest_json FROM module_install WHERE id = ?").get("desoworks.probe");
  const legacy = JSON.parse(current.manifest_json);
  delete legacy.runtime.themeContract;
  registry.db.prepare("UPDATE module_install SET manifest_json = ? WHERE id = ?").run(JSON.stringify(legacy), "desoworks.probe");
  registry.close();

  modules = manager(data, modulesDir, catalogFile);
  let row = modules.list().installed[0];
  assert.equal(row.compatible, false);
  assert.equal(row.updateAvailable, true);
  assert.equal(row.canUpdate, true);
  assert.throws(() => modules.open("desoworks.probe"), (error) => error.code === "module-incompatible");

  modules.installFromDirectory(offered);
  row = modules.list().installed[0];
  assert.equal(row.version, "1.0.3");
  assert.equal(row.compatible, true);
  assert.equal(row.updateAvailable, false);
  assert.deepEqual(modules.progress("desoworks.probe"), PROGRESS);
  modules.close();
});

test("Katalog: inkompatibles neues Paket wird nicht als Update angeboten", () => {
  const { modulesDir, catalogFile } = catalogSetup();
  const old = path.join(modulesDir, "alt");
  const offered = path.join(modulesDir, "probe");
  writePackage(old, { themeContract: 1, version: "1.0.2" });
  writePackage(offered, { version: "1.0.3" });
  const modules = manager(tempDir(), modulesDir, catalogFile);
  modules.installFromDirectory(old);
  const row = modules.list().installed[0];
  assert.equal(row.updateAvailable, false);
  assert.equal(row.availableVersion, null);
  assert.equal(row.canUpdate, false);
  modules.close();
});
