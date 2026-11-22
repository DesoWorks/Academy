# Betriebshandbuch – Phase N.1, Welle 3

**Stand:** 22. November 2026  
**Arbeitsbranch:** `feature/phase-n1-release-connectivity`  
**Gelesener lokaler HEAD:** `70dfe52f0db6ec4d0cf091ec03411f5ea84ce7a7`  
**Geschützter Branch laut Auftrag:** `main` (`2e704e3`; nicht verändert)  
**Status:** Betriebsanleitung zum vorgesehenen DEV-Ablauf; kein Nachweis für einen erfolgreichen CI-Build oder eine neue Veröffentlichung.

## Geltungsbereich und Nachweisstatus

Dieses Dokument beschreibt den heute gelesenen Workflow- und Update-Signaturcode sowie den von der Koordination gemeldeten letzten Actions-Lauf. Code, der einen Ablauf vorsieht, ist kein Beleg dafür, dass der Ablauf erfolgreich ausgeführt wurde. Die Phase N.1 bleibt offen.

**Gemeldet durch den Lead, nicht in diesem Dokument unabhängig aus GitHub verifiziert:** Der letzte Actions-Lauf `45012452830` ist fehlgeschlagen und hat keinen Build bzw. kein Release-Artefakt erzeugt. Laut Workflow würde ein fehlendes oder ungültiges Secret `ACADEMY_MANIFEST_SIGNING_KEY` den Manifest-Schritt abbrechen. Der bereitgestellte öffentliche Schlüssel der App ist `src/updates/update-public-key.pem`.

**Lokal beobachtet:** Der gelesene Workflow `.github/workflows/academy-dev.yml` reagiert auf Pushes zum Branch `dev`; die Jobs sind `test`, danach `build`, danach `publish`. Der Build-Schritt erzeugt eine DEV-Versionsnummer aus der Paketversion und der Actions-Laufnummer. Der Publish-Job ist von erfolgreichen Tests und Build abhängig. Die Datei `scripts/make-release-manifest.js` bricht ohne privaten Manifest-Schlüssel ab und schreibt Manifest, Signatur, Installerkopie und SHA-256-Datei. Der gelesene lokale HEAD ist `70dfe52…`; damit weicht der lokale Checkout vom in der Aufgabenannahme genannten `main`-Stand ab. Das ist kein Hinweis auf eine Änderung von `main`.

## DEV-Veröffentlichung: vorgesehener Ablauf

- Veröffentlichungsquelle ist der Branch `dev`; der Workflow ist auf Pushes zu diesem Branch beschränkt.
- Vorgesehen ist die Reihenfolge **Tests → Windows-Installer-Build → signiertes Release-Manifest und Artefakt-Upload → DEV-Release-Veröffentlichung**. Veröffentlichung wird nur erreicht, wenn die abhängigen Jobs erfolgreich sind.
- Manifest-Tags folgen dem Schema `dev/v<Version>-dev.<Laufnummer>`. Das Skript prüft, ob Kanal, Tag, Version und Branch zusammenpassen.
- Laut Workflow wird ein bereits existierender Tag nicht überschrieben. Das Release wird zunächst als Entwurf angelegt, die erwarteten Manifestdateien werden geprüft und erst danach sichtbar gemacht.
- **Derzeit nicht als Erfolg belegt:** Der letzte gemeldete Lauf erzeugte keinen Build. Dieser Workflow-Entwurf ist daher keine Bestätigung, dass aktuelle Release-Artefakte oder eine neue DEV-Veröffentlichung existieren.
- Der Release-Tag `dev/v0.3.1-dev.4` bleibt gemäß Arbeitsauftrag unverändert. Keine Stable-Veröffentlichung ist Bestandteil dieses Betriebswegs.

## Manifest-Signatur und Schlüssel

