"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveAcademyPath } = require("../src/protocol-path");
const { resolveChannel, contentRootFrom, APP_ID, DATA_DIR_NAME } = require("../src/config");
const { listPorts } = require("../src/extensions/ports");
const { CORE_VERSION, CORE_NAME } = require("../src/core/version");

test("Shell-Pfade bleiben im Inhaltsverzeichnis", () => {
  const root = path.join(__dirname, "..", "src", "renderer");
  const home = resolveAcademyPath(root, "/home.html");
  assert.equal(home, path.join(root, "home.html"));
  assert.throws(() => resolveAcademyPath(root, "/../package.json"), (error) => error.code === "traversal");
  assert.throws(() => resolveAcademyPath(root, "/%2e%2e/package.json"), (error) => error.code === "traversal");
});

test("Inhaltsstamm ist der Renderer und nie der Parent", () => {
  const expected = path.join(__dirname, "..", "src", "renderer");
  assert.equal(path.resolve(contentRootFrom({ isPackaged: false })), path.resolve(expected));
  assert.equal(path.resolve(contentRootFrom({ isPackaged: true })), path.resolve(expected));
  assert.equal(fs.existsSync(path.join(contentRootFrom({}), "home.html")), true);
  assert.equal(fs.existsSync(path.join(contentRootFrom({}), "index.html")), false);
});

test("Identität und Datenverzeichnis sind Academy", () => {
  assert.equal(APP_ID, "dev.desoworks.academy");
  assert.equal(DATA_DIR_NAME, path.join("DesoWorks", "Academy"));
  assert.equal(CORE_VERSION, "0.3.0");
  assert.equal(CORE_NAME, "DesoWorks Academy Core");
});

test("Standardkanal ist dev, Erweiterungen sind abgeschaltet", () => {
  assert.equal(resolveChannel({}), "dev");
  assert.equal(resolveChannel({ ACADEMY_CHANNEL: "stable" }), "dev");
  const stableFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "academy-ch-")), "channel.json");
  fs.writeFileSync(stableFile, JSON.stringify({ channel: "stable" }));
  assert.equal(resolveChannel({ ACADEMY_CHANNEL: "stable" }, stableFile), "stable");
  assert.equal(resolveChannel({ ACADEMY_CHANNEL: "dev" }, stableFile), "dev");
  const ports = listPorts();
  assert.equal(ports.every((port) => port.enabled === false), true);
  assert.equal(ports.find((port) => port.id === "ide").execution, "isolated-worker-only");
});
