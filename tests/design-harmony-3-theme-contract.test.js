"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createModuleManager } = require("../src/modules/manager");
const { validateManifest } = require("../src/modules/spec");
const { openRegistry } = require("../src/modules/registry");
const { CORE_VERSION } = require("../src/core/version");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-theme3-"));
}

// Das Hilfspaket entsteht über denselben Aufbau wie in hosted-module.test.js.
function writePackage(dir, options) {
  const crypto = require("node:crypto");
  const settings = options || {};
  fs.mkdirSync(path.join(dir, "content"), { recursive: true });
  fs.mkdirSync(path.join(dir, "web"), { recursive: true });
  const page = path.join(dir, "web", "index.html");
  fs.writeFileSync(page, "<!DOCTYPE html><html><head><title>P</title></head><body><p>x</p></body></html>");
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
  const manifest = {
    format: "desoworks.academy.module",
    formatVersion: 1,
    id: "desoworks.probe",
    name: "Probe",
    description: "Theme-Probe",
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
  };
  fs.writeFileSync(path.join(dir, "academy-module.json"), JSON.stringify(manifest));
  return manifest;
}

function manager(data, parent) {
  return createModuleManager({ dataDir: data, coreVersion: CORE_VERSION, hostedWebRoots: [parent] });
}

test("themeContract: falscher Typ ist ein Manifestfehler, fehlendes Feld bleibt gültig", () => {
  const base = writePackage(path.join(tempDir(), "p"), { themeContract: 1 });
  for (const bad of ["1", 0, -1, 1.5, true, null === undefined]) {
    const copy = JSON.parse(JSON.stringify(base));
    copy.runtime.themeContract = bad;
    assert.throws(() => validateManifest(copy), /themeContract/, "Wert " + String(bad));
  }
  const without = JSON.parse(JSON.stringify(base));
  delete without.runtime.themeContract;
  assert.doesNotThrow(() => validateManifest(without));
});

test("hosted-web ohne Theme-Vertrag wird nicht installiert und hinterlässt nichts", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  writePackage(source);
  const data = tempDir();
  const modules = manager(data, parent);
  assert.throws(() => modules.installFromDirectory(source), (error) => error.code === "incompatible-theme");
  assert.equal(modules.list().installed.length, 0);
  const packages = path.join(data, "module-packages");
  assert.deepEqual(fs.existsSync(packages) ? fs.readdirSync(packages) : [], []);
  modules.close();
});

test("hosted-web mit unbekanntem Theme-Vertrag 2 wird nicht installiert", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  writePackage(source, { themeContract: 2 });
  const modules = manager(tempDir(), parent);
  assert.throws(() => modules.installFromDirectory(source), (error) => error.code === "incompatible-theme");
  modules.close();
});

test("kompatibles Paket: publicRow meldet compatible, themeContract und keinen geprüften Updatestand", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  writePackage(source, { themeContract: 1, version: "1.0.2" });
  const modules = manager(tempDir(), parent);
  const row = modules.installFromDirectory(source);
  assert.equal(row.compatible, true);
  assert.equal(row.compatibilityReason, null);
  assert.equal(row.themeContract, 1);
  assert.equal(row.availableVersion, null);
  assert.equal(row.updateAvailable, null);
  assert.equal(modules.open("desoworks.probe").kind, "module");
  assert.ok(modules.resolveHostedFile("desoworks.probe", "/index.html"));
  modules.close();
});

test("älteres Paket 1.0.1 ersetzt installiertes 1.0.2 nicht, Lernstand bleibt", () => {
  const parent = tempDir();
  const newer = path.join(parent, "neu");
  const older = path.join(parent, "alt");
  writePackage(newer, { themeContract: 1, version: "1.0.2" });
  writePackage(older, { themeContract: 1, version: "1.0.1" });
  const modules = manager(tempDir(), parent);
  modules.installFromDirectory(newer);
  modules.progress("desoworks.probe", { tasks: { a: { done: true } }, assessment: {} });
  assert.throws(() => modules.installFromDirectory(older), (error) => error.code === "downgrade-blocked");
  assert.equal(modules.list().installed[0].version, "1.0.2");
  assert.deepEqual(modules.progress("desoworks.probe").tasks, { a: { done: true } });
  modules.close();
});

test("installiertes Modul ohne Theme-Vertrag: sichtbar, inkompatibel, nicht öffenbar, keine Auslieferung, Lernstand bleibt; abgelehnter Versuch ändert nichts", () => {
  const parent = tempDir();
  const source = path.join(parent, "pkg");
  const candidate = path.join(parent, "kandidat");
  writePackage(source, { themeContract: 1, version: "1.0.2" });
  writePackage(candidate, { version: "1.0.3" });
  const data = tempDir();
  let modules = manager(data, parent);
  modules.installFromDirectory(source);
  modules.progress("desoworks.probe", { tasks: { a: { done: true } }, assessment: {} });
  modules.close();

  // Altbestand nachstellen: installiertes Manifest ohne Theme-Vertrag (wie ein Profil vor Vertrag 3).
  const registry = openRegistry({ dataDir: data });
  const current = registry.db.prepare("SELECT manifest_json FROM module_install WHERE id = ?").get("desoworks.probe");
  const legacy = JSON.parse(current.manifest_json);
  delete legacy.runtime.themeContract;
  registry.db.prepare("UPDATE module_install SET manifest_json = ? WHERE id = ?").run(JSON.stringify(legacy), "desoworks.probe");
  registry.close();

  modules = manager(data, parent);
  const row = modules.list().installed[0];
  assert.equal(row.compatible, false);
  assert.match(row.compatibilityReason, /Theme-Vertrag/);
  assert.equal(row.updateAvailable, null);
  assert.throws(() => modules.open("desoworks.probe"), (error) => error.code === "module-incompatible");
  assert.equal(modules.resolveHostedFile("desoworks.probe", "/index.html"), null);

  assert.throws(() => modules.installFromDirectory(candidate), (error) => error.code === "incompatible-theme");
  assert.equal(modules.list().installed[0].version, "1.0.2");
  assert.deepEqual(modules.progress("desoworks.probe").tasks, { a: { done: true } });
  modules.close();
});

test("gebündeltes Quellmodul it-systemintegration deklariert themeContract 1 bei Version 1.0.5", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "modules", "it-systemintegration", "academy-module.json"), "utf8"));
  assert.equal(manifest.runtime.themeContract, 1);
  assert.equal(manifest.version, "1.0.5");
});
