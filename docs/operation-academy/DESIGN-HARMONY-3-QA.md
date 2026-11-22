# Design Harmony 3 – QA-Bericht

**Prüfumfang:** lesende Prüfung der Theme-Vertrag-3-Implementierung und des gezielten Node-Tests. Keine Änderung an Anwendungscode, kein Commit, keine Installation, keine WCAG-Freigabe.

**Arbeitsstand:** Branch `feature/phase-n1-release-connectivity`, HEAD unverändert durch diese Prüfung. Vorhandene Änderungen im Arbeitsbaum waren bereits vorhanden; sie wurden nicht verändert. Geprüft wurde der lokale Quellstand, nicht die installierte Academy.

## Automatisierte Prüfung – tatsächlicher Beleg

Befehl: `node --test tests/design-harmony-3-theme-contract.test.js`

Ergebnis: 7 Tests bestanden, 0 fehlgeschlagen, 0 übersprungen (Node-Testlauf; ca. 402 ms).

Der Test belegt im isolierten Manager-/Registry-Testkontext:

- `themeContract` mit ungültigen Typen wird bei der Manifestvalidierung abgewiesen; ein fehlendes Feld ist für sich genommen weiterhin manifestgültig.
- Hosted-Web-Pakete ohne Vertrag bzw. mit unbekanntem Vertrag 2 werden bei Installation abgewiesen. Beim fehlenden Vertrag prüft der Test außerdem, dass kein Modul und kein Paketrest zurückbleibt.
- Ein Paket mit Vertrag 1 wird als kompatibel ausgewiesen und kann geöffnet werden; `publicRow` liefert dabei keinen geprüften Update-Stand (`availableVersion` und `updateAvailable` bleiben `null`).
- Ein älteres Paket 1.0.1 ersetzt 1.0.2 nicht; ein im Test gesetzter Lernfortschritt bleibt erhalten.
- Ein nachgestellter installierter Altbestand ohne Theme-Vertrag wird als inkompatibel ausgewiesen, lässt sich nicht öffnen und liefert keine Hosted-Datei aus. Der abgewiesene Installationsversuch ändert Version und Lernfortschritt nicht.
- Das gebündelte Quellmodul `it-systemintegration` deklariert Vertrag 1 bei Version 1.0.1.

Zusätzliche Quelltextbeobachtung: `module.js` übergibt beim Erzeugen des Hosted-Web-iframes den von `shell.activeTheme()` gelieferten Wert als Query-Parameter `academy-theme`. Das ist ein Implementierungshinweis, kein Laufzeit- oder Rendering-Nachweis. `shell.js` stellt Modulstatus und Aktionen in einer DOM-Karte dar. Quelltextprüfung belegt nicht, wie diese Oberflächen tatsächlich gerendert werden.

## Nicht gerendert / nicht ausgeführt

Es wurde keine installierte Academy gestartet und kein UI-Browserlauf bzw. visueller Vergleich durchgeführt. Es gibt hier keinen Screenshot- oder Screenreader-Nachweis. Keine Hell-/Dunkel-Darstellung, Kontrastmessung am aktuellen Modul, Tastaturbedienung, Fokusführung oder Textskalierung wurde praktisch geprüft. Der frühere iframe-Kontrastwert 5,98:1 ist kein Ergebnis dieses Core-Builds und wird nicht als Beleg übernommen. Die Aussage 170 bestanden / 0 fehlgeschlagen aus dem Gesamt-Testlauf wurde für diese Teilprüfung nicht erneut verifiziert.

## Neun Auftragspunkte – Status

1. **Hell/Dunkel/Kontrast mit aktuellem Modul – OFFEN.** Nicht gerendert; kein Kontrastwert am aktuellen Modul ermittelt.
2. **Älteres Modul 1.0.2 – EINGESCHRÄNKT BELEGT.** Der Test bildet ein installiertes Modul ohne Theme-Vertrag nach und belegt dessen Inkompatibilität, Sperre beim Öffnen und fehlende Dateiauslieferung. Das reale/installierte Modul 1.0.2 wurde nicht geprüft.
3. **Update mit Lernfortschritt – EINGESCHRÄNKT BELEGT.** Automatisierter Fall belegt, dass ein Downgrade von 1.0.2 auf 1.0.1 abgewiesen wird und der Test-Lernstand erhalten bleibt. Ein tatsächlicher Updatepfad zu einer neueren Version mit Lernfortschritt wurde nicht geprüft.
4. **Update ohne Lernfortschritt – OFFEN.** Kein entsprechender Testfall oder UI-Lauf im gezielten Test.
5. **Unterbrochene Aktualisierung – OFFEN.** Abbruch-/Crash-/Wiederanlaufverhalten nicht geprüft.
6. **Tastaturbedienung – OFFEN.** Nicht praktisch geprüft.
7. **Fokusverhalten – OFFEN.** Nicht praktisch geprüft.
8. **Textskalierung – OFFEN.** Nicht praktisch geprüft.
9. **Rückfall bei fehlgeschlagenem Update – OFFEN.** Kein Fehler-/Rollback-Szenario ausgeführt; Verhalten nicht belegt.

## QA-Einordnung

**EINGESCHRÄNKT geprüft.** Der gezielte automatisierte Vertragstest ist bestanden und stützt die genannten Manager-/Registry-Verhaltensfälle. Die visuellen, barrierebezogenen und Update-Robustheitskriterien bleiben offen. Daraus folgt weder eine WCAG-Freigabe noch eine Freigabe der vollständigen Auftragspunkte.
