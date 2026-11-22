"use strict";

// Phase N.1 / Welle 2: Tests des GitHub-Updaters (Signatur, Kanal, Downgrade, Hash, Weiterleitungen).
// Alle Schluessel sind kurzlebig und entstehen im Test. Kein Netzwerk, kein Token, kein privater Repo-Schluessel.
// Zusicherungen pruefen immer ok === true bzw. ok === false, nie das Ergebnisobjekt selbst.

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { verifyManifest } = require("../src/updates/manifest-sign");
const { createUpdateService } = require("../src/updates/service");
const { SOURCE_URL } = require("../src/updates/github-feed");
const { MESSAGES } = require("../src/updates/messages");

const PLATFORM = `${process.platform}-${process.arch}`;

function keyPair() {
  const pair = crypto.generateKeyPairSync("ed25519");
  return { privateKey: pair.privateKey, publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }) };
}

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-n1w2-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

// Baut ein Release samt Dateien. files: Map von Download-URL auf Bytes.
function buildRelease(options) {
  const {
    channel = "dev",
    version = "0.4.0-dev.12",
    privateKey,
    installerBytes = Buffer.from("installer-bytes-for-test"),
    installerName = `Academy-Setup-${version}.exe`,
    manifestPatch = {},
    sign = true,
    tamper = false,
    sha256Override = null,
    prefix = null
  } = options;
  const tag = `${channel}/v${version}`;
  const base = prefix || `https://github.com/DesoWorks/Academy/releases/download/${tag}/`;
  const manifest = Object.assign({
    schemaVersion: 1,
    product: "desoworks-academy",
    channel,
    sourceBranch: channel === "stable" ? "main" : channel,
    releaseTag: tag,
    version,
    commit: "a".repeat(40),
    publishedAt: "2026-11-22T10:00:00.000Z",
    package: { kind: "core", name: installerName, size: installerBytes.length },
    sha256: sha256Override || crypto.createHash("sha256").update(installerBytes).digest("hex"),
    signatureStatus: "unsigned",
    minimumCore: null,
    platform: PLATFORM
  }, manifestPatch);
  const signedBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8");
  const signature = Buffer.from(crypto.sign(null, signedBytes, privateKey).toString("base64") + "\n", "utf8");
  const servedBytes = tamper
    ? Buffer.from(signedBytes.toString("utf8").replace('"minimumCore": null', '"minimumCore": "0.0.1"'), "utf8")
    : signedBytes;
  assert.notEqual(tamper && servedBytes.equals(signedBytes), true, "die Manipulation muss die Bytes aendern");

  const files = new Map();
  const assets = [];
  const add = (name, bytes) => {
    files.set(`${base}${name}`, bytes);
    assets.push({ name, browser_download_url: `${base}${name}`, size: bytes.length });
  };
  add("manifest.json", servedBytes);
  if (sign) add("manifest.json.sig", signature);
  add(installerName, installerBytes);
  const release = {
    tag_name: tag,
    draft: false,
    prerelease: channel !== "stable",
    target_commitish: channel,
    published_at: "2026-11-22T10:00:00Z",
    body: "Testnotizen",
    assets
  };
  return { release, files, tag, installerUrl: `${base}${installerName}`, manifestUrl: `${base}manifest.json`, installerBytes, servedBytes, signature };
}

function mockFetch(releases, files, hooksArg) {
  const hooks = hooksArg || {};
  const requests = [];
  const fetch = async (url, init = {}) => {
    const key = String(url);
    requests.push({ url: key, headers: init.headers || {} });
    if (hooks.before) {
      const answer = hooks.before(key);
      if (answer) return answer;
    }
    if (key === SOURCE_URL) return { ok: true, status: 200, json: async () => releases };
    if (files.has(key)) {
      return { ok: true, status: 200, url: key, headers: { get: () => null }, arrayBuffer: async () => toArrayBuffer(files.get(key)) };
    }
    return { ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) };
  };
  return { fetch, requests };
}

function makeService(options) {
  return createUpdateService({
    dataDir: options.dataDir,
    channel: "dev",
    installedVersion: options.installed || "0.3.1-dev.2",
    feedUrl: "",
    channelPreference: options.preference || (() => "dev"),
    fetch: options.fetch,
    updatePublicKey: options.publicKeyPem,
    githubToken: options.token,
    env: {}
  });
}

