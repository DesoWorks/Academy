"use strict";

// Phase N: erzeugt Pruefsumme, manifest.json und manifest.json.sig fuer ein Core-Release.
// Der Signaturschluessel kommt ausschliesslich aus der Umgebungsvariable ACADEMY_MANIFEST_SIGNING_KEY
// (PEM, Ed25519). Er wird weder gelesen noch geschrieben, wenn er fehlt: dann bricht das Skript ab.
// Aufruf: node scripts/make-release-manifest.js channel=dev version=0.4.0-dev.1 tag=dev/v0.4.0-dev.1
//         branch=dev commit=<sha> installer=dist/<datei>.exe out=dist/release signature=unsigned

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { parseReleaseTag, CHANNELS } = require("../src/updates/channels");

function args() {
  const result = {};
  for (const item of process.argv.slice(2)) {
    const index = item.indexOf("=");
    if (index > 0) result[item.slice(0, index)] = item.slice(index + 1);
  }
  return result;
}

function fail(message) {
  process.stderr.write(`Manifest abgebrochen: ${message}\n`);
  process.exit(1);
}

const input = args();
const parsed = parseReleaseTag(input.tag);
if (!parsed || parsed.module) fail("Der Tag ist kein gueltiger Core-Kanaltag.");
if (parsed.channel !== input.channel) fail("Tag und Kanal widersprechen sich.");
if (parsed.version !== input.version) fail("Tag und Version widersprechen sich.");
if (CHANNELS[parsed.channel].branch !== input.branch) fail("Der Quellbranch passt nicht zum Kanal.");
if (!/^[0-9a-f]{40}$/.test(String(input.commit || ""))) fail("Es fehlt eine vollstaendige Commit-ID.");
if (!["signed", "unsigned"].includes(input.signature)) fail("signature muss signed oder unsigned sein.");
if (!input.installer || !fs.existsSync(input.installer)) fail("Der Installer fehlt.");
const key = process.env.ACADEMY_MANIFEST_SIGNING_KEY;
if (!key) fail("Der Manifest-Signaturschluessel fehlt. Es wird nichts veroeffentlicht.");

const out = path.resolve(input.out || "dist/release");
fs.mkdirSync(out, { recursive: true });
const installerName = path.basename(input.installer);
const bytes = fs.readFileSync(input.installer);
const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

const manifest = {
  schemaVersion: 1,
  product: "desoworks-academy",
  channel: parsed.channel,
  sourceBranch: input.branch,
  releaseTag: input.tag,
  version: parsed.version,
  commit: input.commit,
  publishedAt: new Date().toISOString(),
  package: { kind: "core", name: installerName, size: bytes.length },
  sha256,
  signatureStatus: input.signature,
  minimumCore: null,
  platform: "win32-x64"
};

const manifestBytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8");
let signature;
try {
  signature = crypto.sign(null, manifestBytes, crypto.createPrivateKey(key));
} catch (error) {
  fail("Der Signaturschluessel ist nicht lesbar.");
}

fs.copyFileSync(input.installer, path.join(out, installerName));
fs.writeFileSync(path.join(out, `${installerName}.sha256`), `${sha256}  ${installerName}\n`);
fs.writeFileSync(path.join(out, "manifest.json"), manifestBytes);
fs.writeFileSync(path.join(out, "manifest.json.sig"), signature.toString("base64") + "\n");
process.stdout.write(`Manifest geschrieben: ${installerName}, sha256 ${sha256}\n`);
