# Design Harmony 3B – Implementierung (Jarvis)

Stand: 22.11.2026. Lokal umgesetzt, nicht committet, nicht gepusht, kein Release. Das Benutzerprofil `C:\Users\Denni\AppData\Roaming\DesoWorks\Academy` wurde weder gelesen noch beschrieben. Alle Tests laufen in temporären Verzeichnissen.

## Geänderte Dateien (von mir in Etappe 3B)

| Datei | Änderung |
| --- | --- |
| `modules/it-systemintegration/academy-module.json` | `version` 1.0.1 auf 1.0.3. `themeContract` 1 unverändert. `sizeBytes` unverändert (62017): Sie summiert nur die zwei gelisteten Dateien, und die wurden nicht angefasst. `readPackage` bestätigt 62017 gemessen gleich 62017 deklariert. |
| `src/modules/manager.js` | Same-Version-Sperre, Updateerkennung, Fehlerhinweis (Details unten). |
| `src/main.js` | Eine `catalogFile`-Konstante (gepackt: `resources/academy-catalog/official.json`, sonst `catalogPath(src/renderer)`), an Modulmanager und IPC übergeben. Der zuvor in `registerIpc` stehende Ausdruck ergibt denselben Pfad. |
| `src/renderer/shell.js` | `statusReason` mit den Zustandssätzen, `moduleCard` mit Aktualisieren-Aktion. |
| `tests/design-harmony-3-theme-contract.test.js` | Erwartete Version 1.0.1 auf 1.0.3 (Titel und Assertion). Sonst unverändert. |
| `tests/design-harmony-3b-update.test.js` | Neu: 7 Regressionstests. |
| `docs/operation-academy/DESIGN-HARMONY-3B-IMPLEMENTIERUNG.md` | Dieses Dokument. |

Im Git-Status stehen weitere geänderte Dateien (`spec.js`, `design-tokens.css`, `module.js`, `design-harmony-2b-theme.test.js`, `hosted-module.test.js`). Sie stammen aus früheren Etappen. Ich habe sie nicht angefasst.

## manager.js im Einzelnen

**Same-Version-Sperre** (`installFromDirectory`): Sie sitzt hinter `verifyTrust`, `publisher-mismatch`, `trust-mismatch` und der Downgrade-Sperre, also ohne Lockerung dieser Prüfungen, und vor `fs.rmSync(incoming)`, `mkdirSync`, `copyFileSync` und `fs.rmSync(dest)`. Bedingung: `existing` vorhanden, `existing.state !== "uninstalled"`, `compare(neu, installiert) === 0`.

- Verglichen werden `fileHashes`, `payloadHashes` und zusätzlich die Manifest-Identität (Manifest ohne die beim Installieren abgeleiteten Felder). Letzteres ist strenger als beauftragt. Grund: Sonst könnte der Reparaturweg bei gleichen Dateien ein verändertes Manifest (zum Beispiel erweiterte Rechte) unter gleicher Versionsnummer einschleusen.
- Abweichung: `ModuleError` mit Code `same-version-different-content`. Nichts wird gelöscht, nichts in `module_install` oder `module_kv` geschrieben.
- Identisch und `active` oder `disabled`: bestehende `publicRow` zurück, keine Datei ersetzt.
- Identisch und `faulted`: bisheriger Kopierweg als Reparatur.
- `uninstalled`: bisheriger Neuinstallationsweg.

**Updateerkennung** (`list()`): Nur mit `options.catalogFile`. Der vorhandene `resolveBundledPackage` liefert das Paketverzeichnis, gelesen wird nur das Manifest (validiert). Ein Update gilt, wenn ID, Herausgeber und Vertrauensstufe passen, die Version größer ist und `compatibilityOf` kompatibel meldet. Dann `updateAvailable: true`, `availableVersion`, `canUpdate: true`. Sonst `false`, `null`, `false`. Ohne `catalogFile` bleiben `availableVersion` und `updateAvailable` `null` (der alte Test bleibt gültig). Es gibt keinen zweiten Feed.

Abweichung vom Wortlaut: Beauftragt war "hosted-web mit themeContract 1". Ich prüfe stattdessen `compatibilityOf`. Für hosted-web ist das identisch (verlangt Vertrag 1), zusätzlich werden Core-Version und Nicht-Web-Module abgedeckt.

**Fehlerhinweis** (`lastUpdateError`): `installFromDirectory` ist mit einem Wrapper versehen. Schlägt ein Versuch für ein bereits installiertes Modul fehl, wird in `module_notice` (Level `warn`) die Meldung mit dem Präfix "Aktualisierung fehlgeschlagen: " abgelegt und der Fehler unverändert weitergeworfen. `list()` liefert `lastUpdateError` nur, wenn die jüngste Meldung dieses Moduls so ein Präfix trägt. Eine spätere erfolgreiche Installation überschreibt sie. Der Installationszustand ändert sich nie.

