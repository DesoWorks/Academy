"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createUpdateService } = require("../src/updates/service");

function temporaryDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "academy-phase-n-wiring-"));
}

function createService(overrides = {}) {
  const dataDir = temporaryDataDir();
  const requests = [];
  const service = createUpdateService({
    dataDir,
    installedVersion: "0.3.0",
    channel: "dev",
    feedUrl: "",
    channelPreference: () => "dev",
    fetch: async (url, options) => {
      requests.push({ url: String(url), options });
      return { ok: true, status: 200, json: async () => [] };
    },
    ...overrides
  });
  return { dataDir, requests, service };
}

test("ohne Token geht der Abruf an die öffentliche GitHub-Releases-API, die Installation bleibt unverändert", async () => {
  const { dataDir, requests, service } = createService({
    githubToken: "",
    env: {}
  });

  const result = await service.check();

  assert.notEqual(result.error, "no-token");
  assert.equal(result.installed, "0.3.0");
  assert.equal(requests.length, 1, "genau ein Abruf der Release-Liste");
  assert.equal(requests[0].url.split("?")[0], "https://api.github.com/repos/DesoWorks/Academy/releases");
  assert.equal(JSON.stringify(requests[0].options || {}).toLowerCase().includes("authorization"), false, "kein Token im Abruf");
  assert.equal(fs.existsSync(path.join(dataDir, "updates", "incoming", "0.3.0.exe")), false);
  assert.equal(service.status().installed, "0.3.0");
});

test("unbekannter Kanalwert nightly wird abgelehnt und bleibt gesperrt", async () => {
  const { requests, service } = createService({
    channelPreference: () => "nightly",
    githubToken: "qa-test-token",
    env: {}
  });

  const result = await service.check();

  assert.equal(service.channel, null);
  assert.equal(result.phase, "blocked");
  assert.equal(result.error, "unknown-channel");
  assert.equal(result.installed, "0.3.0");
  assert.deepEqual(requests, [], "ungültiger Kanal darf keinen Netzabruf auslösen");
});

test("ausdrückliche Loopback-feedUrl wird nicht durch den GitHub-Feed ersetzt", async () => {
  const feedUrl = "http://127.0.0.1:43210/updates.json";
  const { requests, service } = createService({
    feedUrl,
    devFeedKey: "qa-local-feed-key"
  });

  await service.check();

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, feedUrl);
  assert.equal(requests.some(({ url }) => url.includes("api.github.com")), false);
});

const { resolveFeedUrl } = require("../src/updates/feed");

test("gepackter Build ignoriert ACADEMY_UPDATE_FEED und nutzt nur GitHub (H-1)", () => {
  const env = { ACADEMY_UPDATE_FEED: "http://127.0.0.1:43210/updates.json" };
  assert.equal(resolveFeedUrl({ isPackaged: true, env }), "");
  assert.equal(resolveFeedUrl({ isPackaged: true, env: { ACADEMY_UPDATE_FEED: "https://evil.example/feed.json" } }), "");
});

test("ungepackter Lauf darf ACADEMY_UPDATE_FEED für Tests nutzen", () => {
  const url = "http://127.0.0.1:43210/updates.json";
  assert.equal(resolveFeedUrl({ isPackaged: false, env: { ACADEMY_UPDATE_FEED: url } }), url);
  assert.equal(resolveFeedUrl({ isPackaged: false, env: {} }), "");
  assert.equal(resolveFeedUrl({ isPackaged: false }), "");
  assert.equal(resolveFeedUrl(), "");
});

test("gepackter Build mit gesetzter Variable fragt GitHub statt des Legacy-Feeds", async () => {
  const { requests, service } = createService({
    feedUrl: resolveFeedUrl({ isPackaged: true, env: { ACADEMY_UPDATE_FEED: "http://127.0.0.1:43210/updates.json" } })
  });
  await service.check();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.split("?")[0], "https://api.github.com/repos/DesoWorks/Academy/releases");
});
