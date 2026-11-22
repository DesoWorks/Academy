"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const { SOURCE_URL, fetchReleases, fetchCandidates } = require("../src/updates/github-feed");

const platform = `${process.platform}-${process.arch}`;
function release(tag, { draft = false, channel, version, privateKey } = {}) {
  const manifest = {
    product: "desoworks-academy", channel, version, package: "core", platform,
    sha256: "a".repeat(64)
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest));
  const signatureBytes = Buffer.from(crypto.sign(null, manifestBytes, privateKey).toString("base64"));
  const prefix = `https://github.com/DesoWorks/Academy/releases/download/${tag}/`;
  return {
    tag_name: tag,
    draft,
    prerelease: channel !== "stable",
    assets: [
      { name: "manifest.json", browser_download_url: `${prefix}manifest.json`, size: manifestBytes.length },
      { name: "manifest.json.sig", browser_download_url: `${prefix}manifest.json.sig`, size: signatureBytes.length }
    ],
    testAssets: { "manifest.json": manifestBytes, "manifest.json.sig": signatureBytes }
  };
}
function mockFetch(releases) {
  const requests = [];
  const fetch = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    if (String(url) === SOURCE_URL) return { ok: true, status: 200, json: async () => releases };
    for (const item of releases) {
      const asset = item.assets.find((entry) => entry.browser_download_url === String(url));
      if (asset) return { ok: true, status: 200, arrayBuffer: async () => item.testAssets[asset.name] };
    }
    return { ok: false, status: 404, arrayBuffer: async () => Buffer.alloc(0) };
  };
  return { fetch, requests };
}
function keyPair() {
  const pair = crypto.generateKeyPairSync("ed25519");
  return { ...pair, publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }) };
}

test("öffentliche Releases-API liefert HTTP 200 ohne Token; Authorization bleibt aus", async () => {
  const { fetch, requests } = mockFetch([]);
  const result = await fetchReleases({ fetch, token: "", env: {} });
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.equal(requests[0].url, SOURCE_URL);
  assert.equal(new Headers(requests[0].options.headers).has("authorization"), false);
});

test("DEV berücksichtigt ausschließlich DEV-Tags", async () => {
  const { privateKey, publicKeyPem } = keyPair();
  const releases = [
    release("dev/v0.4.0-dev.12", { channel: "dev", version: "0.4.0-dev.12", privateKey }),
    release("beta/v0.4.0-beta.2", { channel: "beta", version: "0.4.0-beta.2", privateKey }),
    release("stable/v0.4.0", { channel: "stable", version: "0.4.0", privateKey })
  ];
  const { fetch } = mockFetch(releases);
  const candidates = await fetchCandidates({ fetch, channel: "dev", platform, publicKey: publicKeyPem });
  assert.deepEqual(candidates.map((item) => item.tag), ["dev/v0.4.0-dev.12"]);
});

test("BETA berücksichtigt ausschließlich BETA-Tags", async () => {
  const { privateKey, publicKeyPem } = keyPair();
  const releases = [
    release("dev/v0.4.0-dev.12", { channel: "dev", version: "0.4.0-dev.12", privateKey }),
    release("beta/v0.4.0-beta.2", { channel: "beta", version: "0.4.0-beta.2", privateKey }),
    release("stable/v0.4.0", { channel: "stable", version: "0.4.0", privateKey })
  ];
  const { fetch } = mockFetch(releases);
  const candidates = await fetchCandidates({ fetch, channel: "beta", platform, publicKey: publicKeyPem });
  assert.deepEqual(candidates.map((item) => item.tag), ["beta/v0.4.0-beta.2"]);
});

test("STABLE ignoriert DEV-, BETA-Tags und Entwürfe", async () => {
  const { privateKey, publicKeyPem } = keyPair();
  const releases = [
    release("dev/v0.4.0-dev.12", { channel: "dev", version: "0.4.0-dev.12", privateKey }),
    release("beta/v0.4.0-beta.2", { channel: "beta", version: "0.4.0-beta.2", privateKey }),
    release("stable/v0.4.0", { channel: "stable", version: "0.4.0", privateKey }),
    release("stable/v0.4.1", { draft: true, channel: "stable", version: "0.4.1", privateKey })
  ];
  const { fetch } = mockFetch(releases);
  const candidates = await fetchCandidates({ fetch, channel: "stable", platform, publicKey: publicKeyPem });
  assert.deepEqual(candidates.map((item) => item.tag), ["stable/v0.4.0"]);
});
