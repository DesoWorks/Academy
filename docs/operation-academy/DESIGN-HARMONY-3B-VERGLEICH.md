# Design Harmony 3B – Bestandsaufnahme IT-Systemintegration 1.0.1 → 1.0.2

**Stand:** 22.11.2026 · **Für:** Rick und JARVIS · **Zweck:** Vergleichsgrundlage für den Kandidaten 1.0.3. Keine Abnahme und keine Releasefreigabe.

**Ergebnis:** Laut Vollmessung des Koordinators enthält das installierte 1.0.2 **keine Datei, die im Quellstand 1.0.1 fehlt** (`ONLY_INST = 0`). Zehn gemeinsame Dateien unterscheiden sich nach Zeilenenden-Normalisierung. Die Quellseite aller zehn Dateien war in dieser Stichprobe lesbar; die installierte Gegenseite war für diesen Lauf nicht freigegeben. Die Stichprobe widerspricht der Vollmessung nicht, bestätigt aber keinen der zehn Diffs unabhängig auf beiden Seiten.

## Bestätigt – eigene Stichprobe

- Vergleichsquelle: `modules/it-systemintegration/` im Academy-Arbeitsbaum. Referenz laut Koordinator: Branch `feature/phase-n1-release-connectivity`, HEAD `95f0033`, `main` `2e704e3`.
- Das gelesene Quellmanifest `modules/it-systemintegration/academy-module.json` deklariert `id: desoworks.it-systemintegration`, `version: 1.0.1`, `runtime.kind: hosted-web` und `runtime.themeContract: 1` (Ganzzahl). Sein `core`-Bereich lautet `>=0.3.0 <0.4.0`. Das ist die Deklaration des Altquellstands, keine Kompatibilitätsaussage für 1.0.3.
- Mit `fs_read` wurden Manifest und alle zehn Quellpfade stichprobenartig gelesen. Die Leseversuche für alle zehn installierten Gegenstücke und die beiden Manifestpfade im Profil wurden wegen fehlender Freigabe des externen Profilpfads abgewiesen. Ein abgewiesener Zugriff belegt weder Inhalt noch Abwesenheit einer Datei. Für `anzeige-glossar.js` stützt der [Etappe-3-Vergleich](DESIGN-HARMONY-3-MODUL-102.md) den Koordinatorbefund zusätzlich, ersetzt aber keine erneute Direktprüfung.

## Übernommene Vollmessung des Koordinators – nicht erneut ausgeführt

Bezugsstand: 22.11.2026, lesender Vergleich der relativen Pfade in Quellbaum und installiertem Paketordner, mit separater Betrachtung des Manifests im Verified-Cache. Text-Rohdiffs wurden nach Normalisierung von CRLF auf LF erneut bewertet.

| Merkmal | Befund des Koordinators |
|---|---|
| Dateien im Quellbaum / installierten Paketordner | 252 / 251 |
| Identische gemeinsame Dateien nach LF-Normalisierung | 241, davon 232 zuvor nur wegen CRLF/LF als Rohdiff aufgefallen |
| Echte Inhaltsdiffs unter den gemeinsamen Dateien | 10; damit sind alle 251 gemeinsamen Pfade erfasst (`241 + 10`) |
| Nur in 1.0.2 installiert (`ONLY_INST`) | **Keine: 0 Dateien** |
| Nur im Quellbaum (`ONLY_SRC`) | `academy-module.json` |

**Installierter Paketordner:** `C:\Users\<Benutzer>\AppData\Roaming\DesoWorks\Academy\module-packages\desoworks.it-systemintegration\1.0.2` – laut Koordinator **ohne** `academy-module.json`.

**Verified-Cache:** Das Manifest 1.0.2 liegt laut Koordinator, bezogen auf die beiden untersuchten Ablagen, **nur** unter `C:\Users\<Benutzer>\AppData\Roaming\DesoWorks\Academy\updates\modules\verified\desoworks.it-systemintegration\1.0.2\academy-module.json`. Es deklariert `version: 1.0.2`; `runtime.themeContract` fehlt. Es zählt nicht als Datei des installierten Paketordners. Ein fehlendes Theme-Level gilt bei `hosted-web` nach [Theme-Vertrag 3](THEME-CONTRACT-3.md) nicht als v1.

### Zehn gemeldete echte Inhaltsdiffs

Pfade sind relativ zur jeweiligen Modulwurzel. Die dritte Spalte dokumentiert, was auf der Quellseite tatsächlich zu sehen war.

