# Operation Knowledge Pilot – Sicherheitsprüfung (RoboCop)

**Projekt:** DesoWorks Academy, Modul IT-Systemintegration
**Datum:** 2026-11-23
**Art der Prüfung:** nur lesend, statische Analyse. Keine Änderung an Code, Index, Signatur oder Update.

## 1. Prüfgegenstand

- Repo `D:\Desoworks\Workspace\Academy`, Branch `feature/operation-knowledge-pilot`, HEAD `0494674374e804c692ba6120d7897179b42418e5`.
- Der geprüfte Stand ist **gestaged, nicht committet** (`git status`: 12 Dateien `M `/`A `, keine unstaged Änderungen). Es gibt keinen Commit-Hash für den Prüfstand. Maßgeblich sind die SHA-256-Werte unten.
- Geprüft: `lf3-diagnose-kern.js`, `lf3-diagnose-labor.js`, `module/lf3-diagnose-labor.html`, `lf3-diagnose.css` (nur auf Remote-Referenzen), `startseite.js`, `navigation.js`, `module-daten.js`, `academy-module.json`, Diffs von `payload-index.json` und `course.json`.

## 2. Urteil

**Kein hoher Befund.** Es gibt keinen KRITISCHEN, keinen HOHEN und keinen MITTLEREN Befund. Es bleiben zwei NIEDRIG-Befunde und mehrere Hinweise (siehe 4 und 5).

Das ist kein Stable-Freigabesiegel. Die Freigabe liegt beim Commander.

## 3. Prüfung gegen die Grenzen des Auftrags

| Grenze | Ergebnis | Beleg |
|---|---|---|
| Keine echten Netz- oder OS-Aufrufe | Eingehalten | Suche nach `fetch(`, `XMLHttpRequest`, `WebSocket`, `postMessage`, `child_process`, `require(`, `eval(`, `new Function`, `document.write`, `https?://` in `lf3-diagnose-*.js`, `startseite.js`, `navigation.js`: keine Treffer. Der Kern setzt `simulation: true` und `netzwerkzugriff: false` (`lf3-diagnose-kern.js` Z. 392–393). Die Oberfläche bricht ab, wenn diese Flags nicht stimmen (`lf3-diagnose-labor.js` Z. 6). Alle Ergebnisse sind Daten im Kern (Z. 10–236). |
| Keine unsichere Eingabeinterpretation | Eingehalten | Es gibt kein Freitextfeld. Eingaben sind Radio-Buttons und Checkboxen mit festen IDs. `bewerten()` lehnt unbekannte Aktionen, Befunde, Ursachen und Maßnahmen ab (`lf3-diagnose-kern.js` Z. 298–303). Die Ausgabe erfolgt ausschließlich über `textContent` (`el()`, `lf3-diagnose-labor.js` Z. 19–24). Keine `innerHTML`-, `outerHTML`- oder `insertAdjacentHTML`-Treffer. |
| Keine neuen Remote-Inhalte | Eingehalten | Keine `http(s)://`-, `@import`- oder `url(`-Treffer in `lf3-diagnose.css`. Keine `http(s)://`-Treffer in `lf3-diagnose-labor.html`. Die HTML lädt nur relative Skripte und Styles (Z. 8–12, 38–45). |
| Keine CSP-/Sandbox-Lockerung | Eingehalten | `src/` ist unverändert (siehe 6). `src/window.js` Z. 71–73: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Die Pilot-HTML setzt keine CSP und lockert keine. In `modules/it-systemintegration/web` gibt es keine Content-Security-Policy (siehe H-1). |
| Keine Abhängigkeit von RC-04 | Eingehalten | Suche nach `RC-04`/`RC04` im Modulordner: keine Treffer. |
| Pilotstand nur unter `it-ausbildung.lf3-diagnose-pilot.v1` | Eingehalten | Der Schlüssel steht in `lf3-diagnose-labor.js` Z. 4. `localStorage` kommt in `lf3-diagnose-*.js` nur in Z. 10 und 17 vor, beide mit diesem Schlüssel. |
| Lernstände bleiben getrennt | Eingehalten | Der Pilot trägt `fortschritt: "isoliert"` (`module-daten.js` Z. 74). `startseite.js` schließt solche Karten aus der Abschlusszählung aus (`lesson.fortschritt !== "isoliert"`). `navigation.js` übergibt für sie eine leere ID. `fortschritt.js` kennt die Pilot-ID nicht in `SCHLUESSEL` und liefert für unbekannte IDs `false` (Z. 105–107). Es gibt keinen Schreibzugriff auf bestehende Lernstand-Schlüssel. |
| Keine Freischaltung nur wegen vorhandener Dateien | Eingehalten | `lektionOffen()` verlangt `field.status === "verfuegbar"`, `lesson.status === "verfuegbar"` und `lesson.datei` (`module-daten.js`). Status und Zugriff sind getrennt: `abdeckung` steuert nur die Beschriftung. LF8 und LF9 bleiben `status: "kommt-bald"` und damit gesperrt. LF10b bis LF12b bleiben `kommt-bald` mit `abdeckung: "geplant"`. |