function incomingNames(dataDir) {
  const dir = path.join(dataDir, "updates", "incoming");
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

function setup(t, releaseOptions, hooks, serviceOptions) {
  const keys = keyPair();
  const built = buildRelease(Object.assign({ privateKey: keys.privateKey }, releaseOptions));
  const dataDir = tempDir(t);
  const net = mockFetch([built.release], built.files, hooks);
  const service = makeService(Object.assign({ dataDir, fetch: net.fetch, publicKeyPem: keys.publicKeyPem }, serviceOptions));
  return { keys, built, dataDir, net, service };
}

// ---------- 1 bis 4: Signaturpruefung der exakten Bytes ----------

test("gueltige Ed25519-Signatur ueber die exakten Bytes wird akzeptiert", () => {
  const { privateKey, publicKeyPem } = keyPair();
  const bytes = Buffer.from('{"product":"desoworks-academy"}\n', "utf8");
  const signature = crypto.sign(null, bytes, privateKey).toString("base64");
  const verdict = verifyManifest(bytes, signature, publicKeyPem);
  assert.equal(verdict.ok, true);
});

test("ungueltige Signatur wird abgewiesen", () => {
  const { privateKey, publicKeyPem } = keyPair();
  const bytes = Buffer.from('{"product":"desoworks-academy"}\n', "utf8");
  const other = crypto.sign(null, Buffer.from("anderer Inhalt"), privateKey).toString("base64");
  const wrongContent = verifyManifest(bytes, other, publicKeyPem);
  assert.equal(wrongContent.ok, false);
  assert.equal(wrongContent.reason, "signature-mismatch");
  const garbage = verifyManifest(bytes, Buffer.alloc(64, 7).toString("base64"), publicKeyPem);
  assert.equal(garbage.ok, false);
  const badFormat = verifyManifest(bytes, "kein base64!", publicKeyPem);
  assert.equal(badFormat.ok, false);
  assert.equal(badFormat.reason, "signature-invalid-format");
  const missing = verifyManifest(bytes, "  ", publicKeyPem);
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "signature-missing");
});

test("manipulierte Manifest-Bytes werden abgewiesen", () => {
  const { privateKey, publicKeyPem } = keyPair();
  const bytes = Buffer.from('{"version":"0.4.0-dev.1","sha256":"aa"}\n', "utf8");
  const signature = crypto.sign(null, bytes, privateKey).toString("base64");
  assert.equal(verifyManifest(bytes, signature, publicKeyPem).ok, true);
  const tampered = Buffer.from(bytes);
  tampered[tampered.length - 3] ^= 0x01;
  const verdict = verifyManifest(tampered, signature, publicKeyPem);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "signature-mismatch");
  const reserialized = Buffer.from(JSON.stringify(JSON.parse(bytes.toString("utf8")), null, 2), "utf8");
  assert.equal(verifyManifest(reserialized, signature, publicKeyPem).ok, false);
});

test("falscher oeffentlicher Schluessel und kein Ed25519-Schluessel werden abgewiesen", () => {
  const signer = keyPair();
  const stranger = keyPair();
  const bytes = Buffer.from('{"product":"desoworks-academy"}\n', "utf8");
  const signature = crypto.sign(null, bytes, signer.privateKey).toString("base64");
  assert.equal(verifyManifest(bytes, signature, signer.publicKeyPem).ok, true);
  const wrongKey = verifyManifest(bytes, signature, stranger.publicKeyPem);
  assert.equal(wrongKey.ok, false);
  assert.equal(wrongKey.reason, "signature-mismatch");
  const ec = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const notEd = verifyManifest(bytes, signature, ec.publicKey.export({ type: "spki", format: "pem" }));
  assert.equal(notEd.ok, false);
  assert.equal(notEd.reason, "key-not-ed25519");
  const invalidKey = verifyManifest(bytes, signature, "-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----\n");
  assert.equal(invalidKey.ok, false);
  assert.equal(invalidKey.reason, "key-invalid");
});

// ---------- Service: gueltiger Weg ----------

