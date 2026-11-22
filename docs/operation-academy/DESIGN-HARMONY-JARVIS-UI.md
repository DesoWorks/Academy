# DESIGN HARMONY – Jarvis: Inventar Update-Oberfläche und Statuszeile

Stand: Branch `feature/phase-n1-release-connectivity`, HEAD 46283bf (laut Lead-Kontext, hier nicht erneut mit git geprüft).
Art: reines Inventar. Es wurde nichts geändert, nichts committet, nichts installiert.
Alle Zeilennummern stammen aus Dateien, die für diese Datei tatsächlich gelesen wurden. Zuletzt abgeglichen mit `verwaltung.html`, `verwaltung.js`, `bridge.js`, `service.js` (Z. 170-733), `ipc.js` (Z. 455-534 und Suchtreffer), `preload.js` (Z. 30-74), `main.js` (Z. 90-109), `about.js`, `shell.css` (Z. 67-73).

## 1. Update-Bedienelemente heute

Quelle der Elemente: `src/renderer/verwaltung.html` Zeilen 70 bis 79. Die Klick-Handler stehen in `src/renderer/verwaltung.js`. Die Kette läuft danach über `src/preload.js` (Zeilen 42 bis 65) nach `src/ipc.js` und `src/updates/service.js`.

Wichtigster Befund vorweg: `paint()` in `verwaltung.js` (Zeilen 27 bis 79) liest `update.phase` an keiner Stelle. Es wird kein Button deaktiviert oder ausgeblendet. Alle sechs Buttons sind in jedem Zustand klickbar. Die einzige Prüfung auf Oberflächenseite ist die Modul-ID bei den zwei Modul-Buttons.

| Button (id, Beschriftung) | HTML | Handler | Prüfung in der Oberfläche | Prüfung im Hauptprozess |
|---|---|---|---|---|
| `pruefen` "Erneut prüfen" | verwaltung.html:72 | verwaltung.js:150-156 (`api.checkUpdate`) | Keine. | `ipc.js:220` ruft `updates.check()` (`service.js:394`). Keine Phasenprüfung. `check()` setzt sofort `state.phase = "checking"` (Z. 396), auch während `downloading`, `verifying` oder `installing`. Ein laufender Download kann so seinen Zustand verlieren. |
| `laden` "Core herunterladen" | verwaltung.html:73 | verwaltung.js:158-164 (`api.downloadUpdate`) | Keine. | `ipc.js:229` ruft `updates.download()` (`service.js:482`). Geprüft werden Kanal, Prerelease-Regel, Asset vorhanden, Downgrade, Signatur. Reihenfolge: Kanal Z. 483, Prerelease Z. 486, Asset Z. 492, Downgrade Z. 499, Signatur Z. 502. Nicht geprüft wird die Phase. Ein zweiter Klick während `downloading` startet einen zweiten Download, weil `state.asset` noch gesetzt ist. Aus `ready` heraus wird erneut geladen. Aus `current`, `rejected` oder `failed` endet der Aufruf nicht wegen der Phase, sondern weil `stop()` (Z. 294-305) `asset` leert: Im Kanal `dev` meldet Z. 486-491 `blocked`/`devChannel`, im Kanal `stable` Z. 492-497 `hashMissing`. |
| `abbrechen` "Download abbrechen" | verwaltung.html:74 | verwaltung.js:166-172 (`api.abortUpdate`) | Keine. | `ipc.js:238` ruft `updates.abort()`, das ist `abortDownload` (`service.js:184-194`). Das setzt bedingungslos `phase = "aborted"`, `installerPath = null`, `received = 0` und schreibt den Zustand. Aus `ready` heraus wird so ein fertig geprüftes Update im Zustand verworfen, die Datei bleibt auf der Platte liegen. |
| `installieren` "Core-Update installieren" | verwaltung.html:75 | verwaltung.js:174-178 (`api.installUpdate`) | Keine. Nach Erfolg kein `refresh()`. | `ipc.js:490` legt zuerst `store.backup("pre-update")` an (Z. 493) und ruft erst danach `updates.installPlan` (Z. 494). `installPlan` (`service.js:599`) prüft Kanal, Phase `ready`, Installerpfad, Version, Hash, Manifest, Sicherung, bei Stable die Herausgebersignatur. Die Logik ist also gesperrt, aber jeder Fehlklick erzeugt vorher eine Sicherung. |
| `modul-laden` "Modulupdate herunterladen" | verwaltung.html:76 | verwaltung.js:180-191 (`api.downloadModuleUpdate`) | Nur: `dataset.moduleId` nicht leer (Z. 181-185). Die ID ist immer `modules[0].id` (Z. 59). Weitere Modulupdates sind nicht adressierbar. | `ipc.js:503` ruft `updates.downloadModule(id)` (`service.js:657`). Verlangt Kanal `dev` und einen Eintrag mit `action === "available"` und `prerelease === true`. Sonst nur `moduleMessage = moduleFailed`. Keine Phasenprüfung. |
| `modul-installieren` "Modulupdate installieren" | verwaltung.html:77 | verwaltung.js:193-203 (`api.installModuleUpdate`) | Nur: `dataset.moduleId` nicht leer (Z. 194-198). | `ipc.js:512` verlangt `preparedModule` mit gleicher ID und gleichem SHA-256 (Z. 520-527). Das ist saubere Logik, aber die Oberfläche zeigt den Button auch ohne vorbereitetes Paket. |
| `beim-start` (Checkbox) | verwaltung.html:70 | verwaltung.js:205-215 | Schreibt `academy.updateCheckOnStart` per `storageSet`. Das Ergebnis von `storageSet` wird nicht geprüft. | Gelesen wird der Schlüssel in `src/main.js:97`: bei `"1"` läuft `updates.check()` (Z. 98) direkt nach `updates.reconcile()` (Z. 95), ohne Download. Auch dieser Aufruf hat keine Phasenprüfung. |
| Menüaktion `check` | kein Button | bridge.js:91-95 (`api.checkUpdate`) | Keine. Ergebnis geht als Text in die Statuszeile. | wie `pruefen` |

