# Design Harmony 3D – DEV-Release-Kandidat

**Stand:** 22. November 2026  
**Empfehlung:** NO-GO für den nächsten DEV-Actions-Lauf.  
**Veröffentlichung:** nicht erfolgt. Kein Push, kein Merge, keine Installation auf dem Rechner des Commanders.

## Empfehlung

Der lokale Windows-Installer ist gebaut und enthält Modul `1.0.3` mit `themeContract: 1`. Das reicht nicht für einen Actions-Lauf.

Ein Push auf `dev` würde den bestehenden Workflow starten und nach grünem Test und Build veröffentlichen. Der aktuelle Commit `95f0033` enthält die Moduländerungen nicht. Actions baut den gepushten Commit, nicht diesen Arbeitsbaum. Solange der Commander den Commit und den Push nicht freigibt, bleibt der Lauf gesperrt.

## Was gebaut wurde

| Feld | Wert |
| --- | --- |
| Datei | `dist/DesoWorks-Academy-Setup-0.3.1-dev.6.local.exe` |
| Größe | 133.444.558 Bytes |
| SHA-256 | `e7774f9da833abe4575949fdf5e3b5accdc2264dc226171fd3c923f5a8789c5f` |
| Paketversion im asar | `0.3.1-dev.6.local` |
| Build | `npx electron-builder --win nsis --publish never -c.extraMetadata.version=0.3.1-dev.6.local`, Exit 0 |
| `package.json` | unverändert `0.3.1`, App-ID `dev.desoworks.academy` |

Die Versionszeichenkette ist nur der lokale Kandidat. Sie ist neuer als `0.3.1-dev.6` und älter als ein späteres `0.3.1-dev.7`. Sie ist kein GitHub-Tag.

## Installerinhalt

Der Installer wurde entpackt, nicht ausgeführt. Im entpackten Setup liegt `resources/academy-modules/it-systemintegration/academy-module.json` mit Version `1.0.3`, `runtime.themeContract: 1`, `trust: private`, `review.signed: false`. `sizeBytes` ist 62017 und entspricht der Summe der deklarierten Dateien.

Der Nutzlastindex im Installer hat 249 Einträge. Alle 249 Hashes und Größen stimmen mit den entpackten Dateien überein. `win-unpacked` ist bytegleich. Die sechs geänderten Quelldateien im `app.asar` sind bytegleich mit dem Arbeitsbaum. Der asar enthält `incompatible-theme`, `same-version-different-content` und `--farbe-akzent-dunkel`.

`node scripts/regenerate-payload-index.js --check` endete vor dem Build mit Exit 0. Der Index wurde nicht neu geschrieben.

Ein signiertes Release-Manifest gibt es lokal nicht. Der Workflow erzeugt es nur mit dem Secret `ACADEMY_MANIFEST_SIGNING_KEY`. Das Secret wurde nicht kopiert und nicht umgangen.

## Upgradepfad

Geprüft am entpackten Installer, nicht durch Ausführen des Setup. Temporäres Datenverzeichnis. Das Profil des Commanders wurde nur gelesen. Der Marker `anzeige-glossar.js` von Modul `1.0.2` blieb auf 22. November 2026, 09:32.

Ausgang: Kopie von `1.0.2` ohne Theme-Vertrag, gesetzter Lernstand in `module_kv`. Das ist nicht der Local-Storage-Lernstand des Commanders.

| Schritt | Ergebnis |
| --- | --- |
| Vor dem Update | inkompatibel, Grund genannt, `canUpdate` true, angebotene Version `1.0.3` |
| Gleicher Stand, anderer Inhalt | `same-version-different-content`, Version, Hash und Lernstand blieben `1.0.2` |
| Neueres Paket ohne Vertrag | `incompatible-theme`, dieselben drei Werte blieben |
| Kataloginstallation aus dem Installer | `1.0.3`, Vertrag 1, kompatibel |
| Lernstand | `lf3-dhcp` abgeschlossen, `lf3-skizze` begonnen, unverändert |
| Modulskript | übernimmt `data-academy-theme` |

Der Katalog ist der des Installers. Ein zweiter Updateweg wurde nicht eingeführt.

## Darstellung

Dieselben Installer-Moduldateien im Academy-iframe. Der Core-Code ist der Arbeitsbaum, bytegleich mit dem asar. Die Zeile `updates.status is not a function` kommt vom Prüfstub.

| Modus | „Jetzt lernen“ | Fokus |
| --- | --- | --- |
| Dunkel | 5,98:1 auf `#141114` | sichtbar, 3 px |
| Hell | 8,78:1 | sichtbar, 3 px |
| Kontrast | 14,89:1 | sichtbar, 3 px |

Bei 150 % und 200 % blieb der Link sichtbar, ohne horizontale Überbreite im iframe. Der Mauszeiger hat den Hover nicht getroffen. Tab blieb in der Shell. Kein Screenreader. Keine WCAG-Freigabe.

## Regression und Sicherheit

`node --test tests/*.test.js`: 177 bestanden, 0 fehlgeschlagen, Exit 0.

ROBOCOP hat in `DESIGN-HARMONY-3D-SECURITY.md` keine gelockerte Signatur, Downgrade-Sperre oder App-ID gesehen. Die Prüfung war statisch und kannte den späteren Installer nicht. Die Artefaktprüfung danach hat die genannten Sperren im asar wiedergefunden. Der mittlere Befund bleibt: der GitHub-Feed liefert keine Modulupdates. Das Modul kommt nur mit dem Core-Installer.

## Offene Punkte

- Arbeitsbaum uncommittet. `HEAD` ist `95f0033`.
- NSIS wurde nicht installiert. Ein Core-Wechsel von der installierten `0.3.1-dev.6` auf diesen Kandidaten ist nicht gelaufen.
- Signiertes Release-Manifest fehlt lokal, absichtlich.
- Hover, iframe-Tastatur und Screenreader sind nicht nachgewiesen.
- Der Lernstandnachweis ist ein gesetzter `module_kv`-Stand, kein echter Benutzer-Local-Storage.
- `build/build-info.json` im Artefakt trägt den lokalen Hinweis. Das ist kein veröffentlichter Build.

## Nächster Schritt

Erst ein eigener Auftrag: den geprüften Stand committen und den Push auf `dev` freigeben. Erst dann kann Actions Test, signiertes Manifest und Veröffentlichung erzeugen. Dieser Bericht ist keine solche Freigabe.
