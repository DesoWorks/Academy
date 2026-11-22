"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const outDir = __dirname;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-2d-keys-"));
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
const findings = { dataDir, delivery: [], pages: [], a11y: [], errors: [] };
const sessions = [];

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function shot(win, name) {
  if (!win.isVisible()) win.showInactive();
  await sleep(120);
  const image = await win.webContents.capturePage();
  const file = path.join(outDir, name);
  fs.writeFileSync(file, image.toPNG());
  const blank = image.getBitmap().every((byte, index) => index % 4 === 3 || byte === 0);
  return { name, bytes: image.getBitmap().length, blank };
}

async function childFrame(win, part) {
  for (let i = 0; i < 40; i += 1) {
    const frames = win.webContents.mainFrame.frames || [];
    const found = frames.find((frame) => String(frame.url).includes(part));
    if (found) return found;
    await sleep(200);
  }
  throw new Error("Kein Modulframe für " + part);
}

async function arm(frame) {
  await frame.executeJavaScript(`(() => {
    if (window.__probeArmed) return true;
    window.__probeArmed = true;
    window.__probeEvents = [];
    const push = (type, event) => {
      const target = event.target;
      window.__probeEvents.push({
        type,
        trusted: Boolean(event.isTrusted),
        key: event.key || null,
        tag: target && target.tagName,
        id: target && target.id,
        className: target && String(target.className || "").slice(0, 60)
      });
      if (window.__probeEvents.length > 120) window.__probeEvents.shift();
    };
    document.addEventListener("keydown", (event) => push("keydown", event), true);
    document.addEventListener("keyup", (event) => push("keyup", event), true);
    document.addEventListener("click", (event) => push("click", event), true);
    document.addEventListener("focusin", (event) => push("focusin", event), true);
    return true;
  })()`);
}

async function snap(frame) {
  return frame.executeJavaScript(`(() => {
    const active = document.activeElement;
    const style = active ? getComputedStyle(active) : null;
    const rect = active ? active.getBoundingClientRect() : null;
    const events = window.__probeEvents || [];
    return {
      href: location.href,
      hash: location.hash,
      active: {
        tag: active && active.tagName,
        id: active && active.id,
        className: active && String(active.className || "").slice(0, 80),
        text: active && (active.getAttribute("aria-label") || active.textContent || "").trim().slice(0, 90),
        outline: style ? style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor : null,
        outlineOffset: style && style.outlineOffset,
        inView: rect ? rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight : null,
        inMain: Boolean(active && (active.id === "main" || (document.getElementById("main") && document.getElementById("main").contains(active))))
      },
      trustedKeys: events.filter((event) => event.type === "keydown" && event.trusted).map((event) => event.key),
      lastEvents: events.slice(-8)
    };
  })()`);
}

async function parentActive(win) {
  return win.webContents.executeJavaScript(`(() => {
    const active = document.activeElement;
    return { tag: active && active.tagName, id: active && active.id, className: active && String(active.className || "").slice(0, 80) };
  })()`);
}

function keySpec(name) {
  const table = {
    Tab: { key: "Tab", code: "Tab", vk: 9 },
    Enter: { key: "Enter", code: "Enter", vk: 13 },
    Space: { key: " ", code: "Space", vk: 32 },
    Escape: { key: "Escape", code: "Escape", vk: 27 }
  };
  return table[name];
}

async function press(win, frame, name, shift) {
  const before = await snap(frame);
  await win.webContents.sendInputEvent({ type: "keyDown", keyCode: name === "Space" ? "Space" : name, modifiers: shift ? ["shift"] : [] });
  await win.webContents.sendInputEvent({ type: "keyUp", keyCode: name === "Space" ? "Space" : name, modifiers: shift ? ["shift"] : [] });
  await sleep(160);
  const after = await snap(frame);
  const moved = JSON.stringify(before.active) !== JSON.stringify(after.active);
  const trusted = after.trustedKeys.length > before.trustedKeys.length;
  findings.delivery.push({ key: name, shift: Boolean(shift), via: "sendInputEvent", moved, trusted });
  return { before, after, moved, trusted };
}

