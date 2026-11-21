"use strict";

const { isSafeVersion, parse, compare } = require("../updates/semver");
const { ModuleError } = require("./errors");

const FORMAT = "desoworks.academy.module";
const FORMAT_VERSION = 1;
const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+){1,12}$/;
const TRUST = ["private", "community", "reviewed", "official"];
const TRUST_RANK = { private: 1, community: 2, reviewed: 3, official: 4 };
const ALLOWED_EXTENSIONS = new Set([".json", ".md", ".png", ".svg", ".txt"]);
const SIGNED_TRUST = new Set(["reviewed", "official"]);

const PERMISSIONS = {
  "content.read": { minTrust: "private", granted: true },
  "progress.write": { minTrust: "private", granted: true },
  "tutor.context": { minTrust: "private", granted: true },
  "notifications.show": { minTrust: "private", granted: true },
  "media.read": { minTrust: "private", granted: true },
  "ide.workspace": { minTrust: "official", granted: false },
  network: { minTrust: "official", granted: false },
  script: { minTrust: "official", granted: false }
};

const FORBIDDEN_PERMISSIONS = ["shell", "filesystem", "node", "core-admin", "native", "process"];

const REQUIRED_FIELDS = [
  "format",
  "formatVersion",
  "id",
  "name",
  "description",
  "publisher",
  "version",
  "license",
  "language",
  "core",
  "dependencies",
  "permissions",
  "sizeBytes",
  "subject",
  "audience",
  "status",
  "review",
  "trust",
  "entry",
  "files"
];

function fail(code, message, details) {
  throw new ModuleError(code, message, details);
}

function satisfies(version, range) {
  const raw = String(range || "").trim();
  if (isSafeVersion(raw)) return compare(version, raw) === 0;
  const caret = raw.match(/^\^(\d+\.\d+\.\d+)$/);
  if (caret) {
    const major = parse(caret[1]).parts[0] + 1;
    return compare(version, caret[1]) >= 0 && compare(version, major + ".0.0") < 0;
  }
  const span = raw.match(/^>=(\d+\.\d+\.\d+) <(\d+\.\d+\.\d+)$/);
  if (!span) return false;
  return compare(version, span[1]) >= 0 && compare(version, span[2]) < 0;
}

function assertRelativeFile(file) {
  const value = String(file || "");
  if (!value || value.length > 180 || value.includes("\0") || value.includes("\\")) {
    fail("bad-file", "Ein Modulpfad ist ungültig.", { file });
  }
  if (value.startsWith("/") || /^[a-zA-Z]:/.test(value) || value.split("/").includes("..") || value.split("/").includes(".")) {
    fail("bad-file", "Ein Modulpfad verlässt das Paket.", { file });
  }
  const extension = value.slice(value.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    fail("bad-file", "Dieser Dateityp darf in einem Modulpaket nicht liegen. Skripte werden nicht übernommen.", { file });
  }
  return value;
}

