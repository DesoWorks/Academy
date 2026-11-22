# Design Harmony 3D – Sicherheitsprüfung des lokalen DEV-Release-Kandidaten

Prüfer: RoboCop (Security Officer)
Stand: 2026-11-22, Branch-HEAD `95f0033`, Änderungen uncommittet (10 geänderte Dateien, mehrere neue Dokumente und Tests laut `git status`).
Art der Prüfung: lesend, statische Codeprüfung. Keine Anwendungsdateien geändert, nichts committet, nichts gepusht, nichts installiert.

## Empfehlung

**SICHERHEITSFREIGABE FÜR DEN LOKALEN INSTALLER-BUILD: JA (bedingt).**
Ich habe keine Umgehung einer Sicherheitskontrolle gefunden. Alle geprüften Sperren sind im Code weiterhin wirksam. Das gilt nur für den lokalen Kandidaten. Eine Veröffentlichung ist nicht Gegenstand und bleibt gesperrt. Die Bedingungen stehen unter "Grenzen der Prüfung".

## Prüfgegenstand

`src/modules/manager.js`, `src/modules/spec.js`, `src/modules/catalog.js`, `.github/workflows/academy-dev.yml`, `src/updates/manifest-sign.js`, `modules/it-systemintegration/academy-module.json`. Ergänzend gelesen: `git diff HEAD` für `src/main.js`, `spec.js` und das Modulmanifest, außerdem `src/updates/module-manifest.js` und eine Stelle in `src/updates/github-feed.js`.

## Bestätigte Kontrollen (im Code gesehen)

| Kontrolle | Nachweis | Ergebnis |
|---|---|---|
| Signaturpflicht DEV-Manifest | `academy-dev.yml`, Schritt "Manifest erzeugen und signieren": bricht mit `exit 1` ab, wenn `ACADEMY_MANIFEST_SIGNING_KEY` leer ist. Der folgende Schritt prüft mit `verifyManifest` und bricht bei `r.ok !== true` ab. | Erzwungen |
| Manifest-Signatur | `manifest-sign.js`: Ed25519 über die exakten Bytes, strenges Base64 mit genau 64 Byte, fehlender oder ungültiger Schlüssel ergibt `ok:false`. Der Schlüssel ist `src/updates/update-public-key.pem`. Dort liegt kein privater Schlüssel. | Erzwungen |
| `--publish never` | `academy-dev.yml`: `npx electron-builder --win nsis --publish never ...`. | Gesetzt |
| Workflow-Rechte | Oberste Ebene `contents: read`. Nur der Job `publish` hat `contents: write`. Er läuft nur nach grünem `test` und `build`, mit `GITHUB_TOKEN` und ohne Überschreiben bestehender Tags. | Unverändert restriktiv |
| Downgrade-Sperre | `manager.js` Z. 516: `compare(neu, installiert) < 0` ergibt `downgrade-blocked`. Das passiert vor jeder Dateioperation. | Erzwungen |
| same-version-different-content | `manager.js` Z. 521–531: gleiche Version, aber abweichende Datei-Hashes, Payload-Hashes oder `manifestIdentity` ergeben einen Fehler, bevor Dateien oder Registry angefasst werden. | Erzwungen |
| incompatible-theme vor dem Löschen | `manager.js` Z. 499–504 prüft `compatibilityOf` und wirft `incompatible-theme`. Die erste Löschung (`rmSync(incoming…)`) steht erst in Z. 542, die von `dest` in Z. 564. Core-Version, Herausgeber und Vertrauensstufe sind ebenfalls vorher geprüft. | Erzwungen |
| Theme-Vertrag | `spec.js`: `THEME_CONTRACT_SUPPORTED = 1`. `themeContract` muss eine positive Ganzzahl sein. `manager.js` `compatibilityOf` markiert fehlenden oder fremden Vertrag als inkompatibel. `open()` und `resolveHostedFile()` prüfen das erneut. | Erzwungen |
| Pfadprüfung `resolveBundledPackage` | `catalog.js` Z. 45–64: `localPackage` muss mit `modules/` beginnen, darf kein `..` enthalten und nicht absolut sein. Danach wird gegen `realpath` des Wurzelordners geprüft. Gleich dem Wurzelordner, außerhalb oder ein Symlink-Ausbruch ergibt `bad-path`. | Wirksam |
| Hosted-Web nur aus mitgeliefertem Ordner | `manager.js` Z. 485–495: `hostedWebRoots` per realpath, sonst `runtime-denied`. | Erzwungen |
| Hash-Integrität beim Lesen | `readPackage` prüft Größe, Symlinks, Pfade und Payload-SHA-256 gegen den Index. `readCourse` und `resolveHostedFile` prüfen beim Öffnen und Ausliefern erneut. Bei Abweichung wird das Modul `faulted`, nicht gelöscht und nicht ausgeführt. | Erzwungen |
| Reservierte IDs | `spec.js` und `manager.js`: `dev.desoworks.it-ausbildung` und das Präfix `dev.desoworks.` sind gesperrt. | Erzwungen |

