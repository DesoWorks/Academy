# Knowledge Pilot – Umsetzung

## Git

- Branch: `feature/operation-knowledge-pilot`
- Basis: `0494674374e804c692ba6120d7897179b42418e5` auf `feature/phase-n1-release-connectivity`
- `main`: `2e704e316d1cfad58f7335424ff0078012f41f10`
- `dev` und `main` wurden nicht geändert
- kein Push, kein Merge, kein Release

## Versionen, bewusst nicht angefasst

- `package.json`: `0.3.1`
- `src/core/version.js`: `CORE_VERSION` `0.3.0`
- Modul `academy-module.json`: `1.0.4`
- `themeContract`: `1`

Der Unterschied `0.3.1` gegen `0.3.0` ist der bereits bekannte Riss. Er wird hier nicht korrigiert.

`sizeBytes` im Modulmanifest steht auf `62895`. Das ist die Summe der deklarierten Paketdateien nach der Indexaktualisierung, keine Versionserhöhung. Ohne diese Anpassung würde der Installationspfad die geänderte Nutzlast ablehnen.

## Geänderte Produktpfade

- `modules/it-systemintegration/web/js/module-daten.js` – `abdeckung`, Statushelfer, Laboreintrag mit `fortschritt: "isoliert"`
- `modules/it-systemintegration/web/js/startseite.js` – Statuszeile, Legende, Abschlusszahl ohne Pilot
- `modules/it-systemintegration/web/js/navigation.js` – gesperrte Einträge mit demselben Status, Pilot ohne Fortschrittsmarkierung
- `modules/it-systemintegration/web/css/startseite.css` – Legende und Hinweis, bestehende Farben
- `modules/it-systemintegration/web/js/lf3-diagnose-kern.js` – Fälle und Bewertung
- `modules/it-systemintegration/web/js/lf3-diagnose-labor.js` – Oberfläche und Pilotstand
- `modules/it-systemintegration/web/css/lf3-diagnose.css`
- `modules/it-systemintegration/web/module/lf3-diagnose-labor.html`
- `modules/it-systemintegration/content/course.json` – Titelzeile der neuen Seite
- `modules/it-systemintegration/content/payload-index.json` – neue Dateien und Prüfsummen der geänderten Nutzlast
- `modules/it-systemintegration/academy-module.json` – nur `sizeBytes`
- `tests/knowledge-pilot.test.js`

Die Verwaltungsausbildung ist nicht berührt. Signatur- und Updatecode sind nicht berührt. Es gibt keine neue Hosted-Web-Freigabe und keine Abhängigkeit von Befund RC-04.

## Verhalten

Zugriff und Abdeckung sind getrennt. `lektionOffen` verlangt weiter `status === "verfuegbar"` am Lernfeld. LF8 und LF9 bleiben zu.

Die Abschlusszahl der Übersicht zählt Lektionen mit `fortschritt: "isoliert"` nicht mit. Der Pilot schreibt ausschließlich `it-ausbildung.lf3-diagnose-pilot.v1`.

Die Bewertung liegt in `lf3-diagnose-kern.js` und ist ohne Browser prüfbar. Die Oberfläche setzt nur `textContent`, keine HTML-Zeichenketten aus Eingaben. Es gibt keine freie Texteingabe.

## Prüfung in diesem Lauf

`node --test tests/*.test.js` im Academy-Repo: 191 bestanden, 0 fehlgeschlagen, vor der letzten Zeilenänderung am Labor. `node --test tests/knowledge-pilot.test.js` wird nach der Indexangleichung erneut ausgeführt. `node scripts/regenerate-payload-index.js --check` meldet keine Abweichung zwischen Git-Blob und Index.

Nachgeholt im lokalen Quellfenster, nicht im Installer `0.3.1-dev.8`: Übersicht zeigt Im Aufbau, In Vorbereitung und Geplant. LF8-Karten sind nicht verlinkt. Ein DNS-Auftrag im Labor endete nach Untersuchung mit `tragfaehig`. Der Installer enthält diesen Branch nicht. Ein reiner Tastaturdurchlauf ohne Maus ist nicht gelaufen.
