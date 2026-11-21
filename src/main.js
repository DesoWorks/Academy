"use strict";

const { app, BrowserWindow, dialog, session } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { resolveChannel, contentRootFrom, dataDirFrom } = require("./config");
const { openDatabase } = require("./store/database");
const { createUpdateService } = require("./updates/service");
const { verifyPublisher } = require("./updates/signature");
const { PINNED_REPOSITORY } = require("./updates/feed");
const { declareScheme, registerProtocol } = require("./protocol");
const { registerIpc } = require("./ipc");
const { createModuleManager } = require("./modules/manager");
const { CORE_VERSION } = require("./core/version");
const { createWindow } = require("./window");

declareScheme();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  const dataDir = dataDirFrom(app);
  app.setPath("userData", dataDir);
  app.setAppUserModelId("dev.desoworks.academy");

  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    const channel = resolveChannel(app.isPackaged ? {} : process.env);
    const storeRef = { current: openDatabase({ dataDir }) };
    let modules = null;
    try {
      modules = createModuleManager({ dataDir, coreVersion: CORE_VERSION });
    } catch (error) {
      modules = { available: false, list() { return { platform: null, installed: [], available: false, message: error.message }; }, close() {} };
    }
    const updates = createUpdateService({
      dataDir,
      channel,
      installedVersion: app.getVersion(),
      feedUrl: channel === "stable" && !app.isPackaged ? (process.env.ACADEMY_UPDATE_FEED || "") : "",
      repository: PINNED_REPOSITORY,
      publisherThumbprint: app.isPackaged ? "" : (process.env.ACADEMY_PUBLISHER_THUMBPRINT || ""),
      verifyPublisher
    });
    updates.reconcile();
    try {
      storeRef.current.ensureScheduledBackup();
    } catch (error) {
      dialog.showErrorBox("DesoWorks Academy", error && error.message ? error.message : "Die planmäßige Sicherung ist fehlgeschlagen. Sie wird nicht als erfolgreich angezeigt.");
    }
    registerProtocol({
      contentRoot: contentRootFrom(app),
      desktopRoot: path.join(__dirname, "renderer")
    });
    registerIpc({
      ipcMain: require("electron").ipcMain,
      dialog,
      storeRef,
      updates,
      channel,
      versions: {
        desktop: app.getVersion(),
        core: CORE_VERSION,
        channel,
        name: "DesoWorks Academy"
      },
      modules,
      exampleModuleDir: app.isPackaged
        ? path.join(process.resourcesPath, "academy-modules", "wissen-weitergeben")
        : path.join(__dirname, "..", "modules", "wissen-weitergeben"),
      catalogFile: app.isPackaged
        ? path.join(process.resourcesPath, "academy-catalog", "official.json")
        : path.join(__dirname, "..", "catalog", "official.json"),
      onInstall(plan) {
        const child = spawn(plan.command, plan.args, { detached: true, stdio: "ignore" });
        child.unref();
        app.quit();
      }
    });
    const win = createWindow();
    if (!app.isPackaged && (process.env.ACADEMY_LAB === "seed" || process.env.ACADEMY_LAB === "read")) {
      const { runLaboratory } = require("./lab-run");
      runLaboratory(win, app);
    }
    if (!app.isPackaged && process.env.ACADEMY_SMOKE === "1") {
      win.webContents.once("did-finish-load", async () => {
        try {
          const value = await win.webContents.executeJavaScript("localStorage.setItem('academy.smoke','gehalten'); localStorage.getItem('academy.smoke');");
          fs.writeFileSync(path.join(dataDir, "smoke-result.txt"), String(value));
          app.exit(value === "gehalten" ? 0 : 2);
        } catch (error) {
          fs.writeFileSync(path.join(dataDir, "smoke-result.txt"), String(error && error.message));
          app.exit(3);
        }
      });
    }
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }).catch((error) => {
    dialog.showErrorBox("DesoWorks Academy", error && error.message ? error.message : "Die Anwendung konnte nicht starten. Die Lerndaten wurden nicht gelöscht.");
    app.exit(1);
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}
