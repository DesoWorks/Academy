"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { BrowserWindow, Menu } = require("electron");
const { shouldToggleFullscreen, createFullscreenController } = require("./window-bounds");

const START_URL = "academy://app/home.html";
const ICON_FILE = path.join(__dirname, "..", "build", "icon.png");

function buildMenu(win, fullscreen) {
  const send = (action) => {
    if (!win.isDestroyed()) win.webContents.send("academy:menu", action);
  };
  const entry = (label, action, accelerator) => {
    const item = { label, click: () => send(action) };
    if (accelerator) item.accelerator = accelerator;
    return item;
  };
  return Menu.buildFromTemplate([
    {
      label: "Academy",
      submenu: [
        entry("Startseite", "home", "Ctrl+1"),
        entry("Meine Lernbereiche", "areas", "Ctrl+2"),
        entry("Modul-Katalog", "catalog", "Ctrl+3"),
        entry("Einstellungen", "settings", "Ctrl+,"),
        entry("Daten und Updates", "verwaltung", "F9"),
        entry("Sicherung anlegen", "backup", "Ctrl+Shift+S"),
        { type: "separator" },
        { role: "quit", label: "Beenden" }
      ]
    },
    {
      label: "Ansicht",
      // Bewusst ohne Accelerator: F11 liegt im Core (before-input-event), sonst würde doppelt umgeschaltet.
      submenu: [
        { label: "Vollbild / Vollbild beenden", click: () => fullscreen.toggle() }
      ]
    },
    {
      label: "Lernen",
      submenu: [
        { label: "KI-Lernassistent (vorgesehen)", enabled: false },
        { label: "IDE (vorgesehen)", enabled: false }
      ]
    },
    {
      label: "Aktualisierung",
      submenu: [entry("Erneut prüfen", "check")]
    },
    {
      label: "Hilfe",
      submenu: [entry("Über Academy", "about")]
    }
  ]);
}

function createWindow() {
  const options = {
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    show: process.env.ACADEMY_HEADLESS !== "1",
    title: "DesoWorks Academy",
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
  };
  // Ohne eigene Icon-Datei gilt der Electron-Standard. Das ist kein endgültiges Branding.
  if (fs.existsSync(ICON_FILE)) options.icon = ICON_FILE;
  const win = new BrowserWindow(options);
  const fullscreen = createFullscreenController(win);

  win.webContents.on("before-input-event", (event, input) => {
    if (!shouldToggleFullscreen(input)) return;
    event.preventDefault();
    fullscreen.toggle();
  });
  win.on("enter-full-screen", () => win.setMenuBarVisibility(true));
  win.on("leave-full-screen", () => fullscreen.restore());

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("academy://app/")) event.preventDefault();
  });
  win.webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });

  Menu.setApplicationMenu(buildMenu(win, fullscreen));
  win.webContents.on("context-menu", (_event, params) => {
    const menu = Menu.buildFromTemplate([
      { role: "copy", label: "Kopieren", enabled: params.editFlags.canCopy },
      { role: "paste", label: "Einfügen", enabled: params.editFlags.canPaste },
      { role: "selectAll", label: "Alles auswählen" }
    ]);
    menu.popup({ window: win });
  });
  win.loadURL(START_URL);
  return win;
}

module.exports = { createWindow, START_URL };