Weitere Befunde aus dem gelesenen Code:

- `service.js` kennt diese Phasen: `idle`, `checking`, `available`, `current`, `failed`, `rejected`, `blocked`, `downloading`, `verifying`, `ready`, `installing`, `interrupted`, `aborted`. Im Feed-Pfad (`service.js:452`) wird `state.phase = selected.action` gesetzt. Welche Werte `selectRelease` liefert, wurde nicht gelesen.
- Zuordnung zu den geforderten sieben Zuständen ist möglich, aber nicht eindeutig umgesetzt: aktuelle Version = `current`/`idle`; Update verfügbar = `available`; Download = `downloading`; Integritätsprüfung = `verifying`; Installation bereit = `ready`; Installation läuft = `installing`; Fehler = `failed`, `rejected`, `blocked`, `interrupted`, `aborted`.
- `ipc.js:462-465` kennt bereits die Sperrphasen `downloading`, `verifying`, `installing` (Kanalwechsel). Das ist die vorhandene Vorlage für eine einheitliche "Update läuft"-Regel.
- Während `api.downloadUpdate()` auf Antwort wartet, wird der Fortschritt nicht aktualisiert. `service.js:218` kennt `options.onProgress`. In den gelesenen Zeilen von `preload.js` (30-74) gibt es keinen Fortschrittskanal; Z. 75-96 wurden nicht gelesen. Ob `onProgress` beim Anlegen des Dienstes übergeben wird, wurde nicht gelesen. `#fortschritt` wird nur in `paint()` gesetzt und nie geleert (verwaltung.js:68-72).
- Es gibt keinen Schutz gegen Mehrfachklick (kein In-Flight-Flag in verwaltung.js).
- Die Fehlermeldung nutzt `state.message`. Ein Fehlerzustand hat keine eigene Darstellung, nur `#meldung` mit Klasse `fehler` (verwaltung.js:6-9).
- Es gibt keine "eine zentrale Hauptaktion": sechs gleichrangige Buttons in einer `div.zeile` (verwaltung.html:71-78).

## 2. Technische Statuszeile: Erzeugung und Anzeige

Die Statuszeile ist kein Teil des Navigations-HTML, sondern wird per Skript in jede App-Seite eingefügt.