## 4. Befunde

### B-1 NIEDRIG – Pilotstand ist clientseitig manipulierbar
- **Beleg:** `lf3-diagnose-labor.js` Z. 33–58 übernimmt `urteil`, `abgegeben` und `aufgegeben` aus `localStorage` ohne Neubewertung. Z. 272 zählt `urteil === "tragfaehig"` direkt. Die Musterlösungen stehen im Klartext in `lf3-diagnose-kern.js` Z. 132–236.
- **Auswirkung:** Wer seinen Browser-Speicher bearbeitet, kann sich einen höheren Pilotstand und die Musterlösung anzeigen lassen. Es ist nur der eigene Browser betroffen. Der Pilotstand ist laut Oberfläche (Z. 273) und HTML-Fußzeile nicht Teil der Lernzielkontrollen.
- **Voraussetzung:** Zugriff auf den eigenen Browser-Speicher.
- **Empfehlung:** Den Pilotstand nicht als Leistungsnachweis verwenden. Optional beim Anzeigen `urteil` über `kern.bewerten()` neu ableiten. Kein Sofortbedarf.

### B-2 NIEDRIG – Gespeicherter Zustand wird nur teilweise normalisiert
- **Beleg:** `zustandSicher()` (`lf3-diagnose-labor.js` Z. 33–58) begrenzt `aktionen` und `befunde` auf 20 Einträge, prüft aber weder Länge noch Bekanntheit der Strings. `hilfen` wird nur nach Wert gefiltert, nicht in der Länge begrenzt. `ursache`, `massnahme` und `urteil` sind unbegrenzte Strings.
- **Auswirkung:** Ein manipulierter Zustand kann den Pilot-Eintrag aufblähen oder dazu führen, dass `bewerten()` dauerhaft `ungueltig` liefert. Eine Codeausführung ergibt sich daraus nicht, weil alles per `textContent` und als `id`-Attributwert dargestellt wird. Über „Diesen Auftrag neu beginnen“ lässt sich der Zustand zurücksetzen.
- **Empfehlung:** Beim Laden Aktionen und Befunde gegen die Whitelist des Kerns filtern und `hilfen` auf drei Einträge begrenzen. Härtung, kein Blocker.

## 5. Hinweise (INFORMATIV)

- **H-1 Keine CSP im Modul.** Weder `src` noch `modules/it-systemintegration/web` enthalten eine Content-Security-Policy. Das ist ein Bestandszustand und kein Befund dieses Piloten. Der Pilot verlässt sich auf die Electron-Einstellungen (`sandbox`, `contextIsolation`). Eine CSP sollte als eigene Maßnahme geplant werden, nicht im Pilot.
- **H-2 Gleiche Ursprungsgrenze.** Andere Seiten des Moduls können den Pilot-Schlüssel lesen und schreiben. Das entspricht dem Bestandsmodell der anderen `it-ausbildung.*`-Schlüssel.
- **H-3 `module.exports` in `module-daten.js`.** Der Export steht außerhalb der IIFE. Im Renderer ist `nodeIntegration` ausgeschaltet, der Export ist dort wirkungslos und dient den Tests. Kein Risiko.
- **H-4 Pseudozufall.** `mischen()` nutzt `Date.now()` für die Reihenfolge. Das ist nur eine didaktische Durchmischung und kein Sicherheitsmerkmal.
- **H-5 Statistische Aussage in der Legende.** Der Satz „Im aktuellen Modul ist kein Lernfeld als Verfügbar gekennzeichnet“ in `startseite.js` ist fest eingetragen und stimmt nur, solange alle Lernfelder eine `abdeckung` ungleich `verfuegbar` haben. Das ist ein Wartungs-, kein Sicherheitsthema.

