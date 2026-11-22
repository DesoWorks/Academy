"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2c-live-"));
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

const findings = {
  dataDir,
  core: CORE_VERSION,
  note: "Temporäres Datenverzeichnis. Die Installation des Commanders wird nicht geöffnet.",
  pages: {},
  keyboard: [],
  steps: []
};

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

function measureScript(surface) {
  return `(() => {
    const node = document.querySelector(${JSON.stringify(surface)});
    const opt = document.querySelector(".opt");
    const step = document.querySelector(".step");
    const result = document.querySelector(".result");
    const choice = document.getElementById("farbmodus");
    const nav = document.querySelector(".site-nav a, .site-nav summary, .site-navigation a");
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
    function paint(el) {
      if (!el) return null;
      const style = getComputedStyle(el);
      const color = rgb(style.color);
      const background = rgb(style.backgroundColor);
      return {
        tag: el.tagName,
        color: style.color,
        background: style.backgroundColor,
        contrast: contrast(color, background),
        outline: style.outlineStyle + " " + style.outlineWidth
      };
    }
    const navRect = nav ? nav.getBoundingClientRect() : null;
    const surfaceRect = node ? node.getBoundingClientRect() : null;
    return {
      href: location.href,
      academyTheme: document.documentElement.getAttribute("data-academy-theme"),
      dataTheme: document.documentElement.getAttribute("data-theme"),
      surface: paint(node),
      opt: paint(opt),
      step: paint(step),
      result: paint(result),
      aria: node ? node.getAttribute("aria-label") : null,
      role: node ? node.getAttribute("role") : null,
      selectDisabled: choice ? choice.disabled : null,
      selectValue: choice ? choice.value : null,
      textScale: getComputedStyle(document.documentElement).getPropertyValue("--text-scale").trim(),
      spacing: document.documentElement.classList.contains("mehr-abstand"),
      navText: nav ? nav.textContent.trim().slice(0, 80) : null,
      navInView: navRect ? navRect.bottom > 0 && navRect.top < innerHeight && navRect.left >= -1 && navRect.right <= innerWidth + 1 : null,
      surfaceInView: surfaceRect ? surfaceRect.bottom > 0 && surfaceRect.top < innerHeight : null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      view: { w: innerWidth, h: innerHeight }
    };
  })()`;
}

async function openPage(win, page, theme) {
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  for (let i = 0; i < 40; i += 1) {
    const src = await win.webContents.executeJavaScript("var f=document.querySelector('iframe.modul-frame'); f?f.src:''");
    if (src) break;
    await sleep(250);
  }
  const target = "academy://" + moduleId + "/module/" + page.file + "?academy-theme=" + theme;
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
  const frame = await childFrame(win, page.file);
  await sleep(900);
  return frame;
}

async function key(win, keyCode) {
  win.focus();
  win.webContents.focus();
  await win.webContents.sendInputEvent({ type: "keyDown", keyCode });
  await win.webContents.sendInputEvent({ type: "keyUp", keyCode });
  await sleep(80);
}

async function focusSnapshot(win, frame) {
  const shell = await win.webContents.executeJavaScript(`(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    return {
      tag: active && active.tagName,
      id: active && active.id,
      text: active && (active.getAttribute("aria-label") || active.textContent || "").trim().slice(0, 60),
      outline: style ? style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor : null
    };
  })()`);
  const inner = await frame.executeJavaScript(`(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    const rect = active ? active.getBoundingClientRect() : null;
    return {
      tag: active && active.tagName,
      id: active && active.id,
      className: active && String(active.className || "").slice(0, 80),
      text: active && (active.getAttribute("aria-label") || active.textContent || "").trim().slice(0, 80),
      outline: style ? style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor : null,
      inView: rect ? rect.bottom > 0 && rect.top < innerHeight && rect.width > 0 : null
    };
  })()`);
  return { shell, inner };
}

