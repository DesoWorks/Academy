# DESIGN HARMONY – Sicherheitsgrenzen für die UI- und CSS-Arbeit

Prüfer: RoboCop (Security Officer). Projekt: DesoWorks Academy. Stand: 2026-11-22.
Prüfgegenstand: Branch feature/phase-n1-release-connectivity, HEAD 46283bf (laut Auftrag; Git nicht selbst abgefragt).
Art: Kurzprüfung, nur lesend. Keine Codeänderung, kein Exploit, keine Umgehung.

## 1. Ergebnis in Kürze

Der Darstellungsfehler im Dunkelmodus ist ein reines CSS-Problem. In `modules/it-systemintegration/web/module/lf3-client-anbindung.html` kommt der Fallback `var(--flaeche,#fff)` dreimal vor (gezählt, nicht einzeln gelesen). Er ist kein Grund, an der Update-Sicherheit etwas zu ändern. Design-, Kontrast- und Hilfe-Arbeit lässt sich vollständig ohne Eingriff in die Update-Prüfkette erledigen.

## 2. Dateien, die eine Designänderung nicht schwächen darf

| Datei | Gelesene Schutzfunktion (Beleg) |
|---|---|
| `src/updates/service.js` | `download()` lehnt fremden Kanal ab (Z. 483–485), ebenso Nicht-Prerelease außerhalb von stable (Z. 486–491), fehlenden Hash (Z. 492–498), Downgrade (Z. 499–501) und ungültiges Manifest (`pendingManifestOk()`, Z. 502–504). Hashvergleich vor dem Umbenennen (Z. 559–567). `installPlan()` prüft Kanal, Pfad im Updateordner, Version größer als installiert, Hash, gespeichertes Manifest (`storedManifestOk`, Z. 628) und eine vorhandene Sicherung (`backupPath`, Z. 631–633). Stable verlangt zusätzlich die Herausgebersignatur (Z. 634–643). |
| `src/updates/manifest-sign.js` | Ed25519-Prüfung über die exakten Manifest-Bytes, strenge Base64-Prüfung, Ablehnung bei fehlendem oder falschem Schlüssel (Z. 46–68). Der private Schlüssel gehört laut Kommentar nicht ins Repository (Z. 7). |
| `src/updates/update-public-key.pem` | Vertrauensanker für `verifyManifest` (`PUBLIC_KEY_FILE`, manifest-sign.js Z. 13). Inhalt nicht gelesen, nur Verwendung belegt. |
| `src/updates/signature.js` | Authenticode-Prüfung des Installers für stable (`verifyPublisher`, Z. 6–35). Ersetzt die Manifestprüfung nicht. |
| `src/updates/channels.js` | Strenge Kandidatenwahl: Tag, Kanal, Manifest, Plattform, Paketart; Draft und Duplikate mit abweichendem Hash werden abgelehnt (Z. 89–209). |
| `.github/workflows/academy-dev.yml` | Build bricht ohne `ACADEMY_MANIFEST_SIGNING_KEY` ab (Z. 75–78). Das Secret steht nur im Schritt „Manifest erzeugen und signieren“ (Z. 72–73). Prüfschritt gegen den öffentlichen Schlüssel (Z. 85–88). Build läuft mit `contents: read` (Z. 36–37), nur `publish` mit `contents: write` (Z. 99–100). Tag-Kollision bricht ab (Z. 112–115). |
| `package.json` (Abschnitt `build`) | `appId` `dev.desoworks.academy` (Z. 20), `productName`, `artifactName` (Z. 63), `files`-Liste (Z. 27–33), `win.signExecutable: false` (Z. 54, vorhandener Zustand, nicht zu ändern ohne Auftrag). |

Nicht gelesen, aber im Dienst referenziert und deshalb ebenfalls tabu für Designarbeit: `src/updates/feed.js`, `src/updates/github-feed.js`, `src/updates/messages.js` (Fehlertexte dürfen sprachlich verbessert werden, ihre Codes und Bedingungen nicht).

## 3. Ausdrücklich unzulässig

Jede dieser Maßnahmen ist im Rahmen von Design Harmony unzulässig und braucht, wenn überhaupt, einen eigenen Auftrag des Commanders mit Sicherheitsprüfung.