async function openPage(win, file, theme) {
  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  for (let i = 0; i < 40; i += 1) {
    const src = await win.webContents.executeJavaScript("var f=document.querySelector('iframe.modul-frame'); f?f.src:''");
    if (src) break;
    await sleep(200);
  }
  const target = "academy://" + moduleId + "/module/" + file + "?academy-theme=" + theme;
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').src = " + JSON.stringify(target));
  const frame = await childFrame(win, file);
  await sleep(500);
  await arm(frame);
  await win.webContents.executeJavaScript("document.querySelector('iframe.modul-frame').scrollIntoView({block:'start'})");
  return frame;
}

async function tabToSkip(win, frame) {
  win.focus();
  await sleep(80);
  const path = [];
  for (let i = 0; i < 40; i += 1) {
    const state = await snap(frame);
    path.push({ i, active: state.active, parent: await parentActive(win) });
    if (state.active && String(state.active.className).includes("skip-link")) return { reached: true, tabs: i, path: path.slice(-4), state };
    await press(win,  frame, "Tab", false);
  }
  return { reached: false, path: path.slice(-6) };
}

function contrastOf(rgbText, rgbBg) {
  function channel(value) {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  }
  function parse(text) {
    const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(text || "");
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
  }
  const fg = parse(rgbText);
  const bg = parse(rgbBg);
  if (!fg || !bg) return null;
  const l1 = 0.2126 * channel(fg[0]) + 0.7152 * channel(fg[1]) + 0.0722 * channel(fg[2]);
  const l2 = 0.2126 * channel(bg[0]) + 0.7152 * channel(bg[1]) + 0.0722 * channel(bg[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
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
    width: 1280, height: 900, x: 40, y: 40, show: false,
    webPreferences: {
      preload: path.join(root, "src/preload.js"),
      contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true,
      backgroundThrottling: false
    }
  });
  win.webContents.setBackgroundThrottling(false);
  const dbg = win.webContents.debugger;
  try {
    dbg.attach("1.3");
    dbg.on("message", (_event, method, params) => {
      if (method === "Target.attachedToTarget" && params && params.targetInfo) {
        sessions.push({ sessionId: params.sessionId, url: params.targetInfo.url, type: params.targetInfo.type });
      }
    });
    await dbg.sendCommand("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  } catch (error) {
    findings.errors.push("debugger: " + String(error && error.message || error));
  }
  win.show();
  win.focus();
  await win.loadURL("academy://app/home.html");
  await win.webContents.executeJavaScript("window.AcademyShell.writeTheme('dunkel')");

  for (const file of pages) {
    const frame = await openPage(win, file, "dunkel");
    const skip = await tabToSkip(win,  frame);
    const record = { file, skipReached: skip.reached, tabs: skip.tabs, beforeEnter: skip.state || null };
    if (skip.reached) {
      record.shotSkip = await shot(win, file.replace(".html", "") + "-skip.png");
      await press(win,  frame, "Enter", false);
      await sleep(200);
      record.afterEnter = await snap(frame);
      record.parentAfterEnter = await parentActive(win);
      record.shotMain = await shot(win, file.replace(".html", "") + "-nach-enter.png");
      await press(win,  frame, "Tab", false);
      record.afterNextTab = await snap(frame);
      await press(win,  frame, "Tab", true);
      record.afterShiftTab = await snap(frame);
    } else {
      record.tail = skip.path;
    }
    findings.pages.push(record);
    fs.writeFileSync(path.join(outDir, "probe-keyboard.json"), JSON.stringify(findings, null, 2));
  }

  const dhcp = await openPage(win, "lf3-dhcp.html", "dunkel");
  const skip = await tabToSkip(win,  dhcp);
  if (skip.reached) {
    await press(win,  dhcp, "Enter", false);
    await sleep(150);
    for (let i = 0; i < 12; i += 1) {
      const state = await snap(dhcp);
      if (state.active && /button/i.test(state.active.tag) && /Weiter/.test(state.active.text || "")) break;
      await press(win,  dhcp, "Tab", false);
    }
    await press(win,  dhcp, "Enter", false);
    await sleep(200);
    findings.step = await snap(dhcp);
    findings.stepShot = await shot(win, "lf3-dhcp-schritt-fokus.png");
  }

  for (const theme of ["dunkel", "hell", "kontrast"]) {
    await win.webContents.executeJavaScript("window.AcademyShell.writeTheme(" + JSON.stringify(theme) + ")");
    const frame = await openPage(win, "lf3-dhcp.html", theme);
    const colors = await frame.executeJavaScript(`(() => {
      const node = document.querySelector(".skizze") || document.querySelector("main");
      const style = getComputedStyle(node);
      const body = getComputedStyle(document.body);
      const nav = document.querySelector("nav");
      const navStyle = nav ? getComputedStyle(nav) : null;
      return {
        text: style.color, surface: style.backgroundColor, body: body.backgroundColor,
        navText: navStyle && navStyle.color, navBg: navStyle && navStyle.backgroundColor,
        scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
        navScroll: nav ? nav.scrollWidth : null, navClient: nav ? nav.clientWidth : null
      };
    })()`);
    findings.a11y.push({ theme, zoom: 1, colors, contrast: contrastOf(colors.text, colors.surface) });
  }

  const frame = await openPage(win, "lf3-dhcp.html", "dunkel");
  for (const zoom of [1.5, 2]) {
    win.webContents.setZoomFactor(zoom);
    await sleep(250);
    const box = await frame.executeJavaScript(`(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      innerWidth: innerWidth
    }))()`);
    findings.a11y.push({ theme: "dunkel", zoom, box });
    await shot(win, "lf3-dhcp-zoom-" + String(zoom).replace(".", "") + ".png");
  }
  win.webContents.setZoomFactor(1);
  win.setContentSize(320, 700);
  await sleep(300);
  findings.reflow320 = await frame.executeJavaScript(`(() => ({
    innerWidth: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    navOverflow: (() => { const nav = document.querySelector("nav"); return nav ? nav.scrollWidth > nav.clientWidth + 1 : null; })()
  }))()`);
  findings.reflowShot = await shot(win, "lf3-dhcp-reflow-320.png");
  win.setContentSize(1280, 900);

  await frame.executeJavaScript(`localStorage.setItem("it-ausbildung.anzeige.v1", JSON.stringify({ text: 150, spacing: true, theme: "hell", ruhig: false }));`);
  await openPage(win, "lf3-dhcp.html", "dunkel");
  const reading = await (await childFrame(win, "lf3-dhcp.html")).executeJavaScript(`(() => {
    const paragraph = document.querySelector("main p") || document.querySelector("main");
    const style = getComputedStyle(paragraph);
    return {
      textScale: getComputedStyle(document.documentElement).getPropertyValue("--text-scale").trim(),
      spacing: document.documentElement.classList.contains("mehr-abstand"),
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      theme: document.documentElement.getAttribute("data-academy-theme"),
      selectDisabled: (() => { const node = document.getElementById("farbmodus"); return node ? node.disabled : null; })()
    };
  })()`);
  findings.reading = reading;

  const narrators = [];
  try {
    const { execFileSync } = require("node:child_process");
    const listed = execFileSync("tasklist", ["/FO", "CSV", "/NH"], { encoding: "utf8" });
    for (const name of ["Narrator.exe", "nvda.exe", "jfw.exe"]) {
      if (listed.toLowerCase().includes(name.toLowerCase())) narrators.push(name);
    }
  } catch (error) {
    findings.errors.push("tasklist: " + String(error && error.message || error));
  }
  findings.screenreader = { running: narrators, sampled: false };

  fs.writeFileSync(path.join(outDir, "probe-keyboard.json"), JSON.stringify(findings, null, 2));
  win.close();
  storeRef.current.close();
  modules.close();
  app.exit(0);
}).catch((error) => {
  findings.errors.push(String(error && error.stack || error));
  fs.writeFileSync(path.join(outDir, "probe-keyboard.json"), JSON.stringify(findings, null, 2));
  console.error(error);
  app.exit(1);
});
