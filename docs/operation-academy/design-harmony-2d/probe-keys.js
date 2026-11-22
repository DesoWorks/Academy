"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2d-keys2-"));
const moduleId = "desoworks.it-systemintegration";
const pages = [
  "lf3-client-anbindung.html",
  "lf3-dhcp.html",
  "lf3-dns.html",
  "lf3-fehlerbild-protokoll.html",
  "lf3-ipv4-konfiguration.html",
  "lf3-verbindung-eingrenzen.html"
];

const { declareScheme, registerProtocol } = require(path.join(root, "src/protocol"));
const { registerIpc } = require(path.join(root, "src/ipc"));
const { createModuleManager } = require(path.join(root, "src/modules/manager"));
const { openDatabase } = require(path.join(root, "src/store/database"));
const { CORE_VERSION } = require(path.join(root, "src/core/version"));
const { contentRootFrom } = require(path.join(root, "src/config"));

declareScheme();
app.setPath("userData", dataDir);
const findings = { dataDir, method: "Tab via sendInputEvent bis Skip-Link, danach genau ein CDP-keyDown/keyUp. Kein DOM-focus, kein dispatchEvent.", pages: [], themes: [], deeper: null, a11y: {} };

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function shot(win, name) {
  await sleep(80);
  const image = await win.webContents.capturePage();
  fs.writeFileSync(path.join(outDir, name), image.toPNG());
  return { name, blank: image.isEmpty() };
}

async function waitFrame(win, part) {
  for (let i = 0; i < 40; i += 1) {
    const found = (win.webContents.mainFrame.frames || []).find((frame) => String(frame.url).includes(part));
    if (found) return found;
    await sleep(200);
  }
  throw new Error("Kein Frame " + part);
}

async function arm(frame) {
  await frame.executeJavaScript(`(() => {
    window.__ev = [];
    if (window.__probeArmed) return true;
    window.__probeArmed = true;
    const push = (type, event) => {
      const target = event.target;
      window.__ev.push({ type, trusted: event.isTrusted, key: event.key || null, tag: target && target.tagName, id: target && target.id, cls: String(target && target.className || "").slice(0, 40) });
      if (window.__ev.length > 80) window.__ev.shift();
    };
    document.addEventListener("keydown", (event) => push("keydown", event), true);
    document.addEventListener("focusin", (event) => push("focusin", event), true);
    return true;
  })()`);
}

async function snap(frame) {
  return frame.executeJavaScript(`(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    const main = document.getElementById("main");
    return {
      hash: location.hash,
      active: {
        tag: active && active.tagName,
        id: active && active.id,
        cls: active && String(active.className || "").slice(0, 40),
        text: active && (active.getAttribute("aria-label") || active.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 70),
        outline: style && (style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor),
        offset: style && style.outlineOffset,
        inMain: Boolean(active && main && (active === main || main.contains(active)))
      },
      events: (window.__ev || []).slice(-6)
    };
  })()`);
}

async function parentActive(win) {
  return win.webContents.executeJavaScript(`(() => {
    const active = document.activeElement;
    return { tag: active && active.tagName, id: active && active.id, cls: String(active && active.className || "").slice(0, 40) };
  })()`);
}

async function sendTab(win) {
  await win.webContents.sendInputEvent({ type: "keyDown", keyCode: "Tab" });
  await win.webContents.sendInputEvent({ type: "keyUp", keyCode: "Tab" });
  await sleep(90);
}

