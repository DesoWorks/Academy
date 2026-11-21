# Unabhängiger QA-Bericht – Operation Academy Phase L

**Prüfgegenstand:** DesoWorks Academy, Phase L – Module Experience & Corporate Identity  
**Prüfstand laut Lead:** Branch `feature/phase-l-module-experience`, Commit `ab80dfb`; `main` nicht angefasst, kein Push. Diese Git-Angaben habe ich in dieser Teilprüfung nicht selbst mit Git verifiziert.  
**Scope:** Lesende Prüfung der im Projekt vorliegenden Quelldateien, Spezifikationsdokumente und PNG-Belege. Kein Quellcode geändert.  
**Einschränkungen:** Keine Shell in dieser Teilprüfung; `npm test` nicht selbst ausgeführt. Keine interaktive Laufzeitbedienung.  

## Gesamturteil: EINGESCHRÄNKT

Die Quellstruktur und vorgelegten Screenshots stützen mehrere zentrale Phase-L-Ziele: ein zentraler Academy-Kopf, direkte Modulöffnung über `module.js`, ein breiter iframe-Arbeitsbereich und eine gemeinsame Token-/Host-CSS-Einbindung. Der Modulmodus blendet die Shell-Seite per `overflow:hidden` aus. In den gezeigten Screenshots ist rechts jedoch eine Scrollbar im eingebetteten Lernbereich sichtbar. Die verfügbare Evidenz reicht nicht, um zu beweisen, dass es sich in jedem Fensterzustand um exakt eine einzige Scrollfläche handelt oder dass jede Modulseite ohne unerwünschte weitere Scrollbereiche funktioniert.

Das Ergebnis ist deshalb **nicht vollständig bestanden**. Das ist eine unabhängige Teilprüfung, keine Eigenabnahme. Die vom Lead gemeldeten 67 bestandenen Tests sind ein Lead-Bericht, kein von mir ausgeführter Testlauf.

## Prüfung und Befunde

### 1. Startseite und Corporate Identity

**Selbst gelesen:** `src/renderer/shell.js`, `src/renderer/shell.css`, `docs/operation-academy/DESIGN-SYSTEM.md`.  
**Selbst im Bild gesehen:** `fenster-l-start.png`.

- Die Shell-Navigation enthält Startseite, Meine Lernbereiche, Modul-Katalog sowie die übrigen Core-Bereiche; aktuelle Seite wird per `aria-current` ausgezeichnet.
- Die Startseite zeigt das Signet und den Namen „DesoWorks Academy“, den dunklen Hintergrund, eine korallfarbene Akzentkante und die Begrüßung. Das passt sichtbar zum dokumentierten Token-System.
- Die Startansicht hat rechts eine sichtbare Scrollbar; der Screenshot ist ein Ausschnitt der Startseite und kein Beleg für eine scrollbarfreie Startseite. In diesem Kontext ist Seiten-Scrollen nicht per se ein Defekt.
- Der Designsystem-Bericht dokumentiert die lokale Website-Token-Quelle, weil `desoworks.dev` laut Dokument nicht zugänglich war (HTTP 401). Das war nicht von mir selbst nachgeprüft. Das Dokument nennt als konkrete zentrale Datei `src/renderer/design-tokens.css`; ich habe die Datei in diesem QA-Lauf nicht gelesen. Die Farbwerte sind damit für diese Prüfung aus dem Design-Bericht übernommen, nicht unabhängig gegen Website-Assets validiert.

**Bewertung:** Teilweise gestützt; visuelle Konsistenz ist im Startseitenbild erkennbar. Vollständige Responsive-/Komponentenprüfung nicht erfolgt.

### 2. Katalog-Seite

**Selbst gelesen:** `src/renderer/catalog.html`.

Die Katalogdatei existiert unter `src/renderer/catalog.html`; sie enthält Shell-Navigation, Katalog-Kartencontainer, lokalen Kataloghinweis und eine Paketordner-Installationsaktion. Im Shell-Navigationsarray ist ein Link zum Katalog vorhanden.

**Nicht geprüft:** Das tatsächliche Laden, Befüllen und Bedienen des Katalogs zur Laufzeit. Ein Vorhandensein der HTML-Datei beweist nicht den erfolgreichen Katalogablauf.

### 3. Modulöffnung über `module.js` und Navigation

**Selbst gelesen:** `src/renderer/module.html`, `src/renderer/module.js`, `src/renderer/shell.js`.

