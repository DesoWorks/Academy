# Migrationsmatrix Phase J

**Stand:** 2026-11-21  
**Quelle, nur gelesen:** `D:\Desoworks\Workspace\IT-Ausbildung`, Branch `feature/operation-academy-unified-platform`, Commit `b7c60e1`.  
**Zielpaket:** `modules/it-systemintegration/` im Academy-Repo.  
**Ursprungsrepository:** nicht verändert. HEAD danach weiterhin `b7c60e1`.

## Entscheidung

Die IT-Webanwendung passt nicht in das kleine Inhaltsformat (32 Dateien, 2 MB, kein HTML/JS). Sie wird nicht zu Platzhalterlektionen verkürzt.

Stattdessen installiert der Core ein DesoWorks-Paket mit `runtime.kind = hosted-web`. Die Seiten liegen unter `web/` und laufen in einem iframe auf einer eigenen Origin `academy://desoworks.it-systemintegration`. Kein Node, keine Core-IPC, keine Bridge-Injektion.

## Übernommen

| Bereich | Dateien | Kategorie | Nachweis |
| --- | --- | --- | --- |
| Themenübersicht | `web/index.html` | unverändert übernommen | Titel „IT-Ausbildung – Themenübersicht“ |
| Glossar | `web/glossar.html` | unverändert übernommen | im Nutzlastindex |
| Lernfeld 1 | 11 HTML-Seiten | unverändert übernommen | `web/module/lf1-*.html` |
| Lernfeld 2 | 13 HTML-Seiten | unverändert übernommen | `web/module/lf2-*.html` |
| Lernfeld 3 | 8 HTML-Seiten | unverändert übernommen | `web/module/lf3-*.html` |
| Lernfeld 4 | 7 HTML-Seiten | unverändert übernommen | `web/module/lf4-*.html` |
| Lernfeld 5 | 11 HTML-Seiten | unverändert übernommen | `web/module/lf5-*.html` |
| Lernfeld 6 | 12 HTML-Seiten | unverändert übernommen | `web/module/lf6-*.html` |
| Lernfeld 7 | 9 HTML-Seiten | unverändert übernommen | `web/module/lf7-*.html` |
| Lernfeld 8 | 9 HTML-Seiten | unverändert übernommen | `web/module/lf8-*.html` |
| Lernfeld 9 | 9 HTML-Seiten | unverändert übernommen | `web/module/lf9-*.html` |
| Windows-Labor, PC-Explorer, RAID-Labor, BWL-Werkstatt, Rechner, Werkzeugkiste | 11 HTML-Seiten unter `web/module/` außerhalb der LF-Zählung | unverändert übernommen | Dateien und zugehörige `web/js/*.js` |
| Skripte, Styles, Assets | übrige Dateien des Index | unverändert übernommen | 248 Dateien, 13.460.854 Bytes Nutzlast |

Die vollständige Dateiliste mit SHA-256 steht in `modules/it-systemintegration/content/payload-index.json`. Quelleintrag: `sourceCommit` `b7c60e1ae4353b6872e9af73d5e188e129420657`.

## Nicht ins Modul kopiert

| Bereich | Kategorie | Grund |
| --- | --- | --- |
| `desktop/` (etwa 944 MB) | nicht migrierbar als Lerninhalt | Alter Electron-Rahmen. Der Academy-Core ersetzt ihn. |
| `tests/`, Root-Markdown, `screenshots/` | keine Lernseite | Projekt- und QA-Unterlagen, nicht die Anwendung für Lernende. |
| `node_modules`, `.git`, Skripte `.bat`/`.sh` | abgelehnt | Keine Laufzeit und keine Fremdabhängigkeit im Modulpaket. |

## Lernstände

| Speicher | Kategorie | Verhalten |
| --- | --- | --- |
| `localStorage` der IT-Seiten, Schlüssel `it-ausbildung.*` | Anpassung an die Modul-Origin | Bleibt im iframe auf `academy://desoworks.it-systemintegration`. Übersteht Neustart und Deinstallation der Dateien, weil die Origin nicht das Paketverzeichnis ist. |
| Core-SQLite `module_kv` | getrennt | Academy-Fortschritt der Modul-ID. Keine Vermischung mit den Seitenschlüsseln. |
| Alter Desktop-`userData` der IT-Ausbildung | noch nicht automatisch migrierbar | Es gibt keinen bestätigten Exportpfad. Nichts wird stillschweigend gelesen oder überschrieben. |

## Modul-ID

`desoworks.it-systemintegration` kollidiert nicht mit `dev.desoworks.it-ausbildung`. Die reservierte Plattform-ID bleibt gesperrt. Herausgeber ist `publisher.desoworks`, weil die Manifestregel eine Herausgeber-ID mit Punkt verlangt.