async function cdpKey(dbg, name, shift) {
  const table = { Tab: [9, "Tab", "Tab"], Enter: [13, "Enter", "Enter"], Space: [32, " ", "Space"] };
  const spec = table[name];
  const params = { key: spec[1], code: spec[2], windowsVirtualKeyCode: spec[0], nativeVirtualKeyCode: spec[0], modifiers: shift ? 8 : 0 };
  await dbg.sendCommand("Input.dispatchKeyEvent", Object.assign({ type: "keyDown" }, params));
  await dbg.sendCommand("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, params));
  await sleep(140);
}

async function openPage(win, file, theme) {
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  for (let i = 0; i < 40; i += 1) {
    const src = await win.webContents.executeJavaScript("var f=document.querySelector('iframe.modul-frame'); f ? f.src : ''");
    if (src) break;
    await sleep(150);
  }
  await win.webContents.executeJavaScript("window.AcademyShell && window.AcademyShell.writeTheme(" + JSON.stringify(theme) + ")");
  const target = "academy://" + moduleId + "/module/" + file + "?academy-theme=" + theme;
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
  const frame = await waitFrame(win, file);
  await sleep(400);
  await arm(frame);
  win.focus();
  win.webContents.focus();
  await sleep(80);
  return frame;
}

async function tabToSkip(win, frame) {
  for (let i = 0; i < 24; i += 1) {
    const state = await snap(frame);
    if (state.active && state.active.cls === "skip-link") return { reached: true, tabs: i, state };
    await sendTab(win);
  }
  return { reached: false, state: await snap(frame) };
}

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
    updates: { reconcile() {}, check() { return Promise.resolve({ ok: false, code: "probe" }); }, plan() { return null; }, status() { return { ok: false, code: "probe" }; } },
    versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "DesoWorks Academy" },
    channel: "dev"
  });
  const win = new BrowserWindow({
    width: 1280, height: 900, x: 30, y: 30, show: true, alwaysOnTop: true,
    webPreferences: {
      preload: path.join(root, "src/preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
      backgroundThrottling: false
    }
  });
  const dbg = win.webContents.debugger;
  dbg.attach("1.3");
  await win.loadURL("academy://app/home.html");
  await win.webContents.executeJavaScript("window.AcademyShell.writeTheme('dunkel')");

  const save = () => fs.writeFileSync(path.join(outDir, "probe-keys.json"), JSON.stringify(findings, null, 2));
  for (const file of pages) {
    console.log("page", file);
    const frame = await openPage(win, file, "dunkel");
    const skip = await tabToSkip(win, frame);
    const row = { file, skip: skip.reached, tabs: skip.tabs, before: skip.state && skip.state.active };
    if (skip.reached) {
      const eventsBefore = (await snap(frame)).events.length;
      await cdpKey(dbg, "Enter", false);
      const after = await snap(frame);
      row.afterEnter = after.active;
      row.enterTrusted = after.events.slice(eventsBefore).some((event) => event.type === "keydown" && event.key === "Enter" && event.trusted);
      row.focusinMain = after.events.some((event) => event.type === "focusin" && event.id === "main" && event.trusted);
      await cdpKey(dbg, "Tab", false);
      row.afterTab = (await snap(frame)).active;
      await cdpKey(dbg, "Tab", true);
      row.afterShiftTab = (await snap(frame)).active;
      row.parent = await parentActive(win);
      if (file === "lf3-dhcp.html") row.shot = await shot(win, "lf3-dhcp-enter-dunkel.png");
    }
    findings.pages.push(row);
    save();
    console.log("done", file, row.skip, row.enterTrusted, row.afterEnter && row.afterEnter.id);
  }

  for (const theme of ["hell", "kontrast"]) {
    const frame = await openPage(win, "lf3-dhcp.html", theme);
    const skip = await tabToSkip(win, frame);
    const row = { theme, skip: skip.reached };
    if (skip.reached) {
      await cdpKey(dbg, "Enter", false);
      row.afterEnter = (await snap(frame)).active;
      row.shot = await shot(win, "lf3-dhcp-enter-" + theme + ".png");
    }
    findings.themes.push(row);
  }

  const frame = await openPage(win, "lf3-dhcp.html", "dunkel");
  const skip = await tabToSkip(win, frame);
  if (skip.reached) {
    await cdpKey(dbg, "Enter", false);
    const stops = [];
    for (let i = 0; i < 8; i += 1) {
      await cdpKey(dbg, "Tab", false);
      const state = await snap(frame);
      stops.push(state.active);
      if (state.active && state.active.tag === "BUTTON" && /Weiter/.test(state.active.text || "")) break;
    }
    await cdpKey(dbg, "Enter", false);
    await sleep(200);
    const afterStep = await snap(frame);
    let radio = null;
    for (let i = 0; i < 15; i += 1) {
      await cdpKey(dbg, "Tab", false);
      const state = await snap(frame);
      if (state.active && state.active.tag === "INPUT") { radio = state.active; break; }
    }
    if (radio) await cdpKey(dbg, "Space", false);
    const checked = await frame.executeJavaScript(`(() => { const node = document.activeElement; return { tag: node && node.tagName, type: node && node.type, checked: node && node.checked, name: node && node.name }; })()`);
    let left = false;
    for (let i = 0; i < 30; i += 1) {
      await cdpKey(dbg, "Tab", true);
      const parent = await parentActive(win);
      if (parent.tag !== "IFRAME") { left = parent; break; }
    }
    findings.deeper = { stops, afterStep: afterStep.active, radio, checked, leftFrame: left, shot: await shot(win, "lf3-dhcp-schritt.png") };
  }

  findings.a11y.colors = {};
  for (const theme of ["dunkel", "hell", "kontrast"]) {
    const page = await openPage(win, "lf3-dhcp.html", theme);
    findings.a11y.colors[theme] = await page.executeJavaScript(`(() => {
      const node = document.querySelector(".skizze") || document.querySelector("main");
      const style = getComputedStyle(node);
      const nav = document.querySelector(".schritte");
      return { text: style.color, surface: style.backgroundColor, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, navScroll: nav && nav.scrollWidth, navClient: nav && nav.clientWidth };
    })()`);
  }
  const zoomPage = await openPage(win, "lf3-dhcp.html", "dunkel");
  findings.a11y.zoom = {};
  for (const zoom of [1.5, 2]) {
    win.webContents.setZoomFactor(zoom);
    await sleep(200);
    findings.a11y.zoom[String(zoom)] = await zoomPage.executeJavaScript(`({ innerWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, shell: null })`);
    findings.a11y.zoom[String(zoom)].shell = await win.webContents.executeJavaScript(`(() => { const nav = document.querySelector("nav"); return { overflow: nav ? nav.scrollWidth > nav.clientWidth + 1 : null, scroll: nav && nav.scrollWidth, client: nav && nav.clientWidth }; })()`);
    await shot(win, "lf3-dhcp-zoom-" + String(zoom).replace(".", "") + ".png");
  }
  win.webContents.setZoomFactor(1);
  win.setContentSize(320, 720);
  await sleep(250);
  findings.a11y.reflow320 = await zoomPage.executeJavaScript(`({ innerWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 })`);
  findings.a11y.reflow320.shell = await win.webContents.executeJavaScript(`(() => { const nav = document.querySelector("nav"); return nav ? { overflow: nav.scrollWidth > nav.clientWidth + 1, scroll: nav.scrollWidth, client: nav.clientWidth } : null; })()`);
  await shot(win, "lf3-dhcp-reflow-320.png");
  await zoomPage.executeJavaScript(`localStorage.setItem("it-ausbildung.anzeige.v1", JSON.stringify({ text: 150, spacing: true, theme: "hell", ruhig: false }))`);
  const readPage = await openPage(win, "lf3-dhcp.html", "dunkel");
  findings.a11y.reading = await readPage.executeJavaScript(`(() => { const p = document.querySelector("main p") || document.querySelector("main"); const s = getComputedStyle(p); return { scale: getComputedStyle(document.documentElement).getPropertyValue("--text-scale").trim(), spacing: document.documentElement.classList.contains("mehr-abstand"), fontSize: s.fontSize, lineHeight: s.lineHeight, theme: document.documentElement.getAttribute("data-academy-theme"), selectDisabled: document.getElementById("farbmodus") ? document.getElementById("farbmodus").disabled : null }; })()`);
  findings.screenreader = { running: [], sampled: false };
  try {
    const listed = require("node:child_process").execFileSync("tasklist", ["/FO", "CSV", "/NH"], { encoding: "utf8" }).toLowerCase();
    findings.screenreader.running = ["narrator.exe", "nvda.exe", "jfw.exe"].filter((name) => listed.includes(name));
  } catch (error) {
    findings.screenreader.error = String(error.message || error);
  }
  fs.writeFileSync(path.join(outDir, "probe-keys.json"), JSON.stringify(findings, null, 2));
  win.close();
  storeRef.current.close();
  modules.close();
  app.exit(0);
}).catch((error) => {
  findings.error = String(error.stack || error);
  fs.writeFileSync(path.join(outDir, "probe-keys.json"), JSON.stringify(findings, null, 2));
  console.error(error);
  app.exit(1);
});
