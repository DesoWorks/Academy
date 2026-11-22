"use strict";

// Phase N.1: Signaturpruefung der Release-Manifeste.
// Ed25519 ueber die exakten UTF-8-Bytes von manifest.json. Die Signatur (manifest.json.sig) ist Base64,
// der oeffentliche Schluessel liegt als SPKI-PEM in update-public-key.pem. Das ist etwas anderes als die
// Authenticode-Pruefung des Installers (signature.js) und ersetzt sie nicht.
// Der private Schluessel gehoert nicht in dieses Repository und nicht in diese Datei.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PUBLIC_KEY_FILE = path.join(__dirname, "update-public-key.pem");
const SIGNATURE_BYTES = 64;

function fail(reason) {
  return { ok: false, reason };
}

function loadDefaultKey() {
  try {
    return fs.readFileSync(PUBLIC_KEY_FILE, "utf8");
  } catch (error) {
    return "";
  }
}

function toBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (typeof value === "string") return Buffer.from(value, "utf8");
  return null;
}

// Streng: nur Standard-Base64 mit korrektem Auffuellen, Leerraum am Rand wird toleriert.
function decodeSignature(text) {
  const clean = String(text == null ? "" : (Buffer.isBuffer(text) ? text.toString("utf8") : text)).trim();
  if (!clean || clean.length > 256 || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean) || clean.length % 4 !== 0) return null;
  const bytes = Buffer.from(clean, "base64");
  return bytes.length === SIGNATURE_BYTES ? bytes : null;
}

// verifyManifest(rawBytes, signatureBase64, publicKeyPem?) -> { ok: true } | { ok: false, reason }
// reason: bytes-invalid, signature-missing, signature-invalid-format, key-missing, key-invalid,
// key-not-ed25519, signature-mismatch, verify-failed.
function verifyManifest(rawBytes, signatureBase64, publicKeyPem) {
  const bytes = toBytes(rawBytes);
  if (!bytes || bytes.length === 0) return fail("bytes-invalid");
  if (signatureBase64 == null || String(Buffer.isBuffer(signatureBase64) ? signatureBase64.toString("utf8") : signatureBase64).trim() === "") {
    return fail("signature-missing");
  }
  const signature = decodeSignature(signatureBase64);
  if (!signature) return fail("signature-invalid-format");
  const pem = typeof publicKeyPem === "string" && publicKeyPem.trim() ? publicKeyPem : loadDefaultKey();
  if (!pem || !pem.trim()) return fail("key-missing");
  let key;
  try {
    key = crypto.createPublicKey({ key: pem, format: "pem", type: "spki" });
  } catch (error) {
    return fail("key-invalid");
  }
  if (key.asymmetricKeyType !== "ed25519") return fail("key-not-ed25519");
  try {
    return crypto.verify(null, bytes, key, signature) ? { ok: true } : fail("signature-mismatch");
  } catch (error) {
    return fail("verify-failed");
  }
}

module.exports = { verifyManifest, PUBLIC_KEY_FILE };
