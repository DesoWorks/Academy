# DESIGN HARMONY DEV PREVIEW – Sicherheitsprüfung des uncommitteten Diffs

Prüfer: RoboCop (Security Officer)
Datum: 2026-11-22
Projekt: Academy, `D:\Desoworks\Workspace\Academy`
Branch: `feature/phase-n1-release-connectivity` (laut `git rev-parse --abbrev-ref HEAD`)
Prüfgegenstand: uncommitteter Arbeitsbaum gegen HEAD `46283bf` (Angabe des Leads; HEAD selbst habe ich nicht erneut abgefragt)
Art der Prüfung: nur lesend. Kein Anwendungscode geändert, nichts committet, nichts gepusht. Diese Datei ist die einzige Schreibaktion.

## 1. Urteil

**FREIGABE für einen DEV-Commit, unter zwei Bedingungen. Keine Produkt- und keine WCAG-Freigabe.**

Ich habe im Diff keinen Befund der Stufen KRITISCH, HOCH oder MITTEL gefunden, der durch diese Änderung neu entsteht.

Bedingungen vor dem Auslösen des DEV-Workflows:

1. **Nutzlastindex neu erzeugen.** `modules/it-systemintegration/content/payload-index.json` darf im jetzigen Arbeitsbaumzustand nicht als veröffentlichungsreif gelten. Er muss nach dem Stagen aus den Git-Blobs neu entstehen und danach vollständig verifiziert werden (siehe Abschnitt 8).
2. **Umfang des Commits bewusst festlegen.** Es liegen rund 150 untracked Dateien unter `docs/operation-academy/` (Berichte, PNGs, Probe-Skripte) sowie zwei Testdateien vor. Der Commit darf nur enthalten, was gewollt ist. Ob `docs/` aus dem Installer ausgeschlossen ist, habe ich nicht geprüft (siehe Abschnitt 9).

## 2. Geprüfter Umfang

18 geänderte Dateien (`git diff --stat`: 379 Einfügungen, 68 Löschungen):

- Host: `src/protocol.js`, `src/renderer/module.js`, `src/renderer/shell.js`, `src/renderer/settings.js`, `src/renderer/settings.html`, `src/renderer/design-tokens.css`, `src/renderer/host.css`, `src/renderer/shell.css`
- Modul IT-Systemintegration: `web/css/styles.css`, `web/js/anzeige-glossar.js`, `web/js/navigation.js`, sechs Dateien `web/module/lf3-*.html`, `content/payload-index.json`
- Untracked: `tests/design-harmony-2b-theme.test.js`, `tests/phase-n1-w4-qa.test.js`, Berichte und Probe-Skripte unter `docs/operation-academy/` (Liste über `git ls-files --others --exclude-standard`)

Die Diffs der Dateien in `src/` und `modules/` habe ich vollständig gelesen. Die Berichte und Probe-Skripte habe ich nur per Mustersuche geprüft, nicht Zeile für Zeile.

## 3. App-ID unverändert

Befund: **bestätigt.** `git grep` findet `dev.desoworks.academy` unverändert in `package.json:20`, `src/config.js:6`, `src/main.js:28`, `tests/modules-preserved.test.js:38`, `tests/protocol-path.test.js:30`. Keine dieser Dateien steht in `git status`. `git diff` auf `package.json`, `src/config.js`, `src/main.js` lieferte keine Änderung.

## 4. iframe-Sandbox und Kanäle zwischen Shell und Modul

**Sandbox: nicht gelockert.** `src/renderer/module.js:96` setzt unverändert `allow-scripts allow-forms allow-same-origin`. Die Zeile erscheint im Diff nur als Kontext. Hinzugefügt wurde direkt danach, dass die URL mit `new URL(...)` gebaut und `academy-theme` per `searchParams.set` gesetzt wird. `frame.referrerPolicy = "no-referrer"` bleibt.

**Kein neuer postMessage-Kanal.** `git grep -n -i -E "postMessage|sandbox=|allow-same-origin" -- src modules/it-systemintegration/web` liefert genau einen Treffer: die unveränderte Sandbox-Zeile. Es gibt weder `postMessage` noch einen `message`-Listener im Code. Der Kommentar in `navigation.js` ("Kein Nachrichtenkanal") stimmt mit dem Code überein.

**Neuer Transport: ein Query-Parameter.** Er ist nur eine Anzeigewahl, keine Berechtigung:

