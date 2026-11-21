"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

test("Vorlage enthält Manifest und Kurs", () => {
  const root = path.join(__dirname, "..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "academy-module.json"), "utf8"));
  assert.equal(manifest.format, "desoworks.academy.module");
  assert.equal(fs.existsSync(path.join(root, manifest.entry)), true);
});
