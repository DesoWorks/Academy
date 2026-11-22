"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const root = path.resolve(__dirname, "..", "..", "..");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2d-btn-"));
const moduleId = "desoworks.it-systemintegration";
const { declareScheme, registerProtocol } = require(path.join(root, "src/protocol"));
const { registerIpc } = require(path.join(root, "src/ipc"));
const { createModuleManager } = require(path.join(root, "src/modules/manager"));
const { openDatabase } = require(path.join(root, "src/store/database"));
const { CORE_VERSION } = require(path.join(root, "src/core/version"));
const { contentRootFrom } = require(path.join(root, "src/config"));
declareScheme();
app.setPath("userData", dataDir);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  const storeRef = { current: openDatabase({ dataDir }) };
  const modules = createModuleManager({ dataDir, coreVersion: CORE_VERSION, hostedWebRoots: [path.join(root, "modules")] });
  modules.installFromDirectory(path.join(root, "modules", "it-systemintegration"));
  registerProtocol({ contentRoot: contentRootFrom(), desktopRoot: path.join(root, "src", "renderer"), resolveModuleFile(id, requestPath) { return modules.resolveHostedFile(id, requestPath); } });
  registerIpc({ ipcMain, dialog, storeRef, modules, updates: { reconcile() {}, check() { return Promise.resolve({ ok: false }); }, plan() { return null; }, status() { return { ok: false }; } }, versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "probe" }, channel: "dev" });
  const win = new BrowserWindow({ width: 1100, height: 800, show: true, alwaysOnTop: true, webPreferences: { preload: path.join(root, "src/preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, backgroundThrottling: false } });
  const dbg = win.webContents.debugger;
  dbg.attach("1.3");
  const key = async (name) => {
    const table = { Tab: [9, "Tab", "Tab"], Enter: [13, "Enter", "Enter"], Space: [32, " ", "Space"] };
    const spec = table[name];
    const params = { key: spec[1], code: spec[2], windowsVirtualKeyCode: spec[0], nativeVirtualKeyCode: spec[0] };
    await dbg.sendCommand("Input.dispatchKeyEvent", Object.assign({ type: "keyDown" }, params));
    await dbg.sendCommand("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, params));
    await sleep(120);
  };
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  await sleep(700);
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify("academy://" + moduleId + "/module/lf3-dhcp.html?academy-theme=dunkel"));
  let frame = null;
  for (let i = 0; i < 30 && !frame; i += 1) { frame = (win.webContents.mainFrame.frames || []).find((item) => String(item.url).includes("lf3-dhcp")); if (!frame) await sleep(150); }
  await sleep(300);
  win.focus();
  win.webContents.focus();
  for (let i = 0; i < 16; i += 1) {
    const cls = await frame.executeJavaScript("document.activeElement && document.activeElement.className");
    if (cls === "skip-link") break;
    await win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Tab" });
    await win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Tab" });
    await sleep(70);
  }
  await key("Enter");
  await sleep(150);
  fs.writeFileSync(path.join(__dirname, "lf3-dhcp-main-dunkel.png"), (await win.webContents.capturePage()).toPNG());
  const stops = [];
  for (let i = 0; i < 8; i += 1) {
    await key("Tab");
    const active = await frame.executeJavaScript("document.activeElement && document.activeElement.textContent.trim().slice(0,40)");
    stops.push(active);
    if (/Weiter/.test(active || "")) break;
  }
  await key("Space");
  await sleep(200);
  const afterSpace = await frame.executeJavaScript(`({ id: document.activeElement && document.activeElement.id, outline: getComputedStyle(document.activeElement).outline, caseVisible: document.getElementById("case") && !document.getElementById("case").hidden })`);
  const second = [];
  for (let i = 0; i < 10; i += 1) {
    await key("Tab");
    const text = await frame.executeJavaScript("(document.activeElement && document.activeElement.textContent || '').trim().slice(0, 40)");
    second.push(text);
    if (/Weiter zur Übung/.test(text)) break;
  }
  await key("Space");
  await sleep(200);
  const afterSecond = await frame.executeJavaScript(`({ id: document.activeElement && document.activeElement.id, outline: getComputedStyle(document.activeElement).outline, exercise: document.getElementById("exercise") && !document.getElementById("exercise").hidden })`);
  let radio = null;
  for (let i = 0; i < 16; i += 1) {
    await key("Tab");
    radio = await frame.executeJavaScript(`(() => { const n = document.activeElement; return { tag: n.tagName, type: n.type || "", checked: !!n.checked, text: (n.textContent || n.getAttribute("aria-label") || "").trim().slice(0, 40) }; })()`);
    if (radio.tag === "INPUT") break;
  }
  if (radio && radio.tag === "INPUT") {
    await key("Space");
    radio.after = await frame.executeJavaScript(`(() => { const n = document.activeElement; return { tag: n.tagName, type: n.type || "", checked: !!n.checked }; })()`);
  }
  const result = { stops, afterSpace, second, afterSecond, radio };
  fs.writeFileSync(path.join(__dirname, "probe-button.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  win.close();
  storeRef.current.close();
  modules.close();
  app.exit(0);
}).catch((error) => {
  fs.writeFileSync(path.join(__dirname, "probe-button.json"), JSON.stringify({ error: String(error.stack || error) }));
  console.error(error);
  app.exit(1);
});
