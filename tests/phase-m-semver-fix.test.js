"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { compare, isSafeVersion } = require("../src/updates/semver");
const { assertManifestMatches } = require("../src/updates/module-manifest");

test("Prerelease-Zahlen werden numerisch verglichen", () => {
  assert.equal(compare("0.3.1-dev.2", "0.3.1-dev.10"), -1);
  assert.equal(compare("0.3.1-dev.10", "0.3.1-dev.2"), 1);
  assert.equal(compare("0.3.1-dev.10", "0.3.1-dev.10"), 0);
});

test("SemVer-Rangfolge der Prerelease-Teile", () => {
  assert.equal(compare("1.0.0-alpha", "1.0.0-alpha.1"), -1);
  assert.equal(compare("1.0.0-alpha.1", "1.0.0-alpha.beta"), -1);
  assert.equal(compare("1.0.0-alpha.beta", "1.0.0-beta"), -1);
  assert.equal(compare("1.0.0-beta.2", "1.0.0-beta.11"), -1);
  assert.equal(compare("1.2.0", "1.2.0-dev"), 1);
  assert.equal(compare("1.2.0-dev", "1.2.0"), -1);
  assert.equal(compare("0.3.1-dev.1", "0.3.2"), -1);
});

test("isSafeVersion bleibt unveraendert", () => {
  assert.equal(isSafeVersion("0.3.1-dev.10"), true);
  assert.equal(isSafeVersion("1.2.0"), true);
  assert.equal(isSafeVersion("../1.2.0"), false);
});

function pack(manifest) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-manifest-"));
  if (manifest) fs.writeFileSync(path.join(dir, "academy-module.json"), JSON.stringify(manifest));
  return dir;
}

test("Manifest-Abgleich akzeptiert passende id und version", () => {
  const dir = pack({ id: "it-systemintegration", version: "1.0.1" });
  try {
    assert.doesNotThrow(() => assertManifestMatches(dir, { id: "it-systemintegration", version: "1.0.1" }));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("Manifest-Abgleich lehnt abweichende id, version oder fehlendes Manifest ab", () => {
  const prepared = { id: "it-systemintegration", version: "1.0.1" };
  const cases = [
    [{ id: "anderes-modul", version: "1.0.1" }, "manifest-mismatch"],
    [{ id: "it-systemintegration", version: "1.0.0" }, "manifest-mismatch"],
    [null, "manifest-missing"]
  ];
  for (const [manifest, code] of cases) {
    const dir = pack(manifest);
    try {
      assert.throws(() => assertManifestMatches(dir, prepared), (error) => error.code === code);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
});
