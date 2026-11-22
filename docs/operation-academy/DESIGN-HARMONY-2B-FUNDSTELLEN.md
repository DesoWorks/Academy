# OPERATION ACADEMY – DESIGN HARMONY / Etappe 2B: Fundstellen `--flaeche`

**Stand:** 22.11.2026 · Academy-Arbeitsbaum auf `46283bf` · Quellinventar, keine visuelle Abnahme.

## Befund

**141 Fundstellen in 80 Dateien, davon 137 mit weißem Fallback.** Alle 137 verwenden `#fff`; `#ffffff` und `white` kommen als Fallback nicht vor. Vier Aufrufe haben keinen Fallback. Die gleiche Gesamtzahl wie in 2A wurde am aktuellen Arbeitsbaum neu erhoben und ist keine Fehlerzahl: **121 Fundstellen in 62 Lernseiten** sind über die reguläre Modulnavigation erreichbar. Bei **16 weiteren Lernseiten** und **einer Abnahmeseite** ist die HTML-Datei auslieferbar, aber kein regulärer Einstieg aus der Themenübersicht nachgewiesen. Die übrigen **3 Stellen** liegen in der Shell, nicht im Modul-iframe.

| Klasse | Dateityp / Funktion | Dateien | Stellen | Davon weiß | `html[data-theme]` / `--farbe-flaeche:` in der Trefferdatei | Academy-iframe: statisch belegter Ladeweg |
| --- | --- | ---: | ---: | ---: | --- | --- |
| A | HTML / Lerninhalt LF1–LF7 | 62 | 121 | 121 | Nein / Nein; beide im eingebundenen Modul-CSS | Regulär erreichbar, sobald das aktive Modul geöffnet ist. Betroffene Komponenten können erst im jeweiligen Lernschritt erscheinen. |
| P | HTML / Lerninhalt LF8–LF9 | 16 | 16 | 16 | Nein / Nein; beide im eingebundenen Modul-CSS | Auslieferbar, aber die Themenübersicht und die linke Modulnavigation zeigen die übergeordneten Lernfelder als „In Kürze“ ohne Lektionslinks. Kein alternativer Pfad vom regulären Einstieg gefunden. |
| T | HTML / lokales QA-Abnahmeformular LF3, kein automatisierter Test | 1 | 1 | 0 | Nein / Nein; eigenes `--flaeche: #fff` | Auslieferbar, aber weder regulärer Navigationslink noch HTML-Link von einer erreichbaren Seite gefunden. |
| S | CSS / Academy-Shell | 1 | 3 | 0 | Nein / Nein; eigenes `--flaeche: var(--dw-surface)` | Nein; das Stylesheet gehört zum äußeren Academy-Dokument. |
| – | Doku oder automatisierte Tests im Suchbereich | 0 | 0 | 0 | – | – |
| | **Gesamt** | **80** | **141** | **137** | | |

**Ursachen:** A und P verwenden ein altes Token in Inline-CSS (`<style>`), für das der gesichtete Modulstand keine Definition liefert. Die eingebundene `web/css/styles.css` definiert stattdessen `--farbe-flaeche` und `html[data-theme]`; alle 78 Lektionen laden außerdem `anzeige-glossar.js`. Bei fehlendem `--flaeche` greift Weiß, während der Text im Modul-Dunkelmodus hell sein kann. Ob die Regel für ein bestimmtes Element und einen bestimmten Zustand in der Kaskade gewinnt, ist nicht gerendert geprüft. T hat eine eigene statische Hellpalette; hier ist das Weiß ein **definierter Wert**, kein Fallback. S verwendet einen im selben Stylesheet definierten Shell-Alias. Beide sind getrennt von der Fallback-Ursache zu beurteilen.

## Inventar je Datei

Kurze Dateinamen stehen unter `modules/it-systemintegration/web/module/`; der Shell-Pfad ist ausgeschrieben. Jede Angabe `Zeile: Selektor` zählt genau **ein** Vorkommen in einer `background`-Deklaration. Semikolons trennen einzelne Deklarationen; `.karte, .leiste` ist eine Selektorliste mit **einer** Deklaration. Dateityp, Funktion, Theme-Definitionen und iframe-Status gelten je Klasse wie in der Übersicht.

