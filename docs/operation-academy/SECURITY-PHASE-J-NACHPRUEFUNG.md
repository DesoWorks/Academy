# Nachprüfung F1

**Stand:** 2026-11-21, nach `SECURITY-PHASE-J.md`.

RoboCop-Befund F1: Ein Ordner außerhalb der Anwendung konnte sich im Manifest als `publisher.desoworks` ausgeben und die Web-Laufzeit bekommen.

Änderung: `installFromDirectory` lässt `hosted-web` nur zu, wenn der reale Paketpfad in `hostedWebRoots` liegt. Die Anwendung setzt diesen Ordner auf `modules/` bzw. im Paket auf `academy-modules`. Ein Dialogordner außerhalb davon wird mit `runtime-denied` abgewiesen und nicht kopiert.

Nachweis: `npm test`, 57 bestanden, 0 fehlgeschlagen. Neuer Test: `hosted web from outside the bundled modules directory is refused`.

Nicht erneut durch RoboCop geprüft. F2 bis F6 bleiben wie in seinem Bericht.
