# DesoWorks Academy – Theme-Vertrag 3

**Stand:** 22.11.2026 · **Status:** verbindliche Architekturentscheidung, keine Implementierungsabnahme und keine Release-Freigabe.

**Grundlage:** lokaler Quellstand `feature/phase-n1-release-connectivity` (`95f0033`) und der bestehende [Theme-Vertrag 2B](DESIGN-HARMONY-2B-VERTRAG.md). Die installierte Academy `0.3.1-dev.6` und ihr Profil sind nicht Gegenstand der Änderung.

**Problem:** Der Core kann derzeit nicht zuverlässig erkennen, ob ein installiertes Webmodul seinen Darstellungsmodus tatsächlich übernimmt.

## 1. Vertrag: Theme-Schnittstelle v1 im bestehenden Manifest

Die Schnittstelle wird als **`runtime.themeContract: 1`** im vorhandenen `academy-module.json` deklariert. `1` ist eine JSON-Ganzzahl, kein String. Das Feld gehört ausschließlich zu `runtime.kind: hosted-web`. Im Theme-Vertrag steht die `3` für die Etappe, nicht für die Schnittstellenversion.

- `formatVersion` bleibt `1`: Sie versioniert das Manifestformat, nicht das Verhalten der Web-Laufzeit. `version` bleibt die SemVer des Modulpakets. `manifest.core` bleibt der einzige Ausdruck für die benötigte Core-Version bzw. den unterstützten Bereich; kein zusätzliches `minCore` im Theme-Feld. Ein später deklariertes Paket muss über `core` auch Cores ausschließen, die diesen Vertrag noch nicht durchsetzen. Das konkrete Mindestrelease wird erst bei der Implementierung festgelegt.
- Bei `hosted-web` bedeutet ein fehlendes oder vom Core nicht unterstütztes Theme-Level **inkompatibel**; ein vorhandener Wert falschen Typs oder außerhalb positiver Ganzzahlen ist ein **Manifestfehler**. Der Core behandelt fehlende Angaben nicht als v1. Bei reinem Lerninhalt ohne Web-Laufzeit ist das Feld nicht anzuwenden: Der Core rendert den Inhalt selbst. Die Core-Prüfung bleibt in beiden Fällen Pflicht.
- Der Manager ermittelt die Kompatibilität aus dem **tatsächlich installierten** bzw. **zur Installation geprüften** Manifest: `manifest.core` muss passen; bei `hosted-web` muss zusätzlich die deklarierte Theme-Version unterstützt sein. Paketnummer, Quellordner, Feed-Angabe oder sichtbares Root-Attribut sind kein Ersatz für diese Prüfung. Die Deklaration ist eine Zusicherung des Pakets; die tatsächliche Einhaltung ist vor Veröffentlichung im Laufzeittest zu belegen.
- Inkompatible installierte Webmodule bleiben registriert und sichtbar, mit Begründung (Core oder Theme-Vertrag), aber ohne Öffnen: Der Manager verweigert `open`; auch direkte `academy://<modul-id>/…`-Aufrufe dürfen keine inkompatiblen Paketdateien ausliefern. Kein stiller Betrieb mit gemischten Paletten, kein automatisches Löschen und keine Umdeutung in einen Integritätsfehler. Neue inkompatible Pakete dürfen keine bisher installierte Version ersetzen.

**Abgewogene Optionen:**

| Option | Vorteil | Nachteil und Entscheidung |
|---|---|---|
| **A. Eigenes Feld in `runtime`** | Explizit, getrennt versionierbar, kleinster Zusatz im vorhandenen Manifest. | Validator und Manager müssen das Feld auswerten. **Gewählt.** |
| B. Vorhandene Versionsfelder umdeuten (`formatVersion`, `core` oder Paket-`version`) | Kein neues Feld. | Vermischt Manifestlesbarkeit, Core-Voraussetzung oder Paketversion mit einem Laufzeitverhalten; zwei Pakete mit gleichem Core-Bereich können sich beim Theme unterschiedlich verhalten. Verworfen. |
| C. Verhalten indirekt erkennen (Root-Attribut, Skriptprüfung oder Laufzeit-Handshake) | Könnte bei einzelnen Paketen ohne Manifeständerung ansetzen. | Das Protokoll injiziert das Attribut bereits unabhängig vom Verhalten; Skript-Heuristiken sind unzuverlässig, ein Handshake wäre ein zweiter Kanal nach dem Start. Verworfen. |