function validateManifest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    fail("invalid-manifest", "Das Modulmanifest ist keine JSON-Datei.");
  }
  for (const field of REQUIRED_FIELDS) {
    if (raw[field] == null || raw[field] === "") {
      fail("invalid-manifest", "Pflichtfeld fehlt: " + field, { field });
    }
  }
  if (raw.format !== FORMAT || Number(raw.formatVersion) !== FORMAT_VERSION) {
    fail("invalid-manifest", "Das Manifestformat wird von diesem Core nicht gelesen.");
  }
  if (!ID_PATTERN.test(raw.id) || raw.id.length > 80) {
    fail("invalid-manifest", "Die Modul-ID ist ungültig.");
  }
  if (!isSafeVersion(raw.version)) fail("invalid-manifest", "Die Modulversion ist kein gültiges Versionspaar.");
  if (!satisfies("0.0.0", raw.core) && !/^\^|>=/.test(String(raw.core))) {
    if (!satisfies("0.2.0", raw.core) && !isSafeVersion(String(raw.core).replace(/^[^\d]*/, ""))) {
      fail("invalid-manifest", "Die Core-Kompatibilität ist nicht lesbar.", { core: raw.core });
    }
  }
  if (!satisfies("0.2.0", raw.core) && !/^\^(\d+\.\d+\.\d+)$/.test(raw.core) && !/^>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+$/.test(raw.core) && !isSafeVersion(raw.core)) {
    fail("invalid-manifest", "Die Core-Kompatibilität ist nicht lesbar.", { core: raw.core });
  }
  if (!TRUST.includes(raw.trust)) fail("invalid-manifest", "Der Vertrauensstatus ist unbekannt.");
  if (!raw.publisher || typeof raw.publisher.name !== "string" || typeof raw.publisher.id !== "string") {
    fail("invalid-manifest", "Herausgeber fehlt.");
  }
  if (!ID_PATTERN.test(raw.publisher.id)) fail("invalid-manifest", "Die Herausgeber-ID ist ungültig.");
  if (!Array.isArray(raw.dependencies) || !Array.isArray(raw.permissions) || !Array.isArray(raw.files)) {
    fail("invalid-manifest", "Abhängigkeiten, Rechte oder Dateiliste sind keine Listen.");
  }
  if (!Number.isInteger(raw.sizeBytes) || raw.sizeBytes < 0) {
    fail("invalid-manifest", "Die Installationsgröße ist ungültig.");
  }
  if (typeof raw.entry !== "string" || !raw.files.includes(raw.entry)) {
    fail("invalid-manifest", "Der Einstieg fehlt in der Dateiliste.");
  }
  if (typeof raw.language !== "string" || raw.language.length < 2 || raw.language.length > 12) {
    fail("invalid-manifest", "Die Sprache ist ungültig.");
  }
  for (const file of raw.files) assertRelativeFile(file);
  if (new Set(raw.files).size !== raw.files.length) fail("invalid-manifest", "Die Dateiliste enthält Doppelungen.");
  for (const permission of raw.permissions) {
    if (FORBIDDEN_PERMISSIONS.includes(permission)) {
      fail("permission-denied", "Dieses Recht ist für Module gesperrt.", { permission });
    }
    const rule = PERMISSIONS[permission];
    if (!rule) fail("permission-denied", "Unbekanntes Recht.", { permission });
    if (TRUST_RANK[raw.trust] < TRUST_RANK[rule.minTrust]) {
      fail("permission-denied", "Dieses Modul darf das Recht nicht verlangen.", { permission, trust: raw.trust });
    }
    if (!rule.granted) {
      fail("permission-unavailable", "Dieses Recht ist in Phase H vorbereitet, aber nicht freigegeben.", { permission });
    }
  }
  for (const dependency of raw.dependencies) {
    if (!dependency || !ID_PATTERN.test(dependency.id) || typeof dependency.core !== "undefined") {
      fail("invalid-manifest", "Eine Abhängigkeit ist ungültig.");
    }
    if (!dependency.version || (!isSafeVersion(dependency.version) && !/^\^|>=/.test(dependency.version))) {
      fail("invalid-manifest", "Eine Abhängigkeit hat keine lesbare Version.", { id: dependency.id });
    }
  }
  if (SIGNED_TRUST.has(raw.trust)) {
    const signature = raw.signature;
    if (!signature || signature.algorithm !== "ed25519" || typeof signature.publicKey !== "string" || typeof signature.value !== "string") {
      fail("signature-required", "Geprüfte und offizielle Module brauchen eine Ed25519-Signatur.");
    }
  }
  return raw;
}

function forkManifest(manifest, override) {
  const source = validateManifest(Object.assign({}, manifest, { trust: manifest.trust === "official" || manifest.trust === "reviewed" ? "private" : manifest.trust, signature: undefined, sizeBytes: manifest.sizeBytes || 0 }));
  const next = Object.assign({}, source);
  delete next.signature;
  next.id = override.id;
  next.version = override.version;
  next.publisher = override.publisher;
  next.trust = "private";
  next.status = "fork";
  next.review = { state: "private", signed: false };
  next.origin = {
    id: manifest.origin && manifest.origin.id ? manifest.origin.id : manifest.id,
    version: manifest.version,
    license: manifest.license,
    publisher: manifest.publisher
  };
  return next;
}

module.exports = {
  FORMAT,
  FORMAT_VERSION,
  TRUST,
  PERMISSIONS,
  FORBIDDEN_PERMISSIONS,
  ALLOWED_EXTENSIONS,
  satisfies,
  assertRelativeFile,
  validateManifest,
  forkManifest
};
