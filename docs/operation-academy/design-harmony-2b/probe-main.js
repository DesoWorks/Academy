"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2b-live-"));
const moduleId = "desoworks.it-systemintegration";
const lf3Path = "module/lf3-client-anbindung.html";

const { declareScheme, registerProtocol } = require(path.join(root, "src/protocol"));
const { registerIpc } = require(path.join(root, "src/ipc"));
const { createModuleManager } = require(path.join(root, "src/modules/manager"));
const { openDatabase } = require(path.join(root, "src/store/database"));
const { CORE_VERSION } = require(path.join(root, "src/core/version"));
const { contentRootFrom } = require(path.join(root, "src/config"));

declareScheme();
app.setPath("userData", dataDir);

const findings = { dataDir, core: CORE_VERSION, steps: [] };

function note(step, detail) {
  findings.steps.push({ step, detail });
  console.log(step + " " + JSON.stringify(detail));
}

function save() {
  fs.writeFileSync(path.join(outDir, "probe-academy.json"), JSON.stringify(findings, null, 2));
}

async function shot(win, name) {
  const image = await win.webContents.capturePage();
  const file = path.join(outDir, name);
  fs.writeFileSync(file, image.toPNG());
  return file;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function childFrame(win, part) {
  for (let i = 0; i < 40; i += 1) {
    const frames = win.webContents.mainFrame.frames || [];
    const found = frames.find((frame) => String(frame.url).includes(part));
    if (found) return found;
    await sleep(250);
  }
  const urls = (win.webContents.mainFrame.frames || []).map((frame) => frame.url);
  throw new Error("Kein Modulframe: " + JSON.stringify(urls));
}

const measure = `(() => {
  const next = document.querySelector("[data-next='case']");
  if (next) next.click();
  const node = document.querySelector(".skizze");
  const style = node ? getComputedStyle(node) : null;
  function rgb(value) {
    const match = String(value || "").match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  }
  function contrast(a, b) {
    if (!a || !b) return null;
    const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const l1 = L(a), l2 = L(b);
    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
  }
  const choice = document.getElementById("farbmodus");
  const nav = document.querySelector(".site-nav a, .site-nav summary");
  const navRect = nav ? nav.getBoundingClientRect() : null;
  return {
    href: location.href,
    academyTheme: document.documentElement.getAttribute("data-academy-theme"),
    dataTheme: document.documentElement.getAttribute("data-theme"),
    color: style ? style.color : null,
    background: style ? style.backgroundColor : null,
    contrast: style ? contrast(rgb(style.color), rgb(style.backgroundColor)) : null,
    aria: node ? node.getAttribute("aria-label") : null,
    role: node ? node.getAttribute("role") : null,
    selectDisabled: choice ? choice.disabled : null,
    caseHidden: document.getElementById("case") ? document.getElementById("case").hidden : null,
    navText: nav ? nav.textContent.trim().slice(0, 80) : null,
    navRect: navRect ? { x: navRect.x, y: navRect.y, w: navRect.width, h: navRect.height, bottom: navRect.bottom } : null,
    view: { w: innerWidth, h: innerHeight }
  };
})()`;

async function openLf3(win, theme) {
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  for (let i = 0; i < 40; i += 1) {
    const src = await win.webContents.executeJavaScript("var f=document.querySelector('iframe.modul-frame'); f?f.src:''");
    if (src) break;
    await sleep(250);
  }
  const target = "academy://" + moduleId + "/" + lf3Path + "?academy-theme=" + theme;
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
  const frame = await childFrame(win, "lf3-client-anbindung.html");
  await sleep(400);
  await sleep(700);
  await frame.executeJavaScript("var node=document.querySelector('.skizze'); if(node) node.scrollIntoView({block:'center'});");
  await sleep(500);
  const measured = await frame.executeJavaScript(measure);
  const focus = await frame.executeJavaScript(`(() => {
    const button = document.querySelector("#case button, button");
    if (button) button.focus();
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return { tag: active && active.tagName, outline: style ? style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor : null };
  })()`);
  return { measured, focus, frameUrl: frame.url };
}

app.whenReady().then(async () => {
  const storeRef = { current: openDatabase({ dataDir }) };
  storeRef.current.set("academy.theme", "dunkel");
  const modules = createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [path.join(root, "modules")]
  });
  const installed = modules.installFromDirectory(path.join(root, "modules", "it-systemintegration"));
  note("install", { id: installed.id, version: installed.version, state: installed.state });
  registerProtocol({
    contentRoot: contentRootFrom(),
    desktopRoot: path.join(root, "src", "renderer"),
    resolveModuleFile(id, requestPath) {
      return modules.resolveHostedFile(id, requestPath);
    }
  });
  registerIpc({
    ipcMain,
    dialog,
    storeRef,
    modules,
    updates: {
      reconcile() {},
      check() { return Promise.resolve({ ok: false, code: "probe" }); },
      plan() { return null; }
    },
    versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "DesoWorks Academy" },
    channel: "dev"
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    show: false,
    webPreferences: {
      preload: path.join(root, "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  const dark = await openLf3(win, "dunkel");
  note("dunkel", dark);
  await shot(win, "academy-dunkel.png");
  win.webContents.setZoomFactor(2);
  await sleep(500);
  const zoomed = await childFrame(win, "lf3-client-anbindung.html");
  await zoomed.executeJavaScript("var node=document.querySelector('.skizze'); if(node) node.scrollIntoView({block:'center'});");
  await sleep(400);
  note("dunkel-zoom-200", { factor: win.webContents.getZoomFactor() });
  await shot(win, "academy-dunkel-200.png");
  win.webContents.setZoomFactor(1.5);
  await sleep(200);
  note("dunkel-zoom-150", { factor: win.webContents.getZoomFactor() });
  await shot(win, "academy-dunkel-150.png");
  win.webContents.setZoomFactor(1);

  const wrote = await win.webContents.executeJavaScript("window.AcademyShell.writeTheme('hell')");
  note("write-hell", wrote);
  const light = await openLf3(win, "hell");
  note("hell", light);
  await shot(win, "academy-hell.png");
  const shellNav = await win.webContents.executeJavaScript(`(() => {
    document.documentElement.style.fontSize = "32px";
    const link = document.querySelector("#navigation a");
    const rect = link ? link.getBoundingClientRect() : null;
    return { theme: document.documentElement.getAttribute("data-academy-theme"), text: link ? link.textContent : null, rect: rect ? { y: rect.y, h: rect.height, bottom: rect.bottom } : null, viewH: innerHeight };
  })()`);
  note("shell-nav", shellNav);
  await shot(win, "academy-shell-hell.png");

  win.close();
  storeRef.current.close();
  modules.close();
  save();
  app.exit(0);
}).catch((error) => {
  findings.error = String(error && error.stack || error);
  save();
  console.error(findings.error);
  app.exit(1);
});
