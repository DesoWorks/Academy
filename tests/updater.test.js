"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createUpdateService } = require("../src/updates/service");
const { fromGitHubReleases, selectRelease } = require("../src/updates/feed");
const { compare } = require("../src/updates/semver");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-up-"));
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
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
    };
  };
}

test("Entwicklungsbuild installiert keine produktive Version", async () => {
  const dir = tempDir();
  const service = createUpdateService({
    dataDir: dir,
    channel: "dev",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": {
        json: { releases: [{ version: "1.0.0", prerelease: false, notes: "Stabil", assets: [] }] }
      }
    })
  });
  const state = await service.check();
  assert.equal(state.phase, "blocked");
  assert.equal(state.available, "1.0.0");
  assert.match(state.message, /Entwicklungsbuild/);
  const downloaded = await service.download();
  assert.equal(downloaded.phase, "blocked");
  assert.equal(fs.readdirSync(path.join(dir, "updates", "incoming")).length, 0);
});

test("stabile Prüfung ohne Netz lässt die Datenbank in Ruhe", async () => {
  const dir = tempDir();
  const db = path.join(dir, "academy.sqlite");
  fs.writeFileSync(db, "fortschritt-unberuehrt");
  const service = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: async () => { throw new Error("offline"); }
  });
  const state = await service.check();
  assert.equal(state.phase, "failed");
  assert.match(state.message, /fehlgeschlagen/);
  assert.equal(fs.readFileSync(db, "utf8"), "fortschritt-unberuehrt");
});

test("Download prüft SHA-256 und eine falsche Summe wird verworfen", async () => {
  const dir = tempDir();
  const bytes = Buffer.from("setup-bytes");
  const service = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": {
        json: {
          releases: [{
            version: "0.2.0",
            notes: "Mehr Übungen",
            assets: [
              { name: "IT-Ausbildung-Setup-0.2.0.exe", url: "https://example.test/setup.exe" },
              { name: "IT-Ausbildung-Setup-0.2.0.exe.sha256", url: "https://example.test/setup.exe.sha256" }
            ]
          }]
        }
      },
      "https://example.test/setup.exe": { bytes },
      "https://example.test/setup.exe.sha256": { text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n" }
    })
  });
  await service.check();
  const failed = await service.download();
  assert.equal(failed.phase, "failed");
  assert.equal(failed.error, "hash-mismatch");
  assert.equal(fs.readdirSync(path.join(dir, "updates", "incoming")).length, 0);

  const good = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": {
        json: {
          releases: [{
            version: "0.2.0",
            notes: "Mehr Übungen",
            assets: [
              { name: "IT-Ausbildung-Setup-0.2.0.exe", url: "https://example.test/setup.exe" },
              { name: "IT-Ausbildung-Setup-0.2.0.exe.sha256", url: "https://example.test/setup.exe.sha256" }
            ]
          }]
        }
      },
      "https://example.test/setup.exe": { bytes },
      "https://example.test/setup.exe.sha256": { text: sha(bytes) }
    })
  });
  await good.check();
  const ready = await good.download();
  assert.equal(ready.phase, "ready");
  assert.equal(ready.notes, "Mehr Übungen");
  assert.equal(fs.existsSync(ready.installerPath), true);
});

test("unterbrochener Download wird verworfen und blockiert die Installation nicht mit einer halben Datei", () => {
  const dir = tempDir();
  const incoming = path.join(dir, "updates", "incoming");
  fs.mkdirSync(incoming, { recursive: true });
  fs.writeFileSync(path.join(incoming, "0.2.0.exe.partial"), "halb");
  fs.writeFileSync(path.join(dir, "updates", "state.json"), JSON.stringify({ phase: "downloading", available: "0.2.0" }));
  fs.writeFileSync(path.join(dir, "academy.sqlite"), "fortschritt");
  const service = createUpdateService({ dataDir: dir, channel: "stable", installedVersion: "0.1.0" });
  const state = service.reconcile();
  assert.equal(state.phase, "interrupted");
  assert.equal(fs.existsSync(path.join(incoming, "0.2.0.exe.partial")), false);
  assert.equal(fs.readFileSync(path.join(dir, "academy.sqlite"), "utf8"), "fortschritt");
  const plan = service.installPlan(path.join(dir, "academy.sqlite"));
  assert.equal(plan.ok, false);
});

