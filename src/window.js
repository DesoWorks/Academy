"use strict";

const path = require("node:path");
const { BrowserWindow, Menu } = require("electron");

function createWindow(options) {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: process.env.ACADEMY_HEADLESS !== "1",
    title: "IT-Ausbildung",
    backgroundColor: "#10141c",
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      navigateOnDragDrop: false
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("academy://app/")) event.preventDefault();
  });
  win.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  const template = [
    {
      label: "Datei",
      submenu: [
        {
          label: "Module",
          accelerator: "F8",
          click: () => win.webContents.send("academy:menu", "module")
        },
        {
          label: "Daten und Updates",
          accelerator: "F9",
          click: () => win.webContents.send("academy:menu", "verwaltung")
        },
        {
          label: "Sicherung anlegen",
          accelerator: "Ctrl+Shift+S",
          click: () => win.webContents.send("academy:menu", "backup")
        },
        { type: "separator" },
        { role: "quit", label: "Beenden" }
      ]
    },
    {
      label: "Aktualisierung",
      submenu: [
        {
          label: "Erneut prüfen",
          click: () => win.webContents.send("academy:menu", "check")
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  win.webContents.on("context-menu", (_event, params) => {
    const menu = Menu.buildFromTemplate([
      { role: "copy", label: "Kopieren", enabled: params.editFlags.canCopy },
      { role: "paste", label: "Einfügen", enabled: params.editFlags.canPaste },
      { role: "selectAll", label: "Alles auswählen" }
    ]);
    menu.popup({ window: win });
  });
  win.loadURL("academy://app/index.html");
  return win;
}

module.exports = { createWindow };
