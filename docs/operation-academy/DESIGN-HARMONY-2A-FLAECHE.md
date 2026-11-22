# OPERATION ACADEMY – DESIGN HARMONY / Etappe 2A: Inventar `--flaeche`

**Stand:** 22.11.2026 · Arbeitsbaum auf `46283bf`, nach der LF3-Pilotänderung.

Im Arbeitsbaum stehen **148 wörtliche Treffer in 85 Dateien**. **144** nennen `#fff` als Fallback: **137** CSS-Verwendungen im Anwendungscode und **7** Zitate in der Projektdokumentation. Der Anwendungscode allein enthält **141 Verwendungen in 80 Dateien**; die anderen vier haben keinen Fallback. Andere Fallback-Werte wurden nicht gefunden.

| Bereich / Kandidat | Treffer | Dateien | mit `#fff` |
| --- | ---: | ---: | ---: |
| Modul-HTML · `inline-fallback` | 137 | 78 | 137 |
| Modul-HTML · `andere` | 1 | 1 | 0 |
| Shell-CSS · `shell-alias` | 3 | 1 | 0 |
| Projektdokumentation · `andere` (nur Zitate) | 7 | 5 | 7 |
| **Gesamt** | **148** | **85** | **144** |

## Beleg und Abgrenzung

Nur für `modules/it-systemintegration/web/module/lf3-client-anbindung.html` ist in [Etappe 1](DESIGN-HARMONY.md#der-gemeldete-dunkelmodus-fehler) am **Quelltext** belegt, dass der weiße Hintergrund-Fallback neben dem hellen Dunkelmodus-Text (`#f2f5f8`) stand: `.step` (Zeile 15), `.opt` (17) und `.skizze` (22) im Git-Ausgangsstand. Alle drei waren `inline-fallback` mit `#fff`. Im geprüften Arbeitsbaum ist das Muster in dieser Datei nicht mehr vorhanden. Die historischen drei Vorkommen sind in der obigen Arbeitsbaum-Zählung nicht enthalten. Der Git-Ausgangsstand zählt separat **144 tatsächliche Verwendungen in 81 Dateien**, davon **140** mit `#fff`.

**Die übrigen Fundstellen wurden nicht gerendert und bleiben visuell ungesehen.** Die Klassen beschreiben nur, wo und wie die Variable verwendet oder zitiert wird. Keine Eintragung ist als bestätigter Darstellungsfehler eingestuft; dieses Inventar ersetzt keine visuelle Abnahme.

## Fundstellen im Anwendungscode

Alle Einträge in dieser Tabelle betreffen die CSS-Eigenschaft `background`. Mehrere Regeln in derselben Quellzeile sind einzeln aufgeführt, durch Semikolon getrennt. Fallback und Kandidatenklasse gelten jeweils für alle Einträge der Tabellenzeile.

| Pfad | Zeile: Selektor | Fallback | Kandidat |
| --- | --- | --- | --- |
| `modules/it-systemintegration/web/module/lf1-ausbildungsbetrieb.html` | 15: `.rollen-karte`; 22: `.rollen-option` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-handlungsspielraum.html` | 2: `.case`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-leitbild.html` | 15: `.rollen-karte`; 22: `.rollen-option` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-markt-kundschaft.html` | 9: `.market-card`; 9: `.option` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-organisation.html` | 2: `.org-card`; 2: `.quiz-option` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-praesentation.html` | 2: `.card`; 2: `.option` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-qualitaet.html` | 2: `.card`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-reflexion.html` | 2: `.case`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-weiterbildung.html` | 2: `.card`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf1-wertschoepfung.html` | 2: `.step-card`; 2: `.answer` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-angebot.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-angebote.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-auswertung.html` | 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-beschaffung.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-einrichten.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-energie.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-kriterien.html` | 2: `.step`; 2: `.opt`; 2: `.krit li` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-kundenbedarf.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-sichere-auswahl.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-technische-daten.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-uebergabe.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf2-varianten.html` | 2: `.step`; 2: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf3-abnahme.html` | 51: `.karte, .leiste` | keiner | `andere` |
| `modules/it-systemintegration/web/module/lf3-dhcp.html` | 15: `.step`; 17: `.opt`; 22: `.skizze` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf3-dns.html` | 15: `.step`; 17: `.opt`; 22: `.skizze` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf3-fehlerbild-protokoll.html` | 15: `.step`; 17: `.opt`; 22: `.skizze` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf3-ipv4-konfiguration.html` | 15: `.step`; 17: `.opt`; 22: `.karte` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf3-verbindung-eingrenzen.html` | 15: `.step`; 17: `.opt`; 22: `.skizze` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf4-handlungen.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf4-risiken.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf4-schutzbedarf.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf4-schutzziele.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf4-vorfall.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf4-zugang.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-ablage.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-ablauf.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-anweisung.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-doku.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-einordnen.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-format.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-prozess.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-testfall.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-werte.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf5-wiederholung.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-anfrage.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-fragen.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-gespraech.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-kontakt.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-level.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-loesung.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-notiz.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-qualitaet.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-sla.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-status.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf6-ursache.html` | 15: `.step`; 17: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-auswahl.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-fluesse.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-pruefung.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-schnittstelle.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-sicherheit.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-system.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-unterlage.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf7-zusammenfuehren.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-aufbereiten.html` | 16: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-auswahl.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-konzept.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-quellen.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-recht.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-reflexion.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-struktur.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf8-uebergabe.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-anforderung.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-dienste.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-eignung.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-infrastruktur.html` | 16: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-ist.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-schutz.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-standard.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `modules/it-systemintegration/web/module/lf9-zukunft.html` | 15: `.opt` | `#fff` | `inline-fallback` |
| `src/renderer/shell.css` | 90: `.navigation a:hover`; 116: `.bereich`; 129: `.karte` | keiner | `shell-alias` |

`src/renderer/shell.css:7` definiert den Alias `--flaeche: var(--dw-surface)`. `lf3-abnahme.html:16` definiert sein eigenes `--flaeche: #fff`; die Deklaration ist kein Fallback und kein zusätzlicher Aufruf. Auch die Shell-Definition selbst ist kein Treffer.

## Wörtliche Treffer in der Projektdokumentation

Hier enthält der **zitierte Ausdruck** `#fff` als Fallback. Markdown setzt damit selbst keine CSS-Regel um.

| Pfad | Zeile: zitierte Regel / Kontext | Fallback im Zitat | Kandidat |
| --- | --- | --- | --- |
| `docs/operation-academy/DESIGN-HARMONY-2A-TOKENS.md` | 27: historische `background`-Regeln für `.step`, `.opt`, `.skizze` | `#fff` | `andere` |
| `docs/operation-academy/DESIGN-HARMONY-ANALYSE.md` | 21: zitierte `background`-Regeln für `.step`, `.skizze`, `.opt` | `#fff` | `andere` |
| `docs/operation-academy/DESIGN-HARMONY-ARCHITEKTUR.md` | 38: zitierte `background`-Regeln für `.step`, `.opt`, `.skizze` | `#fff` | `andere` |
| `docs/operation-academy/DESIGN-HARMONY-SECURITY.md` | 9: Beschreibung des LF3-Fallbacks; 41: Beispiel für einen Fallback-Wert | `#fff` | `andere` |
| `docs/operation-academy/DESIGN-HARMONY.md` | 49: zitierte `background`-Regeln für `.step`, `.opt`, `.skizze`; 56: wörtliches Suchmuster der früheren Suche | `#fff` | `andere` |

## Reproduzierbare Suche

Arbeitsbaum: alle versionierten und nicht ignorierten unversionierten Projekttextdateien (einschließlich Markdown), kein Git-Interna, keine ignorierten Build-Kopien in `dist/`, keine Abhängigkeiten in `node_modules/` und keine Binärdateien. Der Bericht selbst ist ausgeschlossen. `--farbe-flaeche` ist ein anderes Token und wird nicht gezählt.

```sh
 git grep --untracked -I -n -o -F -e "var(--flaeche" -- ":(exclude)docs/operation-academy/DESIGN-HARMONY-2A-FLAECHE.md"
 git grep -I -n -o -F -e "var(--flaeche" 46283bf --
```

`-o` gibt jedes Vorkommen einzeln aus, auch wenn mehrere Treffer in derselben minifizierten HTML-Zeile stehen. Ein unabhängiger Scan der Dateiliste von `git ls-files --cached --others --exclude-standard` zählt die Ausdrücke ebenfalls einzeln; der Fallback-Abgleich erfasst `#fff` auch nach Leerzeichen. Die frühere abgeschnittene Zeilenliste ist keine Zählgrundlage.
