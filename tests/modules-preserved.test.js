"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");

const required = [
  "index.html",
  "js/navigation.js",
  "js/version.js",
  "js/fortschritt.js",
  "js/windows-labor.js",
  "js/windows-werkzeugkiste.js",
  "module/windows-werkzeugkiste.html",
  "module/pc-explorer.html",
  "js/pc-explorer.js",
  "module/raid-labor.html",
  "js/raid-labor.js",
  "module/bwl-werkstatt.html",
  "js/bwl-werkstatt.js",
  "css/styles.css"
];

test("bestehende Module sind weiterhin im Workspace", () => {
  for (const relative of required) {
    assert.equal(fs.existsSync(path.join(root, relative)), true, relative);
  }
  const version = fs.readFileSync(path.join(root, "js/version.js"), "utf8");
  assert.match(version, /0\.16\.3-alpha\.1/);
});
