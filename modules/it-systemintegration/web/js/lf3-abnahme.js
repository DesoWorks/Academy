    (function () {
      "use strict";

      var LEKTIONEN = [
        {
          id: "lf3-client-anbindung",
          titel: "Client-Anbindung: vom Anschluss bis zur Verbindung",
          datei: "lf3-client-anbindung.html",
          glossar: "../glossar.html?von=lf3-client-anbindung.html",
          schritte: "Überblick, Fall, Übung, Abschluss",
          pruefen: "Leiste #pct, Übung #questions, leere Abgabe über #check, Zurück über data-next"
        },
        {
          id: "lf3-ipv4-konfiguration",
          titel: "IPv4-Konfiguration eines Clients lesen",
          datei: "lf3-ipv4-konfiguration.html",
          glossar: "../glossar.html?von=lf3-ipv4-konfiguration.html",
          schritte: "Überblick, Fall, Übung, Abschluss",
          pruefen: "Leiste #pct, Übung #questions, leere Abgabe über #check, Zurück über data-next"
        },
        {
          id: "lf3-dhcp",
          titel: "DHCP: automatische Konfiguration nachvollziehen",
          datei: "lf3-dhcp.html",
          glossar: "../glossar.html?von=lf3-dhcp.html",
          schritte: "Überblick, Ablauf, Übung, Abschluss",
          pruefen: "Leiste #pct, Übung #questions, leere Abgabe über #check, Zurück über data-next"
        },
        {
          id: "lf3-dns",
          titel: "DNS: Namen und IP-Adressen unterscheiden",
          datei: "lf3-dns.html",
          glossar: "../glossar.html?von=lf3-dns.html",
          schritte: "Überblick, Fall, Übung, Abschluss",
          pruefen: "Leiste #pct, Übung #questions, leere Abgabe über #check, Zurück über data-next"
        },
        {
          id: "lf3-verbindung-eingrenzen",
          titel: "Verbindung systematisch eingrenzen",
          datei: "lf3-verbindung-eingrenzen.html",
          glossar: "../glossar.html?von=lf3-verbindung-eingrenzen.html",
          schritte: "Überblick, Fall, Übung, Abschluss",
          pruefen: "Leiste #pct, Übung #questions, leere Abgabe über #check, Zurück über data-next"
        },
        {
          id: "lf3-fehlerbild-protokoll",
          titel: "Typische Client-Fehlerbilder dokumentieren und übergeben",
          datei: "lf3-fehlerbild-protokoll.html",
          glossar: "../glossar.html?von=lf3-fehlerbild-protokoll.html",
          schritte: "Überblick, Fall, Übung, Abschluss",
          pruefen: "Leiste #pct, Übung #questions, leere Abgabe über #check, Zurück über data-next"
        },
        {
          id: "netzwerkgrundlagen",
          titel: "IPv4",
          datei: "netzwerkgrundlagen.html",
          glossar: "../glossar.html",
          schritte: "Erklärung, Schaubild, Übung, Abschluss",
          pruefen: "Text #fortschritt-text, Fragen #netz-fragen, eigene Eingabe #eigene-eingabe, Zurück über die Lernschritte"
        },
        {
          id: "netzmaske",
          titel: "Netzmaske und Netz-/Geräteanteil",
          datei: "netzmaske.html",
          glossar: "../glossar.html",
          schritte: "Erklärung, Schaubild, Übung, Abschluss",
          pruefen: "Text #fortschritt-text, Quiz #quiz-optionen, leere Werte über #werte-form, Zurück über die Lernschritte"
        },
        {
          id: "subnetting",
          titel: "Subnetting: /24 in zwei /25-Netze teilen",
          datei: "subnetting.html",
          glossar: "../glossar.html",
          schritte: "Erklärung, Beispiel, Übung, Abschluss",
          pruefen: "Text #fortschritt-text, Formular #subnet-form, leere Abgabe dort, Zurück über die Lernschritte"
        }
      ];

      var PUNKTE = [
        ["ziel", "Lernziel und Arbeitsauftrag sind verständlich und passen zur Lektion."],
        ["erwartung", "Es ist klar, was die lernende Person tun und welche Antwort erwartet wird."],
        ["begriffe", "Fachbegriffe sind erklärt oder über den Glossar-Link dieser Lektion auffindbar."],
        ["reihenfolge", "Die Aufgabe braucht keine unausgesprochenen Annahmen. Die Reihenfolge der Lernschritte ist klar."],
        ["eingabe", "Jede vorgesehene Eingabe ist erreichbar, beschriftet und nimmt die erwartete Antwortform an."],
        ["leer", "Eine leere Abgabe wird sinnvoll behandelt und nicht als richtige Lösung gewertet."],
        ["gueltig", "Eine gültige Antwort lässt sich absenden und bleibt der richtigen Aufgabe zugeordnet."],
        ["ungueltig", "Eine ungültige oder unvollständige Eingabe führt zu einer verständlichen Korrektur, nicht zu einem stillen Fehler."],
        ["doppelt", "Mehrfaches schnelles Absenden erzeugt keine doppelte Bewertung und keinen widersprüchlichen Zustand."],
        ["feedback", "Nach dem Absenden erscheint erkennbares Feedback."],
        ["richtig", "Eine richtige Antwort wird nachvollziehbar bestätigt."],
        ["falsch", "Eine falsche Antwort benennt den Denkfehler oder gibt einen hilfreichen Hinweis."],
        ["zuordnung", "Das Feedback gehört zur richtigen Frage und bleibt lesbar."],
        ["korrektur", "Nach einer Korrektur ist der neue Zustand eindeutig. Altes Feedback widerspricht ihm nicht."],
        ["fortschritt", "Die Fortschrittsanzeige stimmt vor Beginn, während der Bearbeitung und nach jeder Antwort."],
        ["offen", "Offene Aufgaben gelten nicht als abgeschlossen. Erledigte Aufgaben werden nicht erneut als offen gezählt."],
        ["zurueck", "Der Zurück-Button mitten in der Bearbeitung lässt den Fortschritt nicht unbemerkt verfälschen."],
        ["aktualisierung", "Nach einer Aktualisierung mitten in der Bearbeitung ist klar, ob Antworten erhalten blieben."],
        ["zusammen", "Nach Zurück, Vor und Aktualisierung stimmen Antwort, Feedback und Fortschritt zusammen."],
        ["bedingung", "Die Lektion wird erst nach den vorgesehenen Abschlussbedingungen als abgeschlossen markiert."],
        ["sichtbar", "Die Abschlussmarkierung ist sichtbar und von „in Bearbeitung“ unterscheidbar."],
        ["konsistent", "Nach dem Abschluss bleiben Ergebnis und Fortschritt auch nach Aktualisierung und erneutem Öffnen konsistent."],
        ["doppelklick", "Ein erneuter Abschluss oder Doppelklick erzeugt keine doppelte Markierung und setzt nichts zurück."],
        ["weiter", "Der Abschluss führt zur vorgesehenen nächsten Lektion oder zurück zur passenden Übersicht."],
        ["bestanden", "Bestanden: alle anwendbaren Prüfpunkte sind erfüllt."],
        ["nacharbeit", "Nacharbeit erforderlich: offene Befunde stehen im Feld darunter."]
      ];

      var SCHLUESSEL = "it-ausbildung-lf3-abnahme-v1";
      var lektion = document.getElementById("lektion");
      var anker = document.getElementById("anker");
      var stand = document.getElementById("stand");
      var form = document.getElementById("form");
      var meldung = document.getElementById("meldung");
      var speichert = false;

      function speicherLesen() {
        try {
          return JSON.parse(localStorage.getItem(SCHLUESSEL) || "{}");
        } catch (fehler) {
          return {};
        }
      }

      function speicherSchreiben(daten) {
        localStorage.setItem(SCHLUESSEL, JSON.stringify(daten));
      }

      function aktuelleId() {
        return lektion.value;
      }

      function lektionNachId(id) {
        return LEKTIONEN.filter(function (eintrag) { return eintrag.id === id; })[0];
      }

      function punkteBauen() {
        PUNKTE.forEach(function (paar) {
          var id = paar[0];
          var text = paar[1];
          var box = document.querySelector('[data-id="' + id + '"]');
          var name = "punkt-" + id;
          box.innerHTML =
            '<p class="frage" id="frage-' + id + '">' + text + '</p>' +
            '<div class="wahl" role="radiogroup" aria-labelledby="frage-' + id + '">' +
              wahl(name, "bestanden", "Bestanden") +
              wahl(name, "nacharbeit", "Nacharbeit") +
              wahl(name, "na", "N. a.") +
            '</div>' +
            '<label class="befund" for="notiz-' + id + '">Befund, falls Nacharbeit</label>' +
            '<textarea id="notiz-' + id + '" maxlength="500"></textarea>';
        });
      }

      function wahl(name, wert, label) {
        return '<label><input type="radio" name="' + name + '" value="' + wert + '"> ' + label + '</label>';
      }

      function lektionenFuellen() {
        LEKTIONEN.forEach(function (eintrag) {
          var option = document.createElement("option");
          option.value = eintrag.id;
          option.textContent = eintrag.titel;
          lektion.appendChild(option);
        });
      }

      function ankerSetzen() {
        var eintrag = lektionNachId(aktuelleId());
        anker.innerHTML = "";
        [
          [eintrag.datei, "Lektion öffnen"],
          [eintrag.glossar, "Glossar dieser Lektion"],
          ["../index.html", "Zur Übersicht"]
        ].forEach(function (link) {
          var item = document.createElement("li");
          var a = document.createElement("a");
          a.href = link[0];
          a.textContent = link[1];
          a.target = "_blank";
          a.rel = "noopener";
          item.appendChild(a);
          anker.appendChild(item);
        });
        var hinweis = document.createElement("li");
        hinweis.textContent = eintrag.schritte + ". " + eintrag.pruefen;
        anker.appendChild(hinweis);
      }

      function standSetzen() {
        var daten = speicherLesen();
        stand.innerHTML = "";
        var geprueft = 0;
        LEKTIONEN.forEach(function (eintrag) {
          var satz = daten[eintrag.id];
          var chip = document.createElement("span");
          chip.className = "chip";
          if (satz && satz.gespeichert) {
            geprueft += 1;
            var ergebnis = ergebnisVon(satz);
            chip.textContent = kurz(eintrag.titel) + ": " + ergebnis;
            chip.className += ergebnis === "Bestanden" ? " ok" : (ergebnis === "Offen" ? " offen" : " warn");
          } else {
            chip.textContent = kurz(eintrag.titel) + ": offen";
            chip.className += " offen";
          }
          stand.appendChild(chip);
        });
        var summe = document.createElement("span");
        summe.className = "chip";
        summe.textContent = geprueft + " von " + LEKTIONEN.length + " gespeichert";
        stand.appendChild(summe);
      }

      function kurz(titel) {
        return titel.length > 28 ? titel.slice(0, 27) + "…" : titel;
      }

      function ergebnisVon(satz) {
        if (satz.punkte && satz.punkte.bestanden === "bestanden" && satz.punkte.nacharbeit !== "bestanden") {
          return "Bestanden";
        }
        if (satz.punkte && satz.punkte.nacharbeit === "bestanden") return "Nacharbeit";
        var werte = satz.punkte ? Object.keys(satz.punkte).map(function (key) { return satz.punkte[key]; }) : [];
        if (werte.indexOf("nacharbeit") !== -1) return "Nacharbeit";
        if (werte.indexOf("bestanden") !== -1 && werte.indexOf("") === -1) return "Bestanden";
        return "Offen";
      }

      function formularLeeren() {
        form.reset();
        document.getElementById("datum").value = "";
        document.getElementById("pruefer").value = "";
        document.getElementById("befunde").value = "";
      }

      function laden() {
        speichert = true;
        formularLeeren();
        var satz = speicherLesen()[aktuelleId()] || {};
        document.getElementById("datum").value = satz.datum || heute();
        document.getElementById("pruefer").value = satz.pruefer || "";
        document.getElementById("befunde").value = satz.befunde || "";
        PUNKTE.forEach(function (paar) {
          var wert = satz.punkte && satz.punkte[paar[0]];
          if (wert) {
            var feld = form.querySelector('input[name="punkt-' + paar[0] + '"][value="' + wert + '"]');
            if (feld) feld.checked = true;
          }
          document.getElementById("notiz-" + paar[0]).value = (satz.notizen && satz.notizen[paar[0]]) || "";
        });
        ankerSetzen();
        standSetzen();
        meldung.textContent = satz.gespeichert ? "Gespeicherter Stand von " + (satz.wann || "diesem Browser") + " geladen." : "Für diese Lektion ist noch nichts gespeichert.";
        speichert = false;
      }

      function heute() {
        var jetzt = new Date();
        var monat = String(jetzt.getMonth() + 1).padStart(2, "0");
        var tag = String(jetzt.getDate()).padStart(2, "0");
        return jetzt.getFullYear() + "-" + monat + "-" + tag;
      }

      function sammeln() {
        var punkte = {};
        var notizen = {};
        PUNKTE.forEach(function (paar) {
          var gewaehlt = form.querySelector('input[name="punkt-' + paar[0] + '"]:checked');
          punkte[paar[0]] = gewaehlt ? gewaehlt.value : "";
          notizen[paar[0]] = document.getElementById("notiz-" + paar[0]).value.trim();
        });
        return {
          datum: document.getElementById("datum").value,
          pruefer: document.getElementById("pruefer").value.trim(),
          befunde: document.getElementById("befunde").value.trim(),
          punkte: punkte,
          notizen: notizen,
          gespeichert: true,
          wann: new Date().toLocaleString("de-DE")
        };
      }

      function speichern() {
        var daten = speicherLesen();
        daten[aktuelleId()] = sammeln();
        speicherSchreiben(daten);
        standSetzen();
        meldung.textContent = "Gespeichert, nur in diesem Browser.";
      }

      function textBauen() {
        var eintrag = lektionNachId(aktuelleId());
        var satz = sammeln();
        var zeilen = [
          "LF3-Lektionsabnahme",
          eintrag.titel,
          "Datei: module/" + eintrag.datei,
          "Datum: " + (satz.datum || "—"),
          "Prüfung durch: " + (satz.pruefer || "—"),
          ""
        ];
        PUNKTE.forEach(function (paar) {
          var wert = satz.punkte[paar[0]] || "offen";
          var notiz = satz.notizen[paar[0]] ? " — " + satz.notizen[paar[0]] : "";
          zeilen.push(wert + ": " + paar[1] + notiz);
        });
        zeilen.push("");
        zeilen.push("Befunde: " + (satz.befunde || "—"));
        return zeilen.join("\n");
      }

      punkteBauen();
      lektionenFuellen();
      lektion.addEventListener("change", laden);
      form.addEventListener("submit", function (ereignis) {
        ereignis.preventDefault();
        speichern();
      });
      form.addEventListener("change", function () {
        if (!speichert) speichern();
      });
      document.getElementById("kopie").addEventListener("click", function () {
        var text = textBauen();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            meldung.textContent = "Abnahmetext kopiert.";
          }, function () {
            meldung.textContent = "Kopieren hat der Browser abgelehnt.";
          });
        } else {
          meldung.textContent = "Kopieren ist in diesem Browser nicht verfügbar.";
        }
      });
      document.getElementById("drucken").addEventListener("click", function () {
        window.print();
      });
      document.getElementById("loeschen").addEventListener("click", function () {
        var eintrag = lektionNachId(aktuelleId());
        if (!window.confirm("Gespeicherten Stand für „" + eintrag.titel + "“ löschen?")) return;
        var daten = speicherLesen();
        delete daten[aktuelleId()];
        speicherSchreiben(daten);
        laden();
        meldung.textContent = "Stand dieser Lektion gelöscht.";
      });
      laden();
    }());
