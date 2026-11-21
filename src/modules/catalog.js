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

function resolveBundledPackage(catalogFile, moduleId) {
  const catalog = readCatalog(catalogFile);
  if (!catalog.ok) {
    const error = new Error(catalog.message || "Der Modulkatalog ist nicht erreichbar.");
    error.code = "catalog-unavailable";
    throw error;
  }
  const entry = catalog.modules.find((item) => item && item.id === moduleId);
  if (!entry || typeof entry.localPackage !== "string") {
    const error = new Error("Dieses Lernangebot liegt nicht im lokalen Katalog.");
    error.code = "missing-module";
    throw error;
  }
  const relative = entry.localPackage.replace(/\\/g, "/");
  if (!relative.startsWith("modules/") || relative.includes("..") || path.isAbsolute(entry.localPackage)) {
    const error = new Error("Der Katalogpfad ist ungültig.");
    error.code = "bad-path";
    throw error;
  }
  const catalogDir = path.dirname(path.resolve(catalogFile));
  const packaged = path.basename(catalogDir) === "academy-catalog";
  const root = packaged
    ? path.resolve(catalogDir, "..", "academy-modules")
    : path.resolve(catalogDir, "..", "modules");
  const full = path.resolve(root, relative.slice("modules/".length));
  const realRoot = fs.realpathSync(root);
  const realFull = fs.realpathSync(full);
  const inside = path.relative(realRoot, realFull);
  if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) {
    const error = new Error("Der Katalogpfad verlässt die Anwendung.");
    error.code = "bad-path";
    throw error;
  }
  return { dir: realFull, entry };
}

module.exports = { readCatalog, catalogPath, resolveBundledPackage };