## 2. Vertrag: Ein Eigentümer, ein Transport

Die **Shell ist alleinige Quelle** des Farbmodus. Der bestehende Pfad bleibt: Shell-Einstellung `academy.theme` → genau ein URL-Parameter `academy-theme` → Protokollhandler → `data-academy-theme` am expliziten `<html>` des Moduls. Erlaubt sind exakt `hell`, `dunkel`, `kontrast`. Fehlender, mehrfacher oder ungültiger Query-Wert führt im Protokoll zu `hell` **mit** Root-Attribut, nicht zum lokalen Modus. Ein fehlendes `<html>` ist ein Vertragsverstoß, kein Standalone-Fallback. Der Parameter ändert weder Modul-ID noch Origin oder Pfad und ist kein Vertrauenssignal.

Sobald `data-academy-theme` gesetzt ist, liest das Modul den validierten Wert ausschließlich von dort. Es darf das Attribut nicht schreiben, entfernen oder durch lokale Präferenzen, Reset, Medienabfragen zur Moduswahl oder eine zweite Palette überstimmen. Ein passiver Spiegel nach `data-theme` für vorhandene CSS-Regeln ist zulässig; die Academy-Rollen behalten Vorrang. Die lokale Farbauswahl ist deaktiviert oder nicht sichtbar; bei deaktivierter Anzeige erklärt ein Hinweis die Zuständigkeit der Academy. Textgröße, Abstände und reduzierte Bewegung bleiben eigenständig. Ohne Root-Attribut bleibt der bisherige Standalone-Modus erhalten; der Query allein löst ihn nicht ab.

Bei interner Dokumentnavigation reicht das Modul den validierten Root-Wert im selben `academy:`-Host weiter, auch bei dynamischen Zielen und Formularnavigation; andere Zielparameter und Fragmente bleiben gemäß 2B erhalten. Keine Weitergabe an andere Hosts, Assets, Downloads oder reine Ankersprünge. Beim Öffnen oder Wechseln eines Moduls setzt die Shell ihren aktuellen Wert; kein separater Live-Synchronisationskanal. `design-tokens.css` bleibt die gemeinsame Rollenmatrix mit der **bereits vorliegenden Kontrastkorrektur** als Integrationsgrundlage; keine neue Palette, keine neue Bridge, keine Änderung an Sandbox, CSP oder Origins.

## 3. Vertrag: Paketersatz ohne Datenverlust

`dataDir/module-packages/<id>/<version>` enthält nur versionierte Paketdateien. Die Registrierung in `dataDir/modules.sqlite` (`module_install`) verweist auf die aktive Version; Lernfortschritt in `module_kv` bleibt an die stabile Modul-ID gebunden, nicht an die Paketversion. Hosted-Web-Lernstände und Einstellungen im Chromium-Speicher von `academy://<modul-id>` (insbesondere `localStorage`) sind getrennte Benutzerdaten. Profil, Partition, Origin und bestehende Speicher-/Fortschritts-IDs bleiben beim Paketersatz unverändert; kein versionsabhängiger Host und kein Leeren, Zurücksetzen, Kopieren zwischen Origins oder Neuanlegen des Profils als Teil des Updates. Laufzeitgebundener `sessionStorage` wird nicht absichtlich gelöscht; daraus folgt keine zusätzliche Persistenz über das Ende seiner Sitzung hinaus.