## 6. Änderungen an Modulkern, Update und Signatur

- `git status --short -- src updates scripts release signatures`: leer. Es gibt **keine Änderungen** an `src/modules/*` (u. a. `signature.js`, `spec.js`, `manager.js`) und `src/updates/*` (u. a. `manifest-sign.js`, `signature.js`, `feed.js`).
- Im Modulordner gibt es keine `*.sig`-Dateien.
- Der gestagte Diff enthält nur Dateien unter `modules/it-systemintegration/` und `tests/knowledge-pilot.test.js`.
- `academy-module.json`: einzige Änderung `sizeBytes` 62019 → 62895. Es gibt keine Änderung bei Version, Berechtigungen (`content.read`, `progress.write` unverändert im sichtbaren Diff-Kontext) oder `status` (`private`). Die Modulversion bleibt 1.0.4.
- `payload-index.json` wurde angepasst (neue Einträge für Pilot-Dateien, neue Hashes für drei geänderte Dateien). Ich habe die SHA-256-Werte gegen die Dateien geprüft:

| Datei | Hash stimmt mit Index überein |
|---|---|
| `web/js/lf3-diagnose-kern.js` | ja (`dfeab815…8617`) |
| `web/js/lf3-diagnose-labor.js` | ja (`253cff8e…297d`) |
| `web/module/lf3-diagnose-labor.html` | ja (`335c6a43…e008`) |
| `web/js/startseite.js` | ja (`31ae1b35…02da`) |
| `web/js/navigation.js` | ja (`e136e1e3…3bd2e1a`) |
| `web/js/module-daten.js` | ja (`03a733d4…7c93`) |

## 7. Grenzen der Prüfung

- Nicht geprüft per Hash: `lf3-diagnose.css`, `startseite.css`, `course.json`.
- `src/modules/signature.js` und `src/updates/*` wurden nicht inhaltlich gelesen. Ich habe nur belegt, dass sie unverändert sind. Ob ein Paket oder Manifest nach der Index-Änderung neu signiert werden muss, ist nicht geprüft. Diese Entscheidung gehört in den Release-Prozess und nicht in diese Prüfung.
- `fortschritt.js` wurde nur bis Zeile 366 von 504 gelesen. Die Feststellung, dass die Pilot-ID nicht in `SCHLUESSEL` steht, stützt sich auf den vollständig gelesenen Schlüsselblock (Z. 5–103).
- Die Funktion `item()` in `navigation.js` mit leerer ID habe ich nicht im Detail gelesen. Ob die Navigation dort funktional korrekt hervorhebt, ist eine Aufgabe für QA.
- Die Tests in `tests/knowledge-pilot.test.js` wurden nicht ausgeführt. Dieser Bericht ersetzt weder QA noch Tests.
- Keine Laufzeitprüfung im Browser, keine Netzüberwachung. Die Aussage „keine Netzzugriffe“ beruht auf statischer Analyse.
- Die untracked Dokumente unter `docs/operation-academy/` wurden nicht auf Secrets durchsucht.
- Historische Prüfberichte wurden nicht als Beleg verwendet.

## 8. Empfehlung

Aus Sicherheitssicht spricht nichts gegen die lokale Weiterverwendung des Piloten. Vor einer Veröffentlichung braucht es QA durch GLaDOS, einen Commit mit festem Hash und die Entscheidung des Commanders. Dieser Bericht erteilt keine Stable-Freigabe.
