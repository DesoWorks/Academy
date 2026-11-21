"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { injectHost } = require("../src/protocol");

const root = path.join(__dirname, "..");

test("Modul-HTML erhält die zentralen Academy-Styles ohne Inline-Skript", () => {
  const html = "<!DOCTYPE html><html><head><title>LF</title></head><body><header class=\"kopf\"></header></body></html>";
  const out = injectHost(html);
  assert.match(out, /href="\/__academy\/design-tokens\.css"/);
  assert.match(out, /href="\/__academy\/host\.css"/);
  assert.equal(out.includes("<script"), false);
  assert.match(out, /<\/head>/);
});

test("Design-Tokens stammen aus der Website-Produktion", () => {
  const tokens = fs.readFileSync(path.join(root, "src/renderer/design-tokens.css"), "utf8");
  assert.match(tokens, /#070708/);
  assert.match(tokens, /#FF5369/);
  assert.match(tokens, /#F7F4F5/);
  assert.match(tokens, /Consolas/);
  assert.match(tokens, /Verdana/);
  const shell = fs.readFileSync(path.join(root, "src/renderer/shell.css"), "utf8");
  assert.match(shell, /@import url\("design-tokens\.css"\)/);
  assert.match(shell, /body\.modul-offen/);
  assert.doesNotMatch(shell, /#20B9D8/);
  assert.doesNotMatch(shell, /height:\s*70vh/);
});

test("Host-CSS lockert die CSP nicht und versteckt nur das doppelte Logo", () => {
  const host = fs.readFileSync(path.join(root, "src/renderer/host.css"), "utf8");
  assert.match(host, /kopf-logo/);
  assert.doesNotMatch(host, /unsafe-inline/);
  assert.doesNotMatch(host, /<script/);
});
