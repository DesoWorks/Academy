"use strict";

const { listPorts } = require("./extensions/ports");

function fromApp(event) {
  const url = event && event.senderFrame && event.senderFrame.url;
  return typeof url === "string" && url.startsWith("academy://app/");
}

function reject(event, sync) {
  const result = { ok: false, code: "forbidden", message: "Diese Anfrage kommt nicht aus der Anwendung." };
  if (sync) event.returnValue = result;
  return result;
}

function ok(value) {
  return Object.assign({ ok: true }, value || {});
}

function fail(error) {
  return {
    ok: false,
    code: error.code || "error",
    message: error.message || "Die Aktion ist fehlgeschlagen."
  };
}

function registerIpc(options) {
  const { ipcMain, dialog, storeRef, updates, versions, channel } = options;
  const fs = require("node:fs");
  let store = storeRef.current;
  let pendingImport = null;

  function replaceStore(next) {
    store = next;
    storeRef.current = next;
  }

  ipcMain.on("academy:storage-load-all", (event) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      event.returnValue = ok({ items: store.all(), schemaVersion: store.schemaVersion });
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.on("academy:storage-set", (event, key, value) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      store.set(key, value);
      event.returnValue = ok();
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.on("academy:storage-remove", (event, key) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      store.remove(key);
      event.returnValue = ok();
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.on("academy:storage-clear", (event) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      const result = store.clear();
      event.returnValue = ok({ backup: result.backup });
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.handle("academy:status", (event) => {
    if (!fromApp(event)) return reject(event, false);
    return ok({
      channel,
      versions,
      schemaVersion: store.schemaVersion,
      dataPath: store.path,
      backupDir: store.backupDir,
      lastBackup: store.lastBackup(),
      policy: store.readPolicy(),
      updates: updates.status(),
      extensions: listPorts(),
      runtime: {
        electron: process.versions.electron,
        platform: process.platform
      }
    });
  });

  ipcMain.handle("academy:backup", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ backup: store.backup("manual"), backups: store.listBackups() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:backups", (event) => {
    if (!fromApp(event)) return reject(event, false);
    return ok({ backups: store.listBackups() });
  });

  ipcMain.handle("academy:policy", (event, partial) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      if (!partial) return ok({ policy: store.readPolicy() });
      return ok({ policy: store.writePolicy(partial) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:export-file", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!dialog) return { ok: false, code: "unavailable", message: "Der Export-Dialog ist nicht verfügbar. Es wurde nichts geschrieben." };
    const picked = await dialog.showSaveDialog({
      title: "Ausbildungsdaten exportieren",
      defaultPath: "it-ausbildung-export.json",
      filters: [{ name: "Ausbildungsdaten", extensions: ["json"] }]
    });
    if (picked.canceled || !picked.filePath) {
      return { ok: false, code: "cancelled", message: "Export abgebrochen. Es wurde nichts geschrieben." };
    }
    try {
      const raw = store.exportBundle(versions && versions.desktop);
      fs.writeFileSync(picked.filePath, raw, "utf8");
      if (fs.readFileSync(picked.filePath, "utf8") !== raw) {
        return { ok: false, code: "export-failed", message: "Die Exportdatei ist unvollständig. Sie darf nicht als erfolgreich gelten." };
      }
      return ok({ file: picked.filePath });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:pick-import", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!dialog) return { ok: false, code: "unavailable", message: "Der Import-Dialog ist nicht verfügbar. Es wurde nichts geändert." };
    const picked = await dialog.showOpenDialog({
      title: "Ausbildungsdaten importieren",
      filters: [{ name: "Ausbildungsdaten", extensions: ["json"] }],
      properties: ["openFile"]
    });
    if (picked.canceled || !picked.filePaths || !picked.filePaths[0]) {
      return { ok: false, code: "cancelled", message: "Import abgebrochen. Es wurde nichts geändert." };
    }
    try {
      const raw = fs.readFileSync(picked.filePaths[0], "utf8");
      pendingImport = { raw, file: picked.filePaths[0] };
      return ok({ file: picked.filePaths[0], bytes: Buffer.byteLength(raw) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:import", async (event, choice) => {
    if (!fromApp(event)) return reject(event, false);
    if (!pendingImport) return { ok: false, code: "missing-import", message: "Keine Importdatei ausgewählt. Es wurde nichts geändert." };
    const mode = choice && choice.mode;
    if (!dialog || typeof dialog.showMessageBox !== "function") {
      return { ok: false, code: "unavailable", message: "Ohne Bestätigung im Hauptprozess wird nichts importiert." };
    }
    const answer = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Importieren", "Abbrechen"],
      defaultId: 1,
      cancelId: 1,
      message: "Ausbildungsdaten importieren?",
      detail: "Modus: " + (mode || "fehlt") + ". Datei: " + pendingImport.file + ". Ohne diese Bestätigung bleibt der aktuelle Stand."
    });
    if (!answer || answer.response !== 0) {
      return { ok: false, code: "cancelled", message: "Import nicht bestätigt. Es wurde nichts geändert." };
    }
    try {
      const result = store.importBundle(pendingImport.raw, { mode, confirm: true, allowLegacy: true });
      pendingImport = null;
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:restore", async (event, name) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      const match = store.listBackups().find((entry) => entry.name === name);
      if (!match) return { ok: false, code: "missing-backup", message: "Diese Sicherung gibt es nicht." };
      if (!dialog || typeof dialog.showMessageBox !== "function") {
        return { ok: false, code: "unavailable", message: "Ohne Bestätigung im Hauptprozess wird nichts zurückgeholt." };
      }
      const answer = await dialog.showMessageBox({
        type: "warning",
        buttons: ["Zurückholen", "Abbrechen"],
        defaultId: 1,
        cancelId: 1,
        message: "Sicherung zurückholen?",
        detail: match.name + " ersetzt den aktuellen Lernstand. Vorher wird ein Sicherheitsstand angelegt."
      });
      if (!answer || answer.response !== 0) {
        return { ok: false, code: "cancelled", message: "Wiederherstellung nicht bestätigt. Der aktuelle Stand bleibt." };
      }
      const next = store.restore(match.path);
      replaceStore(next);
      return ok({ schemaVersion: next.schemaVersion, items: Object.keys(next.all()).length });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-check", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: await updates.check() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-download", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: await updates.download() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-abort", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: updates.abort() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-install", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      const backup = store.backup("pre-update");
      const plan = updates.installPlan(backup);
      if (!plan.ok) return { ok: false, message: plan.message, code: "install-blocked" };
      if (options.onInstall) options.onInstall(plan);
      return ok({ plan });
    } catch (error) {
      return fail(error);
    }
  });
}

module.exports = { registerIpc };
