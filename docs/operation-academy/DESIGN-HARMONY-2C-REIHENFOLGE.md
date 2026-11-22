# Design Harmony 2C – verbindliche LF3-Rollout-Reihenfolge

**Stand:** 22.11.2026 · **Status:** Umsetzungsvorgabe nach Quellprüfung; keine Codeänderung, kein gerenderter Prüfnachweis, keine Freigabe.  
**Grundlage:** [Rollout 2B](DESIGN-HARMONY-2B-ROLLOUT.md), [Theme-Vertrag](DESIGN-HARMONY-2B-VERTRAG.md), Pilot `lf3-client-anbindung.html` (Z. 15–23).

## Reihenfolge und Änderung je Datei

Alle Pfade sind relativ zu `modules/it-systemintegration/web/module/`. Der Ist-Stand bestätigt die 2B-Reihenfolge: In allen fünf Dateien verwenden die drei genannten Flächenselektoren einen weißen Fallback außerhalb der Modulrollen, während der Text geerbt wird. Im Academy-Dunkelmodus kann dadurch heller Text auf Weiß stehen. Die Fokusfarbe der Auswahlkarte liegt ebenfalls außerhalb der Modulrollen. Das sind statische Befunde, keine gerenderten Messungen.

| Nr. | Datei | Selektoren im lokalen `<style>` | Ist → Soll | Bleibt unangetastet (zusätzlich zum gemeinsamen Ausschluss) |
|---|---|---|---|---|
| 1 | `lf3-dhcp.html` | `.step`, `.opt`, `.skizze` (Z. 15/17/22); `.opt:focus-within` (Z. 18); `.opt:has(:checked)` (neu) | A und B unten | Inhalt, Umbruch und `aria-label` des Ablaufbilds |
| 2 | `lf3-dns.html` | `.step`, `.opt`, `.skizze` (Z. 15/17/22); `.opt:focus-within` (Z. 18); `.opt:has(:checked)` (neu) | A und B unten | Anfrage-/Antwortskizze und `.netz-tabelle` einschließlich Beschriftung |
| 3 | `lf3-verbindung-eingrenzen.html` | `.step`, `.opt`, `.skizze` (Z. 15/17/22); `.opt:focus-within` (Z. 18); `.opt:has(:checked)` (neu) | A und B unten | Beobachtungsliste und `.netz-tabelle` |
| 4 | `lf3-fehlerbild-protokoll.html` | `.step`, `.opt`, `.skizze` (Z. 15/17/22); `.opt:focus-within` (Z. 18); `.opt:has(:checked)` (neu) | A und B unten | Vorgegebene Angaben, Supportprotokoll-Tabelle und Übergabetexte |
| 5 | `lf3-ipv4-konfiguration.html` | `.step`, `.opt`, **`.karte`** (Z. 15/17/22); `.opt:focus-within` (Z. 18); `.opt:has(:checked)` (neu) | A und B unten; keine `.skizze` einführen | Beide Karteninhalte und `aria-label`s; `overflow-wrap:anywhere` auf `.karte` beibehalten |

- **A – die drei Flächenselektoren je Datei:** `background:var(--flaeche,#fff)` → `background:var(--farbe-flaeche)`; kein lokales `color` → `color:var(--farbe-text)`; `border:2px solid var(--rahmen,#bdcde3)` → `border:2px solid var(--farbe-rahmen)`. Sonstige Deklarationen beibehalten.
- **B – Zustände auf `.opt` wie im Pilot:** `.opt:focus-within` von `outline:3px solid var(--fokus,#0754a6)` ohne lokalen Offset auf `outline:3px solid var(--farbe-akzent);outline-offset:2px` umstellen. Die bislang fehlende Regel `.opt:has(:checked){border-color:var(--farbe-akzent);font-weight:700}` ergänzen. Das ist der lokale Akzent-Fokus des Piloten, keine Änderung der zentralen Fokusrolle.
- **Gemeinsam unangetastet:** `.result` und `.result[hidden]` (kein weißer Flächen-Fallback; bestehender Primärrahmen bleibt), `.opt input`, Raster und restliches Layout; Lernziele, Aufgaben, Rückmeldungen, ARIA-Markup, Navigation, Lernstands- und Einstellungslogik. Nicht Teil des Rollouts: `lf3-client-anbindung.html`, `lf3-lernziel.html`, `lf3-abnahme.html`, andere Lernfelder, die übrigen Fundstellen, `src/`, Updatepfade, App-ID, Signaturprüfung und Berechtigungen. Keine pauschale Ersetzung.

