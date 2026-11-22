"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-uebersicht-"));
const moduleId = "desoworks.it-systemintegration";

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
  themes: {},
  steps: []
};

function note(step, detail) {
  findings.steps.push({ step, detail });
  console.log(step + " " + JSON.stringify(detail));
}

function save() {
  fs.writeFileSync(path.join(outDir, "probe-uebersicht.json"), JSON.stringify(findings, null, 2));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shot(win, name) {
  const image = await win.webContents.capturePage();
  const file = path.join(outDir, name);
  fs.writeFileSync(file, image.toPNG());
  return file;
}

async function childFrame(win) {
  for (let i = 0; i < 40; i += 1) {
    const frames = win.webContents.mainFrame.frames || [];
    const found = frames.find((frame) => String(frame.url).includes(moduleId));
    if (found) return found;
    await sleep(250);
  }
  const urls = (win.webContents.mainFrame.frames || []).map((frame) => frame.url);
  throw new Error("Kein Modulframe: " + JSON.stringify(urls));
}

const MEASURE = `(() => {
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
  function paintOf(el) {
    if (!el) return null;
    let node = el;
    let background = null;
    let source = null;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      const parsed = rgb(style.backgroundColor);
      if (parsed && style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") {
        background = parsed;
        source = node.className || node.tagName;
        break;
      }
      node = node.parentElement;
    }
    const style = getComputedStyle(el);
    const color = rgb(style.color);
    return {
      text: (el.textContent || "").trim().slice(0, 80),
      className: String(el.className || ""),
      color: style.color,
      background: background,
      backgroundSource: source,
      contrast: contrast(color, background),
      outline: style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor,
      fontWeight: style.fontWeight
    };
  }
  const root = getComputedStyle(document.documentElement);
  const statuses = Array.from(document.querySelectorAll(".modul-status")).slice(0, 8).map(paintOf);
  const entry = document.querySelector(".overview-entry .modul-status");
  const lesson = document.querySelector(".overview-lesson.available .modul-status");
  const planned = document.querySelector(".overview-lesson.planned .modul-status");
  const nav = document.querySelector(".site-nav a");
  const current = document.querySelector(".site-nav a[aria-current='page']");
  const done = document.querySelector(".abschlusszeichen");
  const summary = document.querySelector(".overview-field-summary");
  return {
    url: location.href,
    academyTheme: document.documentElement.getAttribute("data-academy-theme"),
    dataTheme: document.documentElement.getAttribute("data-theme"),
    tokens: {
      flaeche: root.getPropertyValue("--farbe-flaeche").trim(),
      text: root.getPropertyValue("--farbe-text").trim(),
      akzent: root.getPropertyValue("--farbe-akzent").trim(),
      akzentDunkel: root.getPropertyValue("--farbe-akzent-dunkel").trim(),
      hover: root.getPropertyValue("--farbe-hover-flaeche").trim(),
      aktiv: root.getPropertyValue("--farbe-aktiv-tekst").trim(),
      hintergrund: root.getPropertyValue("--farbe-hintergrund").trim()
    },
    body: paintOf(document.body),
    entry: paintOf(entry),
    lesson: paintOf(lesson),
    planned: paintOf(planned),
    nav: paintOf(nav),
    current: paintOf(current),
    done: paintOf(done),
    summary: paintOf(summary),
    statusCount: document.querySelectorAll(".modul-status").length,
    jetzt: statuses.filter((item) => item && item.text.indexOf("Jetzt lernen") !== -1)
  };
})()`;

async function hoverAndFocus(win, frame) {
  win.showInactive();
  await sleep(200);
  const point = await win.webContents.executeJavaScript(`(() => {
    const frame = document.querySelector("iframe.modul-frame");
    if (!frame) return null;
    const outer = frame.getBoundingClientRect();
    return { x: outer.x, y: outer.y, w: outer.width, h: outer.height };
  })()`);
  const inner = await frame.executeJavaScript(`(() => {
    const link = document.querySelector(".overview-entry a.modul-inhalt");
    if (!link) return null;
    link.scrollIntoView({ block: "center", inline: "center" });
    const rect = link.getBoundingClientRect();
    return { x: rect.x + Math.min(rect.width / 2, 80), y: rect.y + rect.height / 2 };
  })()`);
  if (!point || !inner) return { hover: null, focus: null, point, inner };
  const x = Math.round(point.x + inner.x);
  const y = Math.round(point.y + inner.y);
  win.focus();
  win.webContents.sendInputEvent({ type: "mouseMove", x, y });
  await sleep(250);
  let hit = await frame.executeJavaScript(`(() => {
    const link = document.querySelector(".overview-entry a.modul-inhalt");
    const style = link ? getComputedStyle(link) : null;
    return { hovered: !!(link && link.matches(":hover")), background: style && style.backgroundColor, color: style && style.color };
  })()`);
  if (!hit || !hit.hovered) {
    try {
      const dbg = win.webContents.debugger;
      if (!dbg.isAttached()) dbg.attach("1.3");
      await dbg.sendCommand("DOM.enable");
      await dbg.sendCommand("CSS.enable");
      const doc = await dbg.sendCommand("DOM.getDocument", { depth: -1, pierce: true });
      const frameNode = await dbg.sendCommand("DOM.querySelector", { nodeId: doc.root.nodeId, selector: "iframe.modul-frame" });
      const described = await dbg.sendCommand("DOM.describeNode", { nodeId: frameNode.nodeId, pierce: true });
      const docId = described.node.contentDocument.nodeId;
      const linkNode = await dbg.sendCommand("DOM.querySelector", { nodeId: docId, selector: ".overview-entry a.modul-inhalt" });
      await dbg.sendCommand("CSS.forcePseudoState", { nodeId: linkNode.nodeId, forcedPseudoClasses: ["hover"] });
      await sleep(100);
      hit = await frame.executeJavaScript(`(() => {
        const link = document.querySelector(".overview-entry a.modul-inhalt");
        const style = link ? getComputedStyle(link) : null;
        return { hovered: !!(link && link.matches(":hover")), background: style && style.backgroundColor, color: style && style.color, forced: true };
      })()`);
    } catch (error) {
      hit = Object.assign({}, hit, { forceError: String(error && error.message || error) });
    }
  }
  const hover = await frame.executeJavaScript(MEASURE);
  await frame.executeJavaScript(`(() => {
    const link = document.querySelector(".overview-entry a.modul-inhalt");
    if (link) link.focus({ focusVisible: true });
  })()`);
  await sleep(150);
  const focus = await frame.executeJavaScript(MEASURE);
  const focusHit = await frame.executeJavaScript(`(() => {
    const link = document.querySelector(".overview-entry a.modul-inhalt");
    const style = link ? getComputedStyle(link) : null;
    return { active: document.activeElement === link, visible: !!(link && link.matches(":focus-visible")), outline: style && style.outline };
  })()`);
  return { hover: hover && hover.entry, focus: focus && focus.entry, hit, focusHit, x, y };
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
  try {
    const storeRef = { current: openDatabase({ dataDir }) };
    const moduleRoot = process.env.ACADEMY_MODULE_ROOT || path.join(root, "modules", "it-systemintegration");
    const modules = createModuleManager({
      dataDir,
      coreVersion: CORE_VERSION,
      hostedWebRoots: [path.join(root, "modules"), path.dirname(moduleRoot)]
    });
    const installed = modules.installFromDirectory(moduleRoot);
    note("install", { id: installed.id, version: installed.version, state: installed.state });
    registerAll(storeRef, modules);
    const win = makeWindow();
    for (const theme of ["dunkel", "hell", "kontrast"]) {
      await win.loadURL("academy://app/home.html");
      await sleep(300);
      const wrote = await win.webContents.executeJavaScript(
        "window.AcademyShell && window.AcademyShell.writeTheme(" + JSON.stringify(theme) + ")"
      );
      note("write-" + theme, wrote);
      await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
      const frame = await childFrame(win);
      await sleep(600);
      await frame.executeJavaScript("var year=document.querySelector('.overview-year'); if(year) year.open=true; var field=document.querySelector('.overview-field'); if(field) field.open=true;");
      await sleep(200);
      const measured = await frame.executeJavaScript(MEASURE);
      const hover = await hoverAndFocus(win, frame);
      measured.hover = hover.hover;
      measured.focus = hover.focus;
      measured.pointer = { hit: hover.hit, focusHit: hover.focusHit, x: hover.x, y: hover.y };
      note(theme + "-pointer", measured.pointer);
      findings.themes[theme] = measured;
      note(theme, {
        academyTheme: measured.academyTheme,
        dataTheme: measured.dataTheme,
        tokens: measured.tokens,
        entry: measured.entry,
        lesson: measured.lesson,
        body: measured.body && measured.body.contrast
      });
      await shot(win, "uebersicht-" + theme + ".png");
    }
    save();
    app.exit(0);
  } catch (error) {
    findings.error = String(error && error.stack || error);
    save();
    console.error(findings.error);
    app.exit(1);
  }
});
