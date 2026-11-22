# Design Harmony 3E – Commit und Installernachweis

**Stand:** 22. November 2026
**Empfehlung:** Bedingtes GO für einen späteren Push auf `dev`. Nicht ausgeführt. Keine Installation.

## Commit

`9e03fb8d9cb7cef914e1738d2e22278093c88f3f` auf `feature/phase-n1-release-connectivity`.

75 Dateien. Nicht enthalten: `dist/`, Secrets, `build/build-info.json`, die untracked N1-W4-Notizen.

Der Nutzlastindex wurde vor dem Commit gegen die Git-Blobs geprüft: 249 Einträge, `sizeBytes` 62017, Indexdatei unverändert.

`node --test tests/*.test.js` vor dem Commit: 177 bestanden, 0 fehlgeschlagen, Exit 0.

`main` bleibt `2e704e3`. `origin/dev` bleibt `89a5d1d`. Der Feature-Branch ist lokal einen Commit voraus. Kein Push.

## Installer aus diesem Commit

Befehl: `npx electron-builder --win nsis --publish never -c.extraMetadata.version=0.3.1-dev.6.local`

Exit 0. Datei `dist/DesoWorks-Academy-Setup-0.3.1-dev.6.local.exe`.

- 133.444.651 Bytes
- SHA-256 `d3afc31d0d9e64efe17dda86403c56166ca926f84fe0b87ca73e9a860fa3c11b`
- Nicht signiert. Das ist der lokale Kandidat, nicht das Actions-Artefakt.
- Die Versionszeichenkette `.local` ist absichtlich nicht die öffentliche DEV-Version.

Aus dem NSIS-Archiv `app-64.7z` extrahiert, nicht installiert:

- `resources/academy-modules/it-systemintegration/academy-module.json` ist bytegleich mit dem Commit. Version `1.0.3`, `themeContract` 1.
- `content/payload-index.json` ist bytegleich mit dem Commit.
- `resources/app.asar` ist bytegleich mit `dist/win-unpacked/resources/app.asar`.
- `build/build-info.json` im Asar nennt Commit `9e03fb8d9cb7cef914e1738d2e22278093c88f3f`.

Der Katalog `resources/academy-catalog/official.json` verweist auf `modules/it-systemintegration`. Im gepackten Layout löst der Manager das auf `resources/academy-modules/it-systemintegration` auf. Ein Core-Update liefert diesen Katalog mit dem Installer. Der GitHub-Feed liefert weiter keine Modulpakete.

## Upgradeprobe

`docs/operation-academy/design-harmony-3e/probe-upgrade.js` gegen den extrahierten Katalog, temporäres Profil, Kopie von Modul `1.0.2`. Exit 0.

- Vorher: `1.0.2`, inkompatibel, Update auf `1.0.3` angeboten.
- Gleicher Inhalt unter anderer Beschreibung: `same-version-different-content`. Version, Datei und Lernstand blieben `1.0.2`.
- Neueres Paket ohne Vertrag: `incompatible-theme`. Dieselben Werte blieben.
- Danach Installation aus dem extrahierten Katalog: `1.0.3`, Vertrag 1, kompatibel. `lf3-dhcp` abgeschlossen, `lf3-skizze` begonnen. Das ist ein gesetzter `module_kv`-Stand, nicht der echte Lernspeicher des Commanders.
- Profilmarker und geprüftes Manifest von `1.0.2` unverändert (`profileUntouched: true`).

Ein Core-Wechsel der installierten `0.3.1-dev.6` wurde nicht ausgeführt.

## Offen

- `updates.status is not a function` kommt vom Prüfstub. `src/updates/service.js` hat `status()`. Kein belegter Produktfehler.
- Hover nicht getroffen. Tab im iframe nicht nachgewiesen. Kein Screenreader. Keine WCAG-Freigabe.
- Ist der Katalog gesetzt, aber unlesbar, zeigt die Karte „Keine Aktualisierung verfügbar“ statt „Nicht geprüft“ (ROBOCOP B6, niedrig). Der mitgelieferte Katalog dieser Probe war lesbar.
- Der Windows-Benutzername steht in älteren öffentlichen Berichten bereits. Die neuen Nachweise wiederholen ihn. Kein neues Secret.

## Unabhängige Bewertung

- GLaDOS: `docs/operation-academy/DESIGN-HARMONY-3E-QA.md`. Urteil eingeschränkt. Tests nicht selbst ausgeführt. Installer nicht geprüft. Kein Veröffentlichungs-GO aus der QA allein.
- ROBOCOP: `docs/operation-academy/DESIGN-HARMONY-3E-SECURITY.md`. Kein Befund ab Mittel. Signaturpfad, Downgrade-Sperre und App-ID unverändert. 38 Tests in fünf Dateien bestanden. Installer nicht von ROBOCOP geprüft.

## Push

Ein Push des Feature-Branches veröffentlicht nichts. Veröffentlicht wird nur ein Push auf `dev`. Der Workflow setzt die Version auf `0.3.1-dev.` plus `GITHUB_RUN_NUMBER`. Der letzte Lauf ist Nummer 6, `dev/v0.3.1-dev.6`. Der nächste Lauf wäre `0.3.1-dev.7`, sofern vorher kein anderer Lauf dieses Workflows startet.

Der lokale Installer darf dafür nicht verwendet werden.
