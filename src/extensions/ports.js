"use strict";

const PORTS = {
  tutor: {
    id: "tutor",
    status: "prepared",
    enabled: false,
    providers: [],
    contract: [
      "Der Kontextbuilder liegt in modules/tutor.js und schickt weder Lernstände noch Lösungen.",
      "Kein Provider und kein lokales Modell wird in Phase H aufgerufen.",
      "Lernfortschritt verlässt das Gerät nicht ohne ausdrückliche spätere Zustimmung.",
      "Der Hilfslehrer darf Lösungen nicht ungefragt vorwegnehmen.",
      "Fachfragen, Erklärungen und schrittweise Hilfe sind spätere Fähigkeiten dieser Schnittstelle, nicht dieser Version."
    ]
  },
  ide: {
    id: "ide",
    status: "prepared",
    enabled: false,
    editorCandidate: "monaco",
    execution: "isolated-worker-only",
    contract: [
      "Monaco ist nur ein Kandidat. Er ist nicht eingebunden.",
      "Azubi-Code wird nicht im Electron-Hauptprozess ausgeführt.",
      "Eine spätere Ausführung braucht einen isolierten Worker ohne die Rechte des Hauptprozesses."
    ]
  }
};

function listPorts() {
  return Object.values(PORTS).map((port) => Object.assign({}, port));
}

module.exports = { PORTS, listPorts };
