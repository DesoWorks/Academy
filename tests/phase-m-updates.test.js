"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createUpdateService } = require("../src/updates/service");
const { selectRelease, selectModuleUpdates } = require("../src/updates/feed");
const { zipDirectory, extractZip } = require("../src/updates/zip");
const { createModuleManager } = require("../src/modules/manager");
const { CORE_VERSION } = require("../src/core/version");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-phase-m-"));
}

function sha(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function fetchRoutes(routes) {
  return async function (url) {
    const hit = routes[url];
    if (!hit) return { ok: false, status: 404, json: async () => ({}), text: async () => "", arrayBuffer: async () => new ArrayBuffer(0) };
    const bytes = Buffer.from(hit.bytes || "");
    return {
      ok: true,
      status: 200,
      json: async () => hit.json,
      text: async () => hit.text || "",
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      headers: { get: () => String(bytes.length) }
    };
  };
}

function devFeed(version, notes, bytes) {
  return {
    releases: [{
      version,
      prerelease: true,
      notes,
      commit: "abc123",
      publishedAt: "2026-11-22T12:00:00.000Z",
      assets: [
        { name: "DesoWorks-Academy-Setup.exe", url: "https://example.test/setup.exe", size: bytes.length },
        { name: "DesoWorks-Academy-Setup.exe.sha256", url: "https://example.test/setup.exe.sha256", size: 64 }
      ]
    }],
    modules: [{
      id: "desoworks.it-systemintegration",
      version: "1.0.2",
      prerelease: true,
      notes: "Modulnotiz",
      core: ">=0.3.0 <0.4.0",
      assets: [
        { name: "modul.zip", url: "https://example.test/modul.zip", size: 12 },
        { name: "modul.zip.sha256", url: "https://example.test/modul.zip.sha256", size: 64 }
      ]
    }]
  };
}

test("DEV lädt ein Prerelease und installiert es ohne Herausgeberzertifikat, Stable bleibt gesperrt", async () => {
  const blocked = selectRelease([
    { version: "1.0.0", prerelease: false, notes: "Stabil", assets: [] }
  ], { channel: "dev", installed: "0.3.0" });
  assert.equal(blocked.action, "blocked");
  assert.equal(blocked.available, "1.0.0");

  const dir = tempDir();
  const bytes = Buffer.from("dev-installer");
  const service = createUpdateService({
    dataDir: dir,
    channel: "dev",
    installedVersion: "0.3.1-dev.1",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    coreVersion: CORE_VERSION,
    installedModules: [{ id: "desoworks.it-systemintegration", version: "1.0.1" }],
    fetch: fetchRoutes({
      "https://example.test/feed.json": { json: devFeed("0.3.1-dev.2", "DEV-Stand", bytes) },
      "https://example.test/setup.exe": { bytes },
      "https://example.test/setup.exe.sha256": { text: sha(bytes) }
    })
  });
  const found = await service.check();
  assert.equal(found.phase, "available");
  assert.equal(found.prerelease, true);
  assert.equal(found.available, "0.3.1-dev.2");
  assert.equal(found.commit, "abc123");
  assert.equal(found.kind, "core");
  assert.equal(found.moduleUpdates.length, 1);
  assert.equal(found.moduleUpdates[0].kind, "module");
  assert.equal(found.moduleUpdates[0].id, "desoworks.it-systemintegration");
  const ready = await service.download();
  assert.equal(ready.phase, "ready");
  assert.match(ready.message, /nicht mit einem Herausgeberzertifikat/);
  const backup = path.join(dir, "backup.sqlite");
  fs.writeFileSync(backup, "lernstand");
  const plan = service.installPlan(backup);
  assert.equal(plan.ok, true);
  assert.equal(plan.quitFirst, true);
  assert.equal(fs.readFileSync(backup, "utf8"), "lernstand");

  const stable = createUpdateService({
    dataDir: tempDir(),
    channel: "stable",
    installedVersion: "0.3.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": { json: devFeed("0.3.1-dev.2", "nicht stabil", bytes) }
    })
  });
  const ignored = await stable.check();
  assert.notEqual(ignored.phase, "available");
});

test("ein Core-Download nimmt das Modulpaket nicht mit", async () => {
  const dir = tempDir();
  const bytes = Buffer.from("nur-core");
  const service = createUpdateService({
    dataDir: dir,
    channel: "dev",
    installedVersion: "0.3.1-dev.1",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    installedModules: [{ id: "desoworks.it-systemintegration", version: "1.0.1" }],
    coreVersion: CORE_VERSION,
    fetch: fetchRoutes({
      "https://example.test/feed.json": { json: devFeed("0.3.1-dev.2", "Core", bytes) },
      "https://example.test/setup.exe": { bytes },
      "https://example.test/setup.exe.sha256": { text: sha(bytes) }
    })
  });
  await service.check();
  await service.download();
  const names = fs.readdirSync(path.join(dir, "updates", "incoming"));
  assert.equal(names.some((name) => name.endsWith(".zip")), false);
  assert.equal(names.some((name) => name.endsWith(".exe")), true);
});