Die Shell besitzt `academy.theme`; der einzige Transport ist `academy-theme` in der URL. `protocol.js` setzt daraus `data-academy-theme`; das Modul setzt den Modus nicht selbst. Im Academy-Dunkelmodus liefern die vorhandenen Aliase `--dw-surface` (`#141114`) und `--dw-text` (`#F7F4F5`) Fläche und Text. Hell und Kontrast verwenden vorhandene Modulwerte; keine neuen Hexwerte oder Theme-Kanäle.

## Prüfpunkt je Datei

Eine Datei nach der anderen ändern und im tatsächlichen Academy-iframe in Hell und Dunkel prüfen, bevor die nächste folgt. Ausgangszustand und sichtbare Zustände für Flächen, Texte, Auswahlkarten, Radio-Eingaben, Rückmeldungen und Fokus dokumentieren. Zusätzlich Kontrastmodus, 150 % und 200 % Zoom, Reflow bei geeigneter Frame-Breite, Textgrößen-/Abstandsregler, Lernstand und Einstellungen nach Neuladen sowie eine Screenreader-Stichprobe, sofern verfügbar, prüfen. Fehlende Nachweise offen markieren. Nach Änderung von Moduldateien den Nutzlastindex lokal aktualisieren und prüfen; diese reine Dokumentationsänderung berührt ihn nicht. Kein Commit, Push, Merge, Stable-Release oder Installation.

## Offener Fokusbefund – keine Codeänderung

Der Pilot und alle fünf Zielseiten haben einen Skip-Link `href="#main"` und `<main id="main" tabindex="-1">`: Das Ziel ist fokussierbar, aber kein regulärer Tab-Stopp. `styles.css` blendet den Skip-Link bei Fokus ein und setzt für `main:focus` `outline:none` (Z. 41–51/161). Der 2B-Probeablauf ruft zunächst `.click()` zum Schrittwechsel auf, der selbst `#main` fokussiert; anschließend versucht die Probe `.focus()` auf einem Button und liest `document.activeElement` sowie dessen Outline aus (`probe-main.js`, Z. 57–59/107–114). Im [2B-Messbeleg](design-harmony-2b/probe-academy.json) steht in Hell und Dunkel `MAIN` mit `outline-style: none`. Das erklärt keinen realen Tab-Verlauf und belegt keinen sichtbaren Fokus.

Im Academy-iframe beim Pilot und je Zielseite ohne Maus und ohne vom Test ausgelöste DOM-Aufrufe von `.focus()` oder `.click()` prüfen: Vom Shell-Fokus mit **Tab** in den Frame gehen, den sichtbar eingeblendeten Skip-Link mit **Enter** auslösen und Ziel, Scrollposition sowie eine sichtbare Orientierung am Ziel festhalten. Mit **Tab** zum ersten tatsächlich bedienbaren Element des sichtbaren Inhalts weitergehen, ohne den übersprungenen Kopf erneut zu durchlaufen. Mit **Shift+Tab** die Rückwärtsfolge und Rückkehr aus dem Frame prüfen. Schritte per Tastatur wechseln und danach am `MAIN` Ziel, sichtbare Orientierung und den nächsten Tab-Stopp erneut erfassen. In der Übung Radio-Optionen mit **Pfeiltasten/Leertaste**, Prüf- und Navigationsschaltflächen mit **Enter/Leertaste** bedienen. Pro Station Taste, Fokusziel und sichtbaren, nicht abgeschnittenen Indikator festhalten; auf übersprungene Bedienelemente, Fokusverlust und Fokusfallen achten. `activeElement` darf ergänzend protokolliert werden; die sichtbare Darstellung braucht einen eigenen Nachweis. Keine Freigabe aus einer DOM-Messung.