1. **Manifestprüfung abschalten oder abschwächen.** Betrifft `verifyManifest`-Aufrufe in service.js (Z. 81, 96, 323) und `manifest-sign.js`. Folge: Ein untergeschobenes Paket könnte als Update gelten. Bewertung: KRITISCH, falls umgesetzt. Auch ein „nur im Dunkelmodus-Test“ oder „nur für Vorschau“ ist nicht erlaubt.
2. **Token in den Buildjob legen.** Der Build-Job hat bewusst nur `contents: read` und `persist-credentials: false` (academy-dev.yml Z. 36–37, 43–44). Der Dienst nimmt ein Token nur optional und nur für die Release-Liste (service.js Z. 120–126) und gibt es nie an Downloads weiter (Z. 132–136). Folge bei Verstoß: Schreibrechte und Secrets in einem Job, der fremden Paketcode ausführt. Bewertung: HOCH.
3. **App-ID ändern.** `appId` `dev.desoworks.academy` (package.json Z. 20) bestimmt die Identität der Installation. Eine Änderung würde Updates, Lernstände und Installationsverzeichnis von der bestehenden Installation trennen. Bewertung: HOCH (Datenverlust-Risiko, Update-Kette bricht). Das Manifest bindet zudem `product: desoworks-academy` (channels.js Z. 100).
4. **Bestehende Installation ungefragt ersetzen.** `installPlan()` startet nur mit vorhandener Sicherung und liefert den Installer erst nach allen Prüfungen (service.js Z. 599–654). Design-Arbeit darf keinen Pfad schaffen, der Download und Installation ohne ausdrückliche Bestätigung des Benutzers verbindet. Bewertung: HOCH.
5. **DEV-Release überschreiben.** Der Workflow lehnt einen vorhandenen Tag ab (academy-dev.yml Z. 112–115). Das öffentliche Release `dev/v0.3.1-dev.5` bleibt unverändert; der Darstellungsfehler wird nur durch ein neues Release mit höherer Zählung behoben (Tagformat `dev/vX.Y.Z-dev.N`, channels.js Z. 12). Das Löschen oder Neuhochladen von Assets ist unzulässig. Bewertung: HOCH.

Ergänzend unzulässig: Signaturen oder Hashprüfung „vorübergehend“ umgehen, um einen UI-Test zu beschleunigen; Secrets, Schlüssel oder Tokens in Screenshots, Testdateien oder Protokolle schreiben; die Sicherungspflicht vor der Installation entfernen.

## 4. Erlaubte Flächen

| Fläche | Erlaubt | Grenze |
|---|---|---|
| Renderer-CSS und Design-Tokens | Farben, Kontraste, Fokus, Abstände, Hell/Dunkel. Fallback-Werte wie `var(--flaeche,#fff)` durch Token ersetzen, die in beiden Modi definiert sind. | Nur Stylesheets und Markup der Modulseiten. Keine Scripts nachladen, keine externen Schriften oder Dienste einbinden, keine Inline-Handler hinzufügen. |
| Shell-Status (Statuszeile, Updateanzeige) | Statuszeile einklappen oder ausblenden, nicht ausführbare Aktionen ausblenden oder sperren, Texte vereinfachen. | Die Anzeige liest `state.phase` und `state.error` nur. Sie darf keine Aktion auslösen, die der Dienst ablehnen würde, und keine Prüfung selbst nachbauen. Fehlercodes (`signature-invalid`, `hash-mismatch` usw.) müssen sichtbar bleiben, nicht nur Farbe. |
| Aufgabenhilfe | Glossar, Hilfestufen, Lesehilfen, Schriftgröße, Zeilenabstand, Rückmeldungen. | Lösungen und Bewertungslogik nicht in den Renderer verlegen. Lernstände nur über die bestehende Speicherung; ein Vorlesedienst darf keine Aufgabentexte an externe Dienste senden. |

## 5. Prüfregeln für die Umsetzung (Nachprüfung durch RoboCop)

- Diff darf keine Datei aus Abschnitt 2 berühren. Prüfung per `git diff --stat` gegen die Liste.
- Die vorhandenen Tests zu Updates müssen unverändert grün sein; kein Test darf gelöscht, übersprungen oder abgeschwächt werden.
- Der Workflow `academy-dev.yml` bleibt unverändert, außer der Commander beauftragt es ausdrücklich.
- Eine ausgeblendete Schaltfläche ersetzt keine Prüfung im Dienst. Beides bleibt bestehen.
- Neue Release-Zählung statt Überschreiben.

## 6. Grenzen dieser Prüfung

- Gelesen wurden service.js (vollständig), manifest-sign.js, signature.js, channels.js, academy-dev.yml und der Abschnitt `build` in package.json.
- Nicht gelesen: feed.js, github-feed.js, messages.js, academy-beta.yml, academy-stable.yml, das Stylesheet `styles.css` (Ort nicht ermittelt; Suche unter `src` ergab keinen Treffer) und die drei Fundstellen in `lf3-client-anbindung.html` im Einzelnen.
- Dass `styles.css` im Dunkelmodus `--farbe-text #f2f5f8` setzt, stammt aus dem Auftragskontext und wurde nicht selbst bestätigt.
- Keine Tests ausgeführt, kein Git-Stand abgefragt, kein Dateiinhalt von `update-public-key.pem` gelesen.
- Dies ist keine Produktionsfreigabe. Die Freigabe liegt beim Commander.
