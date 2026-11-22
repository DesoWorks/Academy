# TARS CI Analyse N.1 – Welle 3

| Testname | Betroffene Datei | Erwartete Größe | Tatsächliche Größe | Abweichung | Mögliche Ursache |
|---|---|---|---|---|---|
| Modulupdate behält den Lernstand und weist ein beschädigtes Paket ab | nicht ermittelt | nicht ermittelt | nicht ermittelt | nicht ermittelt | Manifest oder Index ist inkonsistent – von `createModuleManager` als Fehler erkannt, kein Größencheck involviert |
| inkompatibler Core und Downgrade ersetzen das Modul nicht | nicht ermittelt | nicht ermittelt | nicht ermittelt | nicht ermittelt | Core‑Version‑Unverträglichkeit bzw. Downgrade‑Blockierung, kein Größencheck involviert |
| abgebrochener Core‑Download lässt das installierte Modul liegen | nicht ermittelt | nicht ermittelt | nicht ermittelt | nicht ermittelt | Nicht‑vollständiger Download führt zu fehlender Datei, nicht zu Größenfehler |
| Modulupdate mit falscher Summe wird verworfen | nicht ermittelt | nicht ermittelt | nicht ermittelt | nicht ermittelt | Prüfsummen‑Mismatch, nicht Größenabweichung |
