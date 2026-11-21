"use strict";

function prepareWorkspace(moduleId) {
  return {
    enabled: false,
    moduleId: moduleId || null,
    editorCandidate: "monaco",
    execution: "refused",
    reason: "Phase H bereitet die Werkstatt nur vor. Es wird kein Code ausgeführt, auch nicht im Hauptprozess."
  };
}

module.exports = { prepareWorkspace };
