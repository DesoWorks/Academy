"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2c-visual-"));
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
const findings = { dataDir, shots: [], keyboard: [] };

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function shot(win, name) {
  if (!win.isVisible()) win.showInactive();
  await sleep(150);
  const image = await win.webContents.capturePage();
  const file = path.join(outDir, name);
  fs.writeFileSync(file, image.toPNG());
  const blank = image.getBitmap().every((byte, index) => index % 4 === 3 || byte === 0);
  findings.shots.push({ name, bytes: image.getBitmap().length, blank });
  return file;
}

async function childFrame(win, part) {
  for (let i = 0; i < 40; i += 1) {
    const frames = win.webContents.mainFrame.frames || [];
    const found = frames.find((frame) => String(frame.url).includes(part));
    if (found) return found;
    await sleep(250);
  }
  throw new Error("Kein Modulframe für " + part);
}

async function key(win, keyCode) {
  win.focus();
  win.webContents.focus();
  await win.webContents.sendInputEvent({ type: "keyDown", keyCode });
  await win.webContents.sendInputEvent({ type: "keyUp", keyCode });
  await sleep(120);
}

async function snap(frame) {
  return frame.executeJavaScript(`(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    const rect = active ? active.getBoundingClientRect() : null;
    return {
      tag: active && active.tagName,
      id: active && active.id,
      className: active && String(active.className || "").slice(0, 80),
      text: active && (active.getAttribute("aria-label") || active.textContent || "").trim().slice(0, 80),
      outline: style ? style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor : null,
      inView: rect ? rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight : null
    };
  })()`);
}

app.whenReady().then(async () => {
  const storeRef = { current: openDatabase({ dataDir }) };
  storeRef.current.set("academy.theme", "dunkel");
  const modules = createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [path.join(root, "modules")]
  });
  modules.installFromDirectory(path.join(root, "modules", "it-systemintegration"));
  registerProtocol({
    contentRoot: contentRootFrom(),
    desktopRoot: path.join(root, "src", "renderer"),
    resolveModuleFile(id, requestPath) { return modules.resolveHostedFile(id, requestPath); }
  });
  registerIpc({
    ipcMain, dialog, storeRef, modules,
    updates: { reconcile() {}, check() { return Promise.resolve({ ok: false, code: "probe" }); }, plan() { return null; }, status() { return { ok: false, code: "probe" }; } },
    versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "DesoWorks Academy" },
    channel: "dev"
  });
  const win = new BrowserWindow({
    width: 1280, height: 900, x: 30, y: 30, show: false,
    webPreferences: {
      preload: path.join(root, "src/preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
      backgroundThrottling: false
    }
  });
  win.webContents.setBackgroundThrottling(false);
  console.log("window-ready");
  for (const theme of ["dunkel", "hell", "kontrast"]) {
    await win.loadURL("academy://app/home.html");
    await sleep(300);
    await win.webContents.executeJavaScript("window.AcademyShell.writeTheme(" + JSON.stringify(theme) + ")");
    for (const page of pages) {
      await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
      for (let i = 0; i < 40; i += 1) {
        const src = await win.webContents.executeJavaScript("var f=document.querySelector('iframe.modul-frame'); f?f.src:''");
        if (src) break;
        await sleep(200);
      }
      const target = "academy://" + moduleId + "/module/" + page.file + "?academy-theme=" + theme;
      await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
      const frame = await childFrame(win, page.file);
      await sleep(700);
      await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').scrollIntoView({block:'start'})");
      await frame.executeJavaScript("var node=document.querySelector(" + JSON.stringify(page.surface) + "); if(node) node.scrollIntoView({block:'center'});");
      await sleep(300);
      await shot(win, page.file.replace(".html", "") + "-" + theme + ".png");
      if (theme === "dunkel") {
        win.webContents.setZoomFactor(2);
        await sleep(300);
        await frame.executeJavaScript("var node=document.querySelector(" + JSON.stringify(page.surface) + "); if(node) node.scrollIntoView({block:'center'});");
        await shot(win, page.file.replace(".html", "") + "-dunkel-200.png");
        win.webContents.setZoomFactor(1);
      }
    }
  }

  await win.webContents.setZoomFactor(1);
  await win.loadURL("academy://app/home.html");
  await win.webContents.executeJavaScript("window.AcademyShell.writeTheme('dunkel')");
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  await sleep(500);
  const target = "academy://" + moduleId + "/module/lf3-dhcp.html?academy-theme=dunkel";
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
  const frame = await childFrame(win, "lf3-dhcp.html");
  await sleep(700);
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').scrollIntoView({block:'start'})");
  for (let i = 0; i < 14; i += 1) await key(win, "Tab");
  findings.keyboard.push({ after: "tabs", snap: await snap(frame) });
  await key(win, "Return");
  await sleep(250);
  findings.keyboard.push({ after: "Return", snap: await snap(frame) });
  await key(win, "Enter");
  await sleep(250);
  findings.keyboard.push({ after: "Enter", snap: await snap(frame) });
  await key(win, "Tab");
  findings.keyboard.push({ after: "Tab-next", snap: await snap(frame) });
  await shot(win, "tastatur-nach-enter.png");
  fs.writeFileSync(path.join(outDir, "probe-visual.json"), JSON.stringify(findings, null, 2));
  win.close();
  storeRef.current.close();
  modules.close();
  app.exit(0);
}).catch((error) => {
  fs.writeFileSync(path.join(outDir, "probe-visual.json"), JSON.stringify({ error: String(error && error.stack || error), findings }, null, 2));
  console.error(error);
  app.exit(1);
});
