"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("academyDesktop", {
  storageLoadAll() {
    return ipcRenderer.sendSync("academy:storage-load-all");
  },
  storageSet(key, value) {
    return ipcRenderer.sendSync("academy:storage-set", String(key), String(value));
  },
  storageRemove(key) {
    return ipcRenderer.sendSync("academy:storage-remove", String(key));
  },
  storageClear() {
    return ipcRenderer.sendSync("academy:storage-clear");
  },
  status() {
    return ipcRenderer.invoke("academy:status");
  },
  backup() {
    return ipcRenderer.invoke("academy:backup");
  },
  backups() {
    return ipcRenderer.invoke("academy:backups");
  },
  restore(name) {
    return ipcRenderer.invoke("academy:restore", name);
  },
  policy(partial) {
    return ipcRenderer.invoke("academy:policy", partial || null);
  },
  importBundle(choice) {
    return ipcRenderer.invoke("academy:import", choice || {});
  },
  exportFile() {
    return ipcRenderer.invoke("academy:export-file");
  },
  pickImport() {
    return ipcRenderer.invoke("academy:pick-import");
  },
  checkUpdate() {
    return ipcRenderer.invoke("academy:update-check");
  },
  downloadUpdate() {
    return ipcRenderer.invoke("academy:update-download");
  },
  abortUpdate() {
    return ipcRenderer.invoke("academy:update-abort");
  },
  installUpdate() {
    return ipcRenderer.invoke("academy:update-install");
  },
  updateChannel() {
    return ipcRenderer.invoke("academy:update-channel");
  },
  setUpdateChannel(channel) {
    return ipcRenderer.invoke("academy:update-channel-set", String(channel || ""));
  },
  downloadModuleUpdate(id) {
    return ipcRenderer.invoke("academy:module-update-download", String(id || ""));
  },
  installModuleUpdate(id) {
    return ipcRenderer.invoke("academy:module-update-install", String(id || ""));
  },
  modules() {
    return ipcRenderer.invoke("academy:modules");
  },
  moduleInstall() {
    return ipcRenderer.invoke("academy:modules-install");
  },
  moduleInstallCatalog(id) {
    return ipcRenderer.invoke("academy:modules-install-catalog", String(id || ""));
  },
  moduleInstallExample() {
    return ipcRenderer.invoke("academy:modules-install-example");
  },
  moduleOpen(id) {
    return ipcRenderer.invoke("academy:modules-open", String(id || ""));
  },
  moduleSetState(id, state) {
    return ipcRenderer.invoke("academy:modules-state", String(id || ""), String(state || ""));
  },
  moduleUninstall(id) {
    return ipcRenderer.invoke("academy:modules-uninstall", String(id || ""));
  },
  moduleCheck(id, taskId, response) {
    return ipcRenderer.invoke("academy:modules-check", String(id || ""), String(taskId || ""), String(response == null ? "" : response));
  },
  moduleCatalog() {
    return ipcRenderer.invoke("academy:modules-catalog");
  },
  onMenu(callback) {
    ipcRenderer.on("academy:menu", (_event, action) => callback(action));
  }
});