- `module.html` lädt `shell.js` und danach `module.js`; der Modulbereich startet zunächst verborgen.
- `module.js` lädt die Modulübersicht, liest nach dem Refresh eine Modul-ID aus dem URL-Hash und ruft `show(id)` auf. `show` verwendet `api.moduleOpen(id)` und erstellt bei `hosted-web` einen iframe mit `academy://<Modul-ID>/<Einstieg>`.
- Der iframe setzt `title`, `sandbox="allow-scripts allow-forms allow-same-origin"` und `referrerPolicy="no-referrer"`.
- Bei erfolgreicher Öffnung werden Modulwechsel und Modultitel angezeigt; ein Auswahlwechsel öffnet das gewählte Modul erneut. Der Shell-Navigationslink führt weiterhin zu Startseite und Katalog, wodurch die übergeordnete Anwendung erkennbar bleibt.
- Die Einblendung des Vollflächenmodus ist an `hosted-web` gebunden. Andere Modularten laufen in einem anderen Rendering-Pfad; deren Layout-/Navigationsverhalten habe ich nicht zur Laufzeit geprüft.
- Beim Fehlerpfad wird `modul-offen` entfernt, aber `view.hidden` wird im gezeigten Code nicht wieder gesetzt. Nach bereits erfolgreicher Öffnung und anschließend fehlgeschlagener Modulöffnung könnte daher die vorherige Ansicht sichtbar bleiben; dies ist ein **begründeter Verdacht aus dem Code**, nicht reproduziert.

**Bewertung:** Codepfad nachvollziehbar; tatsächliche Bedienung und Fehler-/Wechselabläufe nicht interaktiv reproduziert.

### 4. Scrollverhalten und Arbeitsbereich

**Selbst gelesen:** `src/renderer/shell.css`, `src/renderer/host.css`, `src/renderer/module.js`.  
**Selbst im Bild gesehen:** Modulansichten 1280×720, 1280×840, 1920×1080 und F11.

- `body.modul-offen` setzt die Academy-Shell auf Flex-Layout und `overflow:hidden`; der Hauptbereich und iframe wachsen über Flexbox und erhalten `min-height:0`. Das ist eine plausible strukturelle Lösung gegen eine zusätzliche Shell-Seiten-Scrollbar.
- Die Screenshots zeigen jeweils eine sichtbare Scrollbar an der rechten Kante des eingebetteten IT-Lernbereichs. Das entspricht dem iframe als Scrollverantwortlichem und belegt **nicht** eine sichtbare Scrollbar der Shell. Die Scrollbar der eingebetteten Seite bleibt bei längerem Inhalt vorhanden; sie ist nicht als doppelte sichtbare Shell-Scrollbar erkennbar.
- Die IT-Ausbildung behält sichtbar ihre eigene blaue Kopfzone und linke Lernnavigation. Das ist als Modul-Navigation plausibel und unterscheidet sich von der früheren doppelten globalen Academy-Navigation.
- Das Modul nutzt bei den vorgelegten Auflösungen große verfügbare Breite. Auf 1920er Breite liegt der Lerninhalt allerdings in einem deutlich schmaleren, zentrierten Hauptbereich mit großen Seitenflächen; das ist das Layout der eingebetteten Lernseite, kein Beleg für eine schmale Academy-Hülle.
- Die Statuszeile „Desktop 45.4.1 · Kanal dev · Bereit“ sitzt im Academy-Kopf oberhalb der Modulkontextzeile und überdeckt im sichtbaren Bild keinen Lerninhalt. Damit ist das Kriterium „Statuszeile nicht mehr über dem Inhalt“ in den gezeigten Ansichten visuell gestützt.

**Bewertung:** Shell-Scrollbar-Code-seitig verborgen; eine Scrollfläche im iframe ist in allen Modulbildern sichtbar und für den langen Lerninhalt erwartbar. Ohne DOM-/Laufzeitmessung kann ich nicht abschließend bestätigen, dass in allen Zuständen genau eine und keine zusätzliche Scrollfläche aktiv ist.

### 5. Fenstergrößen und F11

**Selbst im Bild gesehen:**

- `fenster-l-modul-1280x720.png` (Datei 1264×655 Pixel)
- `fenster-l-modul-1280x840.png` (Datei 1264×775 Pixel)
- `fenster-l-modul-1920x1080.png` (Datei 1904×1015 Pixel)
- `fenster-l-modul-f11.png` (Datei 2560×1440 Pixel)

