# Operation Design Harmony – Etappe 2D: Messwertliste

**Stand: 22.11.2026.** Der Skip-Link wurde auf **6 von 6** LF3-Pilotseiten im Academy-iframe erreicht und per Enter aktiviert. Die weiteren Messwerte stammen aus einer DHCP-Stichprobe. Das ist **keine WCAG-Freigabe**.

Quellen: [`probe-keys.json`](design-harmony-2d/probe-keys.json) für Fokus, Themes, Zoom, Reflow und Lesedarstellung; [`probe-button.json`](design-harmony-2d/probe-button.json) für die DHCP-Schrittnavigation und das Antwortfeld. Die Tabellen übernehmen gespeicherte Messwerte; die Summen zählen die zutreffenden Einträge in `pages`. Es wurden keine neuen Messläufe durchgeführt.

## Belegte Werte

### Tastatur und Fokus auf allen sechs Seiten (Dunkel)

Die Probe verwendete Electron-`sendInputEvent` für Tab bis zum Skip-Link und CDP-Tastaturereignisse für die anschließende Bedienung. Die Probe setzte den Fokus auf kein DOM-Element und verwendete kein DOM-`dispatchEvent`. Die Tab-Zahl zählt nur die Tastendrücke bis zum Skip-Link aus der jeweiligen Ausgangslage der Probe; sie ist keine allgemeine Aussage über die Tab-Reihenfolge der Shell.

| Seite | Tab bis Skip-Link | Enter im iframe als vertrauenswürdig erfasst (`isTrusted`) | Fokus nach Enter | Nächster Tab in `MAIN` |
|---|---:|---|---|---|
| `lf3-client-anbindung.html` | 12 | Ja | `MAIN#main` | `SUMMARY` „Client“ |
| `lf3-dhcp.html` | 1 | Ja | `MAIN#main` | `SUMMARY` „DHCP“ |
| `lf3-dns.html` | 1 | Ja | `MAIN#main` | `SUMMARY` „DNS“ |
| `lf3-fehlerbild-protokoll.html` | 1 | Ja | `MAIN#main` | `SUMMARY` „Befund“ |
| `lf3-ipv4-konfiguration.html` | 1 | Ja | `MAIN#main` | Link „Lektion 1: Die IPv4-Adresse“ |
| `lf3-verbindung-eingrenzen.html` | 1 | Ja | `MAIN#main` | `SUMMARY` „Eingrenzung“ |

- **6/6:** Skip-Link „Direkt zum Inhalt springen“ erreicht; danach vertrauenswürdiges Enter-Ereignis im iframe und vertrauenswürdiges `focusin` an `MAIN#main` erfasst. Der nächste Tab führte zu einem Element innerhalb von `MAIN`.
- **6/6:** Ein anschließender Umschalt+Tab-Schritt erreichte „4 · Abschluss“ außerhalb von `MAIN`, aber noch im `IFRAME.modul-frame`.
- **Berechnete Fokuskontur:** Skip-Link und Schaltfläche „4 · Abschluss“ jeweils durchgezogen `3 px`, `rgb(255, 83, 105)`, Versatz `2 px`; `MAIN` dieselbe Kontur mit Versatz `−3 px`. Beim nächsten Tab war die Kontur ebenfalls durchgezogen `3 px`, Versatz `2 px`: `rgb(181, 213, 255)` bei den fünf `SUMMARY`-Elementen und `rgb(255, 83, 105)` beim IPv4-Link.

### DHCP: Schrittnavigation, Antwortfeld und Rückweg zur Shell

| Probe | Beobachtung |
|---|---|
| `probe-keys.json` | Der Enter-Versuch am Button „Weiter zum Ablauf“ ließ den Fokus auf dem Button. In diesem Lauf wurde kein Radio-Input erfasst (`radio: null`; der Prüfschnappschuss `checked` meldete `SUMMARY`). |
| `probe-keys.json` | Wiederholtes Umschalt+Tab führte aus dem iframe zurück zum Shell-Auswahlfeld `SELECT#modul-wechsel`. Die Anzahl der Tastendrücke für den Rückweg ist nicht im JSON gespeichert. |
| `probe-button.json` | **4** Tab-Stopps ab `MAIN`: „DHCP“ → „IPv4-Konfiguration eines Clients lesen“ → „IPv4“ → „Weiter zum Ablauf“. Leertaste: Fallbeispiel sichtbar (`caseVisible: true`), Fokus auf `#main`. |
| `probe-button.json` | Danach **2** Tab-Stopps: „Zurück“ → „Weiter zur Übung“. Leertaste: Übung sichtbar (`exercise: true`), Fokus auf `#main`. Bei beiden Übergängen war die berechnete Kontur `rgb(255, 83, 105) solid 3px`. |
| `probe-button.json` | Ein per Tab erreichter Radio-Input wechselte per Leertaste von `checked: false` auf `checked: true`; der Fokus blieb auf dem Radio-Input. |

### DHCP: Themes

