# Commander-Entscheidungen – Phase N.1

Nur offene Entscheidungen, deren Antwort den weiteren Verlauf ändert. Bereits getroffene Grundsatzentscheidungen (main unangetastet, kein Merge oder Stable-Release, keine Änderung der Repository-Sichtbarkeit durch die Crew, keine VPS-Konfiguration ohne Freigabe und kein eingebettetes Token) sind hier bewusst nicht wiederholt.

## 1. Feature-Branch nach abgeschlossener Sicherheitsprüfung pushen?

**Entscheidung:** Soll `feature/phase-n-continuous-delivery` nach abgeschlossener Sicherheitsprüfung auf das bereits öffentliche Repository gepusht werden?

**Grund:** Ein Push macht den Branch und seine Historie öffentlich erreichbar. Das ist getrennt von der bereits entschiedenen Sichtbarkeit des Repositories und erfordert daher eine eigene Freigabe.

**Folge bei ausbleibender Entscheidung:** Kein Push; Arbeit und Tests bleiben lokal und der öffentliche Updatepfad kann nicht gegen diesen Branch erprobt werden.

## 2. Öffentliches DEV-Release für den Windows-A/B-Test anlegen?

**Entscheidung:** Darf nach Sicherheitsprüfung ein DEV-Release mit den benötigten Assets im öffentlichen Repository angelegt werden, um einen echten Windows-Updatepfad von Version A nach Version B zu testen?

**Grund:** Ein Release veröffentlicht ausführbare Updateartefakte öffentlich. Ein bloßer erfolgreicher Download oder Unit-Test belegt den geforderten A/B-Updateprozess nicht.

**Folge bei ausbleibender Entscheidung:** Kein öffentliches DEV-Release; der reproduzierbare Windows-A/B-Nachweis bleibt ausstehend.

## 3. Ablage des privaten Manifest-Signaturschlüssels

**Entscheidung:** Wo soll der private Ed25519-Manifest-Schlüssel dauerhaft und zugriffsbeschränkt abgelegt werden (z. B. offline auf einem dedizierten, gesicherten Signiergerät oder in einem vom Commander benannten lokalen Schlüsselspeicher)? Bitte Ablageort und verantwortete Sicherungs-/Wiederherstellungsweise festlegen.

**Grund:** Der Schlüssel darf weder ins Repository noch in den Client gelangen. Die Ablage bestimmt den Signierablauf, Zugriffsschutz, Backup und Wiederherstellung; ohne diese Festlegung kann die Signaturkette nicht sicher produktiv eingerichtet werden.

**Folge bei ausbleibender Entscheidung:** Keinen privaten Signierschlüssel erzeugen oder einsetzen; signierte DEV-/BETA-Manifeste und der daran gebundene Updatepfad bleiben blockiert.

## 4. Herausgeberzertifikat für Stable

**Entscheidung:** Soll der Commander ein gültiges Windows-Code-Signing-Herausgeberzertifikat bereitstellen bzw. beschaffen und dessen Thumbprint für den Stable-Build freigeben? Falls ja: welches Zertifikat und welcher verantwortete Beschaffungsweg?

**Grund:** Die vorhandene Stable-Prüfung benötigt ein Herausgeberzertifikat; im gepackten Build ist kein Thumbprint hinterlegt. Das Zertifikat ist ein zusätzlicher Echtheitsanker für Stable-Installer.

**Folge bei ausbleibender Entscheidung:** Stable bleibt gesperrt; es darf kein Stable-Release erstellt oder als funktionsfähig ausgewiesen werden.


## Korrektur des Overseers

Hoshi hat die Liste vor einer Kurskorrektur abgeschlossen. Punkte 1 und 2 sind im Auftrag Phase N.1 bereits entschieden und keine neuen Fragen.

- Der Feature-Branch darf nach abgeschlossener Sicherheitsprüfung gepusht werden. Der Branch heißt `feature/phase-n1-release-connectivity`, nicht `feature/phase-n-continuous-delivery`.
- Ein DEV-Release für den Windows-Test ist erlaubt. Ein Stable-Release bleibt verboten.
- Der private Manifest-Schlüssel für den Test liegt lokal und ist per `keys/` von Git ausgeschlossen. Seinen Inhalt gibt diese Akte nicht wieder. Ein GitHub-Actions-Secret kann die Crew nicht anlegen. Das bleibt ein Commander-Schritt, bevor Actions selbst signieren können. Ein lokal signiertes DEV-Release ist davon unabhängig.
- Das fehlende Herausgeberzertifikat bleibt ein Stable-Blocker. Es blockiert DEV nicht.
