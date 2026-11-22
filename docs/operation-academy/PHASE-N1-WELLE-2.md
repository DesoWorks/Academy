# Phase N.1 Welle 2 – Stand nach Integration

Datum: 22.11.2026. Phase N.1 ist nicht abgeschlossen. Es gab bis zu diesem Bericht keinen Push, kein Release und keinen Windows-Lauf von A nach B.

## Ausgang

- Branch: `feature/phase-n1-release-connectivity`
- Ausgangscommit: `e558c14`
- `main` bleibt unangetastet. Origin-`main` ist `2e704e3`.
- `DesoWorks/Academy` ist öffentlich. Releases: keine. Origin-Branches: `main`, `feature/phase-j-it-module`.

## Was Rick selbst geprüft hat

- `resolveFeedUrl` in `src/updates/feed.js`: ein gepackter Build liefert `""` und liest `ACADEMY_UPDATE_FEED` nicht. `src/main.js` Zeile 77 benutzt diese Funktion.
- `node --test tests/` mit `TEMP` und `TMP` auf `D:\jarvis-tmp`: 131 bestanden, 0 fehlgeschlagen, 0 übersprungen. Exit 0.
- Historiensuche auf Token- und Private-Key-Muster: kein echter Treffer. `ghp_` in `UPDATE-SECURITY-N.md` ist der Suchbegriff, Länge 4.
- Privater Schlüssel `keys/academy-update-private.pem` ist ignoriert und nicht im Commit.
- Öffentlicher Schlüssel ist Ed25519.
- Installierte Phase-M-Fassung: FileVersion `0.3.1-dev.2`, 250000896 Bytes, unter `%LOCALAPPDATA%\DesoWorksAcademyPhaseM`. Kein gültiger A/B-Ausgang. Program Files: nicht vorhanden.
- `gh` ist nicht installiert. `GH_TOKEN` ist nicht gesetzt. Credential-Helper ist `manager`.

## Crew

| Agent | Lauf | Ergebnis |
| --- | --- | --- |
| JARVIS | `8755cf59-222b-46f1-8566-e5dea8f0ad58` | Updater, Signaturprüfung im Installationsweg, DEV-Workflow bricht ohne Secret ab |
| JARVIS | `9b450eba-ea48-43e6-9fe8-04950473035e` | H-1: gepackter Build ignoriert den Legacy-Feed |
| ROBOCOP | `b4937e10-053d-4d6d-ad74-e9be5859b71e` | Basisprüfung, H-1 damals offen, Veröffentlichung blockiert |
| ROBOCOP | `f605c556-9fa4-4438-8159-a361ce3181a6` | Nachprüfung: H-1 geschlossen, kein hoher Befund offen. Mittel bleibt |
| GLaDOS | `275b25ce-2c61-472c-b663-2bb7dd01fe4c` | `tests/phase-n1-w2-qa.test.js`, eigener Lauf 6 bestanden |
| GLaDOS | `1b88c4af-79ec-4fe7-8110-e71fd7670387` | Suite 131 bestanden, 0 fehlgeschlagen. Windows-A/B nicht ausgeführt |
| TERMINUS | `6d653e4b-d9ee-4697-9b2c-7310ae5b9b77` | GitHub reicht, kein VPS-Bedarf. Kanalwechsel startet kein Downgrade |
| C-3PO | `ad120869-49f2-4adc-ba20-ec298e9e0455` | Benutzer-, Rollback- und Release-Text, offene Punkte markiert |
| SMITH | `6a225f74-ae6c-4d9a-9ca2-758acf8763cc` | nur vorhandene Zahlen, A/B-Messwerte fehlen |
| HOSHI | `fdf1cf67-8cf9-4d38-b930-fbcacd83ef05` | Blockaden, keine Freigabe |
| TARS | `e8a28131-795c-448a-96b4-b534cb233106` | Modell lief. Versionszahl `0.16.3-alpha.1` war die Moduldatei, nicht die Academy. Korrigiert |

## Sicherheit

Kein kritischer und kein hoher offener Befund nach der Nachprüfung. Mittel, nicht blockierend für einen DEV-Test: Manifest ohne Frische, ein Schlüssel ohne Rotation, Modulupdates nicht über GitHub signiert, Personenbezug in der schon öffentlichen Historie. Stable bleibt wegen fehlendem Herausgeberzertifikat gesperrt.

## Offen

- Push und GitHub Actions.
- Actions-Secret `ACADEMY_MANIFEST_SIGNING_KEY`. Die Crew kann es nicht über eine Secret-Oberfläche anlegen. Ohne dieses Secret erzeugt der Workflow keinen signierten Build.
- Windows-Update von einer neuen DEV-Fassung A auf B.
- Datenintegrität nach einem echten Update.
