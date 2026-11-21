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
  const { ipcMain, storeRef, updates, versions, channel } = options;
  let store = storeRef.current;

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
    updates: updates.status(),
    extensions: listPorts()
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

  ipcMain.handle("academy:restore", (event, name) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      const match = store.listBackups().find((entry) => entry.name === name);
      if (!match) return { ok: false, code: "missing-backup", message: "Diese Sicherung gibt es nicht." };
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