Die drei normalen Fensterbilder zeigen dieselbe Academy-Kopf-/Modulkontextstruktur bei den angegebenen Zielmaßen, mit dem Lernbereich darunter. Das F11-Bild zeigt eine Vollbildansicht mit 2560×1440 Pixeln und sichtbarer rechter Scrollbar im Modul. Ich habe die PNG-Pixel selbst betrachtet; die in `MODULE-EXPERIENCE.md` bzw. `fenster-l-probe.json` notierten Fenster-Bounds und den `fullscreen`-Zustand habe ich nicht selbst zur Laufzeit gemessen.

**Bewertung:** Visuelle Größenbelege vorhanden; erneute Erfassung oder echte F11-Tastenbedienung durch mich nicht erfolgt.

### 6. Erhalt der IT-Lernseiten

**Selbst geprüft:** Dateisuche in `modules/it-systemintegration/web/` listet die vorhandenen HTML-Einstiegs- und Lernseiten, einschließlich zahlreicher LF1–LF9-Dateien und `index.html`. Die Modul-Laufzeit bindet laut `src/protocol.js` Host-CSS in HTML ein; `src/renderer/host.css` verwendet für die allgemeinen Regeln `:where()`, um spezifische Modulregeln nicht zu überstimmen.

**Nicht unabhängig nachgewiesen:** Dass keine IT-Seite gegenüber dem Basiscommit verändert wurde. Für einen zuverlässigen Vorher/Nachher-Vergleich wäre Git-Diff bzw. der Vorgängerstand erforderlich; die Shell ist für diese Teilprüfung nicht verfügbar. Die Aussage in `MODULE-EXPERIENCE.md`, 102 HTML-Seiten seien nicht umgeschrieben worden, ist eine Dokumentations-/Lead-Angabe und keine von mir verifizierte Diff-Aussage.

**Bewertung:** Vorhandene Inhalte und nicht-invasive CSS-Strategie sind plausibel; vollständiger Erhalt gegenüber dem Vorher-Commit bleibt unbestätigt.

## Teststatus und Trennung der Belege

| Aussage | Herkunft | QA-Einordnung |
| --- | --- | --- |
| Branch `feature/phase-l-module-experience`, Commit `ab80dfb`, `main` unangetastet, kein Push | Lead-Kontext | Nicht durch Git-Kommandos von mir verifiziert. |
| `npm test`: 67 bestanden, 0 fehlgeschlagen | Lead-Kontext | Nicht mein Lauf; nicht als selbst bestandener Test ausgewiesen. |
| Fenster-Bounds, `overflow: hidden`, iframe-Größe 1904×832 und Vollbildmetadaten | `fenster-l-probe.json` | Dokumentierter Probe-Output; hier nicht neu erzeugt. |
| Start-/Modul-/F11-Darstellung | PNG-Dateien | Von mir visuell betrachtet; statische Bildbelege, keine eigene Live-Bedienung. |
| Katalog vorhanden, Modul-Hash-Auflösung, iframe-Erzeugung, Shell-Overflow-Regel | Quelldateien | Von mir gelesen; Codeinspektion, keine Laufzeitreproduktion. |

## Schwerste offene Punkte

1. **IT-Seiten unverändert:** Kein eigener Git-Diff zwischen Basiscommit und Phase L; die Forderung, die Lerninhalte vollständig zu erhalten, ist damit nicht hinreichend unabhängig belegt.
2. **Scrollverhalten über alle Fälle:** Code und Bilder stützen versteckte Shell-Scrollbar plus iframe-Scrollbar, aber es fehlt eine Laufzeitprüfung, die Scroll-Eigentümerschaft und Seiten mit eigenen Tabellen/Editoren systematisch abdeckt.
3. **Interaktive Regressionen:** Katalog laden/installieren, Navigation und Modulwechsel sowie Fehlerpfade nicht manuell oder automatisiert durch mich geprüft. Zusätzlich ist das Nicht-Verbergen der vorherigen Ansicht im Fehlerpfad von `show()` ein nicht reproduzierter Codeverdacht.

**Freigabe:** Keine Produktionsfreigabe ausgesprochen. Für ein uneingeschränktes „bestanden“ fehlen unabhängige Laufzeitergebnisse und ein verifizierter IT-Seiten-Diff. Die vom Lead gemeldete Suite kann diese Evidenz ergänzen, ersetzt sie in diesem Bericht aber nicht.
