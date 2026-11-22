# Design Harmony 2D – QA-Bewertung

**Projekt:** IT-Ausbildung / Academy  
**Prüfumfang:** ausschließlich die von Rick in Etappe 2D erhobenen Messungen zur Tastaturbedienung und den erfassten Barrierefreiheits-Stichproben der sechs angepassten LF3-Seiten.  
**Prüfgrundlage:** `docs/operation-academy/design-harmony-2d/probe-keys.json` und `probe-button.json`; Bilder nur als ergänzende Dokumentation.  
**Git-Stand laut Übergabe:** HEAD `46283bf`, kein Commit. Die CSS-Korrektur beschränkt sich auf einen sichtbaren MAIN-Fokusring für sechs `data-page`-Werte.  
**Urteil:** **EINGESCHRÄNKT.** Die protokollierten Tastaturpfade und der Fokus sind für die aufgeführten Fälle belegt. Reflow nach WCAG 1.4.10, Screenreader und weitere Bedienpfade sind nicht freigegeben. Keine WCAG- oder Produktfreigabe.

## Bewertungsgrundlage und Methode

Bewertet wurden die beiden oben genannten JSON-Messprotokolle, nicht Erfolgsmeldungen als Ersatz für Belege. Laut `probe-keys.json` wurde per `sendInputEvent` bis zum Skip-Link getabbt; anschließend wurde genau ein CDP-`keyDown`/`keyUp` gesendet. `isTrusted` wurde im Kinddokument erfasst. Die Probe verwendete weder `element.focus()` noch `dispatchEvent()`. `probe-button.json` dokumentiert Space-Aktivierung in der DHCP-Lektion und die Radio-Eingabe.

Der Umfang ist auf die sechs Seiten begrenzt: `lf3-client-anbindung.html`, `lf3-dhcp.html`, `lf3-dns.html`, `lf3-fehlerbild-protokoll.html`, `lf3-ipv4-konfiguration.html` und `lf3-verbindung-eingrenzen.html`. Bewertet werden nur die darin tatsächlich protokollierten Zustände und Interaktionen.

## Ergebnisse: Tastatur und Skip-Link

Für alle sechs Seiten meldet `probe-keys.json`:

- Skip-Link „Direkt zum Inhalt springen“ per Tab erreicht.
- Enter-Ereignis als trusted protokolliert; `focusin` auf `MAIN` beobachtet.
- Fokusziel `MAIN#main` innerhalb des Inhalts. Der MAIN-Ring ist sichtbar und als `solid 3px rgb(255, 83, 105)`, `outline-offset: -3px` gemessen.
- Der folgende Tab bleibt im MAIN: je nach Seite führt er zu einem `SUMMARY`-Element oder einem Link. Ein sichtbarer Fokusrahmen ist protokolliert.
- Shift+Tab führt zurück zum Schrittschalter „4 · Abschluss“. Das protokollierte Verhalten zeigt keine Tastaturfalle in diesem getesteten Rückweg.

Für DHCP ist die erweiterte Folge protokolliert: Die Tab-Stopps führen über `SUMMARY`, Inhaltslinks und „Weiter zum Ablauf“. `probe-button.json` zeigt, dass Space auf „Weiter zum Ablauf“ den Abschnitt `case` sichtbar macht und der Fokus auf MAIN mit sichtbarem Ring liegt. Space auf „Weiter zur Übung“ zeigt `exercise` und belässt den Fokus auf MAIN mit Ring. Danach erreicht Tab ein `input type="radio"`; Space ändert `checked` von `false` auf `true`.

**Nicht belegt:** Enter auf einem Weiter-Knopf wurde nicht separat getestet. Daraus wird kein Produktfehler abgeleitet. Rückwärts wurde der Frame-Ausstieg zu `SELECT#modul-wechsel` in der Shell beobachtet. Vorwärts-Tabben bis zum Ende der Shell und der vollständige Fokusumlauf sind nicht geprüft; deshalb ist keine umfassende Aussage zur gesamten Shell-Fokusreihenfolge möglich.

