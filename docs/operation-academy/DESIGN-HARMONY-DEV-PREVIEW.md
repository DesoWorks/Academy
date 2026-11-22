# Design Harmony – DEV-Preview

**Stand:** 22.11.2026. Praktische Erprobung, keine Produktfreigabe, keine WCAG-Freigabe. Die Gesamtmission DESIGN HARMONY bleibt offen.

**Version:** `0.3.1-dev.6`  
**Release:** https://github.com/DesoWorks/Academy/releases/tag/dev/v0.3.1-dev.6  
**Actions:** https://github.com/DesoWorks/Academy/actions/runs/45041693349  
**Commit:** `89a5d1da3c958ac04545f90de5b6793c891c60e6` auf `dev` und `feature/phase-n1-release-connectivity`  
**main:** `2e704e3`. Kein Merge, kein Stable-Release, keine Installation auf dem Rechner des Commanders.

Testanleitung: [DESIGN-HARMONY-DEV-ANLEITUNG.md](DESIGN-HARMONY-DEV-ANLEITUNG.md). Kurzstatus: [DESIGN-HARMONY-DEV-STATUS.md](DESIGN-HARMONY-DEV-STATUS.md).

## Was veröffentlicht wurde

Die Academy-Shell besitzt Hell, Dunkel und Kontrast. Der Modus liegt unter `academy.theme`, wird als Query-Parameter `academy-theme` an den Modulrahmen gegeben und von `src/protocol.js` nur aus der Allowlist auf das HTML gesetzt. Die sechs LF3-Seiten nutzen die vorhandenen Farbrollen. Der sichtbare Fokusring auf `MAIN` gilt nur für diese sechs `data-page`-Werte. Lernlogik und Lernstände wurden nicht umgebaut.

`package.json` bleibt bei `0.3.1`. Die veröffentlichte Nummer setzt der Workflow als `0.3.1-dev.${GITHUB_RUN_NUMBER}`. Der vorherige erfolgreiche Lauf war Nummer 5 (`0.3.1-dev.5`). Dieser Push hat Lauf 6 ausgelöst.

## Prüfungen

| Prüfung | Ergebnis |
| --- | --- |
| Lokale Suite `npm test` vor dem Commit | 163 bestanden, 0 fehlgeschlagen, Exit 0 |
| Nutzlastindex nach dem Stagen | `node scripts/regenerate-payload-index.js --check`, Exit 0, 249 Einträge, `sizeBytes` 62017 |
| Actions-Job test | erfolgreich |
| Actions-Job build | erfolgreich, einschließlich Manifestsignatur im Lauf |
| Actions-Job publish | erfolgreich, Prerelease, kein Entwurf |
| Manifest | Version `0.3.1-dev.6`, Kanal `dev`, Commit `89a5d1d`, Größe 133440971 |
| Ed25519 | `verifyManifest` gegen den öffentlichen Schlüssel: `ok: true` |
| Installer | 133440971 Bytes, SHA-256 `ea82406bc79c27c14bb3c748e55b3d4b96768cce4e23afc3048583b14f85b0ad`, identisch mit dem Manifest |
| Erkennung aus `0.3.1-dev.5` | `selectCandidate` auf dem öffentlichen DEV-Feed: `action: available`, Tag `dev/v0.3.1-dev.6` |

Die Erkennung ist eine Prüfung des Updatecodes gegen die öffentliche API. Die installierte Academy wurde nicht angefasst.

`signatureStatus: unsigned` beschreibt nur Authenticode des Installers. Das Manifest ist signiert.

## Was nicht belegt ist

- Keine neue gerenderte Academy-Prüfung in diesem Lauf. Die Aufnahmen aus Etappe 2D gelten für denselben LF3-Stand, weil die Konsolidierung keine Anwendungsdatei mehr geändert hat.
- Kein Screenreader. Kein bestandenes WCAG 1.4.10. Der Vorwärtsweg aus dem Frame ist nicht bis zum Ende geprüft.
- Die DHCP-Übung zeigt erwartete Angaben vor der Aufgabe und nennt bei einer falschen Antwort die richtige Aussage.
- Weitere Lernfelder sind nicht umgestellt. `navigation.js` und `anzeige-glossar.js` gelten modulweit, sobald die Academy den Modus setzt. Das ist die gemeinsame Theme-Schnittstelle, kein Rollout der Lernseiten.
- Sieben ältere Welle-4-Notizen liegen weiter uncommittet und sind nicht Teil von `0.3.1-dev.6`.

## Nächster Schritt

Der Commander testet selbst. Kanal DEV, dann Daten und Updates, Erneut prüfen. Nur bei angebotener `0.3.1-dev.6` herunterladen und installieren. Punkte und Abbruch stehen in der Testanleitung.

Ein weiterer Push auf `dev` würde Lauf 7 und damit `0.3.1-dev.7` erzeugen. Deshalb bleibt der Abschlussbericht auf dem Feature-Branch und geht nicht noch einmal nach `dev`.
