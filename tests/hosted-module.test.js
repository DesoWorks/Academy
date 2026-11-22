"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createModuleManager } = require("../src/modules/manager");
const { CORE_VERSION } = require("../src/core/version");
const { resolveBundledPackage } = require("../src/modules/catalog");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-hosted-"));
}

function sha(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function writeHosted(dir, options) {
  const settings = options || {};
  fs.mkdirSync(path.join(dir, "content"), { recursive: true });
  fs.mkdirSync(path.join(dir, "web"), { recursive: true });
  const page = path.join(dir, "web", "index.html");
  fs.writeFileSync(page, "<!DOCTYPE html><html><head><title>Probe</title></head><body><p>Probeinhalt</p></body></html>");
  const course = {
    offer: { id: "probe", kind: "self-study", title: "Probe" },
    path: { id: "pfad", title: "Pfad" },
    area: { id: "gebiet", title: "Gebiet" },
    responsibility: "Probe",
    sections: [{ id: "s", title: "Seiten", lessons: [{ id: "l", title: "Start", blocks: [{ type: "text", id: "seite", text: "index.html" }] }] }]
  };
  fs.writeFileSync(path.join(dir, "content", "course.json"), JSON.stringify(course));
  const pageStat = fs.statSync(page);
  fs.writeFileSync(path.join(dir, "content", "payload-index.json"), JSON.stringify({
    format: "desoworks.academy.payload-index",
    formatVersion: 1,
    files: [{ path: "web/index.html", sha256: settings.badHash || sha(page), size: pageStat.size }]
  }));
  const files = ["content/course.json", "content/payload-index.json"];
  const manifest = {
    format: "desoworks.academy.module",
    formatVersion: 1,
    id: settings.id || "desoworks.probe",
    name: "Probe",
    description: "Hosted-Web-Probe",
    publisher: settings.publisher || { id: "publisher.desoworks", name: "DesoWorks" },
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
    runtime: Object.assign(
      { kind: "hosted-web", entry: "index.html", index: "content/payload-index.json" },
      settings.themeContract === null ? {} : { themeContract: settings.themeContract === undefined ? 1 : settings.themeContract }
    )
  };
  fs.writeFileSync(path.join(dir, "academy-module.json"), JSON.stringify(manifest));
}

test("hosted web installs only for the DesoWorks publisher and opens without replacing the core", () => {
  const data = tempDir();
  const source = path.join(tempDir(), "pkg");
  writeHosted(source);
  const modules = createModuleManager({ dataDir: data, coreVersion: CORE_VERSION, hostedWebRoots: [path.dirname(source)] });
  const installed = modules.installFromDirectory(source);
  assert.equal(installed.id, "desoworks.probe");
  assert.equal(installed.runtime, "hosted-web");
  const opened = modules.open("desoworks.probe");
  assert.equal(opened.kind, "module");
  assert.equal(opened.runtime.entry, "index.html");
  assert.equal(modules.list().platform, null);
  const file = modules.resolveHostedFile("desoworks.probe", "/index.html");
  assert.equal(path.basename(file), "index.html");
  assert.equal(modules.resolveHostedFile("desoworks.probe", "/../academy-module.json"), null);
  modules.close();
});

test("a foreign publisher cannot ship a hosted web runtime", () => {
  const source = path.join(tempDir(), "fremd");
  writeHosted(source, { publisher: { id: "example.publisher", name: "Fremd" }, id: "example.publisher.fremd" });
  const modules = createModuleManager({ dataDir: tempDir(), coreVersion: CORE_VERSION, hostedWebRoots: [path.dirname(source)] });
  assert.throws(() => modules.installFromDirectory(source), /Web-Lernumgebung|Herausgeber|Laufzeit/);
  modules.close();
});

test("a bad payload hash is refused before install", () => {
  const source = path.join(tempDir(), "kaputt");
  writeHosted(source, { badHash: "a".repeat(64) });
  const modules = createModuleManager({ dataDir: tempDir(), coreVersion: CORE_VERSION, hostedWebRoots: [path.dirname(source)] });
  assert.throws(() => modules.installFromDirectory(source), /stimmt nicht|Integrität/);
  assert.equal(modules.list().installed.length, 0);
  modules.close();
});

test("hosted web from outside the bundled modules directory is refused", () => {
  const source = path.join(tempDir(), "fremd");
  writeHosted(source);
  const modules = createModuleManager({ dataDir: tempDir(), coreVersion: CORE_VERSION, hostedWebRoots: [tempDir()] });
  assert.throws(() => modules.installFromDirectory(source), /mitgelieferten Modulordner/);
  assert.equal(modules.list().installed.length, 0);
  modules.close();
});

test("catalog resolution stays inside the bundled modules directory", () => {
  const root = tempDir();
  fs.mkdirSync(path.join(root, "catalog"), { recursive: true });
  fs.mkdirSync(path.join(root, "modules", "probe"), { recursive: true });
  fs.writeFileSync(path.join(root, "catalog", "official.json"), JSON.stringify({
    modules: [
      { id: "desoworks.probe", localPackage: "modules/probe" },
      { id: "desoworks.flucht", localPackage: "modules/../catalog" }
    ]
  }));
  const file = path.join(root, "catalog", "official.json");
  const resolved = resolveBundledPackage(file, "desoworks.probe");
  assert.equal(path.basename(resolved.dir), "probe");
  assert.throws(() => resolveBundledPackage(file, "desoworks.flucht"), /ungültig|verlässt/);
});
