# Sicherheitsprüfung Operation ACADEMY Phase I

Prüfer: RoboCop (Security Officer)
Datum: 2026-11-21
Projekt: DesoWorks Academy, `D:\Desoworks\Workspace\Academy`
Prüfgegenstand: aktueller Arbeitsbaum, nicht nur Commit fc6ade42. `git status` zeigt 32 geänderte und 17 neue Pfade, also nicht eingecheckte Änderungen. Die Prüfung gilt für diesen Zustand, nicht für einen Commit.
Art der Prüfung: nur lesend am Produktcode. Einzige Ausführung: `npm test` (51 von 51 bestanden). Keine Angriffe, keine Portscans, keine Netzzugriffe, keine Änderungen an anderen Repositories.

Dieser Bericht ist keine Produktionsfreigabe. Die Freigabe liegt beim Commander.

## Kurzurteil

Der Core ist in den geprüften Punkten überwiegend sauber abgegrenzt. Ein Befund (MITTEL) betrifft die Publisher-Bindung nach Deinstallation und sollte vor einer Freigabe behoben werden. Er ist durch die bestehenden Tests nicht abgedeckt.

## Befunde (bestätigt, mit Fundstelle)

### F-1 MITTEL: Publisher-Bindung greift nach Deinstallation nicht

Fundstellen: `src/modules/manager.js`, Zeile 303 bis 315 (Prüfung), Zeile 378 bis 380 (Deinstallation), Zeile 336 bis 348 (Upsert).

Beobachtung:
- `uninstall()` setzt nur `state = 'uninstalled'` und löscht Dateien. Die Zeilen in `module_kv` (Lernstände) bleiben bewusst erhalten.
- `installFromDirectory()` prüft Herausgeber, Vertrauensstufe und Downgrade nur im Zweig `existing && existing.state !== "uninstalled"`. Bei einem deinstallierten Eintrag entfällt jede dieser Prüfungen.
- Der anschließende Upsert (`ON CONFLICT(id)`) überschreibt `manifest_json` und damit den bisherigen Herausgeber. Die Herkunft des alten Eintrags geht verloren.

Folge: Wer ein Paket mit derselben Modul-ID, aber anderer `publisher.id` installiert, nachdem das Original deinstalliert wurde, erbt die alten Lernstände (`module_kv`). Die Bindung leistet also nur bei einer Neuinstallation über einen aktiven, deaktivierten oder fehlerhaften Eintrag, nicht über den Deinstallationsweg. Das Ziel "fremder Herausgeber bekommt keine alten Lernstände derselben ID" wird nicht erreicht.

Nachweis aus den Tests: Der Test "fremde Herausgeber und reservierte IDs werden abgewiesen" und die Deinstallationstests (`tests/modules.test.js` Zeile 110 bis 113, 323, 332) decken den Ablauf Deinstallieren, dann fremder Herausgeber mit gleicher ID nicht ab. Eine Suche nach `uninstall` in `tests/` ergab keinen solchen Fall. Ich habe den Ablauf nicht ausgeführt; der Befund beruht auf dem Codeverlauf und ist am Quelltext nachvollziehbar.

Auswirkung (begrenzt): Modulpakete enthalten nur Daten (`.json`, `.md`, `.png`, `.svg`, `.txt`, keine Skripte). Das fremde Paket kann die Lernstände nicht auslesen oder versenden. Es entsteht aber eine falsche Zuordnung: alter Fortschritt erscheint im Kontext fremder Inhalte, und ein späterer Export (`exportModule`) würde ihn unter dem neuen Herausgeber ausgeben. Voraussetzung: Der Anwender bestätigt die Installation selbst im Dialog. Der Dialog nennt den Herausgeber, weist aber bei einer deinstallierten ID nicht auf vorhandene Altstände hin (`src/ipc.js` Zeile 279: "Neue Installation.", weil `replaces` bei `uninstalled` null ist).