| Datei | Diff laut Koordinator | Eigene Quellstichprobe | Installierte Seite / eigener Diffstatus |
|---|---|---|---|
| `content/payload-index.json` | Abweichungen bei Hashes und Größen. | `sha256` und `size` sind für die betroffenen CSS-, JS- und LF3-Dateien eingetragen. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/css/styles.css` | Abweichende LF3-Fokusregel. | Zeilen 159–172: eigener sichtbarer Fokusrahmen für `main#main[tabindex="-1"]` auf den sechs LF3-Seiten. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/js/anzeige-glossar.js` | Abweichende Behandlung von `data-academy-theme`. | Quelle liest und validiert das Attribut, priorisiert es gegenüber dem lokalen Farbmodus und deaktiviert im Academy-Kontext die lokale Farbauswahl mit Hinweis. Schlüssel `it-ausbildung.anzeige.v1` bleibt in der Quelle in Benutzung. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/js/navigation.js` | Abweichende Weitergabe des Theme-Parameters. | Zeilen 168–229: `academy-theme` wird aus dem Root-Attribut für interne HTML-Ziele desselben `academy:`-Hosts übernommen; Link- und Formularpfade sind implementiert. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/module/lf3-client-anbindung.html` | Inline-CSS: `--flaeche`/`#fff` → `--farbe-*`. | Schrittbox, Antwortoptionen und Skizze nutzen u. a. `--farbe-flaeche` und `--farbe-text`. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/module/lf3-dhcp.html` | Inline-CSS: `--flaeche`/`#fff` → `--farbe-*`. | Schrittbox, Antwortoptionen und Skizze nutzen u. a. `--farbe-flaeche` und `--farbe-text`. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/module/lf3-dns.html` | Inline-CSS: `--flaeche`/`#fff` → `--farbe-*`. | Schrittbox, Antwortoptionen und Skizze nutzen u. a. `--farbe-flaeche` und `--farbe-text`. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/module/lf3-fehlerbild-protokoll.html` | Inline-CSS: `--flaeche`/`#fff` → `--farbe-*`. | Schrittbox, Antwortoptionen und Skizze nutzen u. a. `--farbe-flaeche` und `--farbe-text`. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/module/lf3-ipv4-konfiguration.html` | Inline-CSS: `--flaeche`/`#fff` → `--farbe-*`. | Schrittbox, Antwortoptionen und Karte nutzen u. a. `--farbe-flaeche` und `--farbe-text`. | Nicht lesbar; Diff nicht unabhängig bestätigt. |
| `web/module/lf3-verbindung-eingrenzen.html` | Inline-CSS: `--flaeche`/`#fff` → `--farbe-*`. | Schrittbox, Antwortoptionen und Skizze nutzen u. a. `--farbe-flaeche` und `--farbe-text`. | Nicht lesbar; Diff nicht unabhängig bestätigt. |

## Arbeitsannahme für JARVIS

Kandidat **1.0.3** auf Basis des Quellbaums mit stabiler Modul-ID und ganzzahligem `runtime.themeContract: 1`. Nach Koordinatorbefund ist keine nur in 1.0.2 vorhandene Datei zu übernehmen. Das sagt nichts über einzelne Änderungen innerhalb der zehn gemeinsamen Dateien aus: Nicht widersprechende 1.0.2-Inhalte oder Funktionen sind bei einem belegten Unterschied zu erhalten. Theme-Weitergabe, LF3-Fokus und rollenbasierte Farben aus der Quelle nicht durch den Altstand ersetzen. Den Payload-Index für die tatsächlich gebauten Bytes neu erzeugen (Hash und Größe, nicht über LF-normalisierten Vergleichstext); den kompatiblen `core`-Bereich gegen den Ziel-Core prüfen. Paketbau und Update über den bestehenden Mechanismus; keine Änderung von Modul-ID, Origin oder Fortschritts-/Speicherschlüsseln.

## Unbekannt / nicht nachgewiesen

- Mangels lesbarer 1.0.2-Gegenseite bleiben die vollständigen Hunk-Diffs, beide installierten Manifestbefunde und die Dateimengen des Profils in dieser Stichprobe unabhängig unbestätigt. Es gibt keine neuen Anhaltspunkte für zusätzliche Dateien oder abweichende Inhalte über die Koordinatorliste hinaus.
- Die Bestandsaufnahme belegt weder Funktions- und Lernstandserhalt noch Theme-Verhalten im Academy-iframe. Das ist am konkreten Kandidaten mit dem vorhandenen Updatepfad in einem temporären Profil zu prüfen. Keine Aussage über Signatur- oder Hash-Gültigkeit des installierten Pakets.
- Dieser Teilschritt ändert ausschließlich diesen Bericht. Kein Anwendungscode, keine Profiländerung, keine Löschung, kein Push, keine Installation und keine Veröffentlichung.
