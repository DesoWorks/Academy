"use strict";

// Design Harmony 2B: Theme-Vertrag (docs/operation-academy/DESIGN-HARMONY-2B-VERTRAG.md).
// Lokal ausführen: node --test tests/design-harmony-2b-theme.test.js

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { injectHost, applyTheme, themeFromUrl, THEMES, THEME_PARAM } = require("../src/protocol");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const moduleUrl = (query) => new URL("academy://it-systemintegration/web/module/lf3-client-anbindung.html" + query);

const THEME_FILES = [
  "src/protocol.js",
  "src/renderer/shell.js",
  "src/renderer/module.js",
  "src/renderer/settings.js",
  "src/renderer/settings.html",
  "src/renderer/design-tokens.css",
  "src/renderer/shell.css",
  "src/renderer/host.css",
  "modules/it-systemintegration/web/js/anzeige-glossar.js",
  "modules/it-systemintegration/web/js/navigation.js"
];

test("Allowlist: genau hell, dunkel, kontrast", () => {
  assert.deepEqual([...THEMES], ["hell", "dunkel", "kontrast"]);
  assert.equal(THEME_PARAM, "academy-theme");
  for (const theme of THEMES) {
    assert.equal(themeFromUrl(moduleUrl("?academy-theme=" + theme)), theme);
  }
});

test("Fehlender, leerer, unbekannter oder mehrfacher Wert ergibt hell", () => {
  const cases = [
    "",
    "?academy-theme=",
    "?academy-theme=knight",
    "?academy-theme=system",
    "?academy-theme=KONTRAST",
    "?academy-theme=%20dunkel",
    "?academy-theme=dunkel&academy-theme=kontrast",
    "?academy-theme=dunkel&academy-theme=dunkel",
    "?other=dunkel",
    '?academy-theme="><script>alert(1)</script>'
  ];
  for (const query of cases) {
    assert.equal(themeFromUrl(moduleUrl(query)), "hell", "Query: " + query);
  }
  assert.equal(themeFromUrl(moduleUrl("?a=1&academy-theme=kontrast#anker")), "kontrast");
});

test("applyTheme setzt genau ein Attribut und erhält andere Root-Attribute", () => {
  const page = '<!DOCTYPE html><html lang="de" data-academy-theme="kontrast" DATA-ACADEMY-THEME title="x data-academy-theme y"><head></head><body></body></html>';
  const out = applyTheme(page, "dunkel");
  assert.equal((out.match(/data-academy-theme/gi) || []).length, 2); // Attribut + Text im title-Wert
  assert.match(out, /<html lang="de" title="x data-academy-theme y" data-academy-theme="dunkel">/);
  assert.equal(applyTheme("<html><head></head></html>", "hell"), '<html data-academy-theme="hell"><head></head></html>');
  assert.match(applyTheme("<HTML LANG=de><head></head></HTML>", "kontrast"), /^<html LANG=de data-academy-theme="kontrast">/i);
});

test("Unbekannte Werte in applyTheme fallen auf hell zurück", () => {
  assert.match(applyTheme("<html></html>", 'dunkel"><script>'), /data-academy-theme="hell"/);
  assert.match(applyTheme("<html></html>", undefined), /data-academy-theme="hell"/);
});

test("Der Roh-Query gelangt nie in das HTML", () => {
  const evil = '?academy-theme=%22%3E%3Cscript%3Ealert(1)%3C/script%3E&x=%3Cb%3E';
  const out = applyTheme("<!DOCTYPE html><html lang=\"de\"><head></head><body></body></html>", themeFromUrl(moduleUrl(evil)));
  assert.equal(out.includes("script"), false);
  assert.equal(out.includes("alert"), false);
  assert.match(out, /data-academy-theme="hell"/);
});

test("Dokument ohne <html> bleibt unverändert (kein Standalone-Ersatz)", () => {
  const fragment = "<p>Kein Wurzelelement</p>";
  assert.equal(applyTheme(fragment, "dunkel"), fragment);
});