| Datei | Klasse | Fallback | Fundstellen (Zeile: Selektor) |
| --- | --- | --- | --- |
| `lf1-ausbildungsbetrieb.html` | A | `#fff` | 15: `.rollen-karte`; 22: `.rollen-option` |
| `lf1-handlungsspielraum.html` | A | `#fff` | 2: `.case`; 2: `.opt` |
| `lf1-leitbild.html` | A | `#fff` | 15: `.rollen-karte`; 22: `.rollen-option` |
| `lf1-markt-kundschaft.html` | A | `#fff` | 9: `.market-card`; 9: `.option` |
| `lf1-organisation.html` | A | `#fff` | 2: `.org-card`; 2: `.quiz-option` |
| `lf1-praesentation.html` | A | `#fff` | 2: `.card`; 2: `.option` |
| `lf1-qualitaet.html` | A | `#fff` | 2: `.card`; 2: `.opt` |
| `lf1-reflexion.html` | A | `#fff` | 2: `.case`; 2: `.opt` |
| `lf1-weiterbildung.html` | A | `#fff` | 2: `.card`; 2: `.opt` |
| `lf1-wertschoepfung.html` | A | `#fff` | 2: `.step-card`; 2: `.answer` |
| `lf2-angebot.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-angebote.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-auswertung.html` | A | `#fff` | 2: `.opt` |
| `lf2-beschaffung.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-einrichten.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-energie.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-kriterien.html` | A | `#fff` | 2: `.step`; 2: `.opt`; 2: `.krit li` |
| `lf2-kundenbedarf.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-sichere-auswahl.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-technische-daten.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-uebergabe.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf2-varianten.html` | A | `#fff` | 2: `.step`; 2: `.opt` |
| `lf3-abnahme.html` | T | keiner | 51: `.karte, .leiste` |
| `lf3-dhcp.html` | A | `#fff` | 15: `.step`; 17: `.opt`; 22: `.skizze` |
| `lf3-dns.html` | A | `#fff` | 15: `.step`; 17: `.opt`; 22: `.skizze` |
| `lf3-fehlerbild-protokoll.html` | A | `#fff` | 15: `.step`; 17: `.opt`; 22: `.skizze` |
| `lf3-ipv4-konfiguration.html` | A | `#fff` | 15: `.step`; 17: `.opt`; 22: `.karte` |
| `lf3-verbindung-eingrenzen.html` | A | `#fff` | 15: `.step`; 17: `.opt`; 22: `.skizze` |
| `lf4-handlungen.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf4-risiken.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf4-schutzbedarf.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf4-schutzziele.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf4-vorfall.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf4-zugang.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-ablage.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-ablauf.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-anweisung.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-doku.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-einordnen.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-format.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-prozess.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-testfall.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-werte.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf5-wiederholung.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-anfrage.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-fragen.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-gespraech.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-kontakt.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-level.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-loesung.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-notiz.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-qualitaet.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-sla.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-status.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf6-ursache.html` | A | `#fff` | 15: `.step`; 17: `.opt` |
| `lf7-auswahl.html` | A | `#fff` | 15: `.opt` |
| `lf7-fluesse.html` | A | `#fff` | 15: `.opt` |
| `lf7-pruefung.html` | A | `#fff` | 15: `.opt` |
| `lf7-schnittstelle.html` | A | `#fff` | 15: `.opt` |
| `lf7-sicherheit.html` | A | `#fff` | 15: `.opt` |
| `lf7-system.html` | A | `#fff` | 15: `.opt` |
| `lf7-unterlage.html` | A | `#fff` | 15: `.opt` |
| `lf7-zusammenfuehren.html` | A | `#fff` | 15: `.opt` |
| `lf8-aufbereiten.html` | P | `#fff` | 16: `.opt` |
| `lf8-auswahl.html` | P | `#fff` | 15: `.opt` |
| `lf8-konzept.html` | P | `#fff` | 15: `.opt` |
| `lf8-quellen.html` | P | `#fff` | 15: `.opt` |
| `lf8-recht.html` | P | `#fff` | 15: `.opt` |
| `lf8-reflexion.html` | P | `#fff` | 15: `.opt` |
| `lf8-struktur.html` | P | `#fff` | 15: `.opt` |
| `lf8-uebergabe.html` | P | `#fff` | 15: `.opt` |
| `lf9-anforderung.html` | P | `#fff` | 15: `.opt` |
| `lf9-dienste.html` | P | `#fff` | 15: `.opt` |
| `lf9-eignung.html` | P | `#fff` | 15: `.opt` |
| `lf9-infrastruktur.html` | P | `#fff` | 16: `.opt` |
| `lf9-ist.html` | P | `#fff` | 15: `.opt` |
| `lf9-schutz.html` | P | `#fff` | 15: `.opt` |
| `lf9-standard.html` | P | `#fff` | 15: `.opt` |
| `lf9-zukunft.html` | P | `#fff` | 15: `.opt` |
| `src/renderer/shell.css` | S | keiner | 90: `.navigation a:hover`; 116: `.bereich`; 129: `.karte` |

## Rollout-Priorität: neun Dateien

Die Reihenfolge bewertet die Bedeutung der betroffenen Elemente für die Aufgabe und die reguläre Erreichbarkeit. Sie bewertet keine gemessenen Kontraste.

