"use strict";

const crypto = require("node:crypto");

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stable(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function payloadFor(manifest, fileHashes) {
  const body = Object.assign({}, manifest);
  delete body.signature;
  return Buffer.from(JSON.stringify(stable({ manifest: body, files: fileHashes })));
}

function signPackage(manifest, fileHashes, privateKey) {
  return crypto.sign(null, payloadFor(manifest, fileHashes), privateKey).toString("base64");
}

function verifyPackage(manifest, fileHashes, publicKey) {
  const signature = manifest && manifest.signature;
  if (!signature || signature.algorithm !== "ed25519" || typeof signature.value !== "string") return false;
  if (signature.publicKey && signature.publicKey !== publicKey) return false;
  try {
    return crypto.verify(null, payloadFor(manifest, fileHashes), publicKey, Buffer.from(signature.value, "base64"));
  } catch (error) {
    return false;
  }
}

function generateKeyPair() {
  const pair = crypto.generateKeyPairSync("ed25519");
  return {
    publicKey: pair.publicKey.export({ type: "spki", format: "pem" }),
    privateKey: pair.privateKey.export({ type: "pkcs8", format: "pem" })
  };
}

module.exports = { stable, payloadFor, signPackage, verifyPackage, generateKeyPair };