function makeWindow() {
  return new BrowserWindow({
    width: 1280,
    height: 840,
    x: 40,
    y: 40,
    show: false,
    webPreferences: {
      preload: path.join(root, "src/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });
}

function registerAll(storeRef, modules) {
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
  modules.progress(moduleId, { tasks: { "2c-probe": { correct: true } }, assessment: {} });
  registerAll(storeRef, modules);

  const win = makeWindow();
  const themes = ["dunkel", "hell", "kontrast"];
  for (const theme of themes) {
    const wrote = await (async () => {
      await win.loadURL("academy://app/home.html");
      await sleep(400);
      return win.webContents.executeJavaScript("window.AcademyShell && window.AcademyShell.writeTheme(" + JSON.stringify(theme) + ")");
    })();
    note("write-" + theme, wrote);
    for (const page of pages) {
      const frame = await openPage(win, page, theme);
      await frame.executeJavaScript("var node=document.querySelector(" + JSON.stringify(page.surface) + "); if(node) node.scrollIntoView({block:'center'});");
      await sleep(250);
      const measured = await frame.executeJavaScript(measureScript(page.surface));
      findings.pages[page.file + ":" + theme] = measured;
      note(page.file + ":" + theme, {
        contrast: measured.surface && measured.surface.contrast,
        background: measured.surface && measured.surface.background,
        academyTheme: measured.academyTheme,
        dataTheme: measured.dataTheme,
        selectDisabled: measured.selectDisabled,
        overflowX: measured.overflowX
      });
      await shot(win, page.file.replace(".html", "") + "-" + theme + ".png");
      if (theme === "dunkel") {
        win.webContents.setZoomFactor(2);
        await sleep(300);
        const zoomed = await frame.executeJavaScript(measureScript(page.surface));
        findings.pages[page.file + ":dunkel:200"] = {
          factor: win.webContents.getZoomFactor(),
          overflowX: zoomed.overflowX,
          scrollWidth: zoomed.scrollWidth,
          clientWidth: zoomed.clientWidth,
          navInView: zoomed.navInView,
          surface: zoomed.surface
        };
        await shot(win, page.file.replace(".html", "") + "-dunkel-200.png");
        win.webContents.setZoomFactor(1.5);
        await sleep(200);
        const mid = await frame.executeJavaScript(measureScript(page.surface));
        findings.pages[page.file + ":dunkel:150"] = {
          factor: win.webContents.getZoomFactor(),
          overflowX: mid.overflowX,
          navInView: mid.navInView,
          surface: mid.surface
        };
        win.webContents.setZoomFactor(1);
      }
    }
  }

  const dhcp = await openPage(win, pages[0], "dunkel");
  win.webContents.setZoomFactor(1);
  win.showInactive();
  win.focus();
  const stops = [];
  for (let i = 0; i < 25; i += 1) {
    await key(win, "Tab");
    const snap = await focusSnapshot(win, dhcp);
    stops.push({ key: "Tab", index: i + 1, snap });
    const innerTag = snap.inner && snap.inner.tag;
    if (innerTag && innerTag !== "BODY" && innerTag !== "HTML") break;
  }
  await key(win, "Enter");
  await sleep(300);
  const afterEnter = await focusSnapshot(win, dhcp);
  stops.push({ key: "Enter", snap: afterEnter });
  await key(win, "Tab");
  await sleep(150);
  const afterTab = await focusSnapshot(win, dhcp);
  stops.push({ key: "Tab-after-enter", snap: afterTab });
  await shot(win, "tastatur-nach-enter.png");
  findings.keyboard = stops;
  note("keyboard-stops", stops.length);

  const beforeStore = await dhcp.executeJavaScript("localStorage.getItem('it-ausbildung.lf3-dhcp.v1')");
  const size = dhcp.executeJavaScript(`(() => {
    const box = document.querySelector(".leseoptionen");
    if (box) box.open = true;
    const input = document.getElementById("textgroesse");
    const space = document.querySelector(".leseoptionen-inhalt button");
    if (!input || !space) return { missing: true };
    input.value = "150";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    space.click();
    return {
      text: document.getElementById("textgroesse-wert") && document.getElementById("textgroesse-wert").textContent,
      scale: getComputedStyle(document.documentElement).getPropertyValue("--text-scale").trim(),
      spacing: document.documentElement.classList.contains("mehr-abstand"),
      stored: localStorage.getItem("it-ausbildung.anzeige.v1"),
      method: "input-event und click auf den vorhandenen Regler, kein neuer Kanal"
    };
  })()`);
  const controls = await size;
  note("controls", controls);
  await dhcp.executeJavaScript("location.reload()");
  await sleep(900);
  const reloaded = await dhcp.executeJavaScript(`(() => ({
    theme: document.documentElement.getAttribute("data-academy-theme"),
    dataTheme: document.documentElement.getAttribute("data-theme"),
    scale: getComputedStyle(document.documentElement).getPropertyValue("--text-scale").trim(),
    spacing: document.documentElement.classList.contains("mehr-abstand"),
    anzeige: localStorage.getItem("it-ausbildung.anzeige.v1"),
    lesson: localStorage.getItem("it-ausbildung.lf3-dhcp.v1"),
    selectDisabled: document.getElementById("farbmodus") ? document.getElementById("farbmodus").disabled : null
  }))()`);
  findings.reload = { beforeStore, controls, reloaded };
  note("reload", reloaded);

  win.close();
  storeRef.current.close();
  modules.close();

  const storeRef2 = { current: openDatabase({ dataDir }) };
  const modules2 = createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [path.join(root, "modules")]
  });
  const progress = modules2.progress(moduleId);
  findings.restart = {
    theme: storeRef2.current.get("academy.theme"),
    progress: progress && progress.tasks && progress.tasks["2c-probe"]
  };
  note("restart", findings.restart);
  storeRef2.current.close();
  modules2.close();
  save();
  app.exit(0);
}).catch((error) => {
  findings.error = String(error && error.stack || error);
  save();
  console.error(findings.error);
  app.exit(1);
});