| Priorität | Datei | Grund für gezielte Prüfung im Academy-iframe |
| ---: | --- | --- |
| 1 | `lf3-dhcp.html` | Drei Stellen: Das Ablaufbild und die zugehörigen Antwortoptionen sind nötig, um die Übung zu lösen. |
| 2 | `lf3-dns.html` | Drei Stellen: Die Textskizze enthält konkrete Anfrage- und Antwortwerte, die Lernende unterscheiden müssen. |
| 3 | `lf3-verbindung-eingrenzen.html` | Drei Stellen: Die textbasierte Beobachtungsliste liefert die Belege für die nächste Auswahl. |
| 4 | `lf3-fehlerbild-protokoll.html` | Drei Stellen: Das textbasierte Fehlerbild ist die Quelle für das Supportprotokoll; auch Karten und Antworten sind betroffen. |
| 5 | `lf3-ipv4-konfiguration.html` | Drei Stellen: Eine `.karte`-Regel betrifft sowohl die Client-Anzeige als auch die Testnetz-Karte, die miteinander verglichen werden. |
| 6 | `lf2-kriterien.html` | Drei Stellen auf einer Quellzeile; neben Karten und Optionen ist die für die Aufgabe zentrale Kriterienliste betroffen. |
| 7 | `lf1-ausbildungsbetrieb.html` | Frühe, regulär erreichbare Lektion; abweichende Selektoren für Rollenkarten und Antworten, mit eigenen Fokus- und Auswahlregeln. |
| 8 | `lf7-fluesse.html` | Repräsentativ für das Ein-Treffer-Muster: Die Antwortoption ist für die Übung zentral, auch wenn nur eine Deklaration betroffen ist. |
| 9 | `lf9-infrastruktur.html` | Erst bei Freigabe des regulären Lernwegs: Die Regel betrifft Antworten in einer Lektion mit zusätzlichem interaktiven Praxisbereich. |

Zuerst die regulär erreichbaren LF3-Muster nach dem Pilot im echten iframe prüfen: Aussagen lesbar, Antworten sichtbar und Tastaturfokus erkennbar, Textskizzen beim Vergrößern nutzbar und in der Screenreader-Ausgabe verständlich. Danach je ein abweichendes Muster aus LF1/LF2 und LF7 prüfen. LF8/9 erst bei Bedarf separat vorziehen; das QA-Formular unabhängig von den Lektionen beurteilen. **Keine pauschale Ersetzung.**

## Erhebung, Ladeweg und Grenzen

- `git grep --untracked -I -n -o -F "var(--flaeche" -- modules src` zählt **Vorkommen**, nicht Trefferzeilen, in den versionierten und nicht ignorierten unversionierten Textquellen. `git ls-files --others --ignored --exclude-standard -- modules src` war leer. Ein zweiter Lauf las je Trefferdatei alle vollständigen Aufrufe, ordnete Fallback, Zeile und Selektor zu und prüfte, dass kein Präfixtreffer übrig blieb. `docs/`, `tests/` und `node_modules/` sind kein Suchbereich; ein Begriff wie „Testfall“ oder „Doku“ im Namen einer Lernseite macht sie nicht zu einem Test oder einer Projekt-Doku.
- Das [Modulmanifest](../../modules/it-systemintegration/academy-module.json) startet `index.html` als `hosted-web`. [`src/renderer/module.js`](../../src/renderer/module.js#L91-L99) öffnet den Einstieg im iframe; [`src/protocol.js`](../../src/protocol.js) hängt die Host-Stylesheets an Modul-HTML. [`resolveHostedFile`](../../src/modules/manager.js#L501-L519) liefert nur Dateien eines aktiven Moduls mit passendem registrierten Payload-Hash aus. Für **alle 79 HTML-Trefferdateien** stimmt der SHA-256 des sichtbaren Arbeitsbaums mit dem [Quell-Payload-Index](../../modules/it-systemintegration/content/payload-index.json) überein. Das belegt die Übereinstimmung dieser 79 Dateien mit dem Index, weder die Integrität des kompletten Pakets noch den Stand einer konkreten Installation.
- Der Erreichbarkeitsabgleich folgt den verfügbaren Einträgen in [`module-daten.js`](../../modules/it-systemintegration/web/js/module-daten.js#L26-L168) und den statischen internen HTML-Links ab diesen Seiten. [`startseite.js`](../../modules/it-systemintegration/web/js/startseite.js#L20-L46) und [`navigation.js`](../../modules/it-systemintegration/web/js/navigation.js#L69-L79) verlangen den Status „verfügbar“ sowohl für die Lektion als auch für ihr Lernfeld. LF8/9 stehen im Katalog, sind aber auf Lernfeld-Ebene `kommt-bald`. `lf3-abnahme.html` ist im Payload-Index und als Text in `content/course.json` aufgeführt, nicht als Link im `hosted-web`-Einstieg. „Auslieferbar“ bedeutet nicht „im regulären Ablauf gerendert“.
- [`lf3-client-anbindung.html`](../../modules/it-systemintegration/web/module/lf3-client-anbindung.html) ist die bereits korrigierte 2A-Referenz: `.step`, `.opt` und `.skizze` verwenden `--farbe-flaeche`, **null** aktuelle Fundstellen. Separater Hinweis an die Academy-QA: Beim Inventurstand weicht der Hash dieser **nicht mitgezählten** Pilotdatei vom Quell-Payload-Index ab. Für den iframe-Nachweis muss der verwendete Testpayload nachweislich den korrigierten Stand enthalten; ein Start mit einer älteren installierten Kopie belegt ihn nicht. Kein Paket und kein Index wurde für diese Inventur verändert.
- Keine Electron-Sichtprüfung, keine Tastatur-, 150-%-/200-%- oder Screenreader-Abnahme in diesem Teilauftrag. Kein Anwendungscode geändert, kein Commit.
