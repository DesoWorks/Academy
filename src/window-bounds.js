"use strict";

// Reine Logik für Vollbild und Fenstergröße. Kein Electron-Import, damit sie testbar bleibt.

function cloneBounds(bounds) {
  if (!bounds) return null;
  return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
}

function rememberBounds(win) {
  return cloneBounds(win.getBounds());
}

function restoreBounds(win, bounds) {
  if (!bounds) return false;
  win.setBounds(cloneBounds(bounds));
  return true;
}

// F11 ohne Strg, Alt, Umschalt oder Meta. Nur beim Herunterdrücken, nicht bei Tastenwiederholung.
function shouldToggleFullscreen(input) {
  if (!input || input.type !== "keyDown" || input.key !== "F11") return false;
  if (input.control || input.alt || input.shift || input.meta) return false;
  if (input.isAutoRepeat) return false;
  return true;
}

function createFullscreenController(win) {
  let saved = null;

  function restore() {
    if (!saved) return false;
    const done = restoreBounds(win, saved);
    saved = null;
    return done;
  }

  function toggle() {
    if (typeof win.isDestroyed === "function" && win.isDestroyed()) return false;
    if (!win.isFullScreen()) {
      saved = rememberBounds(win);
      win.setFullScreen(true);
      return true;
    }
    win.setFullScreen(false);
    restore();
    return false;
  }

  return { toggle, restore, pending: () => saved !== null };
}

module.exports = {
  cloneBounds,
  rememberBounds,
  restoreBounds,
  shouldToggleFullscreen,
  createFullscreenController
};