test("gueltig signiertes DEV-Release wird erkannt, geladen, geprueft und zur Installation freigegeben", async (t) => {
  const { service, built, dataDir, net } = setup(t);
  const checked = await service.check();
  assert.equal(checked.phase, "available");
  assert.equal(checked.available, "0.4.0-dev.12");
  assert.equal(checked.channel, "dev");
  const ready = await service.download();
  assert.equal(ready.phase, "ready");
  assert.equal(ready.error, null);
  assert.equal(fs.readFileSync(ready.installerPath).equals(built.installerBytes), true);
  assert.equal(fs.existsSync(path.join(dataDir, "updates", "incoming", "0.4.0-dev.12.manifest.json")), true);
  const backup = path.join(tempDir(t), "backup.db");
  fs.writeFileSync(backup, "sicherung");
  const plan = service.installPlan(backup);
  assert.equal(plan.ok, true);
  assert.equal(plan.command, ready.installerPath);
  assert.equal(net.requests.some((request) => request.url.includes("evil")), false);
});

test("Weiterleitung innerhalb von GitHub-Hosts bleibt erlaubt", async (t) => {
  let installerUrl = "";
  const { service, built } = setup(t, {}, {
    before(url) {
      if (url === installerUrl) {
        return {
          ok: true, status: 200, url: "https://release-assets.githubusercontent.com/github-production-release-asset/x",
          headers: { get: () => null }, arrayBuffer: async () => toArrayBuffer(Buffer.from("installer-bytes-for-test"))
        };
      }
      return null;
    }
  });
  installerUrl = built.installerUrl;
  await service.check();
  const ready = await service.download();
  assert.equal(ready.phase, "ready");
});

// ---------- Service: Signaturverweigerung (DEV umgeht nichts) ----------

test("DEV-Release ohne Signaturdatei wird abgewiesen", async (t) => {
  const { service, net } = setup(t, { sign: false });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.error, "signature-invalid");
  assert.equal(checked.message, MESSAGES.signatureInvalid);
  assert.equal(checked.available, null);
  assert.equal(net.requests.some((request) => request.url.endsWith(".exe")), false);
});

test("Manifest mit Signatur eines anderen Inhalts (manipulierte Bytes) wird abgewiesen", async (t) => {
  const { service, net, dataDir } = setup(t, { tamper: true });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.error, "signature-invalid");
  assert.equal(checked.available, null);
  assert.equal(net.requests.some((request) => request.url.endsWith(".exe")), false);
  const downloaded = await service.download();
  assert.notEqual(downloaded.phase, "ready");
  assert.deepEqual(incomingNames(dataDir), []);
});

test("Manifest, mit einem fremden Schluessel signiert, wird abgewiesen", async (t) => {
  const keys = keyPair();
  const stranger = keyPair();
  const built = buildRelease({ privateKey: stranger.privateKey });
  const net = mockFetch([built.release], built.files);
  const service = makeService({ dataDir: tempDir(t), fetch: net.fetch, publicKeyPem: keys.publicKeyPem });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.error, "signature-invalid");
  assert.equal(checked.available, null);
});

// ---------- Service: Kanaele ----------

test("falscher Kanal: die gespeicherte Wahl steuert die Pruefung, fremde Kanaele bleiben unsichtbar", async (t) => {
  for (const preference of ["beta", "stable"]) {
    const { service, net } = setup(t, {}, null, { preference: () => preference });
    const checked = await service.check();
    assert.equal(checked.channel, preference);
    assert.equal(checked.phase, "current", `${preference} darf ein DEV-Release nicht anbieten`);
    assert.equal(checked.available, null);
    assert.deepEqual(net.requests.map((request) => request.url), [SOURCE_URL], "fremde Manifeste duerfen nicht einmal geladen werden");
  }
});

test("gueltig signiertes Manifest mit falschem Kanalfeld wird abgewiesen", async (t) => {
  const { service } = setup(t, { manifestPatch: { channel: "stable" } });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.available, null);
  assert.equal(checked.installerPath, null);
});

test("unbekannter Kanalwert wird abgelehnt und nie ersetzt", async (t) => {
  const { service, net } = setup(t, {}, null, { preference: () => "nightly" });
  const checked = await service.check();
  assert.equal(checked.phase, "blocked");
  assert.equal(checked.error, "unknown-channel");
  assert.deepEqual(net.requests, []);
});

