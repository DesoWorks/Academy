# Phase N.1 – Release Connectivity

Stand: Welle 1 läuft. Phase N.1 ist nicht abgeschlossen.

## Ausgang

- Branch `feature/phase-n1-release-connectivity`, angelegt von `e558c14` auf `feature/phase-n-continuous-delivery`.
- `main` bleibt `2e704e3`. Kein Push, kein Merge, kein Release.
- GitHub `DesoWorks/Academy` ist öffentlich. API: `private: false`, `visibility: public`, `https://github.com/DesoWorks/Academy`.
- Releases: leer.
- Remote-Branches: `main` auf `2e704e3`, `feature/phase-j-it-module` auf `2b787e3`. Der Update-Code ist nicht auf origin.

## Delegation

Acht Aufträge wurden gleichzeitig über `team.dispatch` gestartet. Kostenmeldung der Station für diese Läufe: 0 USD.

| Agent | Lauf | Auftrag | Status |
| --- | --- | --- | --- |
| Jarvis | `f8dcb440-7906-44c4-8625-36ba9f682f30` | Öffentlicher Abruf und Ed25519-Manifestprüfung | läuft |
| Terminus | `4e0e89ed-6349-4660-af00-90cf52f5e48f` | Kanal- und VPS-Entscheidung | läuft |
| ROBOCOP | `deffaf6a-e7fe-461d-a38b-5c1152621c39` | Öffentliche Historie und Updateweg | läuft |
| GLaDOS | `eb10aae8-7abc-42b2-80e4-60df358ddb9a` | Kanaltests und A/B-Protokoll | läuft |
| C-3PO | `ceed4a2d-e666-46f8-ad39-42a8eb42c3cf` | Anleitung, Pipeline, Fehlerbilder | läuft |
| TARS | `87f88301-3a84-488e-8a3f-d133a2c346a2` | Windows-Aufnahme | fehlgeschlagen, lokaler Speicher |
| Smith | `2e93c8c2-1b4f-49ee-ad7f-3b343a7fa1cd` | Zahlen aus vorhandenen Berichten | läuft |
| Hoshi | `23814580-d6e4-4f9f-ad7b-2143253014fb` | Offene Entscheidungen | geschrieben, von Rick korrigiert |

TARS wurde nicht erneut gestartet. `gpt-oss:20b` endete zweimal mit `cudaMalloc failed: out of memory`. Die Aufnahme steht in `WINDOWS-ENV-N1.md` und ist als Ricks Prüfung gekennzeichnet.

## Vertrag dieser Welle

Öffentliche Release-Liste ohne Token-Pflicht. Download nur über `browser_download_url`. Ed25519 über die rohen Manifest-Bytes. Fehlende Signatur wird abgelehnt. Authenticode bleibt getrennt. Kein stilles Downgrade. Keine VPS.

Der öffentliche Prüfschlüssel liegt in `src/updates/update-public-key.pem`. Der private Schlüssel ist ignoriert und steht nicht in dieser Akte.

## Noch nicht belegt

- Kein GitHub-Release.
- Kein gelaufener Actions-Build.
- Kein Windows-Update von A nach B.
- Manifestsignatur im Client noch nicht integriert. Jarvis arbeitet daran.
- ROBOCOP hat den Korrekturcode noch nicht nachgelesen, weil er noch nicht vorliegt.


## Welle 1, Ergebnis

Nicht abgeschlossen. Kein Push, kein Release, kein Windows-A/B.

Jarvis hat den öffentlichen Abruf und `src/updates/manifest-sign.js` gelegt. Er hat die Suite nicht laufen lassen. Rick hat die zwei neuen Testdateien danach ausgeführt: 5 bestanden, 0 fehlgeschlagen. Die Signaturprüfung in `tests/phase-n1-manifest-signature.test.js` verglich ein Objekt mit `true` und war damit immer wahr. Rick hat die zwei Zusicherungen auf `ok === false` gestellt und die Datei erneut laufen lassen.

ROBOCOP gibt keine Veröffentlichungsfreigabe. Die öffentliche Historie ist nur gekürzt gelesen. Die Nachprüfung des Korrekturcodes bleibt offen.

TARS ist mit Status Fehler stehen geblieben. Nicht erneut gestartet.
