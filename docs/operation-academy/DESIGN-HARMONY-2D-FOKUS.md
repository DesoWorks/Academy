# Design Harmony 2D – Korrekturvorgabe zur Fokusführung

**22.11.2026 · Statische Analyse für Rick, Jarvis und GLaDOS.** Kein Anwendungscode geändert, kein neuer Tastaturlauf, keine WCAG-Freigabe. Geltungsbereich: `lf3-client-anbindung`, `lf3-dhcp`, `lf3-dns`, `lf3-fehlerbild-protokoll`, `lf3-ipv4-konfiguration`, `lf3-verbindung-eingrenzen`.

## 1. Fokusweg: zwei Dokumente, zwei Sprungziele

- **Shell:** `src/renderer/module.html` beginnt mit einem eigenen Skip-Link auf `#hauptinhalt` im Elterndokument. `shell.js` baut die Hauptnavigation auf, `shell.css` markiert deren Tastaturfokus. Beim normalen Vorwärtstabben gelangt man über die sichtbaren Shell-Bedienelemente (darunter der Modulwechsel) zum eingebetteten Modul. `src/renderer/module.js` hängt `iframe.modul-frame` in `#inhalt` ein; der Frame hat kein eigenes `tabindex` und erhält keinen erzwungenen Fokus. Der Shell-Skip-Link springt nicht direkt zum Modul-MAIN.
- **Frame:** `academy://app` und `academy://<modul-id>` sind getrennte Origins. Wenn ein Element im Kinddokument fokussiert ist, kann das Eltern-DOM das iframe-Element als `document.activeElement` melden; das tatsächliche Zielelement liest man im Kinddokument. `sandbox="allow-scripts allow-forms allow-same-origin"` macht den Frame nicht zum selben Origin wie die Shell. Für den Sprung innerhalb des Frames ist kein Zugriff über die Origin-Grenze nötig.
- **Lernseite:** Auf allen sechs Seiten steht `.skip-link[href="#main"]` am Anfang des Bodys. `styles.css` positioniert ihn außerhalb der Ansicht und zeigt ihn bei `:focus` an; `a:focus-visible` liefert den Rahmen. Enter aktiviert den nativen Link zum `main#main[tabindex="-1"]` desselben Dokuments. `navigation.js` lässt reine Fragmentlinks beim Theme-Transport unverändert. `MAIN` ist fokussierbares Sprungziel, **kein zusätzlicher Tab-Stopp**. Erwartet: Enter setzt den Fokus auf `MAIN`, der folgende Tab geht zum ersten erreichbaren Bedienelement im sichtbaren Inhalt (bei DHCP im Startschritt der Link zur IPv4-Konfiguration), nicht zurück zur vorgeschalteten Modul- oder Schrittnavigation. Das ist der aus dem Code abgeleitete Sollweg, kein Laufzeitnachweis.
- **Schrittwechsel:** Die sechs `js/lf3-*.js` schalten in `go()` den Abschnitt um und rufen nach `update()` `$("main").focus()` sowie `g.scrollTo(0, 0)` auf. Das ist ein eigener, beabsichtigter Fokusweg über die Schritt- bzw. Weiter-Schaltflächen, nicht die Aktivierung des Skip-Links.

## 2. Codefehler und Grenze der 2C-Probe

**Belegter Codefehler:** `web/css/styles.css:161` unterdrückt mit `main:focus { outline: none; }` den Rahmen am bewusst fokussierten Lern-MAIN. Das betrifft sowohl den Schrittwechsel als auch einen erfolgreichen nativen Sprung. Es ist kein Beleg für eine fehlende Fokusübernahme.