test("Kanalwechsel nach der Pruefung verwirft das vorbereitete Paket", async (t) => {
  let preference = "dev";
  const { service } = setup(t, {}, null, { preference: () => preference });
  const checked = await service.check();
  assert.equal(checked.phase, "available");
  preference = "stable";
  const switched = await service.download();
  assert.equal(switched.phase, "blocked");
  assert.equal(switched.error, "channel-switched");
});

// ---------- Service: Downgrade ----------

test("Downgrade und gleiche Version werden nicht angeboten", async (t) => {
  const older = setup(t, {}, null, { installed: "0.5.0-dev.1" });
  const checkedOlder = await older.service.check();
  assert.equal(checkedOlder.phase, "current");
  assert.equal(checkedOlder.available, null);

  const same = setup(t, {}, null, { installed: "0.4.0-dev.12" });
  const checkedSame = await same.service.check();
  assert.equal(checkedSame.phase, "current");
  assert.equal(checkedSame.available, null);
});

test("Kanalwechsel erzeugt kein stilles Downgrade", async (t) => {
  const fromStable = setup(t, {}, null, { installed: "0.5.0" });
  const checked = await fromStable.service.check();
  assert.equal(checked.phase, "current");
  assert.equal(checked.available, null);
  const sameCore = setup(t, {}, null, { installed: "0.4.0" });
  const checkedCore = await sameCore.service.check();
  assert.equal(checkedCore.available, null, "eine DEV-Vorabversion ist nicht neuer als die Stable-Version desselben Kerns");
});

// ---------- Service: Hash und Download ----------

test("falscher SHA-256 verhindert die Installation und hinterlaesst keine Datei", async (t) => {
  const { service, dataDir } = setup(t, { sha256Override: "b".repeat(64) });
  const checked = await service.check();
  assert.equal(checked.phase, "available");
  const failed = await service.download();
  assert.equal(failed.phase, "failed");
  assert.equal(failed.error, "hash-mismatch");
  assert.equal(failed.installerPath, null);
  assert.deepEqual(incomingNames(dataDir), []);
  const plan = service.installPlan(path.join(dataDir, "fehlt.db"));
  assert.equal(plan.ok, false);
});

test("Manifest ohne gueltigen SHA-256 wird nicht verwendet", async (t) => {
  const { service } = setup(t, { manifestPatch: { sha256: "XYZ" } });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.available, null);
});

test("Installername im Manifest muss zum Release-Asset passen", async (t) => {
  const { service } = setup(t, { manifestPatch: { package: { kind: "core", name: "Anderer-Name.exe", size: 24 } } });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.error, "metadata-rejected");
});

test("fehlgeschlagener Download laesst Lernstand und Datenordner unberuehrt", async (t) => {
  let installerUrl = "";
  const { service, dataDir, built } = setup(t, {}, {
    before(url) {
      if (url === installerUrl) throw new Error("Netz getrennt");
      return null;
    }
  });
  installerUrl = built.installerUrl;
  const learning = path.join(dataDir, "learning-progress.json");
  fs.writeFileSync(learning, '{"punkte":42}');
  await service.check();
  const failed = await service.download();
  assert.equal(failed.phase, "failed");
  assert.equal(failed.error, "download-failed");
  assert.equal(fs.readFileSync(learning, "utf8"), '{"punkte":42}');
  assert.deepEqual(incomingNames(dataDir), []);
});

// ---------- Service: Quellen und Weiterleitungen ----------

test("Weiterleitung weg von GitHub (fremder Host, http, Loopback) wird beim Download abgewiesen", async (t) => {
  for (const target of ["https://evil.example/Academy.exe", "http://127.0.0.1:9/Academy.exe", "http://github.com/x.exe"]) {
    let installerUrl = "";
    const { service, dataDir, built } = setup(t, {}, {
      before(url) {
        if (url === installerUrl) {
          return { ok: true, status: 200, url: target, headers: { get: () => null }, arrayBuffer: async () => toArrayBuffer(Buffer.from("installer-bytes-for-test")) };
        }
        return null;
      }
    });
    installerUrl = built.installerUrl;
    await service.check();
    const failed = await service.download();
    assert.equal(failed.phase, "failed", target);
    assert.equal(failed.error, "host-rejected", target);
    assert.deepEqual(incomingNames(dataDir), [], target);
  }
});

