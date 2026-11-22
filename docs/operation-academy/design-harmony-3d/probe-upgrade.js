"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createModuleManager } = require("../../../src/modules/manager");
const { resolveBundledPackage } = require("../../../src/modules/catalog");
const { CORE_VERSION } = require("../../../src/core/version");

const id = "desoworks.it-systemintegration";
const extractedRoot = path.join(process.env.TEMP, "academy-3d-installer", "resources");
const catalogFile = path.join(extractedRoot, "academy-catalog", "official.json");
const profileRoot = path.join(process.env.APPDATA, "DesoWorks", "Academy");
const installed = path.join(profileRoot, "module-packages", id, "1.0.2");
const verifiedManifest = path.join(profileRoot, "updates", "modules", "verified", id, "1.0.2", "academy-module.json");
const profileMarker = path.join(installed, "web", "js", "anzeige-glossar.js");
const markerRel = path.join("web", "js", "anzeige-glossar.js");

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function copyTree(from, to) {
  fs.cpSync(from, to, { recursive: true });
}

function fail(message) {
  const error = new Error(message);
  error.code = "probe-failed";
  throw error;
}

if (!fs.existsSync(catalogFile)) fail("Entpackter Installer-Katalog fehlt: " + catalogFile);
if (!fs.existsSync(installed)) fail("Profilmodul 1.0.2 fehlt. Nichts kopiert.");

const profileBefore = fs.statSync(profileMarker);
const verifiedBefore = fs.statSync(verifiedManifest);
const parent = fs.mkdtempSync(path.join(os.tmpdir(), "academy-3d-"));
const data = path.join(parent, "data");
const legacy = path.join(parent, "legacy");
const badSame = path.join(parent, "bad-same");
const broken = path.join(parent, "broken-newer");
fs.mkdirSync(data, { recursive: true });
copyTree(installed, legacy);
fs.copyFileSync(verifiedManifest, path.join(legacy, "academy-module.json"));

const diskManifest = JSON.parse(fs.readFileSync(path.join(legacy, "academy-module.json"), "utf8"));
if (diskManifest.version !== "1.0.2") fail("Kopie ist nicht 1.0.2: " + diskManifest.version);
diskManifest.runtime = diskManifest.runtime || {};
diskManifest.runtime.themeContract = 1;
fs.writeFileSync(path.join(legacy, "academy-module.json"), JSON.stringify(diskManifest));

const seeded = createModuleManager({
  dataDir: data,
  coreVersion: CORE_VERSION,
  catalogFile,
  hostedWebRoots: [parent, path.join(extractedRoot, "academy-modules")]
});
const seedRow = seeded.installFromDirectory(legacy);
if (seedRow.version !== "1.0.2") fail("Seed ist nicht 1.0.2");
seeded.close();

const DatabaseSync = require("node:sqlite").DatabaseSync;
const db = new DatabaseSync(path.join(data, "modules.sqlite"));
const stored = JSON.parse(db.prepare("SELECT manifest_json FROM module_install WHERE id = ?").get(id).manifest_json);
delete stored.runtime.themeContract;
db.prepare("UPDATE module_install SET manifest_json = ? WHERE id = ?").run(JSON.stringify(stored), id);
db.close();

const progress = {
  tasks: {
    "lf3-dhcp": { correct: true, at: "2026-11-22T08:00:00.000Z", status: "abgeschlossen" },
    "lf3-skizze": { correct: false, at: "2026-11-22T08:05:00.000Z", status: "begonnen", answer: "unvollstaendig" }
  },
  assessment: {
    q1: { correct: true, at: "2026-11-22T08:10:00.000Z" },
    q2: { correct: false, at: "2026-11-22T08:12:00.000Z", answer: "offen" }
  }
};

const modules = createModuleManager({
  dataDir: data,
  coreVersion: CORE_VERSION,
  catalogFile,
  hostedWebRoots: [parent, path.join(extractedRoot, "academy-modules")]
});
modules.progress(id, progress);
const beforePath = modules.installPath(id);
const beforeMarker = hashFile(path.join(beforePath, markerRel));
const beforeProgress = JSON.stringify(modules.progress(id));
const beforeList = modules.list().installed.find((item) => item.id === id);