test("Installation ohne Sicherung startet nicht", async () => {
  const dir = tempDir();
  const bytes = Buffer.from("installer");
  const service = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": {
        json: {
          releases: [{
            version: "0.2.0",
            notes: "",
            assets: [
              { name: "setup.exe", url: "https://example.test/setup.exe" },
              { name: "setup.exe.sha256", url: "https://example.test/setup.exe.sha256" }
            ]
          }]
        }
      },
      "https://example.test/setup.exe": { bytes },
      "https://example.test/setup.exe.sha256": { text: sha(bytes) }
    })
  });
  await service.check();
  await service.download();
  const blocked = service.installPlan(path.join(dir, "fehlt.sqlite"));
  assert.equal(blocked.ok, false);
  const backup = path.join(dir, "backup.sqlite");
  fs.writeFileSync(backup, "sicherung");
  const unsigned = service.installPlan(backup);
  assert.equal(unsigned.ok, false);
  const signed = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    publisherThumbprint: "TEST",
    verifyPublisher: () => ({ ok: true }),
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": {
        json: {
          releases: [{
            version: "0.2.0",
            notes: "",
            assets: [
              { name: "setup.exe", url: "https://example.test/setup.exe" },
              { name: "setup.exe.sha256", url: "https://example.test/setup.exe.sha256" }
            ]
          }]
        }
      },
      "https://example.test/setup.exe": { bytes },
      "https://example.test/setup.exe.sha256": { text: sha(bytes) }
    })
  });
  await signed.check();
  await signed.download();
  const plan = signed.installPlan(backup);
  assert.equal(plan.ok, true);
  assert.equal(plan.quitFirst, true);
  assert.equal(plan.command.endsWith(`${path.sep}0.2.0.exe`), true);
});

test("ein Versionsstring mit Pfad wird nicht als Datei geschrieben", async () => {
  const dir = tempDir();
  const service = createUpdateService({
    dataDir: dir,
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "https://example.test/feed.json",
    extraHosts: ["example.test"],
    fetch: fetchRoutes({
      "https://example.test/feed.json": {
        json: {
          releases: [{
            version: "..\\..\\evil",
            notes: "",
            assets: [
              { name: "setup.exe", url: "https://example.test/setup.exe" },
              { name: "setup.exe.sha256", url: "https://example.test/setup.exe.sha256" }
            ]
          }]
        }
      }
    })
  });
  const state = await service.check();
  assert.notEqual(state.phase, "available");
  assert.equal(fs.readdirSync(path.join(dir, "updates", "incoming")).length, 0);
});

test("eine bereitgelegte state.json außerhalb des Updateordners startet nichts", () => {
  const dir = tempDir();
  fs.mkdirSync(path.join(dir, "updates"), { recursive: true });
  fs.writeFileSync(path.join(dir, "updates", "state.json"), JSON.stringify({
    phase: "ready",
    installerPath: "C:\\\\Windows\\\\System32\\\\notepad.exe",
    expectedSha256: "abc"
  }));
  const service = createUpdateService({ dataDir: dir, channel: "stable", installedVersion: "0.1.0" });
  const state = service.reconcile();
  assert.notEqual(state.phase, "ready");
  const plan = service.installPlan(path.join(dir, "academy.sqlite"));
  assert.equal(plan.ok, false);
});

test("fremde Updatequelle und fehlende Prüfsumme werden abgelehnt", () => {
  const selected = selectRelease([
    { version: "2.0.0", notes: "ohne Summe", assets: [{ name: "setup.exe", url: "https://example.test/a" }] }
  ], { channel: "stable", installed: "1.0.0" });
  assert.equal(selected.action, "rejected");
  const github = fromGitHubReleases([
    { draft: true, tag_name: "v9.0.0", assets: [] },
    { tag_name: "v1.2.0", prerelease: false, body: "Hinweis", assets: [{ name: "a.exe", browser_download_url: "https://github.com/a" }] }
  ]);
  assert.equal(github.length, 1);
  assert.equal(github[0].version, "1.2.0");
  assert.equal(compare("1.2.0", "1.2.0-dev"), 1);
  const service = createUpdateService({
    dataDir: tempDir(),
    channel: "stable",
    installedVersion: "0.1.0",
    feedUrl: "http://evil.example/feed",
    fetch: async () => { throw new Error("soll nicht laufen"); }
  });
  return service.check().then((state) => {
    assert.equal(state.error, "host-rejected");
  });
});
