"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Prueft das entpackte Modulpaket gegen die Angaben des geprueften Updates.
// Wirft bei Abweichung; der Aufrufer loescht das Verzeichnis und installiert nicht.
function assertManifestMatches(dir, prepared) {
  const file = path.join(dir, "academy-module.json");
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    const failure = new Error("Das Modulpaket enthaelt keine lesbare academy-module.json. Es wurde nichts installiert.");
    failure.code = "manifest-missing";
    throw failure;
  }
  if (!manifest || manifest.id !== prepared.id || manifest.version !== prepared.version) {
    const failure = new Error("Die academy-module.json im Paket passt nicht zum geprueften Update (id/version). Es wurde nichts installiert.");
    failure.code = "manifest-mismatch";
    throw failure;
  }
  return manifest;
}

module.exports = { assertManifestMatches };
