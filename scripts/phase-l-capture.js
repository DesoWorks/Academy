"use strict";

const { app, BrowserWindow, dialog, session } = require("electron");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { openDatabase } = require("../src/store/database");
const { createUpdateService } = require("../src/updates/service");
const { verifyPublisher } = require("../src/updates/signature");
const { PINNED_REPOSITORY } = require("../src/updates/feed");
const { declareScheme, registerProtocol } = require("../src/protocol");
const { registerIpc } = require("../src/ipc");
const { createModuleManager } = require("../src/modules/manager");
const { CORE_VERSION } = require("../src/core/version");
const { resolveChannel } = require("../src/config");

const outDir = path.join(__dirname, "..", "docs", "operation-academy");
const dataDir = path.join(os.tmpdir(), "academy-phase-l-capture-" + Date.now());
const moduleId = "desoworks.it-systemintegration";

declareScheme();
app.setPath("userData", dataDir);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
  fs.mkdirSync(dataDir, { recursive: true });
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  const channel = resolveChannel({});
  const storeRef = { current: openDatabase({ dataDir }) };
  const modules = createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [path.join(__dirname, "..", "modules")]
  });
  modules.installFromDirectory(path.join(__dirname, "..", "modules", "it-systemintegration"));
  registerProtocol({
    contentRoot: path.join(__dirname, "..", "src", "renderer"),
    desktopRoot: path.join(__dirname, "..", "src", "renderer"),
    resolveModuleFile(id, requestPath) {
      return modules.resolveHostedFile(id, requestPath);
    }
  });
  const updates = createUpdateService({
    dataDir,
    channel,
    installedVersion: app.getVersion(),
    feedUrl: "",
    repository: PINNED_REPOSITORY,
    publisherThumbprint: "",
    verifyPublisher
  });
  registerIpc({
    ipcMain: require("electron").ipcMain,
    dialog,
    storeRef,
    updates,
    channel,
    versions: { desktop: app.getVersion(), core: CORE_VERSION, channel, name: "DesoWorks Academy" },
    modules,
    exampleModuleDir: path.join(__dirname, "..", "modules", "wissen-weitergeben"),
    catalogFile: path.join(__dirname, "..", "catalog", "official.json"),
    onInstall() {}
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    show: false,
    backgroundColor: "#070708",
    webPreferences: {
      preload: path.join(__dirname, "..", "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  async function shot(name) {
    const image = await win.capturePage();
    const file = path.join(outDir, name);
    fs.writeFileSync(file, image.toPNG());
    const bounds = win.getBounds();
    return { file, bounds, fullscreen: win.isFullScreen() };
  }

  const notes = [];
  await win.loadURL("academy://app/home.html");
  await wait(600);
  notes.push(await shot("fenster-l-start.png"));

  await win.loadURL("academy://app/module.html#" + encodeURIComponent(moduleId));
  await wait(1500);
  const sizes = [
    [1280, 720, "fenster-l-modul-1280x720.png"],
    [1280, 840, "fenster-l-modul-1280x840.png"],
    [1920, 1080, "fenster-l-modul-1920x1080.png"]
  ];
  for (const [width, height, name] of sizes) {
    win.setSize(width, height);
    await wait(400);
    notes.push(await shot(name));
  }
  win.setFullScreen(true);
  await wait(700);
  notes.push(await shot("fenster-l-modul-f11.png"));
  win.setFullScreen(false);
  await wait(400);

  const probe = await win.webContents.executeJavaScript(`(() => {
    const frame = document.querySelector(".modul-frame");
    const body = getComputedStyle(document.body);
    return {
      offen: document.body.classList.contains("modul-offen"),
      title: document.getElementById("modul-titel") && document.getElementById("modul-titel").textContent,
      frame: frame ? { w: frame.clientWidth, h: frame.clientHeight, src: frame.src } : null,
      accent: body.getPropertyValue("--akzent").trim(),
      canvas: body.getPropertyValue("--dw-canvas").trim(),
      overflow: body.overflow
    };
  })()`);
  fs.writeFileSync(path.join(outDir, "fenster-l-probe.json"), JSON.stringify({ probe, notes }, null, 2));
  app.exit(0);
}).catch((error) => {
  fs.writeFileSync(path.join(outDir, "fenster-l-probe.json"), String(error && error.stack || error));
  app.exit(1);
});
