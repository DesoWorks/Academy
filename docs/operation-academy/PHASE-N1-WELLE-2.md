# Phase N.1 Welle 2 – Abschlussstand

Datum: 22.11.2026. Phase N.1 ist nicht abgeschlossen. `main` bleibt `2e704e3`. Kein Merge, kein Stable, keine Sichtbarkeitsänderung.

## Commits und Branches

- Ausgang: `e558c14` auf `feature/phase-n1-release-connectivity`
- Integrationscommit: `34c4c28` `Add the public GitHub update path with Ed25519 checks.`
- Dieser Bericht liegt im Folgecommit.
- Gepusht: `feature/phase-n1-release-connectivity` und `dev`, beide auf den Integrationscommit, danach der Folgecommit.
- Remote geprüft: `feature/phase-n1-release-connectivity` zeigte `34c4c283a230f3a19b0bdee89ddfc85034e7f16b`.

## Was funktioniert und von Rick geprüft wurde

- Öffentliche Releases-API ohne Token: HTTP 200, keine Releases vor dem Test, danach das DEV-Testrelease.
- `verifyManifest` prüft die rohen Manifestbytes. Ein öffentlicher Abruf von `manifest.json` und `manifest.json.sig` für `dev/v0.3.1-dev.4` ergab `ok: true`.
- `resolveFeedUrl`: gepackter Build ignoriert `ACADEMY_UPDATE_FEED`. Gelesen in `src/updates/feed.js` und `src/main.js` Zeile 77.
- `node --test tests/` mit `TEMP` und `TMP` auf `D:\jarvis-tmp`: 131 bestanden, 0 fehlgeschlagen, 0 übersprungen. Exit 0.
- GLaDOS hat dieselbe Suite ohne diese Umleitung laufen lassen: 131 bestanden, 0 fehlgeschlagen. Den angeforderten `TEMP`-Pfad hat ihr Runner abgelehnt. Windows-A/B hat sie nicht ausgeführt.
- ROBOCOP hat H-1 nach dem Fix selbst gelesen und geschlossen. Kein hoher oder kritischer Befund offen. Mittel bleibt offen und blockiert den DEV-Test nicht.
- Der öffentliche Schlüssel steckt im lokalen Build: `dist/win-unpacked/resources/app.asar` enthält den Namen und `BEGIN PUBLIC KEY`.
- Privater Schlüssel bleibt in `keys/`, von Git ignoriert, nicht im Commit und nicht im Bericht.

## Windows-A/B

Kein Ersatz für die alte Installation `0.3.1-dev.2`. Die wurde nicht als Ausgang benutzt.

1. Lokal gebaut: `DesoWorks-Academy-Setup-0.3.1-dev.3.exe` und `...dev.4.exe`.
2. `0.3.1-dev.3` still nach `D:\jarvis-tmp\academy-a` installiert. FileVersion `0.3.1-dev.3`.
3. `0.3.1-dev.4` als öffentliches Prerelease veröffentlicht: https://github.com/DesoWorks/Academy/releases/tag/dev/v0.3.1-dev.4
4. Der Update-Service mit gespeicherter Wahl `dev`, ohne Feed-Adresse und ohne Token, fand `0.3.1-dev.4`. Downloadphase `ready`. Die heruntergeladene Datei hat SHA-256 `d77bd51a1f5a41595bf5ae0a99b28867c431f72c0b99ebe8fb522838542fa76c`, identisch mit dem signierten Manifest.
5. `installPlan` war `ok`. Der Installer lief mit `/S` und Exit 0. Danach war die FileVersion in `academy-a` `0.3.1-dev.4`.
6. `academy.sqlite` unter `%APPDATA%\DesoWorks\Academy` hatte vor und nach dem Lauf denselben SHA-256 `94f0d8d4546b0549f138240feee363a23429ed36a282d51cbb86acc87a4deefb`.

Nebenwirkung: Der NSIS-Installer derselben App-ID hat die vorhandene Phase-M-Installation entfernt. Sie wurde aus `dist\DesoWorks-Academy-Setup-0.3.1-dev.2.exe` nach `%LOCALAPPDATA%\DesoWorksAcademyPhaseM` zurückgespielt. Danach FileVersion `0.3.1-dev.2`, 250000896 Bytes. Die Testinstallation unter `academy-a` ist dadurch wieder weg. Die Datenbank wurde nicht angefasst.

## GitHub Actions

Lauf: https://github.com/DesoWorks/Academy/actions/runs/45011517474

- Job `test`: fehlgeschlagen. `npm test` meldete 4 Fehlschläge, alle `Eine Nutzlastdatei hat die falsche Größe` in `src/modules/manager.js`.
- Job `build`: übersprungen. Es wurde kein Build erzeugt.
- Das Secret `ACADEMY_MANIFEST_SIGNING_KEY` wurde danach angelegt (HTTP 201). Der Wert steht nicht hier. Der fehlgeschlagene Lauf hat es nicht mehr gesehen, weil der Build nicht startete.

`.gitattributes` setzt `eol=lf`, damit ein späterer Checkout die Paketgrößen nicht durch CRLF verändert. Ob der nächste Lauf damit besteht, ist zum Zeitpunkt dieses Berichts nicht belegt.

## Crew

| Agent | Ergebnis |
| --- | --- |
| JARVIS | Signaturprüfung im Installationsweg, H-1-Sperre, DEV- und BETA-Workflow brechen ohne Secret ab |
| ROBOCOP | Basisprüfung und Nachprüfung. H-1 geschlossen. Veröffentlichung nicht mehr durch einen hohen Befund blockiert |
| GLaDOS | Tests und Suite 131/0. Windows-A/B nicht von ihr ausgeführt |
| TERMINUS | GitHub reicht, kein VPS. Kanalwechsel startet kein Downgrade |
| C-3PO | Benutzer-, Rollback- und Release-Text, offene Punkte markiert |
| SMITH | nur vorhandene Zahlen. Downloadzeit und Installationsdauer dieses Laufs hat er nicht gemessen |
| HOSHI | Blockaden, keine Freigabe |
| TARS | Modell lief. `0.16.3-alpha.1` war die Moduldatei, nicht die Academy. Korrigiert |

## Koordination

Die unabhängigen Pakete liefen parallel. Die Implementierung blieb bei JARVIS, bis H-1 nach seiner Rückkehr nachgezogen wurde. Die Suite, der Push, das Release und der Windows-Lauf lagen bei Rick, weil die Crew keine Shell-Freigabe für den Installer und kein Secret anlegen konnte. Unnötige Wartezeit entstand durch den ersten Actions-Lauf, der am alten Modultest scheiterte, bevor der Build das neue Secret sehen konnte.

## Offen

- GitHub Actions hat keinen Build erzeugt.
- Stable bleibt gesperrt, solange das Herausgeberzertifikat fehlt.
- Mittel: Manifest ohne Frische, ein Schlüssel ohne Rotation, Modulupdates nicht über den signierten GitHub-Pfad, Personenbezug in der schon öffentlichen Historie.
- Der NSIS-Installer ersetzt eine ältere Installation derselben App-ID, auch wenn `/D` einen anderen Ordner nennt. Das muss vor dem nächsten Update auf einer vorhandenen Benutzerinstallation bedacht werden.

## Nächster Schritt

Den Actions-Lauf nach dem Zeilenende-Commit abwarten. Wenn `npm test` besteht, erzeugt der Build-Job mit dem vorhandenen Secret das erste signierte DEV-Artefakt. Erst dann ist das Pipeline-Kriterium belegt. Ein Stable-Release bleibt gesperrt.