Empfehlung:
1. Beim Deinstallieren den Herausgeber und die Vertrauensstufe dauerhaft binden, zum Beispiel Spalte `bound_publisher_id` in `module_install` oder eine eigene Tabelle. Der Upsert darf sie nicht überschreiben.
2. In `installFromDirectory` die Herausgeberprüfung für jeden vorhandenen Eintrag ausführen, auch bei `uninstalled`.
3. Bei abweichendem Herausgeber wahlweise ablehnen oder die alten Lernstände vorher ausdrücklich getrennt sichern und nicht zuordnen.
4. Den Installationsdialog bei vorhandenen Altständen darauf hinweisen lassen.
5. Regressionstest: installieren, Fortschritt schreiben, deinstallieren, fremde `publisher.id` mit gleicher ID installieren, Ablehnung und unveränderte `module_kv`-Zeilen erwarten.

Einordnung: MITTEL. Es braucht eine Anwenderbestätigung und ein manipuliertes Paket, die Wirkung ist auf Zuordnung und Integrität des Lernstands begrenzt.

## Geprüft, ohne Befund

### contentRoot (Schwerpunkt 1)
- `src/config.js` Zeile 28 bis 30: `contentRootFrom()` liefert fest `path.join(__dirname, "renderer")`. Der Parameter `app` wird nicht mehr ausgewertet. Parent, IT-Repo und Umgebungsvariablen beeinflussen den Stamm nicht.
- `src/main.js` Zeile 62 bis 65: `contentRoot` und `desktopRoot` zeigen beide auf `src/renderer`.
- Test "Inhaltsstamm ist der Renderer und nie der Parent" bestanden.
- Nachweis im Bestand: `src/renderer` enthält ausschließlich Shell-Seiten; `package.json` bündelt laut Test keine fremde Plattform.

