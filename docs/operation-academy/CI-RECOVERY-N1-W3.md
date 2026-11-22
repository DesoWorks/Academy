# CI-Recovery N.1 Welle 3: Modulnutzlast im GitHub-Checkout

**Verfasser:** Jarvis, Chief Engineer
**Branch:** `feature/phase-n1-release-connectivity`, HEAD `70dfe52`
**Stand:** 22.11.2026, nicht committet, nicht gepusht
**Status:** Fix implementiert und lokal gegen einen frischen Checkout aus dem Git-Index geprüft. **Ein grüner GitHub-Actions-Lauf ist nicht nachgewiesen.**

## Kurzfassung

Die vier Modultests scheitern auf dem Runner, weil die Größen und Prüfsummen im Nutzlastindex nicht zu den Bytes passen, die Git speichert. Dafür gibt es **zwei unabhängige Ursachen**. Die zweite war bisher nicht bekannt:

1. **Textdateien (241 Einträge):** Der Index beschreibt CRLF-Bytes. Git speichert und liefert LF.
2. **Bilddateien (5 Einträge):** Die Git-Blobs sind **beschädigt**. Eine frühere Attributregel hat sie als Text behandelt und CRLF zu LF umgeschrieben. Der Index beschreibt hier die intakten Originale.

Der Fix gleicht den Index bei Textdateien an die LF-Blobs an und stellt bei den Bildern die Originalbytes in Git wieder her. Den Index an die beschädigten Bilder anzupassen wäre falsch gewesen: Die Prüfung wäre grün, die ausgelieferten Bilder blieben kaputt.

## 1. Beobachtungen (gemessen)

| # | Beobachtung | Quelle |
|---|---|---|
| B1 | Die Prüfung `stat.size !== entry.size` löst den Fehler aus. | `src/modules/manager.js` Zeile 124 und 125 |
| B2 | Der Index hat 249 Einträge. 246 davon weichen vom Git-Blob ab (241 Text, 5 Binär), 3 stimmen überein. | Vergleich Blob gegen Index, alle 249 Einträge |
| B3 | Textbeispiel: `web/assets/desoworks-02-terminal.svg` Index 1034 Bytes, Blob 1026 Bytes. `web/css/bwl-werkstatt.css` 5216 gegen 5139. | `--check` des Skripts |
| B4 | Alle Textblobs sind reines LF. Die Arbeitskopie war CRLF (241 Dateien `i/lf w/crlf`, `core.autocrlf=true`). | `git ls-files --eol` |
| B5 | Bei allen 5 Binärdateien ist der Blob exakt die Arbeitskopie mit CRLF zu LF. Arbeitskopie und Originalquelle `IT-Ausbildung` stimmen mit dem Index überein. | Bytevergleich |
| B6 | `favicon-32.png`: Blob beginnt mit `89 50 4E 47 0A 1A 0A`, Original mit `89 50 4E 47 0D 0A 1A 0A`. Die PNG-Signatur ist im Blob zerstört. | Hex-Kopf |
| B7 | Größen Index gegen Blob: PNG 788/787, ICO 2600/2597, JPG 3091012/3090964, JPG 3993600/3993571, JPG 4097171/4097149. | `--check` |
| B8 | `4a93e1a:.gitattributes` enthält `modules/** text eol=lf`. Das ist der Commit, der die Module aufnahm. | `git show 4a93e1a:.gitattributes` |
| B9 | Ein frischer Checkout aus dem Git-Index (`git checkout-index`) reproduziert den CI-Fehler: in den Dateien `phase-k-updates` und `phase-m-updates` 8 Tests, 4 bestanden, 4 gescheitert, jeweils `Eine Nutzlastdatei hat die falsche Größe`. | Lauf vor dem Fix |
| B10 | `git add` ohne Optionen ließ den beschädigten Blob von `favicon-32.png` unverändert (gleiche Objekt-ID). Erst `git add --renormalize` ersetzte ihn. | Eigener Versuch |

## 2. Ursache

**Belegt:**

