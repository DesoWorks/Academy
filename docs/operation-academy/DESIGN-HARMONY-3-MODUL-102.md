# Design Harmony – Modul 1.0.2 Vergleich

## Ziel
Dokumentation der Unterschiede in der Theme‑Erkennung zwischen der im Benutzerprofil installierten Version von **desoworks.it-systemintegration 1.0.2** und der Quell‑Datei im Repository.

## Installierte Datei
- **Pfad**: `C:\Users\<Benutzer>\AppData\Roaming\DesoWorks\Academy\module-packages\desoworks.it-systemintegration\1.0.2\web\js\anzeige-glossar.js`
- **data‑Attribute gesetzt**: `document.documentElement.dataset.theme` wird auf `current.theme` gesetzt. Zusätzlich werden die Klassen `mehr-abstand` (bei `current.spacing`) und `ruhige-ansicht` (bei `current.ruhig` oder systemReduceMotion) umgeschaltet.
- **Speicher‑Key**: `localStorage`‑Schlüssel `it-ausbildung.anzeige.v1`. Das Objekt enthält die Felder `text`, `spacing`, `theme` und `ruhig` (in `current.ruhig` liegt ein Typo, aber der Wert wird trotzdem gespeichert).
- **Verhalten**: Die installierte Version ignoriert das Attribut `data-academy-theme`; das Theme wird ausschließlich aus dem Persistenz‑Objekt gelesen.

## Quell‑Datei im Repository
- **Pfad**: `D:\Desoworks\Workspace\Academy\modules\it-systemintegration\web\js\anzeige-glossar.js`
- **data‑Attribute gesetzt**: `document.documentElement.dataset.theme` wird abhängig vom Vorhandensein von `data-academy-theme` gesetzt. Wenn das Attribut existiert, wird `academyTheme` (welches `hell`, `dunkel` oder `kontrast` sein kann) verwendet; andernfalls fällt auf `current.theme` zurück. Die Klassen `mehr-abstand` und `ruhige-ansicht` werden ebenso umgeschaltet.
- **Speicher‑Key**: identisch wie in der installierten Version (`it-ausbildung.anzeige.v1`).
- **Verhalten**: Im Academy‑Kontext erkennt die Quelle das `data-academy-theme`‑Attribut und verwendet es als primäre Theme‑Quelle, sodass die Academy‑Shell eine konsistente Theme‑Übergabe ermöglichen kann.

## Fazit
- Beide Varianten benutzen denselben Persistenz‑Schlüssel und setzen dieselben data‑Attribute sowie Klassen.
- Der wesentliche Unterschied liegt darin, dass die installierte Version das `data-academy-theme`‑Attribut ignoriert und immer das aus dem Speicher geladene Theme verwendet, während die Quell‑Datei dieses Attribut im Academy‑Kontext berücksichtigt.
- Für eine konsistente Theme‑Erkennung muss die installierte Variante angepasst werden, sodass sie ebenfalls `data-academy-theme` prüft.

---

**Hinweis**: Dieses Dokument wurde ohne Änderungen an Quelldateien erzeugt.