Der vorhandene Manager stellt die neue Version separat bereit und schaltet den Registereintrag erst nach erfolgreichen Prüfungen und vollständiger Bereitstellung um. Bei einem Fehler vor der Aktivierung bleiben bisheriger Registereintrag, dessen Paket und Benutzerdaten erhalten. Kein Uninstall/Neuinstallieren als Updateablauf, keine Migration zwischen SQLite und Webspeicher und keine zweite Datenhaltung. Ein Snapshot von Paketdateien ist kein Backup des Lernfortschritts und kein automatischer Downgrade-Pfad.

## 4. Vertrag: Updates über den vorhandenen Manager

Die Academy nutzt die bereits vorhandenen Katalog-/Updatequellen und die vorhandene Installationsstrecke bis `installFromDirectory`. Für Feed-Pakete bleiben Archivhash und Abgleich von Paket-ID und Version mit dem vorbereiteten Angebot bestehen. Der Manager entscheidet nach erneuter Prüfung des konkreten Pakets; weder ein Feed-Eintrag noch ein UI-Status erteilen Installationsberechtigung. Manifest, Dateiintegrität, Core-/Theme-Kompatibilität, Abhängigkeiten, erlaubte Herkunft, Herausgeber und Trust bleiben Prüfungen des vorhandenen Pfads.

Die **bestehenden Signaturregeln bleiben unverändert**: `reviewed`/`official` benötigen Ed25519 mit hinterlegtem Schlüssel; eine vorhandene Signatur anderer Pakete wird ebenfalls geprüft. Die bestehende private `hosted-web`-Regel wird weder gelockert noch als generelle Signaturpflicht umgedeutet. Bei signierten Paketen ist `runtime.themeContract` über das kanonische Manifest bereits vom Signaturumfang erfasst; kein zweiter Signaturmechanismus und kein nachträgliches Patchen eines installierten Manifests.

Ein reguläres Update setzt dieselbe Modul-ID und eine **streng neuere** Paketversion voraus. Eine gleich alte Version ist kein Update; das ist keine neue Reparaturregel für bewusste Wiederinstallation. Ein älteres Paket wird auch beim finalen Installationsversuch blockiert. **Repo `1.0.1` ersetzt installiertes `1.0.2` nicht**, auch wenn der Quellcode die Darstellung bereits übernimmt. Kein Umgehen der Versionsprüfung durch Kopieren, Umbenennen oder Deinstallieren. Kein Core-Update als Ersatz für ein Modulpaket, keine App-ID-Änderung und keine Änderung der Lerninhalte.

## 5. Vertrag: Ein Status und höchstens eine Hauptaktion pro Modul

Die Shell zeigt **installierte Version** (Registry), **verfügbare Version** (vorhandene Updatequelle) und einen textlichen **Status mit Grund** an. Ohne belastbaren Angebotsstand steht „Nicht geprüft“ statt „Aktuell“; nach erfolgreicher Prüfung ohne neueres Angebot steht „Keine neuere Version“. Eine gemeldete Paketversion darf sichtbar sein, ohne als installierbares Update zu gelten. Die Anzeige unterscheidet die Kompatibilität des installierten Pakets von der des Kandidaten; ein geeigneter Kandidat darf auch für ein inkompatibles installiertes Modul angeboten werden.

| Status | Hauptaktion |
|---|---|
| **Kompatibel**, aktiv, kein installierbares neueres Paket | **Öffnen** |
| **Update verfügbar**, neueres geeignetes Paket; aktueller Installationsstand bleibt sichtbar | **Aktualisieren** über den vorhandenen Ablauf; während des Vorgangs keine zweite Aktion |
| **Inkompatibel**, kein geeignetes Update | Kein Öffnen. Bei einem noch ungeprüften neueren Angebot **Update prüfen** als einzige Aktion; andernfalls nur Grund anzeigen. |
| **Fehler**, z. B. Prüfung oder Update fehlgeschlagen | Bei wiederholbarer Prüfung **Erneut prüfen**; andernfalls nur konkreten Fehlergrund anzeigen. Nicht behaupten, das installierte Paket sei beschädigt, wenn nur der Kandidat fehlerhaft war. |