test("Modulupdate mit falscher Summe wird verworfen und der Core bleibt", async () => {
  const dir = tempDir();
  const bytes = Buffer.from("modul-bytes");
  const service = createUpdateService({
    dataDir: dir,
    channel: "dev",
    installedVersion: "0.3.1-dev.1",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    coreVersion: CORE_VERSION,
    installedModules: [{ id: "desoworks.it-systemintegration", version: "1.0.1" }],
    fetch: fetchRoutes({
      "https://example.test/feed.json": { json: devFeed("0.3.1-dev.2", "Core", Buffer.from("x")) },
      "https://example.test/modul.zip": { bytes },
      "https://example.test/modul.zip.sha256": { text: "ab".repeat(32) }
    })
  });
  await service.check();
  const result = await service.downloadModule("desoworks.it-systemintegration");
  assert.equal(result.preparedModule, null);
  assert.match(result.moduleMessage, /Integrität|fehlgeschlagen|Prüfsumme/i);
  assert.equal(fs.existsSync(path.join(dir, "updates", "incoming")), true);
});

test("ZIP-Modulpaket bleibt im Zielordner und ein Ausbruchspfad scheitert", () => {
  const source = tempDir();
  fs.writeFileSync(path.join(source, "academy-module.json"), "{\"id\":\"demo\"}");
  fs.mkdirSync(path.join(source, "web"));
  fs.writeFileSync(path.join(source, "web", "index.html"), "ok");
  const zip = path.join(tempDir(), "modul.zip");
  zipDirectory(source, zip);
  const dest = tempDir();
  extractZip(zip, dest);
  assert.equal(fs.readFileSync(path.join(dest, "web", "index.html"), "utf8"), "ok");
  const hostile = tempDir();
  const payload = fs.readFileSync(zip);
  const name = Buffer.from("../ausbruch.txt");
  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);
  const packed = Buffer.concat([local, Buffer.from("nein")]);
  fs.writeFileSync(path.join(hostile, "bad.zip"), packed);
  assert.throws(() => extractZip(path.join(hostile, "bad.zip"), tempDir()));
  assert.equal(payload.length > 0, true);
});

test("fehlgeschlagenes Modulupdate lässt die installierte Version liegen", () => {
  const data = tempDir();
  const hosted = tempDir();
  const source = path.join(__dirname, "..", "modules", "it-systemintegration");
  const base = path.join(hosted, "base");
  fs.cpSync(source, base, { recursive: true });
  const manifestPath = path.join(base, "academy-module.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.version = "1.0.1";
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  const modules = createModuleManager({
    dataDir: data,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [hosted, path.join(data, "updates", "modules", "verified")]
  });
  modules.installFromDirectory(base);
  modules.progress("desoworks.it-systemintegration", { tasks: { gehalten: { correct: true } }, assessment: {} });
  const broken = path.join(data, "updates", "modules", "verified", "desoworks.it-systemintegration", "1.0.2");
  fs.cpSync(base, broken, { recursive: true });
  const brokenManifest = JSON.parse(fs.readFileSync(path.join(broken, "academy-module.json"), "utf8"));
  brokenManifest.version = "1.0.2";
  brokenManifest.core = ">=9.0.0 <10.0.0";
  fs.writeFileSync(path.join(broken, "academy-module.json"), JSON.stringify(brokenManifest));
  assert.throws(() => modules.installFromDirectory(broken));
  assert.equal(modules.list().installed[0].version, "1.0.1");
  assert.equal(modules.progress("desoworks.it-systemintegration").tasks.gehalten.correct, true);
  const selected = selectModuleUpdates([{
    id: "desoworks.it-systemintegration",
    version: "1.0.2",
    prerelease: true,
    core: ">=9.0.0 <10.0.0",
    assets: [
      { name: "modul.zip", url: "https://example.test/modul.zip" },
      { name: "modul.zip.sha256", url: "https://example.test/modul.zip.sha256" }
    ]
  }], [{ id: "desoworks.it-systemintegration", version: "1.0.1" }], {
    channel: "dev",
    coreVersion: CORE_VERSION,
    extraHosts: ["example.test"]
  });
  assert.equal(selected[0].action, "rejected");
});
