# DESIGN HARMONY – DEV-Testanleitung

**Ziel:** Die installierte Academy `0.3.1-dev.5` praktisch erproben. Dieses DEV-Update ist ein Teststand, keine Produktfreigabe.

## Release- und Prüfstand

- Neue Version: `0.3.1-dev.6`
- Release: https://github.com/DesoWorks/Academy/releases/tag/dev/v0.3.1-dev.6
- Commit: `89a5d1da3c958ac04545f90de5b6793c891c60e6`
- GitHub-Actions-Lauf: https://github.com/DesoWorks/Academy/actions/runs/45041693349
- `main` bleibt auf `2e704e3`.

## Änderungen im Teststand

- Die Academy-Shell steuert Hell-, Dunkel- und Kontrastmodus zentral.
- Sechs LF3-Seiten verwenden die Farbrollen für ihre Darstellung.
- Auf diesen sechs Seiten ist der Tastaturfokus auf `MAIN` sichtbar.
- Der Skip-Link wurde in Etappe 2D im iframe geprüft.
- Die Lernlogik wurde nicht umgebaut.

## Einschränkungen

- Die DHCP-Übung zeigt die Lösung vor der Aufgabe und nennt sie bei einer falschen Antwort.
- Es gibt keine WCAG-Freigabe und keinen Screenreader-Nachweis.
- Es wurden keine weiteren Lernfelder umgestellt.
- Der Installer ist nicht Authenticode-signiert (`signatureStatus unsigned`). Das bedeutet nicht, dass das Manifest fehlt: Die Ed25519-Manifestsignatur ist gültig.

## Update über die Academy

Diese Anleitung installiert nichts automatisch. Führen Sie das Update in der installierten Academy aus:

1. Öffnen Sie **Einstellungen** und stellen Sie den Updatekanal auf **DEV**.
2. Öffnen Sie **Daten und Updates** und wählen Sie **Erneut prüfen**.
3. Nur wenn `0.3.1-dev.6` angeboten wird: **Core herunterladen** wählen.
4. Danach **Core-Update installieren** wählen. Die Anwendung beendet sich dafür und wird neu installiert.

Starten Sie den Installer nicht aus dem Browser, wenn der In-App-Weg funktioniert.

## Manuelle Prüfpunkte

- Öffnen Sie **Lernfeld 3**. Lesen Sie die Seiten **Client-Anbindung** und **DHCP** jeweils in Hell-, Dunkel- und Kontrastmodus.
- Bedienen Sie die Tastatur: Drücken Sie `Tab`, bis der Skip-Link erscheint, dann `Enter`. Drücken Sie nochmals `Tab` in den Inhalt und prüfen Sie, ob der Fokusring sichtbar ist.
- Ändern Sie Textgröße und Abstand in den Anzeigeoptionen. Öffnen Sie das Modul erneut und prüfen Sie, ob Ihre Wahl erhalten bleibt.
- Prüfen Sie, dass ein bereits vorhandener Lernstand nicht verschwunden ist.

## Wenn das Update fehlschlägt

Installieren Sie nicht erneut. Notieren Sie die Meldung auf **Daten und Updates** und löschen Sie die installierte Version nicht. Rick prüft den Actions-Lauf; ein zweiter Publish erfolgt nicht ohne Auftrag.