**Probegrenze:** [2C-Bericht, „Fokus und Tastatur“](DESIGN-HARMONY-2C.md#fokus-und-tastatur) und [`probe-visual.js`](design-harmony-2c/probe-visual.js) belegen den sichtbaren DHCP-Skip-Link (3 px) nach Tabs. Der Bericht nennt zwölf Tabs, der vorliegende Skriptstand sendet 14; keine feste Tab-Zahl als Abnahmekriterium verwenden. Die Probe ruft vor jeder Taste `win.focus()` und `win.webContents.focus()` auf, sendet `keyDown`/`keyUp` an die BrowserWindow-WebContents und liest im Kind lediglich Fokus-Snapshots. Return, Enter und der nächste Tab änderten dort den Snapshot nicht. Es fehlt der Nachweis, welche Tasten bzw. welche Linkaktivierung im Kind ankamen. Daher weder nachgewiesener Enter-Defekt noch nachgewiesene Tastaturfalle; `MAIN` und der Folge-Tab bleiben offen.

## 3. Verbindlicher Minimalpatch für Jarvis

**`modules/it-systemintegration/web/css/styles.css`** – genau die bisherige Zeile `main:focus { outline: none; }` durch diesen Block ersetzen. Die bisherige Regel bleibt für Nicht-Pilotseiten als Fallback bestehen; die Änderung gilt nur für die sechs vorhandenen `data-page`-Werte. Bestehender Theme-Akzent, keine neue Farbe. Der negative Versatz legt den Ring nach innen, damit er bei voller Breite nicht über den Frame-Rand hinausragt. `:focus` statt `:focus-visible` am Sprungziel deckt auch den bereits vorhandenen programmgesteuerten Schrittwechsel ab; die Sichtbarkeit ist praktisch zu prüfen.

```css
main:focus { outline: none; }
body:is(
  [data-page="lf3-client-anbindung"],
  [data-page="lf3-dhcp"],
  [data-page="lf3-dns"],
  [data-page="lf3-fehlerbild-protokoll"],
  [data-page="lf3-ipv4-konfiguration"],
  [data-page="lf3-verbindung-eingrenzen"]
) main#main[tabindex="-1"]:focus {
  outline: 3px solid var(--farbe-akzent);
  outline-offset: -3px;
}
```

**Paketintegrität für den späteren Implementierungslauf:** `web/css/styles.css` ist in `modules/it-systemintegration/content/payload-index.json` erfasst. Für einen installierbaren Teststand den Index mit dem vorhandenen Projektverfahren aus den tatsächlich ausgelieferten Bytes ableiten; im Manifest nur die daraus folgende `sizeBytes`-Korrektur, falls erforderlich. Keine manuelle Änderung von Signatur oder Update-Metadaten, kein Staging durch diese Analyse.

**Keine weitere Verhaltenskorrektur:** `web/js/navigation.js`, die sechs Lektionsskripte und HTML-Dateien sowie `src/renderer/module.js`, `shell.js` und `shell.css` bleiben unverändert. Kein vorsorglicher Keydown-/Click-Handler, kein zusätzliches `.focus()`, kein positives `tabindex`. Wenn der Nachweis im echten Frame einen reproduzierbaren Fehler des nativen Sprungs zeigt, Befund separat an Rick melden; die 2C-Probe allein rechtfertigt keinen JS-Patch.

## 4. Tastaturnachweis für GLaDOS

1. Im sichtbaren Electron-Testfenster mit isoliertem Profil alle sechs Seiten regulär in der Shell öffnen. Pro Seite ab frisch geladenem Dokument mit physischen oder OS-seitigen Tasten ohne Maus durch die Shell bis zum sichtbaren Frame-Skip-Link tabben. Nicht vor jeder Taste das Parent-WebContents neu fokussieren.
2. Enter drücken; vor dem nächsten Tab Kind-URL/Hash, `activeElement` im Eltern- und Kinddokument sowie sichtbaren MAIN-Rahmen festhalten. Erwartet: `#main` im Kind, `MAIN#main` dort aktiv, Rahmen sichtbar. Ein Hash oder Scrollsprung allein reicht nicht. Für eine automatisierte Probe im Kind passiv `keydown`/`keyup` mit `key`, `target`, `isTrusted` sowie Link-`click` und `focusin` protokollieren: Enter muss am Skip-Link ankommen, danach muss `focusin` am MAIN beobachtbar sein. Keine `.focus()`, `.click()`, Hash-Zuweisung oder `dispatchEvent()` durch die Probe; das wäre kein Tastaturnachweis. Das vorhandene `.focus()` der Anwendung beim Schrittwechsel ist zulässig, wenn der Wechsel tatsächlich per Taste ausgelöst wurde.
3. Mit Tab zu den nächsten sichtbaren Bedienelementen; den ersten Stopp im MAIN konkret protokollieren. Schrittwechsel und Antwortfelder per Tastatur bedienen. Mit Tab und Shift+Tab die Frame-Grenze vorwärts und rückwärts prüfen; Ausstieg in die Shell muss ohne Maus gelingen. Sichtbaren Fokus in Hell, Dunkel und Kontrast belegen, auch bei 150 % und 200 %. Pro Seite Eingabeweg, Fokusfolge und Sichtbeleg festhalten. Fehlende Eingabelieferung oder fehlender Sichtbeleg bleiben ausdrücklich offen; kein Schluss auf WCAG-Konformität.

## 5. Abgrenzung

Keine Änderungen an anderen Lernseiten, den 122 CSS-Kandidaten, Aufgaben, Bewertung, Theme-Architektur oder Farbwerten. Keine Änderung von Sandbox, CSP, Origin-Trennung, Preload/IPC oder neuer Nachrichtenkanal. Keine Änderung an Signatur, Updatekanälen oder App-ID, keine Installation auf dem Arbeitsrechner, kein Stable-Release, kein Commit oder Merge nach `main`.