### Protokoll academy://app (Schwerpunkt 2)
- Host-Prüfung `url.hostname !== "app"` ergibt 404 (`src/protocol.js` Zeile 44).
- Pfadauflösung `src/protocol-path.js`: URL-Dekodierung, NUL-Byte-Abweisung, `path.resolve` und `path.relative`-Kontrolle gegen den Stamm. Fehler ergeben 403. Ungültige Kodierung ergibt `bad-path`.
- Zusätzliche Sperre für `.git`, `desktop`, `node_modules` (Zeile 61).
- Antworten tragen CSP (`default-src 'self'`, `script-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, `form-action 'none'`) und `nosniff`.
- `src/window.js`: `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, `webSecurity: true`; `will-attach-webview` wird verhindert; `setWindowOpenHandler` verweigert; `will-navigate` lässt nur `academy://app/` zu; Berechtigungsanfragen werden in `main.js` pauschal abgelehnt.
- IPC: jeder Handler prüft `senderFrame.url` auf `academy://app/`. Der Preload gibt nur benannte Funktionen frei, kein rohes `ipcRenderer`.

### Modulinstallation (Schwerpunkt 3, außer F-1)
- Reservierte ID `dev.desoworks.it-ausbildung` wird in `spec.js` Zeile 117 und `manager.js` Zeile 316 abgewiesen; zusätzlich das Präfix `dev.desoworks.` für nicht offizielle Pakete und die Herausgeber-ID `dev.desoworks`. `open()` blendet die reservierte ID aus.
- Offizielle und geprüfte Pakete brauchen Ed25519-Signatur mit hinterlegtem Schlüssel; die Standardlisten vertrauenswürdiger Schlüssel sind leer (`manager.js` Zeile 149), solche Pakete werden also derzeit abgewiesen. Das ist sicher, aber auch funktional eng.
- `readPackage`: Pfadprüfung, `lstat` mit Symlink- und Verzeichnisabweisung, `realpath`-Prüfung gegen den Paketstamm, Dateigröße höchstens 512 KiB, Gesamtgröße höchstens 2 MiB und Abgleich mit `sizeBytes`, höchstens 32 Dateien, Manifest höchstens 64 KiB, Erweiterungs-Whitelist ohne Skripte.
- Rechte `network`, `script`, `ide.workspace` sind nicht freigegeben; `shell`, `filesystem`, `node` und weitere sind gesperrt.
- Uninstall bleibt im Paketroot: `install_path` muss exakt `packageRoot/<id>/<version>` entsprechen, Symlink wird nicht entfernt. Die ID ist durch `ID_PATTERN` auf `a-z0-9`, Punkt und Bindestrich begrenzt, `..` ist nicht möglich. Test mit manipuliertem `install_path` bestanden.
- Beim Öffnen werden Dateihashes gegen die gespeicherten Werte geprüft; bei Abweichung wird das Modul als fehlerhaft markiert und nicht ausgeführt. Modultexte werden bereinigt (`sanitizeCourse`, Antworten entfernt); in `src/renderer` nutzt nur `verwaltung.js` Zeile 18 `innerHTML = ""` (Leeren, kein Modultext).

### Update-Pin (Schwerpunkt 5)
- `PINNED_REPOSITORY = "DesoWorks/Academy"`; `repositoryPinned` verlangt für `github.com` den Pfad `/DesoWorks/Academy/releases/download/...`, für `api.github.com` `/repos/DesoWorks/Academy/releases`. Erlaubt sind nur die fünf GitHub-Hosts; Weiterleitungsziele werden erneut geprüft (`service.js` Zeile 275, 279). SHA-256-Prüfsumme ist Pflicht, Herausgeberprüfung per Thumbprint.
- Gepackt ist `feedUrl` leer und der Thumbprint leer; ohne Feed erfolgt keine Netzanfrage (`service.js` Zeile 178). Entwicklungsbuild installiert nichts.
- Hinweis (Risiko NIEDRIG, nicht ausnutzbar bei Standardkonfiguration): `repositoryPinned` gibt für `127.0.0.1` und `localhost` sowie für zusätzliche Hosts pauschal `true` zurück. `extraHosts` ist in `main.js` nicht gesetzt (leer). Im Entwicklungsmodus kann `ACADEMY_UPDATE_FEED` gesetzt werden, im gepackten Build nicht (`app.isPackaged`).

### Export und Import (Schwerpunkt 6)
- Neues Format `desoworks.academy.export` mit Formatversion, Schemaversion und Prüfsumme. Altes Format `desoworks.it-ausbildung.export` und Exporte ohne `format` liefern `legacy-unconfirmed`, solange `allowLegacy` nicht ausdrücklich `true` ist (`database.js` Zeile 495 bis 513). Neuere Formatversionen werden verweigert, ohne Daten zu ändern.
- Import braucht eine Bestätigung im Hauptprozess (`ipc.js` `showMessageBox`) und zusätzlich bei Altformat eine Rückfrage im Renderer (`verwaltung.js` Zeile 115). Vor dem Import entsteht ein Rückfallstand; bei Fehler wird zurückgesetzt (Tests bestanden).
- Keine Netzübertragung: `fs.writeFileSync` und `readFileSync` laufen lokal über Dateidialoge. Im geprüften Code nutzt nur `updates/service.js` das Netz, und dort werden keine Lernstände gesendet. `connect-src 'self'` verhindert externe Anfragen aus dem Renderer.
- Modulexport und -import (`exportModule`, `importModule`) sind im Preload und IPC nicht bereitgestellt, also aus der Oberfläche nicht erreichbar.
- Hinweis (Risiko NIEDRIG): Der Bestätigungsdialog im Hauptprozess nennt das Altformat-Flag nicht; die Entscheidung liegt im Renderer-`confirm`. Da der Renderer eigener, durch CSP und Sandbox geschützter Code ist, bleibt das ein Härtungspunkt. Empfehlung: Der Hauptprozess zeigt bei `allowLegacy` einen eigenen Dialogtext.

### F11-Handler (Schwerpunkt 7)
- `window.js` Zeile 85 bis 89 und `window-bounds.js`: `shouldToggleFullscreen` ist reine Logik auf `input.type`, `input.key` und Modifikatoren; es wird kein Eingabewert interpretiert, ausgeführt oder an den Renderer gesendet. Es entstehen keine neuen IPC-Kanäle, `eval` oder HTML-Pfade. Menüaktionen senden feste Zeichenketten (`academy:menu`).
- Der Menüeintrag hat bewusst keinen Accelerator, damit F11 nicht doppelt schaltet. Tests bestanden.

### Secrets (Schwerpunkt 8)
- In den gelesenen Quelldateien und diesem Bericht stehen keine Zugangsdaten, Tokens oder Schlüssel. Es wurde keine Datei mit Zugangsdaten geöffnet und nichts davon in diesen Bericht übernommen.

## Risiken und Beobachtungen ohne bestätigte Ausnutzbarkeit

| Nr. | Stufe | Beobachtung |
|---|---|---|
| R-1 | NIEDRIG | CSP erlaubt `style-src 'unsafe-inline'`; Skripte bleiben auf `'self'` beschränkt. |
| R-2 | NIEDRIG | `resolveAcademyPath` prüft textuell; Symlinks innerhalb von `src/renderer` würden nicht aufgelöst. Im Bestand gibt es keine. Empfehlung: `realpath`-Kontrolle ergänzen. |
| R-3 | NIEDRIG | Zwischen Hash-Berechnung und Kopie in `installFromDirectory` liegt ein kurzes Zeitfenster. Die Hashprüfung beim Öffnen fängt eine Abweichung nachträglich ab (Modul wird als fehlerhaft markiert). |
| R-4 | INFORMATIV | Eine Modulaktualisierung legt eine neue Versionsmappe an; alte Versionsordner bleiben liegen, nur der aktuelle wird bei Deinstallation entfernt. Kein Sicherheitsproblem, aber Plattenverbrauch. |
| R-5 | INFORMATIV | `will-navigate` erfasst keine Teilframes; `frame-ancestors 'none'` und `default-src 'self'` begrenzen das. |
| R-6 | INFORMATIV | Signaturprüfung für offizielle Module ist ohne hinterlegte Schlüssel faktisch gesperrt. |

## Nicht geprüft

- Laufzeitverhalten der Electron-Anwendung (kein Start, keine UI-Prüfung, kein Netzmitschnitt).
- Das gebaute und signierte Installationspaket sowie die tatsächliche Herausgeber-Thumbprint-Prüfung unter Windows.
- Ob das GitHub-Repository `DesoWorks/Academy` existiert und wie es konfiguriert ist (Branch-Schutz, Secrets, Berechtigungen).
- Abhängigkeitsschwachstellen (`npm audit` wurde nicht ausgeführt, um keinen Netzzugriff zu erzeugen).
- `src/updates/service.js` ab Zeile 300, `src/updates/signature.js`, `src/modules/catalog.js`, `src/modules/signature.js`, `src/lab-run.js`, `src/store/database.js` außerhalb der genannten Abschnitte, `scripts/`, Renderer-Skripte außer der Suche nach gefährlichen Mustern.
- Die Datei `_secure/phase-h-it-ausbildung.bundle` (Sicherung des Phase-H-Stands): Inhalt nicht geöffnet. Hinweis: Sie liegt im Arbeitsbaum des Core-Repositories. Vor dem ersten Commit prüfen, dass sie über `.gitignore` ausgeschlossen ist, damit IT-Historie nicht unbeabsichtigt veröffentlicht wird. Ob das der Fall ist, habe ich nicht verifiziert.
- Das IT-Ausbildungs-Repository und die Verwaltung-Ausbildung wurden nicht berührt.
- Datenschutz im Sinne der DSGVO (Protokolle, Telemetrie) über die gelesenen Pfade hinaus.

## Empfehlung

Negative Sicherheitsempfehlung für eine Freigabe, solange F-1 offen ist. Nach Behebung durch Jarvis und Regressionstest führe ich eine unabhängige Nachprüfung durch. Die Entscheidung über Freigabe, Push und Release liegt beim Commander.
