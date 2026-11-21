"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

// Der Academy Core liefert keine Fachinhalte und keine IT-Plattform mit.
const required = [
  "src/renderer/home.html",
  "src/renderer/home.js",
  "src/renderer/shell.css",
  "src/renderer/shell.js",
  "src/renderer/module.html",
  "src/renderer/catalog.html",
  "src/renderer/settings.html",
  "src/renderer/verwaltung.html",
  "src/renderer/about.html",
  "src/renderer/ki.html",
  "src/renderer/ide.html",
  "src/renderer/brand/signet.svg",
  "modules/wissen-weitergeben/academy-module.json",
  "catalog/official.json"
];

test("Shell-Seiten und Beispielmodul sind vorhanden", () => {
  for (const relative of required) {
    assert.equal(fs.existsSync(path.join(root, relative)), true, relative);
  }
});

test("package.json bündelt keine fremde Plattform", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.name, "desoworks-academy");
  assert.equal(pkg.version, "0.3.0");
  assert.equal(pkg.build.appId, "dev.desoworks.academy");
  for (const entry of pkg.build.extraResources) {
    assert.notEqual(entry.from, "../");
    assert.equal(entry.from.startsWith(".."), false, entry.from);
  }
});

test("Shell-Seiten verweisen nicht auf IT-CSS und nicht auf index.html", () => {
  const dir = path.join(root, "src", "renderer");
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(dir, file), "utf8");
    assert.equal(/css\/styles\.css|css\/startseite\.css/.test(html), false, file);
    assert.equal(/href="\/index\.html"/.test(html), false, file);
  }
});
