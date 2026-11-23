# Knowledge Pilot – Abschluss

Stand: 2026-11-23. Lokale Umsetzung. Keine Veröffentlichung.

## 1. KF-01

Die Übersicht trennt Zugriff und Abdeckung.

- LF1 bis LF7 bleiben offen und heißen **Im Aufbau**. Die Abschlusszahl zählt nur die bisherigen Karten.
- LF8 und LF9 bleiben gesperrt und heißen **In Vorbereitung**. Vorhandene Dateien schalten sie nicht frei.
- LF10b bis LF12b heißen **Geplant**.
- Der Zustand **Verfügbar** existiert in der Legende und ist keinem Lernfeld zugeordnet. Erreichbare Karten gelten nicht als vollständiger Lernfeldumfang.

Im lokalen Fenster unter `http://127.0.0.1:8765/index.html` standen diese Texte so. LF8-Lektionen waren beschriftet und nicht als „Jetzt lernen“ verlinkt.

## 2. Drei Diagnosefälle

Dieselbe Meldung, drei Ursachen. Die Oberfläche nennt die Ursache nicht.

1. Physisch: kein Link an Mira-01, Mira-02 erreicht den Dienst, Adresse ist passend.
2. IP: Link aktiv, Adresse `10.20.40.21/24` liegt nicht in `10.20.30.0/24`. Die Maske ist nicht der Fehler.
3. DNS: Link und Adresse passen, `10.20.30.80` antwortet, der Name nicht, DNS-Eintrag ist `10.20.99.53`.

DHCP, falsches Gateway und ein toter Dienst sind Ablenker, keine eigenen Aufträge.

## 3. Bewertung

Abschluss nur bei `tragfaehig`: nötige Untersuchungen, richtige Ursache, passende Maßnahme, trennender Befund. Raten ohne Untersuchung ergibt `ohne-untersuchung`. Eine falsche Ursache wird vor der Maßnahme gemeldet. GLaDOS hat das als eingeschränkt markiert, weil der zweite Fehler dann nicht zusätzlich erscheint. Das ist die festgelegte Reihenfolge, kein verdeckter Abschluss.

Hilfen nennen die fallspezifische Korrektur nicht. Die Musterlösung erscheint nach tragfähigem Abschluss oder nach Aufgeben.

## 4. Tests

- `node --test tests/*.test.js`: 191 bestanden, 0 fehlgeschlagen, vor der Einleitungskorrektur in `index.html`.
- `node --test tests/knowledge-pilot.test.js`: 14 bestanden, 0 fehlgeschlagen, nach der Laboränderung. GLaDOS hat denselben Pilotenlauf unabhängig mit 14 bestanden wiederholt.
- `node scripts/regenerate-payload-index.js --check`: keine Abweichung nach der letzten Indexangleichung.
- Fenster: Übersicht wie oben. Im Labor ein gemischter DNS-Auftrag bis `Urteil: tragfaehig`, Pilotstand 1 von 3. Kein Windows-Befehl, Banner „Simulation“.

Nicht geprüft: reiner Tastaturdurchlauf ohne Maus. Tastatur-CSS und echte Buttons sind vorhanden. Nicht geprüft: der installierte Stand `0.3.1-dev.8`. Der enthält diesen Branch nicht.

## 5. GLaDOS

Urteil **eingeschränkt**. Beleg: `docs/operation-academy/KNOWLEDGE-PILOT-QA.md`. Kern und Tests bestanden. Kein eigener Browserklick. Die Feedback-Reihenfolge ist der offene didaktische Punkt, kein Fehlurteil im Kern.

## 6. ROBOCOP

**Kein hoher, kein mittlerer Befund.** Kein Stable. Beleg: `docs/operation-academy/KNOWLEDGE-PILOT-SECURITY.md`.

Niedrig: der Pilotstand im eigenen Browser ist fälschbar und wird nicht als Nachweis verwendet. Niedrig: ein manipulierter Speicherstand kann die Bewertung auf `ungueltig` setzen, bis der Auftrag neu beginnt. Keine Codeausführung. Signatur, Update und `src/` sind unverändert. Keine Abhängigkeit von RC-04.

## 7. Terminus

Urteil **tragfähig**. Beleg: `docs/operation-academy/KNOWLEDGE-PILOT-TERMINUS.md`. Sein Hinweis zur falschen Maskenformulierung im Fallblatt ist korrigiert. Der Kern war schon richtig.

## 8. Grenzen

- Modul bleibt `1.0.4`. Core in `package.json` bleibt `0.3.1`, `src/core/version.js` bleibt `0.3.0`. Der Riss ist nicht behoben.
- `sizeBytes` ist `62895`, nur weil der Nutzlastindex gewachsen ist.
- Direkte Dateiaufrufe von LF8 und LF9 sind weiter möglich, wenn jemand die URL kennt. Die Übersicht und die Navigation verlinken sie nicht.
- Lösungen stehen im Client, wie bei den bestehenden Karten. Für Selbstlernen vertretbar, als Nachweis nicht belastbar.

## 9. Git

Branch `feature/operation-knowledge-pilot`, Basis `0494674374e804c692ba6120d7897179b42418e5`. `main` bleibt `2e704e3`. `dev` ist nicht angefasst. Kein Push, kein Merge, kein Release.

Der Commit-Hash steht in der Abschlussmeldung, sobald der lokale Commit liegt.

## 10. Nächste Mission

Nicht starten ohne GO.

Sinnvoll als Nächstes, in dieser Reihenfolge:

1. Diesen Branch nur nach ausdrücklichem GO nach `dev` bringen und einen DEV-Build erzeugen, der das Labor enthält. Der vorhandene Installer `0.3.1-dev.8` enthält es nicht.
2. Die Lernzielkontrollen von LF2 und LF3 von den Lektionstexten lösen. Das war der nächste Roadmap-Punkt nach dem Labor.
3. Den Versionsriss `0.3.0` gegen `0.3.1` in einem eigenen Auftrag klären, nicht nebenbei.

Nicht als Nächstes: VLAN-Simulator, IDE, Notenprüfung, Freischaltung von LF8.
