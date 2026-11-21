"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { MODULE_CSP } = require("../src/protocol-path");

const WEB = path.join(__dirname, "..", "modules", "it-systemintegration", "web");
const HTML = path.join(WEB, "module", "lf3-abnahme.html");
const SCRIPT = path.join(WEB, "js", "lf3-abnahme.js");

function scriptTags(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({ attrs: m[1], body: m[2] }));
}

test("LF3-Abnahme enthält kein Inline-Skript ohne src", () => {
  const tags = scriptTags(fs.readFileSync(HTML, "utf8"));
  assert.ok(tags.length > 0, "Es muss ein externes Skript eingebunden sein.");
  for (const tag of tags) {
    assert.match(tag.attrs, /\bsrc\s*=/i, "<script> ohne src-Attribut würde von der CSP blockiert.");
    assert.equal(tag.body.trim(), "", "Ein <script src> darf keinen Inline-Inhalt tragen.");
  }
});

test("LF3-Abnahme enthält keine Inline-Ereignisattribute", () => {
  const html = fs.readFileSync(HTML, "utf8");
  assert.equal(/<[a-z][^>]*\son[a-z]+\s*=/i.test(html), false);
  assert.equal(/javascript:/i.test(html), false);
});

test("LF3-Abnahme lädt die externe Skriptdatei, und sie existiert", () => {
  const html = fs.readFileSync(HTML, "utf8");
  assert.match(html, /<script src="\.\.\/js\/lf3-abnahme\.js"><\/script>/);
  assert.equal(fs.existsSync(SCRIPT), true);
  const code = fs.readFileSync(SCRIPT, "utf8");
  assert.ok(code.includes("it-ausbildung-lf3-abnahme-v1"), "Speicherschlüssel muss unverändert bleiben.");
  assert.doesNotThrow(() => new Function(code), "Die ausgelagerte Datei muss syntaktisch gültig sein.");
});

test("MODULE_CSP bleibt streng für Skripte", () => {
  const csp = String(MODULE_CSP);
  const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src"));
  assert.equal(scriptSrc, "script-src 'self'");
  assert.equal(/script-src[^;]*unsafe-inline/.test(csp), false);
  assert.equal(/script-src[^;]*unsafe-eval/.test(csp), false);
  assert.equal(/script-src[^;]*nonce-/.test(csp), false);
});
