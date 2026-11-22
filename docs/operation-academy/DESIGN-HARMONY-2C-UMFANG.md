# Design Harmony 2C – Umfang des LF3-Rollouts

**Stand:** 22.11.2026 · **SMITH** · Academy-Arbeitsbaum auf `46283bf`  
**Ergebnis:** Fünf Lernseiten korrigiert, 15 weiße Flächen-Fallbacks entfernt. **122 weiße Fallbacks in 73 anderen Lernseiten bleiben ungeprüfte Kandidaten.** Insgesamt verbleiben 126 Aufrufe von `var(--flaeche)`; vier davon haben keinen Fallback und gehören nicht zu diesem Fehlermuster.

## Korrigierte Seiten

Die HTML-Änderungen liegen ausschließlich in den lokalen `<style>`-Blöcken. Alle fünf Seiten verwenden für die betroffenen Elemente jetzt `--farbe-flaeche`, `--farbe-rahmen` und ausdrücklich `--farbe-text`. Die Auswahlkarte verwendet `--farbe-akzent` für Fokus und Auswahl; die Fokuslinie hat 2 px Abstand, die gewählte Antwort zusätzlich Fettschrift. Lernziele, Aufgabentexte, Markup, Skripte und Speicherung wurden in diesen Dateien nicht geändert.

| Lernseite unter `modules/it-systemintegration/web/module/` | Umgestellte Flächenselektoren | Entfernte weiße Fallbacks | Bildbeleg im Academy-iframe |
| --- | --- | ---: | --- |
| `lf3-dhcp.html` | `.step`, `.opt`, `.skizze` (Ablaufbild) | 3 | [Hell](design-harmony-2c/lf3-dhcp-skizze-hell.png) · [Dunkel](design-harmony-2c/lf3-dhcp-skizze-dunkel.png) |
| `lf3-dns.html` | `.step`, `.opt`, `.skizze` (Anfrage und Antwort) | 3 | [Hell](design-harmony-2c/lf3-dns-skizze-hell.png) · [Dunkel](design-harmony-2c/lf3-dns-skizze-dunkel.png) |
| `lf3-verbindung-eingrenzen.html` | `.step`, `.opt`, `.skizze` (Beobachtungsliste) | 3 | [Hell](design-harmony-2c/lf3-verbindung-eingrenzen-skizze-hell.png) · [Dunkel](design-harmony-2c/lf3-verbindung-eingrenzen-skizze-dunkel.png) |
| `lf3-fehlerbild-protokoll.html` | `.step`, `.opt`, `.skizze` (Fehlerbild) | 3 | [Hell](design-harmony-2c/lf3-fehlerbild-protokoll-skizze-hell.png) · [Dunkel](design-harmony-2c/lf3-fehlerbild-protokoll-skizze-dunkel.png) |
| `lf3-ipv4-konfiguration.html` | `.step`, `.opt`, `.karte` (Client- und Testnetz-Karte) | 3 | [Hell](design-harmony-2c/lf3-ipv4-konfiguration-skizze-hell.png) · [Dunkel](design-harmony-2c/lf3-ipv4-konfiguration-skizze-dunkel.png) |

Der [Nutzlastindex](../../modules/it-systemintegration/content/payload-index.json) wurde für die geänderten Moduldateien nachgezogen. Für diese fünf HTML-Dateien stimmen Dateigröße und SHA-256 des Arbeitsbaums mit den jeweiligen Indexeinträgen überein. Das ist keine Prüfung des gesamten Pakets. Der 2A-Pilot `lf3-client-anbindung.html` ist nicht in den fünf enthalten und wurde in 2C nicht neu geschrieben. `lf3-lernziel.html`, `lf3-abnahme.html` und andere Lernfelder wurden nicht umgestellt.

## Bestätigter Theme-Fehler dieser Etappe

**Ein gemeinsames Fehlerbild auf fünf Seiten:** Die lokalen Regeln verwendeten `var(--flaeche,#fff)` für die Fläche und `var(--rahmen,#bdcde3)` für den Rahmen, statt die Theme-Rollen des Moduls zu nutzen. Im Dunkelmodus passte die weiße Fallback-Fläche nicht zum geerbten hellen Text. Die 15 ersetzten Flächendeklarationen zählen Quellstellen, nicht 15 getrennte Fehler.

