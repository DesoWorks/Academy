"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron");

const root = path.resolve(__dirname, "..", "..", "..");
const id = "desoworks.it-systemintegration";
const legacy = process.env.ACADEMY_LEGACY_ROOT;
const catalogFile = path.join(root, "catalog", "official.json");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "academy-3c-card-"));

const { declareScheme, registerProtocol } = require(path.join(root, "src/protocol"));
const { registerIpc } = require(path.join(root, "src/ipc"));
const { createModuleManager } = require(path.join(root, "src/modules/manager"));
const { openDatabase } = require(path.join(root, "src/store/database"));
const { CORE_VERSION } = require(path.join(root, "src/core/version"));
const { contentRootFrom } = require(path.join(root, "src/config"));

declareScheme();
app.setPath("userData", dataDir);

app.whenReady().then(async () => {
  const findings = { dataDir, core: CORE_VERSION };
  try {
    const storeRef = { current: openDatabase({ dataDir }) };
    const modules = createModuleManager({
      dataDir,
      coreVersion: CORE_VERSION,
      hostedWebRoots: [path.dirname(legacy), path.join(root, "modules")],
      catalogFile
    });
    modules.installFromDirectory(legacy);
    modules.close();
    const DatabaseSync = require("node:sqlite").DatabaseSync;
    const db = new DatabaseSync(path.join(dataDir, "modules.sqlite"));
    const stored = JSON.parse(db.prepare("SELECT manifest_json FROM module_install WHERE id = ?").get(id).manifest_json);
    delete stored.runtime.themeContract;
    db.prepare("UPDATE module_install SET manifest_json = ? WHERE id = ?").run(JSON.stringify(stored), id);
    db.close();
    const again = createModuleManager({
      dataDir,
      coreVersion: CORE_VERSION,
      hostedWebRoots: [path.dirname(legacy), path.join(root, "modules")],
      catalogFile
    });
    registerProtocol({
      contentRoot: contentRootFrom(),
      desktopRoot: path.join(root, "src", "renderer"),
      resolveModuleFile(moduleId, requestPath) {
        return again.resolveHostedFile(moduleId, requestPath);
      }
    });
    registerIpc({
      ipcMain,
      dialog,
      storeRef,
      modules: again,
      updates: {
        reconcile() {},
        check() { return Promise.resolve({ ok: false }); },
        status() { return { phase: "current", moduleUpdates: [] }; },
        plan() { return null; }
      },
      versions: { desktop: "probe", core: CORE_VERSION, channel: "dev", commit: "", builtAt: "", name: "DesoWorks Academy" },
      channel: "dev",
      catalogFile
    });
    const win = new BrowserWindow({
      width: 1280,
      height: 840,
      show: false,
      webPreferences: {
        preload: path.join(root, "src/preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true
      }
    });
    await win.loadURL("academy://app/home.html");
    await new Promise((resolve) => setTimeout(resolve, 800));
    findings.card = await win.webContents.executeJavaScript(`(() => {
      const card = document.querySelector("#karten article");
      const button = card ? card.querySelector("button") : null;
      const open = card ? card.querySelector("a.knopf") : null;
      return {
        text: card ? card.innerText : "",
        button: button ? button.textContent : null,
        open: open ? open.textContent : null
      };
    })()`);
    await win.webContents.capturePage().then((image) => {
      fs.writeFileSync(path.join(__dirname, "karte-inkompatibel.png"), image.toPNG());
    });
    findings.ok = findings.card.text.includes("Inkompatibel, Aktualisierung erforderlich") && findings.card.button === "Aktualisieren" && !findings.card.open;
    fs.writeFileSync(path.join(__dirname, "probe-card.json"), JSON.stringify(findings, null, 2));
    console.log(JSON.stringify(findings.card));
    app.exit(findings.ok ? 0 : 1);
  } catch (error) {
    fs.writeFileSync(path.join(__dirname, "probe-card.json"), JSON.stringify({ error: String(error.stack || error) }, null, 2));
    console.error(error);
    app.exit(1);
  }
});
