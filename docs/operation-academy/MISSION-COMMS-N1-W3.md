# OPERATION ACADEMY – PHASE N.1 / WELLE 3
## Missionsstatus zum Start

**Stand:** Welle 3 gestartet, nicht abgeschlossen. **Phase N.1 bleibt offen.** Keine Releasefreigabe.

### Geprüft

- Actions-Lauf [45012452830](https://github.com/DesoWorks/Academy/actions/runs/45012452830): Windows-Testjob fehlgeschlagen; vier Modultests melden „Eine Nutzlastdatei hat die falsche Größe“. Buildjob übersprungen, kein Build erzeugt. `.gitattributes` mit LF hatte den Fehler im vorherigen Lauf nicht behoben.
- Welle-2-Bericht dokumentiert, dass ein Installer derselben App-ID eine Phase-M-Installation trotz anderem Zielordner entfernte. Isolation paralleler Installationen ist damit nicht nachgewiesen; kein weiterer Installationstest, bis ein sicher isolierter Testweg belegt ist.
- Stable ist mangels Herausgeberzertifikat gesperrt.
- Öffentliche Historie enthält einen offenen Sicherheitsprüfpunkt zu Personenbezug. Hier werden keine personenbezogenen Inhalte übernommen.

### Blockaden und offene Punkte

- **Technisch:** Ursache der vier CI-Größenfehler, kleinster sachgerechter Fix und erfolgreicher Windows-CI-Lauf stehen aus. Ohne grünen Testlauf kein Actions-Build, kein signiertes Manifest und keine Actions-Artefakte.
- **Sicherheit:** Mittlere Befunde und der Personenbezug in der öffentlichen Historie müssen geprüft werden. Installer-Isolation muss vor einem Windows-Installationstest nachgewiesen sein.
- **Entscheidungen:** App-ID nicht ändern ohne begründeten Vorschlag und Commander-Freigabe. Stable bleibt gesperrt, bis ein Herausgeberzertifikat vorliegt. Kein Merge nach `main`; `main` bleibt auf `2e704e3`.

### Bereits festgelegter Rahmen

Der Feature-Branch `feature/phase-n1-release-connectivity` bleibt Arbeitsbasis. Nach Prüfung sind DEV-Push und DEV-Workflow erlaubt; daraus folgt keine Freigabe für Stable oder `main`. Bestehende Installationen und Lernstände müssen erhalten bleiben. Kein privater Schlüssel und keine vertraulichen personenbezogenen Inhalte in diesen Statusbericht aufnehmen.