Der [iframe-Messlauf nach der Korrektur](design-harmony-2c/probe-academy.json) protokolliert auf allen fünf Seiten für die gemessene Schrittkarte, Auswahlkarte und Skizze bzw. Karte **17,15:1** in Dunkel (Knight-Fläche `#141114`, Text `#F7F4F5`) und **15,65:1** in Hell (Fläche `#FFFFFF`, Text `#1B2430`). Das [Skizzenprotokoll](design-harmony-2c/probe-sketch.json) ergänzt sichtbare Stichproben nach dem Scrollen. Diese Werte belegen die gemessenen Text-Flächen-Paare nach der Änderung, nicht sämtliche Zustände. Die geänderte Fokusregel im Quelltext belegt weder die Tastaturkette noch einen sichtbaren Fokus auf `MAIN`. Keine WCAG- oder Produktfreigabe.

## Verbleibende Fundstellen im Arbeitsbaum

| Klasse | Dateien | Aufrufe | Einordnung |
| --- | ---: | ---: | --- |
| LF1, LF2, LF4–LF7 | 57 | 106 | Weißer `#fff`-Fallback; laut 2B-Inventar regulär erreichbar, in 2C nicht gerendert geprüft. |
| LF8–LF9 | 16 | 16 | Weißer `#fff`-Fallback; laut 2B-Inventar im Payload, aber ohne regulären Lektionslink. In 2C nicht gerendert geprüft. |
| **Ungeprüfte weiße Fallbacks** | **73** | **122** | **Kandidaten, keine bestätigten Fehler.** |
| LF3-Abnahmeformular | 1 | 1 | Ohne Fallback. Die Seite definiert `--flaeche: #fff` selbst; kein Nachweis eines regulären iframe-Einstiegs. Separat beurteilen. |
| Academy-Shell `src/renderer/shell.css` | 1 | 3 | Ohne Fallback. `--flaeche` ist ein Alias für `--farbe-flaeche`; die Regeln gehören nicht zum Modul-iframe. |
| **Alle verbleibenden Aufrufe** | **75** | **126** | **122 Kandidaten + 4 Aufrufe anderer Art.** |

`lf3-lernziel.html` und der Pilot haben in diesem Suchmuster keine Treffer. Das sagt nichts über andere Theme- oder Barrierefreiheitsfragen aus. Die 122 Kandidaten erst im tatsächlich ausgelieferten Modul und im jeweiligen UI-Zustand beurteilen. Der LF3-Rollout gibt keine anderen Lernfelder frei. DESIGN HARMONY bleibt offen.

## Zählweg und Vergleichsgrenze

```text
git grep --untracked -I -n -o -F "var(--flaeche" -- modules src
git ls-files --others --ignored --exclude-standard -- modules src
```

Der erste Lauf zählt Vorkommen statt Trefferzeilen, auch bei minifiziertem CSS. Der zweite lieferte keine ignorierten unversionierten Dateien im Suchbereich. In einem zweiten Auswertungsschritt wurden alle Trefferdateien gelesen und die **126 Präfixtreffer vollständig** als Funktionsaufrufe eingeordnet: 122 mit `#fff`, vier ohne Fallback, keine sonstigen Fallbacks. Die Doku, Tests und Abhängigkeiten liegen außerhalb des Suchbereichs.

Vergleichsbasis ist der [2B-Arbeitsbaum](DESIGN-HARMONY-2B-FUNDSTELLEN.md), nicht ein sauberer Checkout von `HEAD`: **141 − 15 = 126** Aufrufe, davon **137 − 15 = 122** weiße Fallbacks; **80 − 5 = 75** Trefferdateien. Der Diff der fünf HTML-Dateien bestätigt jeweils drei ersetzte Flächendeklarationen und nur Änderungen im lokalen `<style>`; die Umsetzungsdetails stehen in der [2C-Umsetzungsnotiz](DESIGN-HARMONY-2C-UMSETZUNG.md). Für dieses Inventar wurde nur diese Dokumentation geschrieben, kein Anwendungscode oder Index geändert.