test("Weiterleitung des Manifests weg von GitHub macht das Release unbrauchbar", async (t) => {
  let manifestUrl = "";
  const { service } = setup(t, {}, {
    before(url) {
      if (url === manifestUrl) return { ok: true, status: 200, url: "https://evil.example/manifest.json", arrayBuffer: async () => new ArrayBuffer(8) };
      return null;
    }
  });
  manifestUrl = (await (async () => {
    const keys = keyPair();
    return buildRelease({ privateKey: keys.privateKey }).manifestUrl;
  })());
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.available, null);
});

test("Assets von fremden Hosts werden nie abgerufen", async (t) => {
  const keys = keyPair();
  const built = buildRelease({ privateKey: keys.privateKey, prefix: "https://evil.example/DesoWorks/Academy/releases/download/dev/v0.4.0-dev.12/" });
  const net = mockFetch([built.release], built.files);
  const service = makeService({ dataDir: tempDir(t), fetch: net.fetch, publicKeyPem: keys.publicKeyPem });
  const checked = await service.check();
  assert.equal(checked.phase, "rejected");
  assert.equal(checked.available, null);
  assert.equal(net.requests.some((request) => request.url.includes("evil.example")), false);
});

// ---------- Service: Token ----------

test("optionales Token geht nur an die Releaseliste, nie an Downloads", async (t) => {
  const { service, net } = setup(t, {}, null, { token: "tok_testwert_123" });
  await service.check();
  await service.download();
  const auth = (request) => Object.keys(request.headers).some((name) => name.toLowerCase() === "authorization");
  const api = net.requests.filter((request) => request.url === SOURCE_URL);
  assert.equal(api.length, 1);
  assert.equal(auth(api[0]), true);
  const downloads = net.requests.filter((request) => request.url !== SOURCE_URL);
  assert.equal(downloads.length >= 3, true);
  assert.equal(downloads.some(auth), false);
});

test("ohne Token funktioniert die Pruefung der oeffentlichen Quelle", async (t) => {
  const { service, net } = setup(t);
  const checked = await service.check();
  assert.equal(checked.phase, "available");
  assert.equal(net.requests.some((request) => Object.keys(request.headers).some((name) => name.toLowerCase() === "authorization")), false);
});

test("im Updatecode steckt kein eingebettetes Token und kein privater Schluessel", () => {
  const dir = path.join(__dirname, "..", "src", "updates");
  const pattern = /gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:EC |RSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/;
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".js"));
  assert.equal(files.length > 0, true);
  for (const name of files) {
    assert.equal(pattern.test(fs.readFileSync(path.join(dir, name), "utf8")), false, name);
  }
});

// ---------- Service: Zustand nach Abbruch und Neustart ----------

test("Neustart behaelt ein geprueftes Paket nur mit gueltigem gespeichertem Manifest", async (t) => {
  const { service, dataDir, net, keys } = setup(t);
  await service.check();
  const ready = await service.download();
  assert.equal(ready.phase, "ready");
  const again = makeService({ dataDir, fetch: net.fetch, publicKeyPem: keys.publicKeyPem });
  assert.equal(again.reconcile().phase, "ready");
  const backup = path.join(tempDir(t), "backup.db");
  fs.writeFileSync(backup, "sicherung");
  fs.unlinkSync(path.join(dataDir, "updates", "incoming", "0.4.0-dev.12.manifest.json.sig"));
  const plan = again.installPlan(backup);
  assert.equal(plan.ok, false);
  assert.equal(plan.message, MESSAGES.signatureInvalid);
  const restarted = makeService({ dataDir, fetch: net.fetch, publicKeyPem: keys.publicKeyPem });
  assert.notEqual(restarted.reconcile().phase, "ready");
  assert.equal(restarted.status().installerPath, null);
});

test("abgebrochene Installation wird als nachvollziehbarer Zustand erkannt", async (t) => {
  const { service, dataDir, net, keys } = setup(t);
  await service.check();
  await service.download();
  const backup = path.join(tempDir(t), "backup.db");
  fs.writeFileSync(backup, "sicherung");
  const plan = service.installPlan(backup);
  assert.equal(plan.ok, true);
  const restarted = makeService({ dataDir, fetch: net.fetch, publicKeyPem: keys.publicKeyPem });
  const state = restarted.reconcile();
  assert.equal(state.phase, "interrupted");
  assert.equal(state.error, "install-interrupted");
  assert.equal(state.message, MESSAGES.installInterrupted);
});
