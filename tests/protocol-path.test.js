"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { resolveAcademyPath } = require("../src/protocol-path");
const { resolveChannel } = require("../src/config");
const { listPorts } = require("../src/extensions/ports");

test("Plattformpfade bleiben im Inhaltsverzeichnis", () => {
  const root = path.resolve("D:/Desoworks/Workspace/IT-Ausbildung");
  const index = resolveAcademyPath(root, "/index.html");
  assert.equal(index, path.join(root, "index.html"));
  assert.throws(() => resolveAcademyPath(root, "/../Windows/win.ini"), (error) => error.code === "traversal");
  assert.throws(() => resolveAcademyPath(root, "/%2e%2e/AGENTS.md"), (error) => error.code === "traversal");
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