1. Einschleusen: `src/protocol.js:9` definiert `BRIDGE`, `injectBridge` (Z. 32-37) setzt das Skript hinter `<head>`. Aufgerufen wird es beim Ausliefern von HTML-Dateien (Z. 130; die Host-Bedingung davor wurde nicht gelesen). Die Datei selbst wird über `/__desktop/bridge.js` ausgeliefert (Z. 103).
2. Erzeugen: `src/renderer/bridge.js` Z. 7-9: `div` mit `role="status"` und Klasse `desktop-status`.
3. Einhängen: `bridge.js:77-78` in `.kopf-inhalt` (Fallback `document.body`). `.kopf-inhalt` liegt direkt neben `#navigation` im Seitenkopf. Seiten mit `.kopf-inhalt` in `src/renderer`: about, catalog, home, ide, ki, module, settings, verwaltung (je ein Treffer; Zeile nur für verwaltung.html:12 belegt).
4. Text bei Normalbetrieb: `paint()` Z. 61-66, Format "Desktop <Version> · Kanal <Kanal> · <update.message oder Bereit>" plus optional " · Offline, Lernseiten bleiben lokal." Gefüllt aus `api.status()` (Z. 79-83).
5. Weitere Schreiber in dieselbe Zeile: Fehlertext Z. 82; Menüaktion `check` Z. 93; Menüaktion `backup` Z. 98 und 100.
6. Warnpfad: Wenn die Lerndatenbank nicht verfügbar ist, setzt Z. 11-18 einen Warntext und hängt die Zeile nach `DOMContentLoaded` an. Dieser Pfad ist eine echte Warnung und bleibt.
7. Stil: `src/renderer/shell.css:67-73`, Klasse `.desktop-status` (13px, `--dw-text-muted`, Abstand unten 8px). Das ist der Platz, der unter der Navigation verbraucht wird.

Nebenwirkung, die später nicht verloren gehen darf: Die Statuszeile ist die einzige Rückmeldefläche für die Menüaktionen `check` und `backup` auf Seiten ohne eigenes Meldungsfeld. `verwaltung.html` hat dafür `#meldung` (Z. 86), die anderen Seiten nicht (Seiten außer verwaltung.html wurden dazu nicht einzeln gelesen).

## 3. Kleinste spätere Änderung (Vorschlag, nicht umgesetzt)

Ziel: sieben Zustände, eine Hauptaktion, unzulässige Aktionen gesperrt, Statuszeile aus der Navigation.

A. Zustandsabbildung in der Oberfläche (nur `verwaltung.js` und `verwaltung.html`)
- Eine kleine reine Funktion in `verwaltung.js`, z. B. `uiState(update)`, liefert Zustandsname, Hauptaktion und die Liste erlaubter Aktionen. Eingabe ist `update.phase`, dazu `update.preparedModule` und `update.moduleUpdates`, beides steht bereits im Ergebnis von `academy:status` (`service.status()` gibt den ganzen Zustand zurück).
- Erlaubt: `current`/`idle` → prüfen; `available` → laden (Hauptaktion), prüfen; `downloading` → abbrechen; `verifying` → nichts; `ready` → installieren (Hauptaktion), prüfen; `installing` → nichts; Fehlerphasen → prüfen (Hauptaktion).
- `paint()` setzt danach `disabled` (nicht erlaubt) und `hidden` für alles außer Hauptaktion und "Erneut prüfen". Die Hauptaktion bekommt eine hervorgehobene Klasse. Modul-Buttons nur bei vorhandenem Modulupdate; "installieren" nur bei passendem `preparedModule`.
- In-Flight-Flag in jedem Handler, damit Mehrfachklicks keinen zweiten Aufruf auslösen.
- Beschriftung und Zustandstext je Zustand neu, `#fortschritt` bei Phasenwechsel leeren.

B. Logiksperren (kleine Guards, Hauptprozess)
- `service.js` `check()`: bei `downloading`, `verifying`, `installing` zurückgeben, ohne die Phase zu überschreiben.
- `service.js` `download()`: nur aus `available` starten.
- `service.js` `abortDownload()`: nur aus `downloading` oder `verifying` wirksam, sonst Zustand unverändert zurückgeben.
- `ipc.js` `academy:update-install`: Phase `ready` prüfen, bevor `store.backup("pre-update")` läuft.
- Diese Guards ändern keine Hash-, Signatur- oder Kanallogik.

C. Statuszeile
- `bridge.js`: `paint()` und das dauerhafte Anhängen (Z. 61-66, 77-78) entfernen. Die Zeile wird nur noch bei Warnung oder Menürückmeldung erzeugt (kleine Funktion `notify(text)`, legt das `div` erst dann an). Der Warnpfad Z. 11-18 bleibt.
- Version und Kanal nach "Über": `about.js:10-12` schreibt heute nur "Programm <desktop> · Core <core>" ohne Kanal in `#version` (`about.html:31`). Dafür wäre eine Zeile in `about.js` nötig, nicht in `about.html`. Version und Kanal stehen schon in `verwaltung.js:34-36`. Updatemeldung steht schon in `verwaltung.html` (`#update`, `#version`). Der Offline-Hinweis steht schon in `#offline`.
- `shell.css`: `.desktop-status` nur noch als Warnmeldung gestalten, nicht mehr im Kopfbereich dauerhaft.

