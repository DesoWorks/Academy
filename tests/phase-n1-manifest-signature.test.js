"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");

// Contracted API under test: signature over the exact raw manifest bytes (not parsed/re-serialized JSON).
let verifyManifest;
try {
  ({ verifyManifest } = require("../src/updates/manifest-sign"));
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}

test("rejects a manifest without a valid Ed25519 signature over raw bytes", {
  skip: typeof verifyManifest !== "function" ? "contracted manifest-sign export is not present yet" : false
}, () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });
  const rawBytes = Buffer.from('{"product":"desoworks-academy","version":"0.4.0"}\n', "utf8");
  const validSignature = crypto.sign(null, rawBytes, privateKey).toString("base64");
  const tamperedBytes = Buffer.from('{"product":"desoworks-academy","version":"9.9.9"}\n', "utf8");

  const tampered = verifyManifest(tamperedBytes, validSignature, publicKeyPem);
  const malformed = verifyManifest(rawBytes, Buffer.from("invalid signature").toString("base64"), publicKeyPem);
  assert.equal(tampered.ok, false);
  assert.equal(malformed.ok, false);
});
