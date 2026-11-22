"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { parseReleaseTag, selectCandidate, switchConsequences } = require("../src/updates/channels");

test("Release-Tags ordnen Kanal, Modul und Version zu", () => {
  assert.deepEqual(parseReleaseTag("dev/v0.4.0-dev.12"), {
    channel: "dev",
    version: "0.4.0-dev.12"
  });
  assert.deepEqual(parseReleaseTag("stable/v0.4.0"), {
    channel: "stable",
    version: "0.4.0"
  });
  assert.deepEqual(parseReleaseTag("beta/modules/desoworks.it-systemintegration/v1.0.2-beta.1"), {
    channel: "beta",
    module: "desoworks.it-systemintegration",
    version: "1.0.2-beta.1"
  });
  assert.equal(parseReleaseTag("v0.4.0"), null);
});

test("Release-Auswahl lehnt kanalübergreifende Releases und Entwürfe ab", () => {
  const stableRelease = { tag_name: "stable/v0.4.0", draft: false };
  const devRelease = { tag_name: "dev/v0.4.0-dev.1", draft: false };
  const draftRelease = { tag_name: "dev/v0.4.0-dev.2", draft: true };

  assert.equal(selectCandidate([stableRelease], { channel: "dev" }), null);
  assert.equal(selectCandidate([devRelease], { channel: "stable" }), null);
  assert.equal(selectCandidate([draftRelease], { channel: "dev" }), null);
});

test("Release-Auswahl vergleicht numerische Prerelease-Teile", () => {
  const releases = [
    { tag_name: "dev/v0.3.1-dev.2", draft: false },
    { tag_name: "dev/v0.3.1-dev.10", draft: false }
  ];

  assert.equal(selectCandidate(releases, { channel: "dev" }).version, "0.3.1-dev.10");
});

test("Downgrade ist nur mit allowDowngrade zulässig", () => {
  const release = { tag_name: "dev/v0.3.1-dev.2", draft: false };

  assert.equal(selectCandidate([release], {
    channel: "dev",
    currentVersion: "0.4.0",
    allowDowngrade: false
  }), null);
  assert.equal(selectCandidate([release], {
    channel: "dev",
    currentVersion: "0.4.0",
    allowDowngrade: true
  }).version, "0.3.1-dev.2");
});

test("Kanalwechsel zu DEV ist Opt-in und kann einen Downgrade auslösen", () => {
  const optIn = switchConsequences("stable", "dev", "0.4.0", "0.4.0-dev.2");
  assert.equal(optIn.optIn, true);

  const downgrade = switchConsequences("dev", "stable", "0.4.0-dev.2", "0.3.1");
  assert.equal(downgrade.downgrade, true);
});
