"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2d-diag-"));
const moduleId = "desoworks.it-systemintegration";
const { declareScheme, registerProtocol } = require(path.join(root, "src/protocol"));
const { registerIpc } = require(path.join(root, "src/ipc"));
const { createModuleManager } = require(path.join(root, "src/modules/manager"));
const { openDatabase } = require(path.join(root, "src/store/database"));
const { CORE_VERSION } = require(path.join(root, "src/core/version"));
const { contentRootFrom } = require(path.join(root, "src/config"));

declareScheme();
app.setPath("userData", dataDir);

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

app.whenReady().then(async () => {
  const storeRef = { current: openDatabase({ dataDir }) };
  storeRef.current.set("academy.theme", "dunkel");
  const modules = createModuleManager({ dataDir, coreVersion: CORE_VERSION, hostedWebRoots: [path.join(root, "modules")] });
  modules.installFromDirectory(path.join(root, "modules", "it-systemintegration"));
  registerProtocol({
    contentRoot: contentRootFrom(),
    desktopRoot: path.join(root, "src", "renderer"),
    resolveModuleFile(id, requestPath) { return modules.resolveHostedFile(id, requestPath); }
  });
  registerIpc({
    ipcMain, dialog, storeRef, modules,
    updates: { reconcile() {}, check() { return Promise.resolve({ ok: false }); }, plan() { return null; }, status() { return { ok: false }; } },
    versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "DesoWorks Academy" },
    channel: "dev"
  });
  const win = new BrowserWindow({
    width: 1100, height: 800, x: 80, y: 60, show: true, alwaysOnTop: true,
    webPreferences: {
      preload: path.join(root, "src/preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
      backgroundThrottling: false
    }
  });
  const methods = [];
  const dbg = win.webContents.debugger;
  dbg.attach("1.3");
  dbg.on("message", (_event, method, params, sessionId) => {
    if (methods.length < 30) methods.push({ method, sessionId: sessionId || null, url: params && params.targetInfo && params.targetInfo.url });
  });
  await dbg.sendCommand("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  win.focus();
  win.webContents.focus();
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  await sleep(800);
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify("academy://" + moduleId + "/module/lf3-dhcp.html?academy-theme=dunkel"));
  let frame = null;
  for (let i = 0; i < 30 && !frame; i += 1) {
    frame = (win.webContents.mainFrame.frames || []).find((item) => String(item.url).includes("lf3-dhcp"));
    if (!frame) await sleep(200);
  }
  await sleep(400);
  await frame.executeJavaScript(`(() => {
    window.__ev = [];
    document.addEventListener("keydown", (event) => window.__ev.push({ type: "keydown", trusted: event.isTrusted, key: event.key, tag: event.target.tagName, id: event.target.id, cls: String(event.target.className || "") }), true);
    document.addEventListener("focusin", (event) => window.__ev.push({ type: "focusin", trusted: event.isTrusted, tag: event.target.tagName, id: event.target.id, cls: String(event.target.className || "") }), true);
    return true;
  })()`);
  const read = () => frame.executeJavaScript(`({ active: document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName), events: window.__ev.slice() })`);
  const before = await read();
  for (let i = 0; i < 16; i += 1) {
    await win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Tab" });
    await win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Tab" });
    await sleep(80);
  }
  const afterTabs = await read();
  await dbg.sendCommand("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await dbg.sendCommand("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  await sleep(200);
  const afterCdp = await read();
  let targets = null;
  try { targets = await dbg.sendCommand("Target.getTargets"); } catch (error) { targets = String(error.message || error); }
  const result = {
    focused: win.isFocused(),
    frameUrl: frame.url,
    frameKeys: Object.keys(frame),
    before,
    afterTabs,
    afterCdp,
    methods,
    targets
  };
  fs.writeFileSync(path.join(outDir, "probe-keydiag.json"), JSON.stringify(result, null, 2));
  win.close();
  storeRef.current.close();
  modules.close();
  app.exit(0);
}).catch((error) => {
  fs.writeFileSync(path.join(outDir, "probe-keydiag.json"), JSON.stringify({ error: String(error.stack || error) }, null, 2));
  app.exit(1);
});