Farbwerte aus `a11y.colors` für die vom Skript ausgewählte Skizze (ersatzweise `MAIN`). Breiten in CSS-Pixeln, jeweils `scrollWidth / clientWidth`. Der Skip-Link war in allen drei Theme-Stichproben erreichbar, und der Fokus lag nach Enter auf `MAIN#main`.

| Theme | Text (RGB) | Fläche (RGB) | iframe-Dokument | Schrittnavigation | Konturfarbe `MAIN` nach Enter |
|---|---|---|---:|---:|---|
| Dunkel | `247, 244, 245` | `20, 17, 20` | 1249 / 1249 | 907 / 907 | `rgb(255, 83, 105)` |
| Hell | `27, 36, 48` | `255, 255, 255` | 1249 / 1249 | 907 / 907 | `rgb(29, 95, 180)` |
| Kontrast | `0, 0, 0` | `255, 255, 255` | 1249 / 1249 | 907 / 907 | `rgb(0, 58, 112)` |

Die `MAIN`-Kontur war in allen drei Fällen durchgezogen `3 px` mit Versatz `−3 px`. Die JSON-Datei meldet für die drei Aufnahmen ein nicht leeres Electron-Bild (`blank: false`): [Dunkel](design-harmony-2d/lf3-dhcp-enter-dunkel.png), [Hell](design-harmony-2d/lf3-dhcp-enter-hell.png), [Kontrast](design-harmony-2d/lf3-dhcp-enter-kontrast.png). Das Feld bestätigt nicht die visuelle Qualität der Kontur.

### DHCP: Zoom, Reflow und Lesedarstellung

Die Reflow-Probe stellte den Shell-Inhaltsbereich bei **100 %** auf **320 × 720** ein; im iframe wurden **305 CSS-px** `innerWidth` gemessen. Bei Zoom und Reflow bezieht sich `overflow` im iframe auf das Dokumentwurzelelement, in der Shell nur auf das erste `nav`. Die Probe setzt `overflow: true` erst bei `scrollWidth > clientWidth + 1`; die tatsächlichen Breiten des iframe-Wurzelelements sind für diese drei Prüfpunkte nicht im JSON gespeichert.

| Einstellung | iframe `innerWidth` (CSS-px) | iframe `overflow` | Shell-`nav` `scrollWidth / clientWidth` (CSS-px) | Shell-`nav` `overflow` |
|---|---:|---|---:|---|
| Zoom 150 % | 843 | `false` | 811 / 811 | `false` |
| Zoom 200 % | 624 | `false` | 593 / 593 | `false` |
| Reflow: 320 × 720 bei 100 % | 305 | `false` | 273 / 273 | `false` |

Lesedarstellung (`a11y.reading`): Einstellung **150 %** und „mehr Abstand“ per gespeicherten Einstellungen gesetzt. Gemessen: `--text-scale: 1.5`, Abstandsklasse aktiv (`spacing: true`), berechnete Schriftgröße **17 px** und Zeilenhöhe **32,3 px** am Stichprobenelement. Das Theme blieb `dunkel`; die lokale Farbauswahl war deaktiviert (`selectDisabled: true`). Ein Vergleichswert bei Normaleinstellung ist nicht gespeichert; auch die Bedienung der Einstellregler wurde damit nicht nachgewiesen.

## Offen oder nicht vollständig belegt

- **Tastatur:** Das Verlassen des iframes ist nur rückwärts auf DHCP belegt. Vollständige Navigation in beiden Richtungen und Ausschluss von Tastaturfallen in allen Schritten auf allen sechs Seiten bleiben offen. Der Enter-Versuch am DHCP-Weiter-Button belegt keinen Schrittwechsel; der zweite Lauf belegt die Leertaste nur für die beobachteten DHCP-Schaltflächen und einen Radio-Input. Andere Antwortfelder und Bedienelemente sind in diesen Quellen nicht abgedeckt.
- **Fokus und Themes:** Berechnete Konturen ersetzen keine vollständige visuelle Prüfung auf Sichtbarkeit, Kontrast, Abschneiden oder Überdecken. Hell und Kontrast sind hier nur für DHCP erfasst; kein flächendeckender visueller oder farbmetrischer Nachweis.
- **Zoom, Reflow und Lesen:** Die DHCP-Stichprobe belegt nur die protokollierten Breiten und Overflow-Indikatoren. Inhaltsverlust, Überlagerungen, vollständige Nutzbarkeit und mögliche Scrollbereiche innerhalb anderer Elemente wurden damit nicht auf allen Seiten ausgeschlossen. Zoom 150/200 %, Reflow und Text-/Abstandseinstellungen auf den übrigen fünf Seiten bleiben offen. Kein Nachweis der Konformität mit WCAG 1.4.10.
- **Screenreader:** Nicht gestartet; kein erfasster laufender Screenreader (`running: []`) und keine Stichprobe (`sampled: false`). Ansagen, Landmarks und Feldbeschriftungen mit Screenreader bleiben ungeprüft.
