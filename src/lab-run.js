"use strict";

const fs = require("node:fs");
const path = require("node:path");

function waitLoad(win) {
  if (!win.webContents.isLoading()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Seite nicht geladen: " + win.webContents.getURL())), 45000);
    win.webContents.once("did-finish-load", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function openPage(win, url) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Seite nicht geladen: " + url)), 45000);
    win.webContents.once("did-finish-load", () => {
      clearTimeout(timer);
      resolve();
    });
    win.loadURL(url).catch(reject);
  });
}

async function shot(win, outDir, name) {
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, name), image.toPNG());
}

async function runLaboratory(win, app) {
  const mode = process.env.ACADEMY_LAB;
  const outDir = process.env.ACADEMY_LAB_OUT || path.join(process.cwd(), "test-results");
  fs.mkdirSync(outDir, { recursive: true });
  const findings = [];
  try {
    win.webContents.session.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*"] }, (details, callback) => {
      callback({ cancel: true });
    });
    await waitLoad(win);
    if (mode === "read") {
      const value = await win.webContents.executeJavaScript("localStorage.getItem('academy.lab.fortschritt')");
      if (value !== "gehalten") throw new Error("Lernstand nach Neustart fehlt: " + value);
      fs.writeFileSync(path.join(outDir, "laboratory-read.txt"), value);
      app.exit(0);
      return;
    }
    const modules = [
      {
        url: "academy://app/module/windows-werkzeugkiste.html",
        script: "document.getElementById('ww-modus-labor').click(); var panel = document.getElementById('ww-bereich-labor'); return panel && panel.hidden === false;"
      },
      {
        url: "academy://app/module/pc-explorer.html",
        script: "document.querySelector('[data-ansicht=\"notebook\"]').click(); return document.querySelector('[data-ansicht=\"notebook\"]').getAttribute('aria-pressed') === 'true';"
      },
      {
        url: "academy://app/module/raid-labor.html",
        script: "var before = document.querySelectorAll('[data-laufwerk], .raid-laufwerk, .laufwerk').length; document.getElementById('raid-add').click(); var after = document.body.innerText.length; return after > 20 && !!document.getElementById('raid-add');"
      },
      {
        url: "academy://app/module/bwl-werkstatt.html",
        script: "document.getElementById('bwl-beispiel').click(); var name = document.querySelector('[data-name]'); return !!(name && name.value);"
      }
    ];
    for (const item of modules) {
      await openPage(win, item.url);
      const external = await win.webContents.executeJavaScript("fetch('https://example.com').then(function () { return 'erreicht'; }, function () { return 'blockiert'; })");
      if (external !== "blockiert") throw new Error(item.url + " hat eine externe Verbindung nicht blockiert: " + external);
      const ok = await win.webContents.executeJavaScript("(function () { try { " + item.script + " } catch (error) { return 'FEHLER:' + error.message; } })()");
      if (ok !== true) {
        await shot(win, outDir, path.basename(item.url) + ".png");
        throw new Error("Interaktion fehlgeschlagen: " + item.url + " -> " + ok + " @ " + win.webContents.getURL());
      }
      findings.push(item.url + " gehalten");
    }
    await win.webContents.executeJavaScript("localStorage.setItem('academy.lab.fortschritt', 'gehalten')");
    fs.writeFileSync(path.join(outDir, "laboratory-seed.txt"), findings.join("\n"));
    app.exit(0);
  } catch (error) {
    try { await shot(win, outDir, "laboratory-fehler.png"); } catch (shotError) { /* Screenshot ist nur Beleg. */ }
    fs.writeFileSync(path.join(outDir, "laboratory-error.txt"), String(error && error.stack || error));
    app.exit(4);
  }
}

module.exports = { runLaboratory };
