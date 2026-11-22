# DESIGN HARMONY – DEV-Konsolidierung (Jarvis)

Stand: 2026-11-22, Branch `feature/phase-n1-release-connectivity`, HEAD `46283bf`, Arbeitsbaum uncommittet.
Methode: `git status`, `git diff` und gezielte Textsuche. Es wurden keine Tests und kein Build ausgeführt. Das ist eine Codeprüfung, keine QS-Abnahme.

## Ergebnis

Alle fünf Anforderungen sind im Code erfüllt. **Es wurde keine Anwendungsdatei geändert.** Es wurde nichts committet oder gepusht. `package.json`, `build/build-info.json` und `payload-index.json` wurden nicht angefasst.

## Prüfung je Anforderung

### 1. Zentrale Theme-Steuerung durch die Academy-Shell: erfüllt
- `src/renderer/shell.js`: `readTheme`, `applyTheme`, `writeTheme` und `activeTheme` gegen eine feste Allowlist (`hell`, `dunkel`, `kontrast`). Die Shell setzt `data-academy-theme` auf `<html>` beim Laden (`applyTheme(readTheme())`). Persistiert wird nur bei `storageSet … ok:true`.
- `src/renderer/module.js`: Der iframe bekommt `?academy-theme=<activeTheme()>` als einzigen Transportweg.
- `src/protocol.js`: `themeFromUrl` akzeptiert genau einen Wert aus der Allowlist, sonst `hell`. `applyTheme` setzt das Attribut serverseitig am `<html>` des Moduldokuments, ein vorhandenes Attribut wird ersetzt.
- `modules/.../web/js/anzeige-glossar.js`: `inAcademy = document.documentElement.hasAttribute("data-academy-theme")`. Dann gilt `academyTheme` als einzige Quelle (`dataset.theme = inAcademy ? academyTheme : current.theme`). Die Theme-Auswahl ist deaktiviert mit Hinweis. Der Zurücksetzen-Knopf lässt das Theme unberührt. Die Systemvorgabe `prefers-contrast` überschreibt in der Academy nichts (`!inAcademy && …`).
- `modules/.../web/js/navigation.js`: Interne `academy:`-Links, die auf HTML-Seiten desselben Moduls zeigen, tragen den Wert weiter (`withTheme`). Assets, Downloads und Sprünge im selben Dokument bleiben unverändert.
- `src/renderer/design-tokens.css`: Die Selektoren `:root[data-academy-theme=…]` haben höhere Spezifität als die Legacy-Regeln `html[data-theme]` in `styles.css` (Zeilen 440 und 451).
- Standalone-Verhalten ohne `data-academy-theme` bleibt erhalten.

### 2. Sechs LF3-Seiten mit semantischen Farbvariablen: erfüllt
Gelesen: `lf3-client-anbindung`, `lf3-dhcp`, `lf3-dns`, `lf3-fehlerbild-protokoll`, `lf3-ipv4-konfiguration`, `lf3-verbindung-eingrenzen` (alle `web/module/*.html`).
- `.step` (Zeile 15) und `.opt` (Zeile 17) nutzen `var(--farbe-rahmen)`, `var(--farbe-flaeche)` und `var(--farbe-text)`.
- Die Suche nach `fff` ergibt in keiner der sechs Dateien einen Treffer, also keine festen Weißflächen.
- `.skizze` nutzt dieselben Variablen (Zeile 23). In `lf3-ipv4-konfiguration.html` heißt die Klasse `.karte` (Zeile 23). Die Vorgabe nennt `.skizze`, die Seite enthält dort aber kein `.skizze`. Die Umsetzung ist gleichwertig.
- Die Variablen sind in `styles.css` für alle drei Modi definiert (Zeilen 6–11, 441–443, 452–453).
- `lf3-dhcp.html`: zusätzlich `.opt:has(:checked)`, ein Auswahlzustand über Rahmenfarbe und Fettschrift. Das ist eine reine Darstellung, die Didaktik bleibt unberührt.

### 3. Tastaturfokus auf MAIN nur für diese sechs Seiten: erfüllt
- `styles.css` Zeilen 162–171: `body:is([data-page="lf3-client-anbindung"], … sechs Werte …) main#main[tabindex="-1"]:focus { outline: 3px solid var(--farbe-akzent); outline-offset:-3px }`. Das Basisverhalten `main:focus { outline:none }` bleibt für alle anderen Seiten.
- Alle sechs Dateien haben `<body data-page="…">` (Zeile 26) mit dem passenden Wert und `<main id="main" tabindex="-1">` (Zeile 48).

### 4. Skip-Link vorhanden und auf den Hauptinhalt gerichtet: erfüllt
- Alle sechs Dateien: `<a class="skip-link" href="#main">Direkt zum Inhalt springen</a>` (Zeile 27), `<main id="main">` als Ziel (Zeile 48).
- `styles.css` Zeilen 41–51: `.skip-link` ist außerhalb des Bildschirms und wird bei `:focus` sichtbar.

### 5. Lernlogik und Lernstandsspeicherung nicht umgebaut: erfüllt (nach Diff-Sicht)
- Geänderte Dateien unter `modules/` und `src/`, ohne die sechs HTML-Seiten und `payload-index.json`: `styles.css`, `anzeige-glossar.js`, `navigation.js`, `protocol.js`, `design-tokens.css`, `host.css`, `module.js`, `settings.html`, `settings.js`, `shell.css`, `shell.js`. Keine Datei für Quiz, Fortschritt oder Lernstände ist darunter.
- `anzeige-glossar.js` behält den Speicherschlüssel `it-ausbildung.anzeige.v1`. Er enthält nur Leseoptionen, kein Lernstand. Neu ist nur der Schlüssel `academy.theme` über die vorhandene `storageSet`-Schnittstelle.
- Die HTML-Diffs der sechs Seiten betreffen nur den `<style>`-Block (je +6/−3 Zeilen). Ich habe Diff-Zeilen von `lf3-dhcp.html` gelesen. Die übrigen fünf habe ich per Suche und Statistik gegengeprüft, nicht Zeile für Zeile.

## Beobachtungen ohne Änderung
- `styles.css` Zeile 490 verwendet `var(--farbe-aktiv-tekst)` (vermutlich Tippfehler für `-text`). Das stammt nicht aus dem aktuellen Diff, ich habe es nicht angefasst. Vorschlag: eigenes Ticket, vorher in allen Modi prüfen, ob die Variable irgendwo definiert ist.
- `src/protocol.js` meldet eine CRLF-Warnung von Git. Sie ist unkritisch, sollte aber beim Stagen bedacht werden (Zeilenenden, Blob-Hash für den Nutzlastindex).
- Nicht geprüft: tatsächliche Darstellung in Hell, Dunkel und Kontrast, 150 % und 200 %, Tastaturlauf, Testsuite. Das gehört in Phase 2 (GLaDOS). Ebenfalls offen bleiben DHCP-Didaktik und die vollständige WCAG-Prüfung. Eine WCAG-Konformität wird hier nicht behauptet.

## Änderungen durch diese Prüfung
Nur diese Datei: `docs/operation-academy/DESIGN-HARMONY-DEV-KONSOLIDIERUNG.md`.