- **U1 (Text):** Der Index wurde aus der CRLF-Arbeitskopie berechnet (so von Rick gemessen, 249 Dateien, 0 Abweichungen gegen die CRLF-Kopie). Der Checkout liefert LF. Größe und SHA-256 passen nicht. Die Regel `* text=auto eol=lf` aus Commit `0777690` ändert nur, was künftig gespeichert und ausgecheckt wird. Der Index wurde dadurch nie neu berechnet und die Blobs waren schon LF. Deshalb hat `.gitattributes` den Fehler nicht behoben.
- **U2 (Bilder):** Beim Commit `4a93e1a` galt `modules/** text eol=lf`. Die Regel erfasste auch PNG, ICO und JPG. Git hat dabei CRLF zu LF umgeschrieben. Belegt durch B5, B6 und B8: Blob gleich Arbeitskopie mit CRLF zu LF, Differenz in Bytes gleich der Zahl der CRLF-Paare, PNG-Signatur zerstört. Die Regel ist später durch `* text=auto eol=lf` plus `*.png`/`*.ico binary` ersetzt worden. Dadurch ist die Ursache für künftige Commits weg, die gespeicherten Blobs blieben aber beschädigt.

**Abgeleitet, nicht geprüft:**

- Gebaute Pakete, die aus einem Checkout stammen, hätten die beschädigten Bilder ausgeliefert. Ob die Welle-2-Installer aus der lokalen CRLF-Arbeitskopie gebaut wurden und daher intakte Bilder enthalten, habe ich nicht geprüft.

## 3. Implementierung

| Datei | Änderung |
|---|---|
| `scripts/regenerate-payload-index.js` | **Neu.** Liest die Git-Blobs (`ls-files -s`, `cat-file`), nicht die Arbeitskopie. Berechnet bei Textdateien Größe und SHA-256 aus den LF-Bytes. Bricht ab, wenn ein Textblob CR enthält. Lässt Binäreinträge unverändert und stellt beschädigte Binärblobs nur mit `--restage-binaries` wieder her (nur wenn die Arbeitskopie dem Index entspricht und Git die Bytes beim Erfassen nicht verändert, danach Nachmessung des Blobs). `--check` ändert nichts und endet bei Abweichung mit Exit 1. `--sync-worktree` setzt CRLF-Textkopien auf die Blob-Bytes, nur bei reinem CRLF-Unterschied. Das Skript committet und pusht nie. |
| `modules/it-systemintegration/content/payload-index.json` | Neu geschrieben, 249 Einträge, 241 Einträge geändert, Format und Reihenfolge unverändert. |
| `modules/it-systemintegration/academy-module.json` | `sizeBytes` 62021 auf 62017. Der Installationspfad prüft diesen Wert gegen die Summe der deklarierten Dateien (`manager.js` Zeile 78). Der Index ist selbst deklariert und wurde um 4 Bytes kürzer (aus der Differenz abgeleitet). Ohne die Änderung wäre die Installation mit `integrity` abgewiesen worden. |
| `.gitattributes` | Sieben Zeilen ergänzt: `*.jpg`, `*.JPG`, `*.jpeg`, `*.gif`, `*.webp`, `*.woff`, `*.woff2` als `binary`. Das sind die übrigen Bildformate und Schriften, die `package-it-module.js` aufnimmt. Sie hingen bisher nur an der Auto-Erkennung. |
| 5 Bilddateien im Git-Index | Blobs wieder auf die Originalbytes gesetzt (`git add --renormalize`), Größen 787, 2597, 3090964, 3993571, 4097149 auf 788, 2600, 3091012, 3993600, 4097171. |
| 241 Textdateien (Arbeitskopie) | CRLF auf LF gesetzt, damit die lokale Suite zum neuen Index passt. Für Git ist das inhaltlich keine Änderung. |

Kein Test entfernt oder geändert, keine Größenprüfung berührt, keine Erwartungswerte von Hand angepasst, kein Workflow geändert, keine App-ID geändert.

## 4. Durchgeführte Prüfungen (ausgeführt, Ergebnis gelesen)