- `src/protocol.js` `themeFromUrl`: nur genau ein Wert, und nur wenn er in der eingefrorenen Liste `hell`, `dunkel`, `kontrast` steht. Sonst `hell`. Zurückgegeben wird immer das Literal aus der Liste, nie der Roh-Query.
- `applyTheme`: schreibt genau ein `data-academy-theme` in das vorhandene `<html>` und entfernt vorher ein bestehendes. Der eingesetzte Wert ist wieder ein Literal aus der Liste. Eine Attribut-Injektion über den Query ist damit nicht erkennbar.
- Die Regex `HTML_ROOT` und `ATTRIBUTE` arbeiten auf den modul-eigenen, signierten HTML-Dateien, nicht auf Angreifereingaben. Die Alternativen haben disjunkte Anfangszeichen; ich sehe kein katastrophales Backtracking. Gemessen habe ich das nicht.
- `navigation.js` `withTheme`: schreibt Links nur um, wenn Protokoll `academy:` und derselbe Host (Modul-ID) vorliegen und das Ziel HTML oder ohne Dateiendung ist. Externe Ziele und Downloads bleiben unberührt. Formulare behandelt der Code ebenso.
- Die URL-Auflösung (`resolveAcademyPath`) nutzt nach meinem Lesen den Pfad, nicht die Query. Die Datei `src/protocol-path.js` selbst habe ich nicht gelesen, sie ist unverändert.

**Neue Speicherung.** `shell.js` schreibt den Schlüssel `academy.theme` über `api.storageSet` und liest über `api.storageLoadAll`. Nur drei Werte werden geschrieben (`validTheme`). Ob der Hauptprozess Schlüssel beschränkt und ob ein Modul `academy.theme` überschreiben kann, habe ich **nicht geprüft** (Preload und Storage-Handler stehen nicht im Diff).

## 5. Signaturprüfung, Manifestschema, Updatekanäle

**Keine Änderung gefunden.** `git diff -U0 --stat -- package.json src/config.js src/main.js src/protocol-path.js src/updates .github` lieferte eine leere Ausgabe. `src/protocol-path.js` enthält die CSP-Definitionen (`CSP`, `MODULE_CSP`); sie sind unverändert. `git status` zeigt außerdem keine geänderte Datei in `src/updates/` oder `.github/`. Die Workflow-Datei `.github/workflows/academy-dev.yml` habe ich nicht gelesen; sie ist unverändert.

## 6. Secrets, Tokens, Schlüssel

- Geänderte Dateien: der gesamte Diff von `src/` und `modules/` ist gelesen. Keine Schlüssel, Tokens oder Passwörter sichtbar.
- Neue Dateien: Mustersuche (Zuweisungen von `api_key`, `secret`, `password`, `BEGIN … PRIVATE KEY`, `ghp_…`, `sk-…`) über `docs/operation-academy/` und `tests/`. Im Verzeichnis `tests/` 0 Treffer. In `docs/` nur Treffer auf das Wort "Token" in Prosa in vier **alten** Berichten (`FEHLERBEHEBUNG-N1.md`, `GITHUB-PIPELINE-N1.md`, `PHASE-N1-WELLE-2.md`, `UPDATE-SECURITY-N.md`). Keiner davon ist neu und keiner enthält einen Wert.
- Nicht geprüft: Inhalt der PNG-Dateien (Screenshots) und die Probe-JSON-Dateien auf eingebettete Pfade oder Personendaten. Die Mustersuche ist eng und ist kein Freispruch.

Einstufung: INFORMATIV, kein Befund.

## 7. Modulgrenze

**Eingehalten.** Alle geänderten Modul-Dateien liegen unter `modules/it-systemintegration/`. Die übrigen Änderungen sind Academy-Renderer (`src/renderer/*`) und `src/protocol.js`. Keine Datei unter einem Verwaltung-Ausbildung-Pfad, kein fremdes Repository, keine Änderung an `package.json`.

Beobachtung (NIEDRIG, INFORMATIV): Das Wort "nur LF3" gilt für die Darstellung, nicht für den Code. `navigation.js` und `anzeige-glossar.js` ändern sich für **alle** Seiten des Moduls IT-Systemintegration, nicht nur für die sechs LF3-Seiten. Das Verhalten ist auf den Fall `data-academy-theme` am `<html>` begrenzt; ohne dieses Attribut gilt das bisherige Standalone-Verhalten (`inAcademy` ist dann false). Nur die CSS-Regel in `styles.css` ist per `data-page` auf die sechs LF3-Seiten begrenzt. Die HTML-Diffs ersetzen ausschließlich CSS-Variablen im `<style>`-Block; ich sehe keine neuen Skripte, externen Ziele oder Inline-Handler.

## 8. Nutzlastindex im Arbeitsbaum

**Er darf vor dem Regenerieren aus Blobs nicht als veröffentlichungsreif gelten.**

Beobachtet:

- Der Index ist im Arbeitsbaum geändert (`M`). Er wurde also aus Arbeitsbaumdateien erzeugt, nicht aus Blobs.
- Ich habe jeden Eintrag gegen die Arbeitsbaumdateien gerechnet (SHA-256 und Größe): **249 Einträge, 0 Abweichungen.** Das beweist nur: Index und Arbeitsbaum sind jetzt konsistent.
- Die neun geänderten Einträge im Diff passen zu den neun geänderten Moduldateien (`styles.css`, `anzeige-glossar.js`, `navigation.js`, sechs `lf3-*.html`).
- Zeilenenden: `git ls-files --eol` zeigt für die Modul-Dateien `i/lf w/lf`, also keine CRLF-Abweichung im Modul. Nur `src/protocol.js` hat im Arbeitsbaum CRLF (`w/crlf`, `eol=lf` per Attribut). Git meldet beim Diff, dass CRLF beim nächsten Zugriff durch LF ersetzt wird. `src/protocol.js` liegt nicht im Nutzlastindex, daher keine Auswirkung auf diesen. Es erzeugt aber Rauschen im Commit.

Warum trotzdem regenerieren: Eine grüne Prüfung gegen den Arbeitsbaum belegt nicht, dass die committeten Blobs gleich sind. Normalisierung von Zeilenenden oder eine vergessene Datei im Stage würde den Unterschied erst nach dem Commit zeigen. Der Index muss aus dem gestagten Zustand entstehen und danach gegen die Blobs (`git show :pfad` oder nach dem Commit `git show HEAD:pfad`) geprüft werden.

## 9. Weitere Beobachtungen

| Nr. | Stufe | Beobachtung | Empfehlung |
|---|---|---|---|
| B-1 | INFORMATIV (bestehend, nicht neu) | Sandbox `allow-scripts allow-same-origin` zusammen: Ein Modul im Frame kann bei gleichem Ursprung die Sandbox-Wirkung weitgehend aufheben. Das Muster ist unverändert und nicht durch diesen Diff entstanden. | Gesondert bewerten, nicht in diesem Commit ändern. |
| B-2 | NIEDRIG | Die Academy erhält einen zusätzlichen Schlüssel im Speicher der Lernstände (`academy.theme`). Ob die Speicherschicht Schlüssel prüft, habe ich nicht gelesen. | Vor der Veröffentlichung klären, dass Lernstandslogik und Reset den Schlüssel nicht versehentlich löschen oder überschreiben (Teil der QA von GLaDOS). |
| B-3 | NIEDRIG | Rund 150 untracked Dateien in `docs/`, darunter PNGs und Probe-Skripte. Ob `docs/` in `package.json` `build.files` ausgeschlossen ist, habe ich nicht geprüft. | Vor dem Commit prüfen, was in den Installer gelangt. Nicht benötigte Artefakte nicht committen oder ausschließen. |
| B-4 | INFORMATIV | CRLF in `src/protocol.js` im Arbeitsbaum. | Kein Sicherheitsproblem. Nach dem Stagen kontrollieren, dass der Diff keine reine Zeilenendenänderung enthält. |

## 10. Grenzen der Prüfung

- Keine Testsuite ausgeführt, keine Laufzeitprüfung der Academy, kein Build. Das gehört zu GLaDOS und zu Phase 3.
- Kein Zugriff auf GitHub, den DEV-Workflow oder die signierten Release-Artefakte. Updateintegrität im Sinn von Signatur und Manifest des fertigen Releases kann erst nach dem Build geprüft werden; hier geprüft ist nur, dass der Diff den Mechanismus nicht berührt.
- `src/preload*`, Storage-Handler im Hauptprozess, `src/protocol-path.js` und `package.json` `build.files` wurden nicht gelesen.
- Keine WCAG-Bewertung. Keine Aussage zu Barrierefreiheit, Kontrast oder Didaktik.
- Historische Berichte (`DESIGN-HARMONY-2A…2D-SECURITY.md`) habe ich nicht als Beleg verwendet. Diese Prüfung stützt sich auf den aktuellen Diff.
- Die Freigabe gilt für den Zustand, den ich gelesen habe. Jede weitere Änderung vor dem Commit macht sie hinfällig.

## 11. Empfohlener Ablauf

1. Umfang des Commits festlegen (B-3), Dateien stagen.
2. Nutzlastindex aus den gestagten Blobs neu erzeugen, danach stagen und vollständig verifizieren.
3. Suite und GLaDOS-Prüfung grün abwarten.
4. Commit auf `feature/phase-n1-release-connectivity`, danach DEV-Workflow kontrolliert auslösen. Das öffentliche Release `dev/v0.3.1-dev.5` darf nicht überschrieben werden.
5. Nach dem Build: Signatur, Manifest und Installer prüfe ich erneut am echten Artefakt.

Die endgültige Freigabe liegt beim Commander.
