# DESIGN HARMONY – Etappe 2B, nur Vorbereitung

**Status:** nicht gestartet. Kein Code, kein Tokenumbau, keine Massenänderung.

## Was 2A gezeigt hat

Die Lernseite besitzt die modusabhängigen Rollen schon: `--farbe-flaeche`, `--farbe-text`, `--farbe-rahmen`, `--farbe-akzent` in `modules/it-systemintegration/web/css/styles.css`. Hell, Dunkel und Kontrast hängen an `html[data-theme]`. Den Modus setzt das Modul selbst in `anzeige-glossar.js` über `localStorage`, nicht die Academy-Shell.

Die Academy hängt `design-tokens.css` und `host.css` in das iframe, vor `</head>`. Die Knight-Tokens `--dw-*` sind dort nur der dunkle Website-Stand. Sie haben keine Hell- oder Kontrastwerte. `host.css` setzt Fläche und Text nur über `:where(body)` und verliert gegen die Modulregel `body`. Ein Shell-Alias `--flaeche` überschreitet die iframe-Grenze nicht. Deshalb war `var(--flaeche, #fff)` weiß.

Der Pilot beweist, dass die drei LF3-Selektoren die Modul-Tokens nutzen können. Er ist kein gemeinsames Komponentensystem.

## Vertrag, der vor dem ersten 2B-Code festliegen muss

1. Wer den Modus besitzt: Modul, Shell oder beide mit einer benannten Übergabe.
2. Welche semantischen Rollen verbindlich sind. Mindestens Fläche, Text, Rahmen, Akzent und ein eigener Fokus, nicht der Akzent als Ersatz.
3. Wie Hell, Dunkel, Kontrast und Dark Knight auf diese Rollen abgebildet werden, ohne neue Markenfarben zu erfinden.
4. Welche Komponenten die Rollen konsumieren: Karte, Antwort, Skizze, Fokus, Status. Keine rohen Hex-Werte in Lernseiten.
5. Dass eine allein geöffnete Lernseite und dieselbe Seite im Academy-iframe dieselben Rollen sehen.

Bis das steht, bleiben die 141 übrigen `var(--flaeche`-Treffer in `modules` und `src` Inventar. Sie werden nicht automatisch ersetzt.

## Nicht Teil von 2B, bis der Commander es extra sagt

Updateoberfläche, Statuszeile, App-ID, Installation, `main`, Stable, Signaturprüfung.
