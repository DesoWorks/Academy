# DESIGN HARMONY 2D – Sicherheitsprüfung (RoboCop)

Projekt: IT-Ausbildung / Academy, Modul it-systemintegration
Stand: Branch feature/phase-n1-release-connectivity, HEAD 46283bf (laut Lead; Branchname per git bestätigt), Arbeitsbaum schmutzig. Prüfung rein lesend, nichts geändert, kein Commit, kein Merge.

## Prüfgegenstand
1. `git diff` von `modules/it-systemintegration/web/css/styles.css`
2. Eintrag `web/css/styles.css` in `modules/it-systemintegration/content/payload-index.json`

## Bestätigte Beobachtungen
- Der CSS-Diff besteht aus genau einem Hunk, 11 hinzugefügte Zeilen, keine gelöschten. Ergänzt wird eine Regel `body:is([data-page=...] x6) main#main[tabindex="-1"]:focus` mit `outline: 3px solid var(--farbe-akzent); outline-offset: -3px;`.
- Die sechs data-page-Werte: lf3-client-anbindung, lf3-dhcp, lf3-dns, lf3-fehlerbild-protokoll, lf3-ipv4-konfiguration, lf3-verbindung-eingrenzen.
- Die alte Regel `main:focus { outline: none; }` steht unverändert davor.
- Der Patch enthält keine `url()`, `@import`, `@font-face`, `content:`, Attributselektoren mit Wertübernahme oder sonstige Ressourcenladung. Es werden nur vorhandene Variablen verwendet.
- Indexeintrag: sha256 `97a47a72…053d035`, size 24316 (vorher c1984ebd…, 23991). Die per `certutil` berechnete SHA-256 der Arbeitskopie stimmt exakt mit dem Indexwert überein. Die Größe wurde nicht separat gemessen; die Differenz von +325 Byte ist für 11 Zeilen plausibel, und der Hash passt bit-genau.
- Der Diff des Indexes enthält außerdem Änderungen für anzeige-glossar.js, navigation.js und die sechs lf3-*.html. Diese Einträge gehören nicht zum CSS-Patch und wurden hier nicht inhaltlich bewertet.

## Bewertung der Prüfpunkte
| Punkt | Ergebnis |
|---|---|
| Neue Nachrichtenkanäle | Keine. Reines CSS, kein Script, kein postMessage, kein Protokoll. |
| Sandbox | Nicht berührt. |
| CSP | Nicht berührt. Kein Inline-Style, keine neue Quelle nötig; die Regel liegt in der bestehenden Stylesheet-Datei. |
| App-ID | Nicht berührt. |
| Signatur | Nicht berührt. Änderung bleibt im Payload; Integrität läuft über den Index. |
| Updatekanäle | Nicht berührt. |
| Modulgrenzen | Gewahrt. Änderung nur in modules/it-systemintegration, Selektor nur auf sechs Seiten begrenzt. |
| Payload-Integrität | Indexhash passt zur Arbeitskopie. Die Installationsprobe hat das Paket laut Lead angenommen (nicht von mir nachgespielt). |

## Risikostufe
INFORMATIV. Kein Sicherheitsbefund. Keine KRITISCH/HOCH/MITTEL/NIEDRIG-Funde zu diesem Patch.

## Hinweis (INFORMATIV)
Das Regenerierskript liest Git-Blobs. Der Indexeintrag wurde deshalb von Hand auf die Arbeitskopie gesetzt. Nach dem Commit des Patches sollte der Index erneut gegen die committeten Dateien geprüft werden, damit Blob und Index nicht auseinanderlaufen.

## Grenzen der Prüfung
- Nicht geprüft: die übrigen schmutzigen Dateien (src/protocol.js, src/renderer/*, navigation.js, anzeige-glossar.js, lf3-*.html, build-info.json, tests). Sie stammen laut Lead aus 2B/2C bzw. anderen Teilen von 2D und gehören nicht zu diesem Auftrag. Insbesondere src/protocol.js und src/renderer/module.js sollten bei einer Prüfung der Nachrichtenkanäle separat angesehen werden.
- Keine Installation, kein Laufzeittest, keine WCAG-Bewertung.
- Dies ist eine Momentaufnahme des Arbeitsbaums, keine Freigabe für Produktion. Die Freigabe liegt beim Commander.

## Empfehlung
Aus Sicherheitssicht gegen den CSS-Patch und den zugehörigen Indexeintrag keine Einwände.