## Modul 1.0.3: Vertrauensstufe

- Manifest: `version 1.0.3`, `trust: private`, `status: private`, `review.signed: false`, `runtime.themeContract: 1`, Rechte nur `content.read` und `progress.write`.
- Das ist kein Umgehen. `spec.js` `validateRuntime` erzwingt für `hosted-web` ausdrücklich `trust === "private"`, den Herausgeber `publisher.desoworks` und eine ID mit Präfix `desoworks.`. Eine Signatur ist für `private` nicht vorgesehen. `verifyTrust` prüft eine vorhandene Signatur trotzdem und lehnt eine falsche ab.
- `manager.js` Z. 513: Die Vertrauensstufe eines installierten Moduls wird nicht stillschweigend geändert (`trust-mismatch`). Ein Upgrade 1.0.2 auf 1.0.3 bleibt `private` und wird nicht höher eingestuft.
- Bei der Installation entsteht der Hinweis "Modul ohne Signatur installiert. Es gilt als ungeprüft…". Der Hinweis ist gewollt und passt zum Zustand.
- Gefährliche Rechte (`shell`, `filesystem`, `node`, `native`, `process`, `core-admin`) sind in `FORBIDDEN_PERMISSIONS` gesperrt. `network`, `script` und `ide.workspace` verlangen `official` und sind ohnehin nicht freigegeben.

## Benutzerdaten und App-ID

- Die Aktualisierung ersetzt nur das versionierte Paketverzeichnis `module-packages/<id>/<version>` und die Zeile in `module_install`. Der Lernstand liegt getrennt in `module_kv`. Der `ON CONFLICT DO UPDATE` auf `module_install` berührt `module_kv` nicht, und `uninstall` meldet ausdrücklich "Lernstände bleiben erhalten". Das ist ein Befund aus dem Code. Der Erhalt des Lernfortschritts im gebauten Kandidaten ist damit nicht bewiesen, das gehört zum GLaDOS-Test.
- Die Änderung an `src/main.js` ist klein. Sie führt nur eine gemeinsame `catalogFile`-Variable ein und übergibt sie dem Modulmanager. Pfade, `dataDir` und Sperren sind unverändert. Kein neuer Schreibzugriff auf das Benutzerverzeichnis.
- `package.json` steht nicht in der Liste der geänderten Dateien. `build.appId` ist weiter `dev.desoworks.academy`. Die App-ID ist also nicht angefasst.
- Es wird kein Lernstand eines echten Profils gelesen oder geschrieben. Das war in dieser Prüfung auch nicht vorgesehen.

## Befunde

