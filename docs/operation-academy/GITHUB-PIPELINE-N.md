# Phase N – GitHub-Pipeline und Kanalverwaltung

**Stand:** 22.11.2026 · Jarvis, Chief Engineer · Umsetzungsstand ohne Push, ohne Release, ohne Build

Vertrag: [CHANNEL-ARCHITECTURE-N.md](CHANNEL-ARCHITECTURE-N.md). Sicherheitsbewertung: [UPDATE-SECURITY-N.md](UPDATE-SECURITY-N.md). Das Repository bleibt privat. Nichts hier wurde veröffentlicht, gepusht oder gebaut.

## Was lokal im Code liegt

| Datei | Inhalt |
| --- | --- |
| `src/updates/channels.js` | Exportiert genau `CHANNELS`, `parseReleaseTag`, `selectCandidate`, `switchConsequences`. Reine Logik ohne Netzwerk. |
| `src/updates/github-feed.js` | Feste Quelle `https://api.github.com/repos/DesoWorks/Academy/releases`. `Authorization` nur, wenn ein Token übergeben wird (Nutzereinstellung) oder `ACADEMY_UPDATE_TOKEN` gesetzt ist. Kein eingebautes Token, kein Loopback-Fallback. Meldet `locked` (401/403/404) und `unreachable` getrennt. |
| `src/updates/channel-preference.js` | Speicherschlüssel `academy.updateChannel` in der vorhandenen Einstellungsablage. Ohne gültige Wahl gilt `stable`. |
| `src/ipc.js`, `src/preload.js` | Zwei neue Aufrufe: gewählten Kanal lesen und setzen. Der Wechsel verweigert sich während Download oder Installation. Ein Wechsel auf einen weniger stabilen Kanal braucht eine Bestätigung im Hauptprozess. |
| `src/renderer/settings.html`, `settings.js` | Anzeige trennt installierten Build (Version, Herkunftskanal) vom gewählten Kanal. Drei Optionen: DEV – Aktuelle Entwicklung, BETA – Vorabversionen, STABLE – Freigegebene Versionen. |
| `scripts/make-release-manifest.js` | Erzeugt `.sha256`, `manifest.json` und `manifest.json.sig` (Ed25519). Bricht ohne Signaturschlüssel ab. |
| `.gitignore` | Ergänzt um `*.pem`, `*.pfx`, `*.p12`, `*.key`, `*.sqlite`, `*.db`, `.npmrc`. Bestehende Regeln unverändert. |

### Tag- und Auswahlregeln (umgesetzt)

- Gültig: `dev/v0.4.0-dev.12`, `beta/v0.4.0-beta.2`, `stable/v0.4.0`, `beta/modules/desoworks.it-systemintegration/v1.0.2-beta.1`. Ein bloßes `v0.4.0` ist ungültig. Das neueste GitHub-Release zählt nie.
- Ein Release ist Kandidat, wenn Tag-Kanal, Manifestfeld `channel`, Entwurf-Status, Prerelease-Flag, Version, Paketart und Plattform zusammenpassen. Falscher Kanal, Entwurf und Widerspruch werden mit Grund abgelehnt.
- Nur höhere Version im gewählten Kanal. `allowDowngrade: true` erlaubt ältere Versionen, nie die gleiche. Verlangt der Aufrufer ein Downgrade, trägt das Ergebnis `downgrade: true`; die eigene Bestätigung dafür gehört in den Aufrufer.
- Zwei Releases derselben Version mit verschiedenem `sha256` werden beide abgelehnt.

## Was die Workflows tun

Alle drei laufen auf `windows-latest` für Test und Build, Veröffentlichung auf `ubuntu-latest`. Test und Build haben nur `contents: read`; nur der Veröffentlichungsjob hat `contents: write` und nutzt den kurzlebigen `GITHUB_TOKEN` des Laufs. Kein persönlicher Token steht in einer Datei.

