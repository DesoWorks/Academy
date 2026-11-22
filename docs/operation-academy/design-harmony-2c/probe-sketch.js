"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2c-sketch-"));
const moduleId = "desoworks.it-systemintegration";
const pages = [
  { file: "lf3-dhcp.html", surface: ".skizze" },
  { file: "lf3-dns.html", surface: ".skizze" },
  { file: "lf3-verbindung-eingrenzen.html", surface: ".skizze" },
  { file: "lf3-fehlerbild-protokoll.html", surface: ".skizze" },
  { file: "lf3-ipv4-konfiguration.html", surface: ".karte" }
];
const { declareScheme, registerProtocol } = require(path.join(root, "src/protocol"));
const { registerIpc } = require(path.join(root, "src/ipc"));
const { createModuleManager } = require(path.join(root, "src/modules/manager"));
const { openDatabase } = require(path.join(root, "src/store/database"));
const { CORE_VERSION } = require(path.join(root, "src/core/version"));
const { contentRootFrom } = require(path.join(root, "src/config"));

declareScheme();
app.setPath("userData", dataDir);
const findings = [];
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function frameFor(win, part) {
  for (let i = 0; i < 40; i += 1) {
    const found = (win.webContents.mainFrame.frames || []).find((frame) => String(frame.url).includes(part));
    if (found) return found;
    await sleep(200);
  }
  throw new Error("kein Frame " + part);
}

app.whenReady().then(async () => {
  const storeRef = { current: openDatabase({ dataDir }) };
  const modules = createModuleManager({ dataDir, coreVersion: CORE_VERSION, hostedWebRoots: [path.join(root, "modules")] });
  modules.installFromDirectory(path.join(root, "modules", "it-systemintegration"));
  registerProtocol({
    contentRoot: contentRootFrom(),
    desktopRoot: path.join(root, "src", "renderer"),
    resolveModuleFile(id, requestPath) { return modules.resolveHostedFile(id, requestPath); }
  });
  registerIpc({
    ipcMain, dialog, storeRef, modules,
    updates: { reconcile() {}, status() { return { ok: false, code: "probe" }; }, check() { return Promise.resolve({ ok: false, code: "probe" }); }, plan() { return null; } },
    versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "DesoWorks Academy" },
    channel: "dev"
  });
  const win = new BrowserWindow({
    width: 1280, height: 900, show: false,
    webPreferences: { preload: path.join(root, "src/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }
  });
  for (const theme of ["dunkel", "hell"]) {
    for (const page of pages) {
      await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
      for (let i = 0; i < 40; i += 1) {
        const src = await win.webContents.executeJavaScript("var f=document.querySelector('iframe.modul-frame'); f?f.src:''");
        if (src) break;
        await sleep(200);
      }
      const target = "academy://" + moduleId + "/module/" + page.file + "?academy-theme=" + theme;
      await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
      const frame = await frameFor(win, page.file);
      await sleep(600);
      const paint = await frame.executeJavaScript(`(() => {
        const next = document.querySelector("[data-next='case']") || document.querySelector("[data-step='case']");
        if (next) next.click();
        const node = document.querySelector(${JSON.stringify(page.surface)});
        if (node) node.scrollIntoView({ block: "center" });
        const style = node ? getComputedStyle(node) : null;
        const rect = node ? node.getBoundingClientRect() : null;
        return {
          shown: document.getElementById("case") ? document.getElementById("case").hidden === false : null,
          color: style && style.color,
          background: style && style.backgroundColor,
          text: node ? node.textContent.trim().slice(0, 80) : null,
          top: rect && Math.round(rect.top),
          h: rect && Math.round(rect.height)
        };
      })()`);
      if (!win.isVisible()) win.showInactive();
      await sleep(200);
      const image = await win.webContents.capturePage();
      const name = page.file.replace(".html", "") + "-skizze-" + theme + ".png";
      fs.writeFileSync(path.join(outDir, name), image.toPNG());
      findings.push({ page: page.file, theme, paint, name });
      console.log(page.file + " " + theme + " " + JSON.stringify(paint));
    }
  }
  fs.writeFileSync(path.join(outDir, "probe-sketch.json"), JSON.stringify(findings, null, 2));
  win.close();
  storeRef.current.close();
  modules.close();
  app.exit(0);
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
