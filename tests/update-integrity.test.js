"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { selectRelease } = require("../src/updates/feed");
const { createUpdateService } = require("../src/updates/service");
const { verifyPublisher } = require("../src/updates/signature");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-integrity-"));
}

test("Repository-Pinning lehnt Pfadtricks und fremde Download-Hosts ab", () => {
  const { repositoryPinned } = require("../src/updates/feed");
  assert.equal(repositoryPinned("https://github.com/Evil/x/releases/download/v1/DesoWorks/IT-Ausbildung/setup.exe"), false);
  assert.equal(repositoryPinned("https://objects.githubusercontent.com/DesoWorks/IT-Ausbildung/setup.exe"), false);
  assert.equal(repositoryPinned("https://github.com/DesoWorks/IT-Ausbildung/releases/download/v0.2.0/setup.exe"), true);
  const selected = selectRelease([
    {
      version: "9.0.0",
      notes: "fremd",
      assets: [
        { name: "setup.exe", url: "https://github.com/Other/Repo/releases/download/v9.0.0/setup.exe" },
        { name: "setup.exe.sha256", url: "https://github.com/Other/Repo/releases/download/v9.0.0/setup.exe.sha256" }
      ]
    }
  ], { channel: "stable", installed: "1.0.0" });
  assert.equal(selected.action, "rejected");
  assert.match(selected.message, /Repository/);
});

test("ungültige Release-Metadaten starten keinen Download", async () => {
  const dir = tempDir();
  const service = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: async () => ({ ok: true, status: 200, json: async () => "kein objekt" })
  });
  const state = await service.check();
  assert.equal(state.error, "metadata-invalid");
  const downloaded = await service.download();
  assert.notEqual(downloaded.phase, "ready");
  assert.equal(fs.readdirSync(path.join(dir, "updates", "incoming")).length, 0);
});

test("abgebrochener Download hinterlässt keine Installationsdatei", async () => {
  const dir = tempDir();
  const service = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: (url, init) => {
      if (String(url).endsWith("feed.json")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            releases: [{
              version: "0.2.0",
              notes: "abbruch",
              assets: [
                { name: "setup.exe", url: "https://example.test/setup.exe" },
                { name: "setup.exe.sha256", url: "https://example.test/setup.exe.sha256" }
              ]
            }]
          })
        });
      }
      return new Promise((_resolve, reject) => {
        const signal = init && init.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const error = new Error("abgebrochen");
            error.name = "AbortError";
            reject(error);
          });
        }
      });
    }
  });
  await service.check();
  const pending = service.download();
  await new Promise((resolve) => setTimeout(resolve, 30));
  service.abort();
  const state = await pending;
  assert.equal(state.phase, "aborted");
  assert.equal(fs.readdirSync(path.join(dir, "updates", "incoming")).filter((name) => !name.endsWith(".partial")).length, 0);
});

test("eine unsignierte Datei besteht die Herausgeberprüfung nicht", () => {
  const file = path.join(tempDir(), "unsigniert.exe");
  fs.writeFileSync(file, "MZ keine signatur");
  const result = verifyPublisher(file, "00112233445566778899AABBCCDDEEFF00112233");
  assert.equal(result.ok, false);
  assert.notEqual(result.status, "Valid");
});