Lücke gegenüber dem Auftrag: Beauftragt war "letzte Meldung mit level warn oder fault". Das reicht nicht, denn eine ordinäre Warnung wie "Modul ohne Signatur installiert" (jedes private Paket) würde sonst als Update-Fehler erscheinen. Fault-Meldungen gehören zum Zustand `faulted` und erscheinen dort über `faultReason`. Deshalb das Präfix. `notices()` selbst liefert keine Zuordnung von Fehlern zu Updates, deshalb der Wrapper.

## shell.js: Sätze

Reihenfolge in `statusReason`:

1. `lastUpdateError` gesetzt: "Aktualisierung fehlgeschlagen: <Fehler>"
2. nicht kompatibel, `updateAvailable === true`: "Inkompatibel, Aktualisierung erforderlich: <Grund>"
3. nicht kompatibel, `updateAvailable === false`: "Keine Aktualisierung verfügbar: <Grund>"
4. nicht kompatibel, `updateAvailable` ungeprüft (`null`): bisheriger Satz "Inkompatibel: <Grund>"
5. `disabled` und `faulted`: bisherige Sätze
6. `active`: "Aktualisierung verfügbar" bei `updateAvailable === true`, sonst "Kompatibel und startbereit"

`canOpen` unverändert (kompatibel und aktiv). Die Karte zeigt "Aktualisieren" nur bei `entry.canUpdate === true`, ruft `api.moduleInstallCatalog(entry.id)` (mit dem bestehenden Bestätigungsdialog), zeigt Rückmeldung in einem `role="status"`-Absatz und lädt bei Erfolg die Ansicht neu. Natives `button`, also Tastatur und Fokus ohne Zusatzcode.

Offen: Die Seite "Meine Lernbereiche" (`module.js`) baut ihre Zeile selbst und nutzt nur `statusReason`. Dort erscheinen die neuen Sätze, aber keine Aktualisieren-Schaltfläche. Auf der Startseite (`home.js` über `moduleCard`) erscheint sie.

## Prüfungen (tatsächlich ausgeführt)

Der Auftrag nannte keine Shell, `shell_exec` stand mir aber zur Verfügung und wurde genutzt.

| Befehl | Ergebnis |
| --- | --- |
| `node --check` auf `manager.js`, `main.js`, `shell.js` | bestanden |
| `readPackage("modules/it-systemintegration")` | Version 1.0.3, themeContract 1, 2 Dateien, 249 Nutzlastdateien, Größe 62017 gleich deklariert 62017 |
| `node --test tests\design-harmony-3b-update.test.js` | 7 von 7 bestanden |
| `npm test` (`node --test tests/*.test.js`) | 177 von 177 bestanden, 0 Fehler |

Die 7 neuen Tests decken ab: abweichender Inhalt bei gleicher Version (Dateien, Lernstand, Zustand unverändert, `.incoming` nicht angelegt, Hinweis sichtbar, später gelöscht); identisches Paket ersetzt nichts (mtime unverändert); Reparatur eines gestörten Moduls; Neuinstallation nach Deinstallation; Katalog meldet Update, danach nicht mehr; ohne Katalog `null`; fehlende Katalogdatei `false`; inkompatibles Altmodul mit kompatiblem Update; inkompatibles neues Paket wird nicht angeboten.

## Nicht ausgeführt, noch ungeprüft

- Kein Lauf im echten Academy-iframe, keine Sichtprüfung von Hell, Dunkel, Kontrast (GLaDOS).
- Die Renderer-Logik (`shell.js`, Aktualisieren-Knopf, Neuladen nach Erfolg) ist nur syntaktisch geprüft und durch bestehende statische Tests nicht berührt. Ein Klick-Test in der laufenden Anwendung steht aus.
- Der Bestätigungsdialog von `moduleInstallCatalog` und der gepackte Pfad (`resources/academy-catalog`) wurden nicht in einem Paketbuild geprüft.
- Kein Paket-/Signatur-Build, keine Installation auf dem Rechner des Commanders.
- Das installierte 1.0.2-Paket im Commander-Profil wurde absichtlich nicht angesehen. Das Verhalten gegen ein echtes Altprofil muss die Updateprobe mit temporärem Profil zeigen.

## Git

Nichts committet, nichts gepusht. Änderungen liegen unstaged im Arbeitsbaum (`git status --short` geprüft).