test("Nur aufgelöste Modul-HTML erhält das Attribut: Anwendung steht im HTML-Zweig von serveModule", () => {
  const source = read("src/protocol.js");
  const html = source.match(/if \(path\.extname\(file\)\.toLowerCase\(\) === "\.html"\) \{[\s\S]*?\n  \}/);
  assert.ok(html, "HTML-Zweig in serveModule gefunden");
  assert.match(html[0], /applyTheme\(/);
  assert.match(html[0], /themeFromUrl\(url\)/);
  assert.equal((source.match(/applyTheme\(page/g) || []).length, 1);
  // Shell-HTML (injectBridge) und Assets bleiben unberührt.
  const shellBranch = source.slice(source.indexOf("function registerProtocol"));
  assert.doesNotMatch(shellBranch, /applyTheme\(/);
});

test("injectHost bleibt skriptfrei und hängt die vorhandenen Stylesheets ein", () => {
  const out = injectHost('<!DOCTYPE html><html lang="de"><head><title>LF</title></head><body></body></html>');
  assert.equal(out.includes("<script"), false);
  assert.match(out, /href="\/__academy\/design-tokens\.css"/);
  assert.match(out, /href="\/__academy\/host\.css"/);
  assert.equal(typeof injectHost, "function");
});

test("Kein postMessage in neuen oder geänderten Theme-Dateien", () => {
  for (const file of THEME_FILES) {
    assert.doesNotMatch(read(file), /postMessage|MessageChannel|BroadcastChannel|addEventListener\(\s*["']message["']/, file);
  }
});

test("Weder CSP, Sandbox noch Referrer-Policy werden gelockert", () => {
  const pathSource = read("src/protocol-path.js");
  assert.match(pathSource, /script-src 'self'/);
  const mod = read("src/renderer/module.js");
  assert.match(mod, /setAttribute\("sandbox", "allow-scripts allow-forms allow-same-origin"\)/);
  assert.match(mod, /referrerPolicy = "no-referrer"/);
});

test("Shell: Schlüssel academy.theme, Allowlist, Speicher über academyDesktop", () => {
  const shell = read("src/renderer/shell.js");
  assert.match(shell, /"academy\.theme"/);
  assert.match(shell, /\["hell", "dunkel", "kontrast"\]/);
  assert.match(shell, /api\.storageLoadAll\(\)/);
  assert.match(shell, /api\.storageSet\(THEME_KEY/);
  assert.doesNotMatch(shell, /localStorage/);
});

function runShell(items, storageSet) {
  const attributes = {};
  const calls = [];
  const documentElement = {
    setAttribute(name, value) { attributes[name] = String(value); },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null; }
  };
  const sandbox = {
    window: {
      academyDesktop: {
        storageLoadAll() {
          if (items instanceof Error) throw items;
          return items;
        },
        storageSet(key, value) { calls.push([key, value]); return storageSet ? storageSet(key, value) : { ok: true }; }
      }
    },
    document: {
      readyState: "complete",
      documentElement,
      body: { getAttribute() { return ""; } },
      getElementById() { return null; },
      createElement() { return {}; },
      addEventListener() {}
    }
  };
  sandbox.window.document = sandbox.document;
  vm.runInNewContext(read("src/renderer/shell.js"), sandbox);
  return { shell: sandbox.window.AcademyShell, attributes, calls };
}

test("Shell liest ohne Schreibzugriff: fehlend, ungültig oder Lesefehler ergibt hell", () => {
  const cases = [
    { ok: true, items: {} },
    { ok: true, items: { "academy.theme": "knight" } },
    { ok: true, items: { "academy.theme": "" } },
    { ok: false, message: "defekt" },
    null,
    new Error("Lesefehler")
  ];
  for (const items of cases) {
    const { shell, attributes, calls } = runShell(items);
    assert.equal(attributes["data-academy-theme"], "hell");
    assert.equal(shell.activeTheme(), "hell");
    assert.equal(calls.length, 0, "beim Lesen wird nichts geschrieben");
  }
});

test("Shell übernimmt einen gespeicherten gültigen Wert beim Aufbau", () => {
  for (const theme of ["hell", "dunkel", "kontrast"]) {
    const { attributes } = runShell({ ok: true, items: { "academy.theme": theme } });
    assert.equal(attributes["data-academy-theme"], theme);
  }
});

test("Shell schreibt nur erlaubte Werte und wirkt erst bei ok:true", () => {
  const { shell, attributes, calls } = runShell({ ok: true, items: {} });
  assert.equal(shell.writeTheme("knight"), false);
  assert.equal(shell.writeTheme(""), false);
  assert.equal(calls.length, 0);
  assert.equal(shell.writeTheme("dunkel"), true);
  assert.deepEqual(calls, [["academy.theme", "dunkel"]]);
  assert.equal(attributes["data-academy-theme"], "dunkel");

  const failing = runShell({ ok: true, items: { "academy.theme": "dunkel" } }, () => ({ ok: false }));
  assert.equal(failing.shell.writeTheme("kontrast"), false);
  assert.equal(failing.attributes["data-academy-theme"], "dunkel", "bleibt auf dem letzten wirksamen Wert");
  const throwing = runShell({ ok: true, items: {} }, () => { throw new Error("IPC"); });
  assert.equal(throwing.shell.writeTheme("dunkel"), false);
  assert.equal(throwing.attributes["data-academy-theme"], "hell");
});

test("module.js hängt genau academy-theme per URL-API an und lässt Query und Fragment stehen", () => {
  const mod = read("src/renderer/module.js");
  assert.match(mod, /new URL\("academy:\/\/"/);
  assert.match(mod, /searchParams\.set\("academy-theme", shell\.activeTheme\(\)\)/);
  assert.match(mod, /frame\.src = frameUrl\.href/);
  const url = new URL("academy://it-systemintegration/web/index.html?a=1#anker");
  url.searchParams.set("academy-theme", "dunkel");
  assert.equal(url.href, "academy://it-systemintegration/web/index.html?a=1&academy-theme=dunkel#anker");
});

test("Einstellungen: Darstellung mit drei Radios und sofortiger Speicherung", () => {
  const html = read("src/renderer/settings.html");
  const radios = html.match(/<input type="radio" name="darstellung" value="(hell|dunkel|kontrast)"/g) || [];
  assert.equal(radios.length, 3);
  const js = read("src/renderer/settings.js");
  assert.match(js, /shell\.writeTheme\(radio\.value\)/);
});

function cssBlock(css, selectorStart) {
  const start = css.indexOf(selectorStart);
  assert.ok(start >= 0, "Selektor fehlt: " + selectorStart);
  return css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
}

function roleValues(block) {
  const values = {};
  for (const match of block.matchAll(/--farbe-([a-z-]+):\s*([^;]+);/g)) values[match[1]] = match[2].trim();
  return values;
}

test("Rollenmatrix: Hell und Kontrast entsprechen unverändert den Modulwerten", () => {
  const tokens = read("src/renderer/design-tokens.css");
  const styles = read("modules/it-systemintegration/web/css/styles.css");
  const moduleHell = roleValues(cssBlock(styles, ":root {"));
  const moduleKontrast = roleValues(cssBlock(styles, 'html[data-theme="kontrast"]'));
  const hell = roleValues(cssBlock(tokens, ':root[data-academy-theme="hell"]'));
  const kontrast = roleValues(cssBlock(tokens, ':root[data-academy-theme="kontrast"]'));
  for (const role of ["hintergrund", "flaeche", "text", "text-leise", "akzent", "rahmen"]) {
    assert.equal(hell[role], moduleHell[role], "hell " + role);
    assert.equal(kontrast[role], moduleKontrast[role], "kontrast " + role);
  }
  assert.equal(hell.fokus, "var(--farbe-akzent)");
  assert.equal(kontrast.fokus, "var(--farbe-akzent)");
});

test("Rollenmatrix: Dunkel besteht nur aus Aliasen auf --dw-*, ohne Hexwerte", () => {
  const tokens = read("src/renderer/design-tokens.css");
  const dunkel = cssBlock(tokens, ":root:not([data-academy-theme]),");
  const roles = roleValues(dunkel);
  assert.deepEqual(Object.keys(roles).sort(), ["akzent", "fokus", "flaeche", "hintergrund", "rahmen", "text", "text-leise"].sort());
  for (const value of Object.values(roles)) assert.match(value, /^var\(--dw-[a-z-]+\)$/);
  assert.doesNotMatch(dunkel, /#[0-9a-fA-F]{3,8}/);
  assert.equal(roles.fokus, "var(--dw-focus)");
});

test("Bestehende Knight-Werte bleiben unverändert", () => {
  const tokens = read("src/renderer/design-tokens.css");
  const expected = {
    "--dw-canvas": "#070708",
    "--dw-surface": "#141114",
    "--dw-text": "#F7F4F5",
    "--dw-text-muted": "#C4B8BD",
    "--dw-border": "#55434A",
    "--dw-accent": "#FF5369",
    "--dw-focus": "#FFB0BA"
  };
  for (const [name, value] of Object.entries(expected)) {
    assert.match(tokens, new RegExp(name + ":\\s*" + value + ";"), name);
  }
});

test("Shell-CSS: Aliase folgen den Rollen, Fokus nutzt --farbe-fokus, forced-colors bleibt unberührt", () => {
  const css = read("src/renderer/shell.css");
  assert.match(css, /--hintergrund:\s*var\(--farbe-hintergrund\)/);
  assert.match(css, /--flaeche:\s*var\(--farbe-flaeche\)/);
  assert.match(css, /--text:\s*var\(--farbe-text\)/);
  assert.match(css, /--text-gedaempft:\s*var\(--farbe-text-leise\)/);
  assert.match(css, /--rahmen:\s*var\(--farbe-rahmen\)/);
  assert.match(css, /--akzent:\s*var\(--farbe-akzent\)/);
  assert.match(css, /outline:\s*3px solid var\(--farbe-fokus\)/);
  assert.doesNotMatch(css, /forced-colors/);
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "kein festes Hex in der Shell");
  assert.doesNotMatch(read("src/renderer/design-tokens.css").split("Academy-Rollenmatrix")[0].length ? "" : "", /x/);
});

test("Modul: Academy-Wert ist die einzige Quelle, Standalone bleibt erhalten", () => {
  const js = read("modules/it-systemintegration/web/js/anzeige-glossar.js");
  assert.match(js, /hasAttribute\("data-academy-theme"\)/);
  assert.match(js, /dataset\.theme = inAcademy \? academyTheme : current\.theme/);
  assert.match(js, /Darstellung wird in der Academy eingestellt/);
  assert.match(js, /theme\.disabled = true/);
  assert.match(js, /!inAcademy && window\.matchMedia/);
  assert.doesNotMatch(js, /setAttribute\("data-academy-theme"|dataset\.academyTheme\s*=/, "Modul setzt das Attribut nie selbst");
  assert.match(js, /var defaults = \{ text: 100, spacing: false, theme: "hell", ruhig: false \}/);
});

test("Modulnavigation: validierter Root-Wert, URL-Auflösung, kein Origin-String-Vergleich", () => {
  const js = read("modules/it-systemintegration/web/js/navigation.js");
  assert.match(js, /new URL\(href, document\.baseURI\)/);
  assert.match(js, /url\.protocol !== "academy:"/);
  assert.match(js, /url\.hostname !== here\.hostname/);
  assert.doesNotMatch(js, /\.origin\s*[!=]==?/);
  assert.match(js, /searchParams\.set\(THEME_PARAM, rootTheme\)/);
  assert.doesNotMatch(js, /academy:\/\/app/);
  assert.doesNotMatch(js, /<script|document\.write|eval\(/);
});

test("Die Hosteinbettung bleibt skriptfrei: HOST_LINKS enthält nur Stylesheets", () => {
  const source = read("src/protocol.js");
  const links = source.match(/const HOST_LINKS = '([^']*)'/);
  assert.ok(links);
  assert.equal(links[1].includes("<script"), false);
});