## Themen, Vergrößerung und Einstellungen

Die protokollierten MAIN-Ringe beim Skip-Link-Sprung betragen:

| Modus | MAIN-Fokusrahmen |
|---|---|
| Dunkel | `solid 3px rgb(255, 83, 105)` |
| Hell | `solid 3px rgb(29, 95, 180)` |
| Kontrast | `solid 3px rgb(0, 58, 112)` |

Die DHCP-Skizzenmessung erfasst in Dunkel Text `rgb(247, 244, 245)` auf Fläche `rgb(20, 17, 20)`, in Hell `rgb(27, 36, 48)` auf Weiß und in Kontrast Schwarz auf Weiß. Das sind erfasste Werte für diese Stichprobe, keine vollständige Kontrastprüfung sämtlicher Komponenten, Zustände oder Seiten.

Bei Zoom 150 % und 200 % ist `overflowX=false` sowohl im Frame als auch in der ersten Shell-Navigation protokolliert. Bei Fensterbreite 320 px beträgt `innerWidth=305`; horizontaler Überlauf ist im Frame und in der erfassten Shell-Navigation ebenfalls nicht gemeldet. Diese Messwerte belegen **keinen** vollständigen Reflow nach WCAG 1.4.10: Inhalte, Bedienelemente und Informationen wurden damit nicht vollständig auf Umbruch, Erreichbarkeit und Nutzbarkeit geprüft. Kein WCAG-Erfolg wird behauptet.

Textskalierung `1.5` und die Klasse `mehr-abstand` überstehen laut Messung einen Reload. Das Theme bleibt dunkel; die Auswahl der Darstellung ist als deaktiviert protokolliert. Damit ist Persistenz dieses Zustands nachgewiesen, nicht jedoch die vollständige Bedienbarkeit oder Wirksamkeit der Einstellungen auf allen Inhalten.

## Nicht geprüft / offen

- **Screenreader:** Es lief kein Narrator-, NVDA- oder JAWS-Prozess; `sampled=false`. Screenreader-Ausgabe und semantische Bedienung bleiben ungeprüft.
- **WCAG 1.4.10 Reflow:** Die Überlaufmessungen bei Zoom und 320 px sind begrenzte Messpunkte, kein vollständiger Reflow-Nachweis.
- **Vollständige Bedienbarkeit:** Die Protokolle belegen nicht sämtliche interaktiven Elemente und Antworttypen auf allen sechs Seiten. Die ausführliche Button-/Radio-Stichprobe betrifft DHCP.
- **Shell-Fokusfolge:** Der Rückwärtsaustritt in die Shell ist erfasst; der Vorwärtsweg bis zum Shell-Ende nicht.
- **Tastaturbedienung der Weiter-Knöpfe mit Enter:** nicht separat gemessen. Kein Fehler daraus abgeleitet.
- **Vollständige Kontrast- und Textdarstellungsprüfung:** Nicht alle Komponenten, Fokus-/Fehler-/Ergebniszustände und Seiten wurden in allen Modi geprüft.

## QA-Urteil

**EINGESCHRÄNKT.** Für alle sechs angepassten LF3-Seiten belegen die Messprotokolle das Erreichen und die trusted-Enter-Aktivierung des Skip-Links, `focusin` auf MAIN, einen sichtbaren 3-px-Fokusring sowie den anschließenden Tab-Stopp im Inhalt. Der protokollierte Shift+Tab-Rückweg führt zum Schrittschalter, nicht in eine Falle. Die DHCP-Stichprobe belegt außerdem Space-Bedienung der beiden Weiter-Schritte und der Radio-Auswahl.

Die Prüfung bleibt auf diese Messungen begrenzt. Die Shell-Vorwärtsfolge, Screenreader, vollständige Nutzbarkeit bei Vergrößerung und vollständiger Reflow sind offen. `overflowX=false` allein ist kein WCAG-1.4.10-Nachweis. **Keine WCAG-Freigabe und keine Produktfreigabe.**