D. Prüfung später
- Neuer Test für die Zustandsabbildung und die Guards, Lauf mit dem vorhandenen Testbefehl des Projekts (nicht in diesem Auftrag ausgeführt).
- Sichtprüfung der Seiten about, home, verwaltung im Hell- und Dunkelmodus.

Offene Entscheidung für Rick: Wohin gehen die Rückmeldungen der Menüaktionen `check` und `backup` auf Seiten ohne `#meldung`? Empfehlung: die Notify-Zeile nur dann sichtbar machen (kurz, als `role="status"`), statt den Nutzer umzuleiten.

## 4. Etappe 2: Dateien

Würde anfassen:
- `src/renderer/verwaltung.html` (Hauptaktion, Struktur der Updatesektion)
- `src/renderer/verwaltung.js` (Zustandsabbildung, Sperren, In-Flight)
- `src/renderer/bridge.js` (Statuszeile nur Zeilen 7-18, 61-84, 91-102; Rest siehe unten)
- `src/renderer/shell.css` (Block `.desktop-status`, Z. 67-73, und neue Stile für Hauptaktion/Zustände)
- `src/renderer/about.js` (Z. 10-12, Kanal ergänzen); `about.html` nur falls Text nötig
- `src/updates/service.js` (nur Guards in `check`, `download`, `abortDownload`)
- `src/ipc.js` (nur Reihenfolge in `academy:update-install`)
- neue Testdatei unter `tests/` und ergänzende Zeilen in `docs/operation-academy/DESIGN-SYSTEM.md`
- möglich: `src/updates/messages.js` für neue Zustandstexte (nicht gelesen)

Darf nicht angefasst werden:
- Signatur und Herkunft: `src/updates/signature.js`, `manifest-sign.js`, `update-public-key.pem`, `github-feed.js`, `feed.js`, `dev-feed.js`, `semver.js`
- Kanalmodell: `src/updates/channels.js`, `channel-preference.js`
- App-ID und Paketierung: der App-ID-Eintrag in der Paket- und Builder-Konfiguration (nicht gelesen, nur Auftragsvorgabe), NSIS-Konfiguration, `.github/workflows/`
- `bridge.js` Zeilen 20-59 (Überschreibung von `localStorage` mit SQLite, Speicherpfad aller Lernstände) und Zeilen 73-76 (Fußtext)
- `src/protocol.js`, `src/protocol-path.js` (CSP und Auslieferung)
- `src/preload.js` nur dann, wenn kein neuer IPC-Kanal nötig ist (für Fortschrittsanzeige wäre eine Erweiterung nötig, das ist nicht Teil des kleinsten Schnitts)
- `src/renderer/shell.js` `NAV` (nicht nötig), `modules/` (Lernmodule), Branch `main`

## 5. Offene Punkte und nicht Gelesenes

- Start-Check: gelesen in `src/main.js:95-99`. `main.js` gehört nicht zu den Dateien für Etappe 2 und bleibt unberührt.
- Menütexte und die Auslösung der Aktion `check` in `src/window.js` wurden nur an Zeile 13 und 101 gesehen.
- `about.html`: Versionsstelle `#version` (Z. 31) vorhanden, gefüllt durch `about.js:10-12`. Rest der Seite nicht gelesen.
- `selectRelease` in `src/updates/feed.js`: mögliche `action`-Werte nicht gelesen.
- `tests/`: Suche nach `desktop-status|verwaltung|pruefen|bridge` trifft nur `tests/modules-preserved.test.js:19` (verlangt, dass `src/renderer/verwaltung.html` existiert; die Datei darf also nicht umbenannt werden) und einen Kommentar in `tests/phase-n1-w2-updater.test.js:5`. Kein gefundener Test erwartet Button-IDs oder Statuszeilentext. Der übrige Inhalt von `phase-n1-w2-updater.test.js` wurde nicht gelesen, Guards in `service.js` könnten dort bestehende Erwartungen berühren.
- Keine Laufzeitprüfung, kein Test, kein Build in diesem Auftrag.
