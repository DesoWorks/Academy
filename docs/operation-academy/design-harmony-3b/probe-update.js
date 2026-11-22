"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createModuleManager } = require("../../../src/modules/manager");
const { CORE_VERSION } = require("../../../src/core/version");

const profileRoot = path.join(process.env.APPDATA, "DesoWorks", "Academy");
const installed = path.join(profileRoot, "module-packages", "desoworks.it-systemintegration", "1.0.2");
const verifiedManifest = path.join(profileRoot, "updates", "modules", "verified", "desoworks.it-systemintegration", "1.0.2", "academy-module.json");
const source = path.resolve(__dirname, "..", "..", "..", "modules", "it-systemintegration");
const id = "desoworks.it-systemintegration";
const marker = path.join("web", "js", "anzeige-glossar.js");

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function copyTree(from, to) {
  fs.cpSync(from, to, { recursive: true });
}

const parent = fs.mkdtempSync(path.join(os.tmpdir(), "academy-3b-"));
const data = path.join(parent, "data");
const legacy = path.join(parent, "legacy");
const bad = path.join(parent, "bad-same");
const broken = path.join(parent, "broken-newer");
fs.mkdirSync(data, { recursive: true });
copyTree(installed, legacy);
const manifest = JSON.parse(fs.readFileSync(verifiedManifest, "utf8"));
if (manifest.version !== "1.0.2" || manifest.runtime.themeContract != null) {
  throw new Error("Verified-Manifest ist nicht das erwartete 1.0.2 ohne Theme-Vertrag.");
}
manifest.runtime.themeContract = 1;
fs.writeFileSync(path.join(legacy, "academy-module.json"), JSON.stringify(manifest));

const modules = createModuleManager({
  dataDir: data,
  coreVersion: CORE_VERSION,
  hostedWebRoots: [parent, path.dirname(source)]
});
const seeded = modules.installFromDirectory(legacy);
const registry = modules;
const row = seeded;
if (row.version !== "1.0.2") throw new Error("Seed ist nicht 1.0.2: " + row.version);

const DatabaseSync = require("node:sqlite").DatabaseSync;
modules.close();
const dbPath = path.join(data, "modules.sqlite");
const db = new DatabaseSync(dbPath);
const stored = JSON.parse(db.prepare("SELECT manifest_json FROM module_install WHERE id = ?").get(id).manifest_json);
delete stored.runtime.themeContract;
db.prepare("UPDATE module_install SET manifest_json = ? WHERE id = ?").run(JSON.stringify(stored), id);
db.close();

const again = createModuleManager({
  dataDir: data,
  coreVersion: CORE_VERSION,
  hostedWebRoots: [parent, path.dirname(source)]
});
again.progress(id, { tasks: { "lf3-dhcp": { done: true, answer: "behalten" } }, assessment: { q1: { correct: true } } });
const beforePath = again.installPath(id);
const beforeMarker = hashFile(path.join(beforePath, marker));
const beforeProgress = JSON.stringify(again.progress(id));
const beforeVersion = again.list().installed[0].version;

copyTree(legacy, bad);
const badManifest = JSON.parse(fs.readFileSync(path.join(bad, "academy-module.json"), "utf8"));
badManifest.description = badManifest.description + " anderer Inhalt";
fs.writeFileSync(path.join(bad, "academy-module.json"), JSON.stringify(badManifest));
let sameVersionCode = null;
try {
  again.installFromDirectory(bad);
} catch (error) {
  sameVersionCode = error.code;
}
const afterFailPath = again.installPath(id);
const afterFailMarker = hashFile(path.join(afterFailPath, marker));
const afterFailProgress = JSON.stringify(again.progress(id));
const afterFailVersion = again.list().installed[0].version;

copyTree(source, broken);
const brokenManifest = JSON.parse(fs.readFileSync(path.join(broken, "academy-module.json"), "utf8"));
brokenManifest.version = "1.0.4";
delete brokenManifest.runtime.themeContract;
fs.writeFileSync(path.join(broken, "academy-module.json"), JSON.stringify(brokenManifest));
let brokenCode = null;
try {
  again.installFromDirectory(broken);
} catch (error) {
  brokenCode = error.code;
}
const afterBrokenMarker = hashFile(path.join(again.installPath(id), marker));
const afterBrokenProgress = JSON.stringify(again.progress(id));
const afterBrokenVersion = again.list().installed[0].version;

const upgraded = again.installFromDirectory(source);
const after = again.list().installed[0];
const upgradedMarker = fs.readFileSync(path.join(again.installPath(id), marker), "utf8");
const oldStill = fs.existsSync(path.join(data, "module-packages", id, "1.0.2", marker));
const oldMarker = oldStill ? fs.readFileSync(path.join(data, "module-packages", id, "1.0.2", marker), "utf8") : "";
const progress = again.progress(id);
again.close();

const report = {
  profileUntouched: true,
  temp: parent,
  seed: seeded.version,
  sameVersionCode,
  brokenCode,
  beforeVersion,
  afterFailVersion,
  afterBrokenVersion,
  version: after.version,
  compatible: after.compatible,
  themeContract: after.themeContract,
  markerUnchangedOnFail: beforeMarker === afterFailMarker && beforeMarker === afterBrokenMarker,
  progressUnchangedOnFail: beforeProgress === afterFailProgress && beforeProgress === afterBrokenProgress,
  progressKept: progress.tasks["lf3-dhcp"].done === true && progress.assessment.q1.correct === true,
  newScriptHasAcademyTheme: upgradedMarker.includes("data-academy-theme"),
  oldScriptLacksAcademyTheme: !oldMarker.includes("data-academy-theme"),
  oldFolderRemains: oldStill,
  pathChanged: againPath(beforePath, path.join(data, "module-packages", id, "1.0.3"))
};

function againPath(before, expected) {
  return path.resolve(before) !== path.resolve(expected);
}

report.pathChanged = path.resolve(beforePath) !== path.resolve(path.join(data, "module-packages", id, upgraded.version));
const out = path.join(__dirname, "probe-update.json");
fs.writeFileSync(out, JSON.stringify(report, null, 2));
const ok = report.sameVersionCode === "same-version-different-content"
  && report.brokenCode === "incompatible-theme"
  && report.markerUnchangedOnFail
  && report.progressUnchangedOnFail
  && report.version === "1.0.3"
  && report.compatible === true
  && report.themeContract === 1
  && report.progressKept
  && report.newScriptHasAcademyTheme
  && report.oldScriptLacksAcademyTheme
  && report.oldFolderRemains
  && report.pathChanged;
console.log(JSON.stringify(report, null, 2));
if (!ok) process.exit(1);
