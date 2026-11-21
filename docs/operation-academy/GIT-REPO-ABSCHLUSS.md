# Git-Abschluss – Academy als eigenständiges Repository

**Stand:** 2026-11-21  
**Pfad:** `D:\Desoworks\Workspace\Academy`  
**Auftrag:** Lokale Initialisierung prüfen und vervollständigen. Kein Push. Kein persönliches Ersatz-Repository.

Dieses Dokument beschreibt den geprüften Git-Stand nach dem Architektur-Lauf. Es ersetzt nicht `PHASE-I.md` und ändert keine fachlichen Inhalte.

## Ergebnis

Die Academy ist ein eigenständiges Git-Repository. Sie hängt nicht am Arbeitsbaum der IT-Ausbildung.

| Prüfung | Befund |
| --- | --- |
| Toplevel | `D:/Desoworks/Workspace/Academy` |
| Git-Verzeichnis | `.git` im Academy-Ordner, kein Gitfile, nicht shallow |
| Branch | `main` |
| Historie vor diesem Abschluss | 6 Commits, unverändert |
| Ältester Commit | `4d7f205ad5384ee602664a7bb10d64302df73485` |
| Stand vor dem Abschlusscommit | `4377df5cf555f2217e608a6fa5934ab79b7aaf98` |
| Remote | nur `origin` → `https://github.com/DesoWorks/Academy.git` |
| Upstream | keiner. Bewusst, weil der Remote-Branch noch nicht existiert |
| Push | nicht ausgeführt |

Die sechs vorhandenen Commits bleiben die Vorgeschichte. Dieser Abschluss hängt einen weiteren lokalen Commit an. Nichts wurde umgeschrieben, rebased oder neu initialisiert.

## Remote

`origin` ist lokal auf die vorgesehene Adresse gesetzt, Fetch und Push:

`https://github.com/DesoWorks/Academy.git`

Das entspricht dem Muster von `DesoWorks/IT-Ausbildung`. Es wurde kein zweiter Remote angelegt, auch nicht unter einem persönlichen Konto.

Eine lesende GitHub-Suche am 2026-11-21 fand `DesoWorks/IT-Ausbildung` (öffentlich, Standardbranch `main`). Die Suche `repo:DesoWorks/Academy` antwortete mit „Ressource existiert nicht oder keine Berechtigung“. Das Repository wurde in diesem Lauf nicht angelegt. Ob der Name in der Organisation frei ist oder nur für dieses Konto unsichtbar, ist damit nicht abschließend bewiesen. Deshalb kein `git push`, kein `gh repo create` und kein Ersatz-Remote.

Upstream bleibt unset. Ein Tracking auf `origin/main` würde einen Branch voraussetzen, den es lokal nicht gibt und der remote nicht bestätigt ist. Nach der Org-Freigabe und dem ersten erlaubten Push kann `main` mit `-u` verbunden werden.

Der bisherige Remote `source` zeigte auf `D:\Desoworks\Workspace\IT-Ausbildung` und hatte einen Remote-Tracking-Ref `refs/remotes/source/split/academy-desktop` auf `fc6ade42f3fdfb92bc8a8be6ece027814be07025`. Dieser Commit liegt in der lokalen Academy-Historie (Eltern von `4377df5`). Der Remote wurde entfernt, damit ein späteres `git push` nicht in das andere Projekt schreibt. Der Branch `split/academy-desktop` in der IT-Ausbildung bleibt dort liegen.

## .gitignore

Ignoriert werden Abhängigkeiten und Builder-Ausgabe (`node_modules/`, `dist/`, `out/`), Logs, `test-results/`, `_secure/`, lokale Env-Dateien, OS-Müll, `coverage/` und `*.asar`. Eine `.env.example` bliebe sichtbar, falls sie später angelegt wird. Modulpakete bleiben versioniert. `.gitattributes` erzwingt für `modules/`, `module-template/` und `catalog/` weiterhin LF.

`core.autocrlf` ist global `true` und wurde nicht angefasst. `init.defaultBranch` ist global `master`; der Academy-Branch ist trotzdem `main`. Globale Git-Konfiguration bleibt unverändert.

## Trennung der Projekte

Geprüft, nicht verändert:

| Projekt | Toplevel | Anmerkung |
| --- | --- | --- |
| Academy | `D:\Desoworks\Workspace\Academy` | dieses Repository |
| IT-Ausbildung | `D:\Desoworks\Workspace\IT-Ausbildung` | eigener `.git`, HEAD `b7c60e1ae4353b6872e9af73d5e188e129420657`, Branch `feature/operation-academy-unified-platform` |
| Verwaltung-Ausbildung | eigenes Toplevel | nicht angefasst |
| Website | eigenes Toplevel | nicht angefasst |
| GalaxynetOS | eigenes Toplevel | nicht angefasst |
| Evergrove | kein Git-Repository | nicht initialisiert |

In der IT-Ausbildung lagen vor dem Lauf unversionierte Dateien. Die wurden nicht angefasst und nicht aufgeräumt.

## Offene Punkte

1. `DesoWorks/Academy` existiert für dieses Konto nicht als beschreibbares Remote. Org-Berechtigung fehlt weiterhin für die Anlage.
2. Kein Upstream, bis der Remote-Branch nach ausdrücklicher Freigabe existiert.
3. Der Name `DesoWorks/Academy` ist nicht reserviert. Unmittelbar vor der Anlage erneut prüfen, wie in `REPO-NAMEN.md` festgehalten.
4. Modul-Repositories werden nicht angelegt.

## Nächster Schritt

Erst wenn die Organisation ein Repository anlegen darf: `DesoWorks/Academy` anlegen, diesen lokalen `main` einmal pushen und Upstream setzen. Nicht nach `DesoWorks/IT-Ausbildung` pushen. Kein Merge, kein Release.
