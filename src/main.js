"use strict";

const { app, BrowserWindow, dialog, session } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { resolveChannel, contentRootFrom, dataDirFrom } = require("./config");
const { openDatabase } = require("./store/database");
const { createUpdateService } = require("./updates/service");
const { declareScheme, registerProtocol } = require("./protocol");
const { registerIpc } = require("./ipc");
const { createWindow } = require("./window");

declareScheme();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  const dataDir = dataDirFrom(app);
  app.setPath("userData", dataDir);
  app.setAppUserModelId("dev.desoworks.it-ausbildung");

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
    const channel = app.isPackaged ? resolveChannel({}, undefined) : resolveChannel();
    const storeRef = { current: openDatabase({ dataDir }) };
    const updates = createUpdateService({
      dataDir,
      channel,
      installedVersion: app.getVersion(),
      feedUrl: !app.isPackaged && channel !== "dev" ? (process.env.ACADEMY_UPDATE_FEED || "") : ""
    });
    updates.reconcile();
    registerProtocol({
      contentRoot: contentRootFrom(app),
      desktopRoot: path.join(__dirname, "renderer")
    });
    registerIpc({
      ipcMain: require("electron").ipcMain,
      storeRef,
      updates,
      channel,
      versions: {
        desktop: app.getVersion(),
        channel,
        web: "siehe js/version.js"
      },
      onInstall(plan) {
        const child = spawn(plan.command, plan.args, { detached: true, stdio: "ignore" });
        child.unref();
        app.quit();
      }
    });
    const win = createWindow();
    if (process.env.ACADEMY_SMOKE === "1") {
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
    dialog.showErrorBox("IT-Ausbildung", error && error.message ? error.message : "Die Anwendung konnte nicht starten. Die Lerndaten wurden nicht gelöscht.");
    app.exit(1);
  });

  app.on("window-all-closed", () => {
    app.quit();
  });
}
