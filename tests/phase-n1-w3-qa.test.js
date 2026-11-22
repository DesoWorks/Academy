"use strict";

// Unabhaengige Welle-3-Regressionen mit synthetischen signierten Installerpaketen.
// Keine echten Academy-Module, kein Netzwerk, kein Installerstart.
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createUpdateService } = require("../src/updates/service");
const { SOURCE_URL } = require("../src/updates/github-feed");

const platform = `${process.platform}-${process.arch}`;
function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-n1w3-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
function arrayBuffer(bytes) { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }
function fixture(t, options = {}) {
  const keys = crypto.generateKeyPairSync("ed25519");
  const version = "0.4.0-dev.20";
  const tag = `dev/v${version}`;
  const name = `Academy-Setup-${version}.exe`;
  const payload = Buffer.from("synthetic installer payload; deliberately not an Academy module", "utf8");
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  const manifest = {
    schemaVersion: 1, product: "desoworks-academy", channel: "dev", sourceBranch: "dev",
    releaseTag: tag, version, commit: "c".repeat(40), publishedAt: "2026-11-22T10:00:00.000Z",
    package: { kind: "core", name, size: payload.length },
    sha256: options.badHash ? "0".repeat(64) : hash,
    signatureStatus: "unsigned", minimumCore: null, platform
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const signature = crypto.sign(null, manifestBytes, keys.privateKey);
  const url = `https://github.com/DesoWorks/Academy/releases/download/${tag}/`;
  const assets = [
    { name: "manifest.json", browser_download_url: `${url}manifest.json`, size: manifestBytes.length },
    { name: "manifest.json.sig", browser_download_url: `${url}manifest.json.sig`, size: signature.length },
    { name, browser_download_url: `${url}${name}`, size: payload.length }
  ];
  const release = { tag_name: tag, draft: false, prerelease: true, target_commitish: "dev", published_at: "2026-11-22T10:00:00Z", body: "synthetic", assets };
  const files = new Map([[assets[0].browser_download_url, options.tamperManifest ? Buffer.from(manifestBytes.toString("utf8").replace(version, "0.4.0-dev.21")) : manifestBytes],
    [assets[1].browser_download_url, Buffer.from(`${signature.toString("base64")}\n`)], [assets[2].browser_download_url, payload]]);
  const dataDir = tempDir(t);
  const fetch = async (requestUrl) => {
    const key = String(requestUrl);
    if (key === SOURCE_URL) return { ok: true, status: 200, json: async () => [release] };
    if (options.abort && key === assets[2].browser_download_url) throw new Error("synthetic connection interruption");
    if (!files.has(key)) return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
    return { ok: true, status: 200, url: key, headers: { get: () => null }, arrayBuffer: async () => arrayBuffer(files.get(key)) };
  };
  const service = createUpdateService({ dataDir, channel: "dev", installedVersion: "0.3.1-dev.4", feedUrl: "", channelPreference: () => "dev", fetch, updatePublicKey: keys.publicKey.export({ type: "spki", format: "pem" }), env: {} });
  return { service, dataDir, payload };
}
function incoming(dataDir) {
  const dir = path.join(dataDir, "updates", "incoming");
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

test("manipulierte Manifestbytes ohne passende Signatur werden abgewiesen", async (t) => {
  const { service, dataDir } = fixture(t, { tamperManifest: true });
  const result = await service.check();
  assert.equal(result.phase, "rejected");
  assert.equal(result.available, null);
  assert.deepEqual(incoming(dataDir), []);
});

test("falscher SHA-256 verhindert das Bereitstellen des synthetischen Pakets", async (t) => {
  const { service, dataDir } = fixture(t, { badHash: true });
  assert.equal((await service.check()).phase, "available");
  const result = await service.download();
  assert.equal(result.phase, "failed");
  assert.equal(result.error, "hash-mismatch");
  assert.equal(result.installerPath, null);
  assert.deepEqual(incoming(dataDir), []);
});

test("abgebrochener Download hinterlaesst Installationsdatei und Lernstand unveraendert", async (t) => {
  const { service, dataDir } = fixture(t, { abort: true });
  const installedMarker = path.join(dataDir, "installed-version.txt");
  const learning = path.join(dataDir, "learning-progress.json");
  fs.writeFileSync(installedMarker, "0.3.1-dev.4");
  fs.writeFileSync(learning, '{"lernziel-1":{"punkte":42}}');
  const installedBefore = fs.readFileSync(installedMarker);
  const learningBefore = fs.readFileSync(learning);
  assert.equal((await service.check()).phase, "available");
  const result = await service.download();
  assert.equal(result.phase, "failed");
  assert.deepEqual(fs.readFileSync(installedMarker), installedBefore);
  assert.deepEqual(fs.readFileSync(learning), learningBefore);
  assert.deepEqual(incoming(dataDir), []);
});
