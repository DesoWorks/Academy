# Design Harmony 3 – Implementierung Theme-Vertrag 3 (lokal)

Stand: 22.11.2026 · Branch `feature/phase-n1-release-connectivity` (HEAD 95f0033) · nur Arbeitsbaum, kein Commit, kein Push, keine Installation, kein Release.
Grundlage: [THEME-CONTRACT-3.md](THEME-CONTRACT-3.md), [DESIGN-HARMONY-3-SECURITY.md](DESIGN-HARMONY-3-SECURITY.md).

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/modules/spec.js` | `runtime.themeContract`, falls vorhanden, muss positive Ganzzahl sein (sonst `invalid-manifest`). Fehlendes Feld bleibt gültig. Neue Konstante `THEME_CONTRACT_SUPPORTED = 1` (exportiert). |
| `src/modules/manager.js` | Neue Funktion `compatibilityOf(manifest)`: Core passt UND bei hosted-web `themeContract === 1`. `publicRow` liefert `compatible`, `compatibilityReason`, `themeContract`, `availableVersion: null`, `updateAvailable: null` (vorher `false`). `installFromDirectory` lehnt hosted-web ohne unterstützten Vertrag mit `incompatible-theme` ab, direkt nach der Core-Prüfung und vor dem ersten Schreibzugriff. `open()` verweigert inkompatible hosted-web-Module (`module-incompatible`). `resolveHostedFile` gibt dann `null` zurück. Downgrade-Sperre (`compare < 0`) unverändert. |
| `modules/it-systemintegration/academy-module.json` | Nur `runtime.themeContract: 1` ergänzt. `version` bleibt `1.0.1`. |
| `src/renderer/shell.js` | Karte zeigt „Installiert: X · Verfügbar: Nicht geprüft“, Status mit Grund, Lernfortschrittszeile bleibt. „Öffnen“ nur bei kompatibel und aktiv. „Aktuell“ entfällt. Neue Helfer `canOpen`, `statusReason`, `availableLabel`. |
| `src/renderer/module.js` | Liste mit installierter/verfügbarer Version und Statusgrund. „Öffnen“ nur bei `canOpen`. Aktivieren/Deaktivieren und Deinstallieren bleiben als Nebenaktionen. |
| `tests/hosted-module.test.js` | Hilfspaket um die Optionen `themeContract` (Standard 1) und `version` erweitert. Bestehende Tests unverändert. |
| `tests/design-harmony-3-theme-contract.test.js` | Neu, 6 Tests (siehe unten). |

Unverändert gelassen: die uncommittete Kontrastkorrektur in `src/renderer/design-tokens.css` und `tests/design-harmony-2b-theme.test.js`, `package.json`, `.github`, `src/updates`, `main`, das Profil unter `AppData\Roaming\DesoWorks\Academy`, `module_kv`, Signaturlogik.

## Bewusst nicht gebaut

- Kein „Aktualisieren“- und kein „Update prüfen“-Button: Es gibt noch keinen echten Kandidaten und keine Anbindung der Shell an die Updatequelle. `availableVersion` bleibt `null`, die Anzeige „Nicht geprüft“.
- Keine Anhebung der Paketversion des Quellmoduls (bleibt 1.0.1) und keine Festlegung einer Mindest-Core-Version in `core`.
- Kein Ersatz des installierten 1.0.2 durch 1.0.1; die Sperre bleibt.
- Keine Behandlung der Sicherheitsbefunde zu gleicher Version, Rollback und Transaktion (Befunde 1 bis 3 im Sicherheitsbericht). Außerhalb dieses Auftrags.
- Kein Laufzeittest der drei Modi in einem isolierten Testprofil (Abnahmekriterium des Vertrags), keine Browser- oder Electron-Prüfung der geänderten Oberfläche.
- `open()` sperrt nur hosted-web, nicht reine Inhaltsmodule (Vertrag: Core-Prüfung bleibt dort wie bisher).
- Kein Statuspfad „Fehler / Erneut prüfen“ in der Oberfläche.

## Tests, selbst ausgeführt

Befehl: `node --test tests/*.test.js` in `D:\Desoworks\Workspace\Academy` (Windows, Shell vorhanden).
Ergebnis: 170 Tests, 170 bestanden, 0 fehlgeschlagen. Ein erster Lauf hatte einen Fehler im neuen Test (Annahme, `module-packages` existiere nicht; der Manager legt den Ordner beim Start an). Der Test prüft jetzt, dass der Ordner leer ist. Die Implementierung wurde dafür nicht geändert.

Neue Tests (`tests/design-harmony-3-theme-contract.test.js`):
1. Falscher Typ von `themeContract` (`"1"`, 0, -1, 1.5, true) ist Manifestfehler; fehlendes Feld bleibt gültig.
2. hosted-web ohne Vertrag wird nicht installiert (`incompatible-theme`), nichts liegt in `module-packages`, Liste leer.
3. Unbekannter Vertrag 2 wird nicht installiert.
4. Kompatibles Paket: `compatible: true`, `themeContract: 1`, `availableVersion: null`, `updateAvailable: null`; `open` und `resolveHostedFile` funktionieren.
5. 1.0.1 ersetzt installiertes 1.0.2 nicht (`downgrade-blocked`); Lernstand in `module_kv` bleibt.
6. Installiertes Modul ohne Vertrag (Altbestand in der Test-Registry nachgestellt): inkompatibel mit Grund, `open` verweigert, `resolveHostedFile` gibt `null`; ein abgelehnter Installationsversuch ändert Version und Lernstand nicht.
7. Das Quellmodul deklariert `themeContract: 1` bei Version 1.0.1.

Nicht geprüft: Aussehen und Verhalten der Oberfläche (`shell.js`, `module.js`) im laufenden Programm; dafür gibt es nur die vorhandenen statischen Tests, keinen neuen.

## Git-Stand

Nur Arbeitsbaum. Geändert: die oben genannten Dateien, dazu die schon vorher offenen Änderungen und Dokumente. Nichts committet, nichts gepusht.