| Prüfung | Ergebnis |
|---|---|
| `node --check scripts/regenerate-payload-index.js` | Exit 0 |
| `--check` **vor** dem Fix | Exit 1: 241 Text- und 5 Binärabweichungen |
| `--check` **nach** dem Fix | Exit 0 |
| Frischer Checkout vor dem Fix, `phase-k-updates` und `phase-m-updates` | 8 Tests, **4 bestanden, 4 gescheitert**, Fehler wie in CI |
| Frischer Checkout nach dem Fix, dieselben zwei Dateien | 8 Tests, **8 bestanden, 0 gescheitert** |
| Frischer Checkout nach dem Fix, `node --test tests/*.test.js` | **131 bestanden, 0 gescheitert, 0 übersprungen** |
| Arbeitskopie, `node --test tests/*.test.js` | **134 bestanden, 0 gescheitert, 0 übersprungen** (3 Tests mehr aus der nicht versionierten `tests/phase-n1-w3-qa.test.js`, die ich nicht angefasst habe) |

Der Checkout entstand mit `git checkout-index -a` aus dem gestagten Stand in einem Temp-Ordner mit Verknüpfung auf das vorhandene `node_modules`. Er enthält nur versionierte Dateien, wie ein Runner.

## 5. Nicht ausgeführt oder nicht nachgewiesen

- **Kein GitHub-Actions-Lauf.** Ob `test`, `build` und `publish` grün werden, ist offen. Ich habe nur den Runner-Fall lokal nachgestellt, aber nicht auf einem echten Runner.
- Der Checkout lief mit der lokalen Konfiguration (`core.autocrlf=true`), nicht mit einem echten `git clone` auf dem Runner.
- Kein Build, keine Signatur, kein Installer, kein Windows-Updatetest.
- Die gebauten Bilder in einem Paket habe ich nicht visuell geprüft. Geprüft sind SHA-256 und Größe gegen den Index, und der Index entspricht der Originalquelle.
- Bleibt ungeprüft: ob andere Projekte oder Module dieselbe Regel `modules/** text eol=lf` in ihrer Historie hatten.

## 6. Git-Stand

- **Gestagt (nur durch diesen Auftrag):** `.gitattributes`, `academy-module.json`, `payload-index.json` und die fünf Bilder. 8 Dateien, 490 Einfügungen, 483 Löschungen laut `git diff --cached --stat`.
- **Nicht gestagt:** `build/build-info.json` (war schon vor meiner Arbeit geändert), `scripts/regenerate-payload-index.js` (neu) und die Dokumente und der Test anderer Agenten.
- **Kein Commit, kein Push, `main` unberührt.**
- Wenn Rick das Staging zurücknehmen will: `git restore --staged .gitattributes modules/it-systemintegration`. Die Arbeitskopie bleibt dabei unverändert, die Blobs der Bilder dann aber wieder im alten Zustand.
- Hinweis zur Korrektur des Auftrags: Ich hatte entgegen der Annahme `shell_exec` und habe das Skript selbst ausgeführt. Ein erneuter Lauf von `node scripts/regenerate-payload-index.js --check` ist gefahrlos und liefert Exit 0.

## 7. Offene Punkte und Empfehlung

1. **`scripts/package-it-module.js` erzeugt den Index weiterhin aus den Rohbytes der Quelle.** Ein erneuter Lauf würde den CRLF-Index zurückbringen und den Fehler wiederherstellen. Nicht geändert, weil außerhalb des kleinsten Fixes. Empfehlung: nach jedem Paketieren zuerst committen oder stagen und dann `node scripts/regenerate-payload-index.js --check` laufen lassen, besser noch das Skript so anpassen, dass es Textdateien auf LF normalisiert.
2. **Ein Wächtertest im Repository fehlt.** `--check` wäre ein geeigneter Test, ich durfte `tests/phase-n1-w3-qa.test.js` und die Workflows nicht anfassen. Rick soll entscheiden, ob eine neue Testdatei oder ein zusätzlicher Workflow-Schritt gewünscht ist.
3. **Reihenfolge für Rick:** Fix committen, pushen, den Actions-Lauf abwarten und das Ergebnis der Jobs `test`, `build` und `publish` aus dem Lauf selbst lesen. Erst dann gilt der Punkt als bestanden.
4. Die Temp-Checkouts unter `%TEMP%\academy-ci-before` und `%TEMP%\academy-ci-after` sind Wegwerfkopien (siehe Abschnitt 4).