| Workflow | Auslöser | Ablauf |
| --- | --- | --- |
| `academy-dev.yml` | Push auf `dev` | `npm test`, dann Build `MAJOR.MINOR.PATCH-dev.<Lauf>`, Manifest, Veröffentlichung als Entwurf, Prüfung der Assets, dann sichtbar als Prerelease. Veröffentlichung nur nach grünen Tests. |
| `academy-beta.yml` | nur `workflow_dispatch`, nur Branch `beta` | Wie DEV mit `-beta.<Lauf>`. |
| `academy-stable.yml` | nur `workflow_dispatch`, nur Branch `main` | Bricht ab ohne Eingabe `FREIGEGEBEN` samt Verweis, ohne Herausgeberzertifikat, ohne Zertifikats-Fingerabdruck und ohne Manifestschlüssel. Signierter Build, Prüfung der Authenticode-Signatur gegen den Fingerabdruck, Veröffentlichung als Nicht-Prerelease. |

Bestehende Tags werden nie überschrieben; ein vorhandener Tag bricht den Lauf ab.

Benötigte Secrets (nicht im Repository): `ACADEMY_MANIFEST_SIGNING_KEY`; für STABLE zusätzlich `ACADEMY_PUBLISHER_PFX_BASE64`, `ACADEMY_PUBLISHER_PFX_PASSWORD`, `ACADEMY_PUBLISHER_THUMBPRINT` sowie das Environment `stable-release` mit Pflichtprüfern.

## Was ohne Push nicht läuft

- Keiner der Workflows. Sie sind weder ausgeführt noch syntaktisch gegen GitHub geprüft.
- Kein Release, kein Tag, keine Veröffentlichung, kein Installer. Auch DEV bleibt blockiert, solange der Manifestschlüssel nicht als Secret hinterlegt ist.
- Der Abruf der echten Quelle ist nicht erprobt, solange das Repository privat ist und kein Token vorliegt: die Quelle bleibt dann `locked`.

## Offene Punkte

1. **Verdrahtung:** `service.js` und `main.js` verwenden weiter den bisherigen Phase-M-Pfad (Build-Kanal aus `channel.json`, Loopback bei DEV-Build). `channels.js` und `github-feed.js` sind noch nicht in `check()`/`download()` eingebunden. Die gewählte Quelle wirkt daher erst nach dieser Verdrahtung. Der Loopback-Feed bleibt als Testquelle erhalten.
2. **Signaturprüfung im Client:** `manifest.json.sig` wird erzeugt, aber der Client prüft sie noch nicht. `manifestVerified` bleibt `false`. Vertrauensanker und Schlüsselverteilung gehören zu ROBOCOP und Terminus.
3. **Kanaldatei:** `config.js` kennt nur `dev` und `stable`. Ein BETA-Build trägt daher als Herkunftskanal `dev`.
4. **Aktionsversionen:** Die Workflows nutzen Versionstags (`@v4`). Das Festsetzen auf Commit-Hashes ist offen.
5. **Ausstehende Pakete:** Beim Kanalwechsel wird ein bereits vorbereitetes Paket nicht aktiv verworfen. Das gehört in die Verdrahtung.
6. **Paginierung:** Es werden die letzten 100 Releases gelesen.
7. **Prüfstand:** `npm test` lief nach Anpassung mit 87 von 87 Tests grün, darunter die Phase-N-Tests von GLaDOS für `channels.js` und `github-feed.js`. Die Workflows selbst sind nicht ausgeführt.
8. **Zwei Aufrufformen:** `selectCandidate(releases, { channel, currentVersion, allowDowngrade })` wählt nur nach Tag, Kanal und Entwurf und liefert Release oder `null`. Sie prüft kein Manifest und ist keine Installationsfreigabe. Die strenge Form `selectCandidate({ channel, installedVersion, releases, allowDowngrade })` prüft zusätzlich Manifest, Flag, Version, Paketart und Plattform. `fetchCandidates` im Feed nutzt die strenge Form. `parseReleaseTag` liefert `null` bei ungültigem Tag.
