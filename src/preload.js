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
  checkUpdate() {
    return ipcRenderer.invoke("academy:update-check");
  },
  downloadUpdate() {
    return ipcRenderer.invoke("academy:update-download");
  },
  installUpdate() {
    return ipcRenderer.invoke("academy:update-install");
  },
  onMenu(callback) {
    ipcRenderer.on("academy:menu", (_event, action) => callback(action));
  }
});