copyTree(legacy, badSame);
const badManifest = JSON.parse(fs.readFileSync(path.join(badSame, "academy-module.json"), "utf8"));
badManifest.description += " anderer Inhalt";
fs.writeFileSync(path.join(badSame, "academy-module.json"), JSON.stringify(badManifest));
let sameVersionCode = null;
try { modules.installFromDirectory(badSame); } catch (error) { sameVersionCode = error.code; }

copyTree(legacy, broken);
const brokenManifest = JSON.parse(fs.readFileSync(path.join(broken, "academy-module.json"), "utf8"));
brokenManifest.version = "1.0.4";
delete brokenManifest.runtime.themeContract;
fs.writeFileSync(path.join(broken, "academy-module.json"), JSON.stringify(brokenManifest));
let incompatibleCode = null;
try { modules.installFromDirectory(broken); } catch (error) { incompatibleCode = error.code; }

const afterFail = {
  version: modules.list().installed.find((item) => item.id === id).version,
  marker: hashFile(path.join(modules.installPath(id), markerRel)),
  progress: JSON.stringify(modules.progress(id)),
  path: modules.installPath(id)
};

const bundled = resolveBundledPackage(catalogFile, id);
const bundledManifest = JSON.parse(fs.readFileSync(path.join(bundled.dir, "academy-module.json"), "utf8"));
const updated = modules.installFromDirectory(bundled.dir);
const after = modules.list().installed.find((item) => item.id === id);
const installedMarker = fs.readFileSync(path.join(modules.installPath(id), markerRel), "utf8");
const profileAfter = fs.statSync(profileMarker);
const verifiedAfter = fs.statSync(verifiedManifest);

const report = {
  source: "extracted-installer",
  catalogFile,
  bundledDir: bundled.dir,
  core: CORE_VERSION,
  temp: parent,
  profileUntouched: profileBefore.mtimeMs === profileAfter.mtimeMs && profileBefore.size === profileAfter.size && verifiedBefore.mtimeMs === verifiedAfter.mtimeMs && verifiedBefore.size === verifiedAfter.size,
  seedVersion: seedRow.version,
  bundledVersion: bundledManifest.version,
  bundledContract: bundledManifest.runtime && bundledManifest.runtime.themeContract,
  before: {
    version: beforeList.version,
    compatible: beforeList.compatible,
    compatibilityReason: beforeList.compatibilityReason,
    updateAvailable: beforeList.updateAvailable,
    availableVersion: beforeList.availableVersion,
    canUpdate: beforeList.canUpdate
  },
  failures: {
    sameVersionCode,
    incompatibleCode,
    version: afterFail.version,
    markerUnchanged: afterFail.marker === beforeMarker,
    progressUnchanged: afterFail.progress === beforeProgress,
    pathUnchanged: afterFail.path === beforePath
  },
  after: {
    version: updated.version,
    listed: after.version,
    compatible: after.compatible,
    themeContract: after.themeContract,
    progressKept: JSON.stringify(modules.progress(id)) === beforeProgress,
    completed: modules.progress(id).tasks["lf3-dhcp"].status,
    started: modules.progress(id).tasks["lf3-skizze"].status,
    adoptsAcademyTheme: installedMarker.includes("data-academy-theme")
  }
};

fs.writeFileSync(path.join(__dirname, "probe-upgrade.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
const ok = report.profileUntouched
  && report.bundledVersion === "1.0.3"
  && report.bundledContract === 1
  && report.before.compatible === false
  && report.before.canUpdate === true
  && report.before.availableVersion === "1.0.3"
  && report.failures.sameVersionCode === "same-version-different-content"
  && report.failures.incompatibleCode === "incompatible-theme"
  && report.failures.markerUnchanged
  && report.failures.progressUnchanged
  && report.failures.version === "1.0.2"
  && report.after.version === "1.0.3"
  && report.after.compatible === true
  && report.after.progressKept
  && report.after.completed === "abgeschlossen"
  && report.after.started === "begonnen"
  && report.after.adoptsAcademyTheme;
modules.close();
if (!ok) process.exit(1);
