"use strict";

const MESSAGES = {
  devChannel: "Dies ist ein Entwicklungsbuild. Produktive Updates werden nicht heruntergeladen und nicht installiert.",
  noFeed: "Für diesen Build ist keine Updatequelle konfiguriert. Die Anwendung bleibt unverändert.",
  upToDate: "Die installierte Version ist aktuell.",
  available: "Eine neuere Version ist verfügbar. Es wird noch nichts installiert.",
  checkFailed: "Die Updateprüfung ist fehlgeschlagen. Die Anwendung und die Lernfortschritte bleiben unverändert. Die Prüfung kann wiederholt werden.",
  downloadFailed: "Der Download ist fehlgeschlagen. Es wurde nichts installiert. Die Lernfortschritte sind unberührt.",
  interrupted: "Ein früherer Download wurde unterbrochen. Die unvollständige Datei wurde verworfen. Lernfortschritte wurden nicht angetastet.",
  installInterrupted: "Eine frühere Installation wurde nicht abgeschlossen. Die Lerndaten sind weiterhin im Datenverzeichnis. Die Prüfung kann wiederholt werden.",
  hashMissing: "Für diese Version liegt keine Prüfsumme vor. Ohne Integritätsprüfung wird nichts installiert.",
  hashMismatch: "Die Integritätsprüfung ist fehlgeschlagen. Die Datei wurde verworfen und nicht installiert.",
  hostRejected: "Die Updatequelle ist nicht freigegeben. Es wurde nichts heruntergeladen.",
  ready: "Das Update ist geprüft und bereit. Die Installation startet erst nach Bestätigung und beendet dafür die laufende Anwendung.",
  running: "Die Anwendung läuft noch. Zuerst wird die Datenbank gesichert, danach beendet sich das Programm und startet die Installation.",
  stableOnly: "Nur ein ausdrücklich gebauter Stable-Release darf Updates installieren.",
  metadataInvalid: "Die Update-Metadaten sind ungültig. Es wurde nichts heruntergeladen und nichts installiert.",
  repoRejected: "Die Updatequelle gehört nicht zum festgelegten DesoWorks-Repository. Es wurde nichts heruntergeladen.",
  aborted: "Der Download wurde abgebrochen. Die unvollständige Datei wurde verworfen. Lernfortschritte wurden nicht angetastet."
};

module.exports = { MESSAGES };
