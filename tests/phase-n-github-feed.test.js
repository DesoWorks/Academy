"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const MODULE_PATH = path.resolve(__dirname, "../src/updates/github-feed.js");
const RELEASES_URL = "https://api.github.com/repos/DesoWorks/Academy/releases";

function loadFeedWithFetch(fetchImplementation) {
  delete require.cache[MODULE_PATH];
  const originalFetch = global.fetch;
  global.fetch = fetchImplementation;
  try {
    return require(MODULE_PATH);
  } finally {
    global.fetch = originalFetch;
  }
}

test("GitHub-Feed verwendet die festgelegte Releases-API-Adresse", async () => {
  let requestedUrl;
  const feed = loadFeedWithFetch(async (url) => {
    requestedUrl = String(url);
    return { ok: true, status: 200, json: async () => [] };
  });

  await feed.fetchReleases();
  assert.equal(requestedUrl, RELEASES_URL);
});

test("Ohne Token wird kein Authorization-Header gesendet", async () => {
  let requestOptions;
  const feed = loadFeedWithFetch(async (_url, options) => {
    requestOptions = options;
    return { ok: true, status: 200, json: async () => [] };
  });

  await feed.fetchReleases();
  const headers = new Headers(requestOptions && requestOptions.headers);
  assert.equal(headers.has("authorization"), false);
});

test("Token wird ausschließlich im Authorization-Header verwendet", async () => {
  const token = "qa-test-token-not-for-url";
  let requestedUrl;
  let requestOptions;
  const feed = loadFeedWithFetch(async (url, options) => {
    requestedUrl = String(url);
    requestOptions = options;
    return { ok: true, status: 200, json: async () => [] };
  });

  await feed.fetchReleases({ token });
  const headers = new Headers(requestOptions && requestOptions.headers);
  assert.equal(headers.get("authorization"), `Bearer ${token}`);
  assert.equal(requestedUrl.includes(token), false);

  const moduleSource = fs.readFileSync(MODULE_PATH, "utf8");
  assert.equal(moduleSource.includes(token), false);
});

test("Release ohne passendes Manifest-channel-Feld wird nicht als Kandidat gemappt", async () => {
  const releases = [{
    tag_name: "dev/v0.4.0-dev.1",
    draft: false,
    assets: [{
      name: "academy-update.json",
      browser_download_url: "https://example.invalid/academy-update.json"
    }]
  }];
  const feed = loadFeedWithFetch(async () => ({
    ok: true,
    status: 200,
    json: async () => releases
  }));

  const candidates = await feed.fetchCandidates({ channel: "dev" });
  assert.deepEqual(candidates, []);
});