„Aktualisieren“ kann den bestehenden Bestätigungsablauf nutzen; Prüfung, Download und Installation sind keine nebeneinanderstehenden Hauptbuttons. Bewusst deaktivierte Module erhalten kein „Öffnen“; Aktivieren/Deaktivieren und Deinstallieren bleiben Verwaltungsaktionen außerhalb der primären Kartenaktion. Dieselbe Kompatibilitätsentscheidung gilt für Modulkarte, Liste, Wechsler und Direktaufruf; die Shell errät sie nicht selbst. Kein neuer Feed, keine zweite Modulverwaltung, keine zusätzliche Update-Buttonleiste.

## 6. Im Quellstand vorhanden / noch nicht implementiert

**Im Quellstand vorhanden:** Das [Modulmanifest](../../modules/it-systemintegration/academy-module.json) deklariert `desoworks.it-systemintegration`, Version `1.0.1`, `formatVersion: 1` und `core: >=0.3.0 <0.4.0`, aber kein Theme-Level. [Shell](../../src/renderer/shell.js), [Frame-Einstieg](../../src/renderer/module.js) und [Protokollhandler](../../src/protocol.js) bilden bereits den beschriebenen Theme-Transport. [Anzeige](../../modules/it-systemintegration/web/js/anzeige-glossar.js) und [Navigation](../../modules/it-systemintegration/web/js/navigation.js) des Quellmoduls berücksichtigen das Root-Attribut. Der [Manager](../../src/modules/manager.js) verwendet den versionierten Paketpfad, `.incoming`, Registry-Upsert und eine Sperre für niedrigere Versionen. [Registry](../../src/modules/registry.js), [Paketvalidierung](../../src/modules/spec.js), [Signaturprüfung](../../src/modules/signature.js) und [Feed-Installationspfad](../../src/ipc.js) bestehen bereits. Laut übergebenem Profilbefund ignoriert das installierte `1.0.2` das Root-Attribut; es wurde für diese Entscheidung nicht gestartet, geändert oder ersetzt.

**Noch nicht implementiert:** Manifestdeklaration und Validierung von `runtime.themeContract`, Core-Unterstützung für v1 einschließlich verbindlicher Kompatibilitätsprüfung bei Installation, Öffnen und direkter Dateiauslieferung, sowie die konsolidierte Status-/Aktionslogik. `publicRow` prüft bisher für `compatible` nur `core` und setzt `updateAvailable` pauschal auf `false`; das ist kein Nachweis, dass die Installation aktuell ist. Der Feed liefert bereits Versionskandidaten, belegt aber nicht deren Theme-Konformität. Ebenfalls offen sind das Festlegen der ersten unterstützenden Core-Version, eine entsprechend deklarierte **neuere** Paketversion und deren integrierter Nachweis; aus der vorhandenen `.incoming`-Strecke allein folgt keine nachgewiesene Fehler- oder Absturzsicherheit.

**Abnahmekriterien für eine spätere Umsetzung:** In einem isolierten Testprofil alle drei Modi bei Einstieg und interner Navigation prüfen, jeweils gegen eine abweichende gespeicherte Modulwahl. Fehlende und unbekannte Theme-Version sowie unpassenden Core sichtbar sperren, einschließlich Direktaufruf. Reine Inhaltsmodule bleiben bei passendem Core benutzbar. Der Versuch, installiertes `1.0.2` durch `1.0.1` zu ersetzen, wird blockiert; bei einem gültigen neueren Paket bleiben die Testlernstände in SQLite und im Webspeicher erhalten. Ein abgelehntes Paket oder ein Fehler vor der Aktivierung lässt den bisherigen Stand und beide Speicher unverändert. Die Oberfläche zeigt in jedem Status höchstens eine Hauptaktion. Diese Kriterien sind eine Vorgabe, kein Testresultat.
