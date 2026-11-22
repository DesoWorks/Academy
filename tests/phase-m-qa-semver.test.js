"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { compare } = require("../src/updates/semver");

test("SemVer vergleicht numerische DEV-Kennungen korrekt und Stable liegt über Prerelease", () => {
  assert.equal(compare("0.3.1-dev.2", "0.3.1-dev.10"), -1);
  assert.equal(compare("0.3.1-dev.10", "0.3.1-dev.2"), 1);
  assert.equal(compare("1.2.0", "1.2.0-dev"), 1);
  assert.equal(compare("0.3.1-dev.1", "0.3.1-dev.2"), -1);
});
