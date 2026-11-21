"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createModuleManager } = require("../src/modules/manager");
const { CORE_VERSION } = require("../src/core/version");
const { createUpdateService } = require("../src/updates/service");

const SOURCE = path.join(__dirname, "..", "modules", "it-systemintegration");
const ID = "desoworks.it-systemintegration";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-phase-k-"));
}

function hostedCopy(root, name, version, coreRange) {
  const dir = path.join(root, name);
  fs.cpSync(SOURCE, dir, { recursive: true });
  const manifestPath = path.join(dir, "academy-module.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.version = version;
  if (coreRange) manifest.core = coreRange;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return dir;
}

function manager(dataDir, hostedRoot) {
  return createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [hostedRoot]
  });
}

test("Modulupdate behält den Lernstand und weist ein beschädigtes Paket ab", () => {
  const data = tempDir();
  const hosted = tempDir();
  const modules = manager(data, hosted);
  const installed = modules.installFromDirectory(hostedCopy(hosted, "base", "1.0.0"));
  assert.equal(installed.version, "1.0.0");
  modules.progress(ID, { tasks: { "phase-k": { correct: true } }, assessment: {} });

  const next = hostedCopy(hosted, "next", "1.0.1");
  const updated = modules.installFromDirectory(next);
  assert.equal(updated.version, "1.0.1");
  assert.equal(modules.progress(ID).tasks["phase-k"].correct, true);
  assert.equal(modules.list().installed.find((entry) => entry.id === ID).version, "1.0.1");

  const broken = hostedCopy(hosted, "broken", "1.0.2");
  const indexPath = path.join(broken, "content", "payload-index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  index.files[0].sha256 = "0".repeat(64);
  fs.writeFileSync(indexPath, JSON.stringify(index));
  assert.throws(() => modules.installFromDirectory(broken), (error) => error.code === "integrity");
  assert.equal(modules.list().installed.find((entry) => entry.id === ID).version, "1.0.1");
  assert.equal(modules.progress(ID).tasks["phase-k"].correct, true);
  assert.equal(fs.existsSync(path.join(data, "module-packages", ID, "1.0.2")), false);
  assert.equal(fs.existsSync(path.join(data, "module-packages", ID, "1.0.2.incoming")), false);
});

test("inkompatibler Core und Downgrade ersetzen das Modul nicht", () => {
  const data = tempDir();
  const hosted = tempDir();
  const modules = manager(data, hosted);
  modules.installFromDirectory(hostedCopy(hosted, "base", "1.0.0"));
  modules.progress(ID, { tasks: { gehalten: { correct: true } }, assessment: {} });
  const tooNew = hostedCopy(hosted, "too-new", "1.1.0", ">=9.0.0 <10.0.0");
  assert.throws(() => modules.installFromDirectory(tooNew), (error) => error.code === "incompatible-core");
  const older = hostedCopy(hosted, "older", "0.9.0");
  assert.throws(() => modules.installFromDirectory(older), (error) => error.code === "downgrade-blocked");
  assert.equal(modules.list().installed.find((entry) => entry.id === ID).version, "1.0.0");
  assert.equal(modules.progress(ID).tasks.gehalten.correct, true);
});

test("abgebrochener Core-Download lässt das installierte Modul liegen", async () => {
  const data = tempDir();
  const hosted = tempDir();
  const modules = manager(data, hosted);
  modules.installFromDirectory(hostedCopy(hosted, "base", "1.0.0"));
  modules.progress(ID, { tasks: { vorUpdate: { correct: true } }, assessment: {} });
  let pulls = 0;
  const service = createUpdateService({
    dataDir: data,
    channel: "stable",
    installedVersion: "0.3.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: async (url) => {
      pulls += 1;
      if (String(url).endsWith("feed.json")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            releases: [{
              version: "0.3.1",
              notes: "Test",
              assets: [
                { name: "setup.exe", url: "https://example.test/setup.exe" },
                { name: "setup.exe.sha256", url: "https://example.test/setup.exe.sha256" }
              ]
            }]
          })
        };
      }
      if (String(url).endsWith(".sha256")) {
        return { ok: true, status: 200, text: async () => "f".repeat(64) };
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => "3" },
        arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer
      };
    }
  });
  const checked = await service.check();
  assert.equal(checked.available, "0.3.1");
  const failed = await service.download();
  assert.equal(failed.phase, "failed");
  assert.equal(failed.error, "hash-mismatch");
  assert.equal(modules.list().installed.find((entry) => entry.id === ID).version, "1.0.0");
  assert.equal(modules.progress(ID).tasks.vorUpdate.correct, true);
  assert.equal(fs.readdirSync(path.join(data, "updates", "incoming")).length, 0);
});
