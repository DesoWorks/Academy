"use strict";

const fs = require("node:fs");
const path = require("node:path");

function readCatalog(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return {
      ok: true,
      offline: false,
      source: "local-file",
      connected: false,
      modules: Array.isArray(parsed.modules) ? parsed.modules : []
    };
  } catch (error) {
    return {
      ok: false,
      offline: true,
      source: "local-file",
      connected: false,
      modules: [],
      message: "Der Modulkatalog ist nicht erreichbar. Bereits installierte Module bleiben nutzbar."
    };
  }
}

function catalogPath(desktopRoot) {
  return path.join(desktopRoot, "..", "..", "catalog", "official.json");
}

module.exports = { readCatalog, catalogPath };
