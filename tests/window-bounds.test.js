"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { rememberBounds, restoreBounds, shouldToggleFullscreen, createFullscreenController } = require("../src/window-bounds");

function fakeWindow(bounds) {
  const state = { bounds: Object.assign({}, bounds), full: false, calls: [] };
  return {
    state,
    getBounds: () => Object.assign({}, state.bounds),
    setBounds: (value) => { state.bounds = Object.assign({}, value); state.calls.push("setBounds"); },
    isFullScreen: () => state.full,
    setFullScreen: (value) => { state.full = value; state.calls.push("full:" + value); state.bounds = { x: 0, y: 0, width: 1920, height: 1080 }; },
    isDestroyed: () => false
  };
}

test("F11 ohne Modifikatoren löst aus, Wiederholung und Kombinationen nicht", () => {
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F11" }), true);
  assert.equal(shouldToggleFullscreen({ type: "keyUp", key: "F11" }), false);
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F10" }), false);
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F11", control: true }), false);
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F11", alt: true }), false);
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F11", shift: true }), false);
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F11", meta: true }), false);
  assert.equal(shouldToggleFullscreen({ type: "keyDown", key: "F11", isAutoRepeat: true }), false);
  assert.equal(shouldToggleFullscreen(null), false);
});

test("Größe und Position werden gemerkt und wiederhergestellt", () => {
  const win = fakeWindow({ x: 120, y: 80, width: 1000, height: 700 });
  const saved = rememberBounds(win);
  win.setFullScreen(true);
  assert.equal(restoreBounds(win, saved), true);
  assert.deepEqual(win.getBounds(), { x: 120, y: 80, width: 1000, height: 700 });
  assert.equal(restoreBounds(win, null), false);
});

test("Controller schaltet ein und aus und stellt die Bounds wieder her", () => {
  const win = fakeWindow({ x: 10, y: 20, width: 1100, height: 760 });
  const controller = createFullscreenController(win);
  assert.equal(controller.toggle(), true);
  assert.equal(win.state.full, true);
  assert.equal(controller.pending(), true);
  assert.equal(controller.toggle(), false);
  assert.equal(win.state.full, false);
  assert.deepEqual(win.getBounds(), { x: 10, y: 20, width: 1100, height: 760 });
  assert.equal(controller.pending(), false);
});
