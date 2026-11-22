"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DEV_FEED_HOST, DEV_FEED_PORT, devFeedDir, devFeedKeyFile } = require("../src/updates/dev-feed");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

const feedDir = path.resolve(arg("--feed") || devFeedDir());
const dataDir = arg("--data") || path.join(process.env.APPDATA || "", "DesoWorks", "Academy");
const installer = arg("--installer");
const version = arg("--version");
const notes = arg("--notes") || "";
const commit = arg("--commit") || "";
const moduleZip = arg("--module-zip");
const moduleId = arg("--module-id") || "desoworks.it-systemintegration";
const moduleVersion = arg("--module-version");
const moduleNotes = arg("--module-notes") || "";
const coreRange = arg("--core") || ">=0.3.0 <0.4.0";

if (!installer || !version || !fs.existsSync(installer)) {
  process.stderr.write("Aufruf: node scripts/publish-dev-feed.js --installer DATEI --version 0.3.1-dev.2 [--module-zip DATEI --module-version 1.0.2]\n");
  process.exit(1);
}

fs.mkdirSync(feedDir, { recursive: true });
fs.mkdirSync(path.dirname(devFeedKeyFile(dataDir)), { recursive: true });
const keyFile = devFeedKeyFile(dataDir);
if (!fs.existsSync(keyFile)) {
  fs.writeFileSync(keyFile, crypto.randomBytes(32).toString("hex") + "\n", { mode: 0o600 });
}

const installerName = path.basename(installer);
const installerTarget = path.join(feedDir, installerName);
fs.copyFileSync(installer, installerTarget);
const installerSha = sha256(installerTarget);
fs.writeFileSync(`${installerTarget}.sha256`, `${installerSha}  ${installerName}\n`);
const base = `http://${DEV_FEED_HOST}:${DEV_FEED_PORT}/dev`;
const release = {
  version,
  prerelease: true,
  notes,
  commit,
  publishedAt: new Date().toISOString(),
  assets: [
    { name: installerName, url: `${base}/${encodeURIComponent(installerName)}`, size: fs.statSync(installerTarget).size },
    { name: `${installerName}.sha256`, url: `${base}/${encodeURIComponent(installerName)}.sha256`, size: fs.statSync(`${installerTarget}.sha256`).size }
  ]
};
const modules = [];
if (moduleZip && moduleVersion && fs.existsSync(moduleZip)) {
  const moduleName = path.basename(moduleZip);
  const moduleTarget = path.join(feedDir, moduleName);
  fs.copyFileSync(moduleZip, moduleTarget);
  const moduleSha = sha256(moduleTarget);
  fs.writeFileSync(`${moduleTarget}.sha256`, `${moduleSha}  ${moduleName}\n`);
  modules.push({
    id: moduleId,
    version: moduleVersion,
    prerelease: true,
    notes: moduleNotes,
    commit,
    publishedAt: release.publishedAt,
    core: coreRange,
    assets: [
      { name: moduleName, url: `${base}/${encodeURIComponent(moduleName)}`, size: fs.statSync(moduleTarget).size },
      { name: `${moduleName}.sha256`, url: `${base}/${encodeURIComponent(moduleName)}.sha256`, size: fs.statSync(`${moduleTarget}.sha256`).size }
    ]
  });
}
const manifest = {
  channel: "dev",
  product: "DesoWorks Academy",
  releases: [release],
  modules
};
fs.writeFileSync(path.join(feedDir, "manifest.json"), JSON.stringify(manifest, null, 2));
process.stdout.write(`DEV-Feed geschrieben: ${feedDir}\nVersion ${version}\nSchlüssel ${keyFile}\n`);