- Der **private Ed25519-Schlüssel** gehört ausschließlich in das GitHub-Actions-Secret `ACADEMY_MANIFEST_SIGNING_KEY`. Er darf weder eingecheckt noch in Client-Dateien, Logs oder Dokumentation gespeichert werden. Der Workflow stellt ihn dem Build-Schritt über eine Umgebungsvariable bereit; bei fehlendem Schlüssel bricht die Erzeugung ab, statt ein unsigniertes Manifest zu veröffentlichen.
- Der **öffentliche Schlüssel** liegt in der App unter `src/updates/update-public-key.pem`. `src/updates/manifest-sign.js` lädt diesen Schlüssel standardmäßig und prüft die Ed25519-Signatur über die exakten UTF-8-Bytes des Manifests.
- Der Workflow prüft die erzeugte Manifest-Signatur vor dem Artefakt-Upload.
- Ein GitHub-Token ist nicht in den Client einzubetten. Im gelesenen Workflow wird für den Publish-Job der kurzlebige `GITHUB_TOKEN` verwendet; der Client-Updatepfad soll keine Token-Authentifizierung benötigen. Das ist von der privaten Manifest-Signatur getrennt: Ein Token ersetzt den Signaturschlüssel nicht.
- Das Workflow-Argument `signature=unsigned` beschreibt laut Manifest-Skript den Authenticode-Status des Installers (`signatureStatus`), nicht eine fehlende Ed25519-Manifest-Signatur. Das Manifest-Skript verlangt weiterhin den privaten Schlüssel und erzeugt die Manifest-Signatur.

## Sichere Windows-A/B-Tests und Installationsisolation

Eine vorhandene Installation mit derselben App-ID `dev.desoworks.academy` ist **nicht** allein deshalb isoliert, weil ein anderer Zielordner gewählt wurde. Behandle sie bis zur Bestätigung des NSIS-Verfahrens als potenziell gemeinsam betroffen. Installiere in einem A/B-Test nicht über eine bestehende Phase-M- oder andere Academy-Installation und entferne oder überschreibe keine Installation, um vermeintliche Isolation herzustellen.

Die Ursache der beobachteten NSIS-Nebenwirkung und ein belastbares Verfahren für parallele Installationen sind in diesem Betriebsstand nicht bestätigt. Bis ein dokumentierter Test das Verhalten nachweist, gilt: **keinen Installer-Test ausführen, der eine vorhandene Installation verändern oder entfernen könnte.** Ein separater Ordner allein ist kein ausreichender Sicherheitsnachweis.

## Wiederherstellung und Lernstände

Für den gemeldeten Vorfall wurde Phase M aus einem vorhandenen Installer zurückgespielt. Das ist als **Notfallweg** zu verstehen, nicht als freigegebenes, wiederholbares Verfahren zum Löschen, Deinstallieren oder Ersetzen einer Installation. Dieses Dokument erteilt keine Freigabe für solche Eingriffe.

Vor einem künftigen Installationstest müssen Isolation und NSIS-Verhalten nachweislich geklärt sein. Der Schutz bestehender Installationen und Lernstände hat Vorrang. Für Wiederherstellungs- oder Datenänderungen ist ein geprüftes, dokumentiertes Verfahren erforderlich; die vorliegende Notfallmaßnahme belegt ein solches Verfahren nicht.

## Offene Punkte

1. Die genaue Ursache der fehlgeschlagenen Windows-Modultests und der CI-Build-Blockade ist durch diesen Betriebsbericht nicht geklärt.
2. Es ist nicht belegt, dass `ACADEMY_MANIFEST_SIGNING_KEY` in den Actions-Secrets korrekt eingerichtet und für den Lauf verfügbar war.
3. Ein erfolgreicher vollständiger Lauf von Tests, Build, Signaturprüfung und Artefakt-Upload ist nicht nachgewiesen.
4. Es ist kein aus GitHub Actions stammendes DEV-Update unter Windows durch diesen Bericht getestet oder bestätigt.
5. NSIS-Installationsidentität, Registry-/Uninstall-Verhalten und sichere A/B-Isolation sind bis zum bestätigten Untersuchungsbericht offen.
6. Mehrere Sicherheitsbefunde bleiben laut Missionslage offen; dieser Betriebsbericht bewertet oder schließt sie nicht.

**Betriebsgrenze:** Bis diese Punkte mit nachvollziehbaren Nachweisen geschlossen sind, bleibt Phase N.1 offen. Keine Aussage in diesem Dokument gilt als QA-, Sicherheits- oder Commander-Freigabe.

## Gelesene Implementierungsquellen

- `.github/workflows/academy-dev.yml`
- `scripts/make-release-manifest.js`
- `src/updates/manifest-sign.js`
- `src/updates/update-public-key.pem`
- `docs/operation-academy/UPDATE-BENUTZER-N1-W2.md` (als Kontext, nicht als Ersatz für die Codeprüfung)
