"use strict";

const { app, BrowserWindow } = require("electron");
const path = require("node:path");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  await win.loadFile(path.join(__dirname, "storage-probe.html"));
  const probe = await win.webContents.executeJavaScript(`(() => {
    const before = localStorage.getItem("setItem");
    let assigned = "threw";
    try {
      localStorage.setItem = function () { return "replaced"; };
      assigned = typeof localStorage.setItem;
    } catch (error) {
      assigned = "error:" + error.name;
    }
    return { before, assigned, stored: localStorage.getItem("setItem") };
  })()`);
  console.log(JSON.stringify({ probe }));
  app.exit(probe.assigned === "function" ? 0 : 2);
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