| Nr. | Stufe | Befund | Status |
|---|---|---|---|
| F-1 | MITTEL | Der GitHub-Feed liefert keine Modulupdates. `github-feed.js` Z. 147 verwirft Modul-Tags (`parsed.module` ergibt `tag-invalid`). `availableUpdate()` in `manager.js` kennt nur das lokal mitgelieferte Paket aus dem Katalog. Ein Moduldelta kommt also nur mit einem neuen Core-Installer an. | Aus 3C übernommen, im Code unverändert zu sehen. Kein Sicherheitsmangel, sondern eine funktionale Grenze. Sie schützt sogar vor fremden Modulpaketen. Für den lokalen Kandidaten kein Hindernis. |
| F-2 | NIEDRIG | Die Integrität des Moduls beruht auf einem Index, der im selben Paket liegt. Das schützt vor Beschädigung und unvollständiger Kopie. Gegen gezielte Manipulation des ganzen Installers schützt es nicht. Dafür gelten Manifest-Signatur und der Authenticode-Status. Der DEV-Installer ist laut Workflow bewusst `signature=unsigned`. | Bekannte DEV-Eigenschaft, kein Mangel dieser Änderung. |
| F-3 | NIEDRIG | Ein vorher deinstalliertes Modul (`state: uninstalled`) überspringt den Vergleich "gleiche Version, anderer Inhalt". Die Downgrade-Sperre gilt weiter. Hosted-Web-Pakete kommen aber nur aus dem mitgelieferten Ordner. | Kein ausnutzbarer Weg aus dem Code erkennbar, nur als Härtungshinweis. |
| F-4 | INFORMATIV | Die Installation löscht ein vorhandenes `dest` (gleiche Versionsnummer) erst nach allen Prüfungen. Alte Versionsordner bleiben liegen und sind kein Risiko. | Beobachtung. |
| F-5 | INFORMATIV | `resolveBundledPackage` ruft `realpathSync` ohne eigenes Abfangen auf. Fehlt der Ordner, wirft die Funktion einen generischen Fehler. Der Aufrufer `availableUpdate` fängt ihn ab. | Beobachtung. |

Es gibt keinen Befund der Stufe KRITISCH oder HOCH.

## Ausdrücklich nicht umgangen

Folgende Kontrollen werden im Code weiterhin erzwungen und wurden von den uncommitteten Änderungen nicht gelockert: Signaturpflicht für das DEV-Manifest, `--publish never`, Downgrade-Sperre, same-version-different-content, incompatible-theme vor dem Löschen, Pfadprüfung im Katalog, Vertrauensstufen-Sperre und Verbot gefährlicher Rechte.

## Grenzen der Prüfung

- Rein statische Prüfung der genannten Dateien. Kein Lauf, kein Test, kein gebauter Installer, keine Portscans.
- Die Tests (`tests/hosted-module.test.js`, `tests/design-harmony-3b-update.test.js`) und die Inhalte der geänderten Renderer-Dateien (`shell.js`, `module.js`, `design-tokens.css`) habe ich nicht geprüft.
- Nicht gelesen: `scripts/make-release-manifest.js` und `src/modules/signature.js`. Ich kann nur sagen, dass der Workflow sie aufruft.
- Der Inhalt von `update-public-key.pem` und die Übereinstimmung mit dem echten Signaturschlüssel sind nicht geprüft.
- Das Manifest und der Nutzlastindex des tatsächlichen Installerartefakts sind hier nicht gegengeprüft. Das muss nach dem Build mit dem echten Artefakt geschehen (Hash des Installers, `payload-index.json` gegen die enthaltenen Dateien, `1.0.3` und `themeContract: 1` im gepackten Modul).
- Der Workflow wurde nicht ausgeführt. Dass der echte Lauf das Secret `ACADEMY_MANIFEST_SIGNING_KEY` hat, ist ungeprüft.
- Die Herkunft von `hostedWebRoots` ist im Diff von `main.js` nur teilweise sichtbar.

## Bedingungen für das GO

1. Kein Push und keine Veröffentlichung ohne Freigabe des Commanders. Der Workflow startet nur auf `dev`-Push, also nicht ohne einen solchen Push.
2. Nach dem Build die Artefaktprüfung (Hashes, Index, Version 1.0.3) von GLaDOS und Jarvis mit den echten Dateien nachweisen lassen.
3. Der Upgradetest läuft nur mit einem temporären Profil, nie mit den Lernständen des Commanders.
4. F-1 bleibt als offenes mittleres Thema für einen späteren Auftrag stehen.
