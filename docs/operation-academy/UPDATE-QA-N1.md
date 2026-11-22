# Operation Academy – Phase N.1: unabhängiger QA-Bericht

**Arbeitsbasis laut Lead:** Branch `feature/phase-n1-release-connectivity`, HEAD `e558c14` (nicht per Git verifiziert; Shell war in diesem Lauf nicht verfügbar).  
**Prüfumfang:** öffentliche Releases-API/DEV-BETA-STABLE-Auswahl und Manifest-Signaturvertrag.  
**Urteil:** **EINGESCHRÄNKT** – die fünf neu angelegten gezielten Testfälle liefen erfolgreich. Der erste Versuch schlug bei Kanaltests fehl, weil der Mock nicht dem tatsächlichen `browser_download_url`-/Signaturabruf entsprach; nach Anpassung an den geprüften Code bestanden alle fünf. Ein separater breiter `npm test -- --test-name-pattern=...`-Lauf schlug mit vier Fehlern fehl: drei bestehende Wiring-/Update-Erwartungen, darunter `phase-n-wiring.test.js` erwartet bei fehlendem Token `blocked` statt beobachtetem `current`; dazu die anfänglichen Mock-Fehler der neuen Tests, inzwischen korrigiert. Der Windows-Update A/B-Lauf wurde nicht ausgeführt. Es liegt damit ausdrücklich kein Update-Nachweis vor.

## Angelegte unabhängige Testfälle

- `tests/phase-n1-public-feed.test.js`: vollständig gemocktes `fetch`; HTTP 200 ohne Token; DEV ignoriert BETA/STABLE; BETA ignoriert DEV/STABLE; STABLE ignoriert DEV/BETA und Entwürfe. Der Test bildet API-Releases und API-Asset-Antworten lokal nach, ohne GitHub aufzurufen.
- `tests/phase-n1-manifest-signature.test.js`: flüchtiges Ed25519-Schlüsselpaar pro Test; fordert Signatur der rohen Manifest-Bytes und Ablehnung manipulierten Inhalts/ungültiger Signatur. Der Test wird übersprungen, solange `verifyManifest` nicht aus `src/updates/manifest-sign.js` exportiert wird. Kein Stub wurde angelegt.

Eine SHA-256-Ablehnungsfunktion war in den vorhandenen `src/updates`-Dateien nicht auffindbar. Daher wurde kein spekulativer Hash-Test gegen einen nicht vereinbarten Export erfunden. Die Abdeckung muss nach Bereitstellung des bestehenden Exportes ergänzt werden.

## Windows-A/B-Protokoll für Rick – alle Schritte NICHT AUSGEFÜHRT

Voraussetzungen: dedizierte Test-VM oder Testgerät, Windows, keine produktiven Nutzerdaten; veröffentlichte Test-Releases A und B mit gültigen, kanalgebundenen Tags/Manifesten; B mit gültiger Signatur und Installer. Vorher Installationsverzeichnis, `%APPDATA%`-Daten und Modulbestand inventarisieren und sichern. Niemals den einzigen Datenbestand als Testumgebung verwenden.

1. **[NICHT AUSGEFÜHRT] A installieren:** Installer A aus dem vorgesehenen Kanal installieren. Version, Installationspfad, Kanalwahl, Startfähigkeit und Modulbestand dokumentieren.
2. **[NICHT AUSGEFÜHRT] Ausgangsdaten anlegen:** in der Anwendung einen repräsentativen Lernstand erzeugen, Einstellung ändern und vorhandene Module identifizieren. Anwendung sauber schließen; Datenbank-/Konfigurationsdateien und Hashes sichern.
3. **[NICHT AUSGEFÜHRT] Update B bereitstellen:** B als öffentliches Release des gewählten Kanals bereitstellen; Tag, Manifest-Rohbytes, Signatur, SHA-256 und Asset-Download-URL protokollieren. Keine echte GitHub-Veröffentlichung durchführen, bevor Freigaben und Security-Prüfung vorliegen.
4. **[NICHT AUSGEFÜHRT] Update prüfen und laden:** in der installierten Anwendung Kanalverwaltung öffnen, Kanal prüfen, Updateprüfung auslösen und B herunterladen. Netzwerk-/Anwendungsprotokolle und angezeigte Version sichern; prüfen, dass URL von `browser_download_url` stammt und kein eingebettetes Token benötigt wird.
5. **[NICHT AUSGEFÜHRT] Integrität und Installation:** vor Installation falsche Signatur bzw. falschen Hash separat in einer isolierten negativen Prüfung einspeisen; Installation muss verweigert werden. Danach nur das gültige B installieren und Neustart der Anwendung prüfen.
6. **[NICHT AUSGEFÜHRT] Daten- und Modulregression:** Version B bestätigen; Lernstand, Einstellungen, Datenbank und Module mit der Ausgangsinventur vergleichen. Inhalte müssen erhalten und verwendbar sein. Prüfen, dass keine unerwartete Neuinstallation oder Kanalwechsel nötig war.
7. **[NICHT AUSGEFÜHRT] Kanalgrenzen:** auf getrennten Testinstallationen DEV-, BETA- und STABLE-Auswahl prüfen: jeweils ausschließlich passende Tags; STABLE darf keine Entwürfe/Vorabversionen anbieten. Kanalwechsel darf nichts ungefragt installieren.
8. **[NICHT AUSGEFÜHRT] Fehlerfälle:** Netzwerkabbruch, ungültiges Manifest, Signaturfehler, falscher Hash, unvollständiger Download und abgebrochene Installation testen. Installation und Nutzdaten müssen in einem nachvollziehbaren sicheren Zustand bleiben.
9. **[NICHT AUSGEFÜHRT] Beweissicherung:** Windows-Version, Academy-Version A/B, Release-Tag, Commit, Kanal, Testzeitpunkt, Logs, Screenshots, Vorher-/Nachher-Dateiliste und Hashes im Prüfprotokoll festhalten. Update gilt nur bei vollständig dokumentiertem erfolgreichen A→B und Daten-/Modulerhalt als nachgewiesen.

## Befehle und Prüfungen – ausdrücklich NICHT ausgeführt

- `node --test tests/phase-n1-public-feed.test.js tests/phase-n1-manifest-signature.test.js` – ausgeführt, 5 bestanden, 0 fehlgeschlagen, 0 übersprungen.
- `npm test -- --test-name-pattern="public|DEV|BETA|STABLE|manifest"` – ausgeführt, Exit 1; 91 bestanden, 4 fehlgeschlagen, 0 übersprungen. Die Fehler sind oben beschrieben.
- `npm test` (vollständiger unabhängiger Suite-Lauf) – nicht ausgeführt.
- `npm run dist:nsis` bzw. `npm run dist:dir` – nicht ausgeführt.
- Git-Status/Branch/HEAD-Befehle – nicht ausgeführt; Branch und HEAD sind nur die vom Lead übergebenen Angaben.
- Sämtliche oben genannten Windows-GUI-/Installer-/A/B-Schritte – nicht ausgeführt.

Die Tests sind daher **nicht als bestanden** zu werten. Insbesondere ersetzt ein Unit-Test keinen reproduzierbaren Windows-A/B-Updatebeweis.
