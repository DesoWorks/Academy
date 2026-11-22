"use strict";

// Welle 4: unabhaengige Logiktests. Ausschliesslich synthetische Bytes/Keys und temporäre Daten;
// kein Netzwerk, kein Installerstart, keine echte Academy-Installation.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { verifyManifest } = require("../src/updates/manifest-sign");
const { createUpdateService } = require("../src/updates/service");
const { SOURCE_URL } = require("../src/updates/github-feed");

const installedVersion = "0.3.1-dev.4";
const nextVersion = "0.3.1-dev.5";
const tag = `dev/v${nextVersion}`;
const platform = `${process.platform}-${process.arch}`;
function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-n1w4-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function ab(bytes) { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
function fixture(t, options = {}) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const pem = publicKey.export({ type: "spki", format: "pem" });
  const installer = Buffer.from("synthetic update package; never executed", "utf8");
  const sha = crypto.createHash("sha256").update(installer).digest("hex");
  const manifest = {
    schemaVersion: 1, product: "desoworks-academy", channel: options.wrongChannel ? "stable" : "dev",
    releaseTag: tag, version: nextVersion, commit: "d".repeat(40),
    package: { kind: "core", name: `DesoWorks-Academy-Setup-${nextVersion}.exe`, size: installer.length },
    sha256: options.badHash ? "0".repeat(64) : sha, platform
  };
  const raw = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const signature = crypto.sign(null, raw, privateKey);
  const signedBytes = options.invalidSignature ? Buffer.from(raw.toString("utf8").replace(nextVersion, "0.3.1-dev.6")) : raw;
  const sig = options.invalidSignature ? signature : crypto.sign(null, signedBytes, privateKey);
  const servedManifest = options.invalidSignature ? signedBytes : raw;
  const root = `https://github.com/DesoWorks/Academy/releases/download/${tag}/`;
  const assets = [
    { name: "manifest.json", browser_download_url: `${root}manifest.json`, size: servedManifest.length },
    { name: "manifest.json.sig", browser_download_url: `${root}manifest.json.sig`, size: sig.length },
    { name: manifest.package.name, browser_download_url: `${root}${manifest.package.name}`, size: installer.length }
  ];
  const release = { tag_name: options.wrongTagChannel ? `stable/v${nextVersion}` : tag, draft: false, prerelease: true, assets };
  const assetsByUrl = new Map([[assets[0].browser_download_url, servedManifest], [assets[1].browser_download_url, Buffer.from(`${sig.toString("base64")}\n`)], [assets[2].browser_download_url, installer]]);
  const dir = tempDir(t);
  const fetch = async (url) => {
    const key = String(url);
    if (key === SOURCE_URL) return { ok: true, status: 200, json: async () => [release] };
    const bytes = assetsByUrl.get(key);
    return bytes ? { ok: true, status: 200, url: key, headers: { get: () => null }, arrayBuffer: async () => ab(bytes) }
      : { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
  };
  const service = createUpdateService({ dataDir: dir, channel: "dev", channelPreference: () => "dev", installedVersion: options.installedVersion || installedVersion,
    feedUrl: "", fetch, updatePublicKey: pem, env: {}, platform });
  return { service, dir, raw, sig, pem, installer, sha };
}
function incoming(dir) {
  const folder = path.join(dir, "updates", "incoming");
  return fs.existsSync(folder) ? fs.readdirSync(folder).sort() : [];
}

test("gültige Ed25519-Signatur über exakt die Manifestbytes wird akzeptiert", (t) => {
  const f = fixture(t);
  assert.deepEqual(verifyManifest(f.raw, f.sig.toString("base64"), f.pem), { ok: true });
});

test("ungültige Signatur verhindert Kandidat, Download und Installationsplan", async (t) => {
  const f = fixture(t, { invalidSignature: true });
  const checked = await f.service.check();
  assert.notEqual(checked.phase, "available");
  assert.equal(checked.available, null);
  const downloaded = await f.service.download();
  assert.notEqual(downloaded.phase, "ready");
  assert.deepEqual(f.service.installPlan(path.join(f.dir, "backup.zip")).ok, false);
  assert.deepEqual(incoming(f.dir), []);
});

test("signiertes Manifest mit falschem SHA-256 wird beim Paketdownload verworfen", async (t) => {
  const f = fixture(t, { badHash: true });
  assert.equal((await f.service.check()).phase, "available");
  const result = await f.service.download();
  assert.equal(result.error, "hash-mismatch");
  assert.notEqual(result.phase, "ready");
  assert.deepEqual(incoming(f.dir), []);
});

test("Manifest-Kanalabweichung wird auch bei gültiger Signatur abgelehnt", async (t) => {
  const f = fixture(t, { wrongChannel: true });
  const result = await f.service.check();
  assert.notEqual(result.phase, "available");
  assert.equal(result.available, null);
  assert.deepEqual(incoming(f.dir), []);
});

test("ältere Releaseversion wird gegenüber installiertem Stand nicht als Update angeboten", async (t) => {
  const f = fixture(t, { installedVersion: "0.3.1-dev.6" });
  const result = await f.service.check();
  assert.notEqual(result.phase, "available");
  assert.equal(result.available, null);
  assert.notEqual((await f.service.download()).phase, "ready");
  assert.equal(f.service.installPlan(path.join(f.dir, "backup.zip")).ok, false);
});

test("ohne verfügbares Update sperren Download und Installationsplan unabhängig von UI", async (t) => {
  const f = fixture(t);
  // Eine Quelle ohne Releases bildet den Zustand 'kein Update verfügbar' ab.
  const noUpdate = createUpdateService({ dataDir: tempDir(t), channel: "dev", channelPreference: () => "dev",
    installedVersion, feedUrl: "", fetch: async (url) => String(url) === SOURCE_URL
      ? { ok: true, status: 200, json: async () => [] } : { ok: false, status: 404 }, updatePublicKey: f.pem, env: {}, platform });
  const checked = await noUpdate.check();
  assert.notEqual(checked.phase, "available");
  assert.equal(checked.available, null);
  assert.notEqual((await noUpdate.download()).phase, "ready");
  assert.equal(noUpdate.installPlan(path.join(f.dir, "backup.zip")).ok, false);
});
