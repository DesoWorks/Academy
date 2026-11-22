"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const asar = require("@electron/asar");

function sha(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

const root = path.resolve(__dirname, "..", "..", "..");
const extracted = path.join(process.env.TEMP, "academy-3d-installer", "resources", "academy-modules", "it-systemintegration");
const unpacked = path.join(root, "dist", "win-unpacked", "resources", "academy-modules", "it-systemintegration");
const asarPath = path.join(root, "dist", "win-unpacked", "resources", "app.asar");
const exePath = path.join(root, "dist", "DesoWorks-Academy-Setup-0.3.1-dev.6.local.exe");

function inside(rel) {
  return asar.extractFile(asarPath, rel.split("/").join("\\"));
}

const manifest = JSON.parse(fs.readFileSync(path.join(extracted, "academy-module.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(path.join(extracted, "content", "payload-index.json"), "utf8"));
let bad = 0;
let ok = 0;
let unpackedDiffers = 0;
for (const entry of index.files) {
  const packed = fs.readFileSync(path.join(extracted, entry.path));
  const loose = fs.readFileSync(path.join(unpacked, entry.path));
  const hash = sha(packed);
  if (hash !== entry.sha256 || packed.length !== entry.size) bad += 1;
  else ok += 1;
  if (!packed.equals(loose)) unpackedDiffers += 1;
}

const changed = [
  "src/main.js",
  "src/modules/manager.js",
  "src/modules/spec.js",
  "src/renderer/design-tokens.css",
  "src/renderer/module.js",
  "src/renderer/shell.js"
];
const asarMatch = {};
for (const rel of changed) {
  asarMatch[rel] = fs.readFileSync(path.join(root, rel)).equals(inside(rel));
}

const manager = inside("src/modules/manager.js").toString("utf8");
const tokens = inside("src/renderer/design-tokens.css").toString("utf8");
const declaredSize = manifest.files.reduce((sum, rel) => sum + fs.statSync(path.join(extracted, rel)).size, 0);
const exe = fs.readFileSync(exePath);

const report = {
  extractedFromInstaller: extracted,
  manifest: {
    version: manifest.version,
    themeContract: manifest.runtime && manifest.runtime.themeContract,
    sizeBytes: manifest.sizeBytes,
    declaredSize,
    signed: manifest.review && manifest.review.signed,
    trust: manifest.trust
  },
  payload: {
    entries: index.files.length,
    ok,
    bad,
    unpackedDiffers
  },
  installer: {
    path: exePath,
    bytes: exe.length,
    sha256: sha(exe)
  },
  packagedVersion: JSON.parse(inside("package.json").toString("utf8")).version,
  asarHasIncompatibleTheme: manager.includes("incompatible-theme"),
  asarHasSameVersion: manager.includes("same-version-different-content"),
  asarHasAccent: tokens.includes("--farbe-akzent-dunkel"),
  buildInfo: JSON.parse(inside("build/build-info.json").toString("utf8")),
  asarMatch
};

fs.writeFileSync(path.join(__dirname, "artifact.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.manifest.version !== "1.0.3" || report.manifest.themeContract !== 1 || report.payload.bad !== 0 || report.payload.unpackedDiffers !== 0) {
  process.exit(1);
}
