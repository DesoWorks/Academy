/* Oberfläche des fiktiven LF3-Diagnoselabors. Speichert nur den Pilotzustand. */
(function () {
  "use strict";
  var KEY = "it-ausbildung.lf3-diagnose-pilot.v1";
  var kern = window.LF3_DIAGNOSE;
  if (!kern || kern.simulation !== true || kern.netzwerkzugriff !== false) return;

  function lesen() {
    try {
      var roh = JSON.parse(localStorage.getItem(KEY) || "{}");
      return roh && typeof roh === "object" ? roh : {};
    } catch (_) {
      return {};
    }
  }
  function schreiben(zustand) {
    try { localStorage.setItem(KEY, JSON.stringify(zustand)); } catch (_) { /* Pilot bleibt in der Sitzung bedienbar. */ }
  }
  function el(tag, klasse, text) {
    var knoten = document.createElement(tag);
    if (klasse) knoten.className = klasse;
    if (text !== undefined) knoten.textContent = text;
    return knoten;
  }
  function knopf(text, klasse) {
    var button = el("button", klasse || "knopf", text);
    button.type = "button";
    return button;
  }
  function leerAuftrag() {
    return { aktionen: [], befunde: [], ursache: "", massnahme: "", hilfen: [], abgegeben: false, aufgegeben: false, urteil: "" };
  }
  function zustandSicher(roh) {
    var reihenfolge = mischen(kern.faelle.map(function (fall) { return fall.id; }));
    var basis = { version: 1, reihenfolge: reihenfolge, aktuell: reihenfolge[0], auftraege: {} };
    kern.faelle.forEach(function (fall) { basis.auftraege[fall.id] = leerAuftrag(); });
    if (!roh || roh.version !== 1 || !Array.isArray(roh.reihenfolge)) return basis;
    var bekannt = {};
    kern.faelle.forEach(function (fall) { bekannt[fall.id] = true; });
    if (roh.reihenfolge.length !== kern.faelle.length || roh.reihenfolge.some(function (id) { return !bekannt[id]; })) return basis;
    basis.reihenfolge = roh.reihenfolge.slice();
    basis.aktuell = bekannt[roh.aktuell] ? roh.aktuell : basis.reihenfolge[0];
    kern.faelle.forEach(function (fall) {
      var alt = roh.auftraege && roh.auftraege[fall.id];
      if (!alt || typeof alt !== "object") return;
      basis.auftraege[fall.id] = {
        aktionen: Array.isArray(alt.aktionen) ? alt.aktionen.filter(function (id) { return typeof id === "string"; }).slice(0, 20) : [],
        befunde: Array.isArray(alt.befunde) ? alt.befunde.filter(function (id) { return typeof id === "string"; }).slice(0, 20) : [],
        ursache: typeof alt.ursache === "string" ? alt.ursache : "",
        massnahme: typeof alt.massnahme === "string" ? alt.massnahme : "",
        hilfen: Array.isArray(alt.hilfen) ? alt.hilfen.filter(function (n) { return n === 1 || n === 2 || n === 3; }) : [],
        abgegeben: alt.abgegeben === true,
        aufgegeben: alt.aufgegeben === true,
        urteil: typeof alt.urteil === "string" ? alt.urteil : ""
      };
    });
    return basis;
  }

  function mischen(liste) {
    var aus = liste.slice();
    var saat = Date.now() % 233280;
    for (var i = aus.length - 1; i > 0; i -= 1) {
      saat = (saat * 9301 + 49297) % 233280;
      var j = saat % (i + 1);
      var tmp = aus[i];
      aus[i] = aus[j];
      aus[j] = tmp;
    }
    return aus;
  }
  var zustand = zustandSicher(lesen());
  var wurzel = document.getElementById("diagnose");
  if (!wurzel) return;

  function auftrag() { return zustand.auftraege[zustand.aktuell]; }
  function fall() { return kern.fallVon(zustand.aktuell); }
  function nummer() { return zustand.reihenfolge.indexOf(zustand.aktuell) + 1; }
  function gesammelt() {
    var liste = [];
    auftrag().aktionen.forEach(function (aktion) {
      kern.beobachtungen(zustand.aktuell, aktion).forEach(function (obs) { liste.push(obs); });
    });
    return liste;
  }
  function merken() { schreiben(zustand); }

  function untersuchen(aktion) {
    var daten = auftrag();
    if (daten.abgegeben || daten.aufgegeben) return;
    if (daten.aktionen.indexOf(aktion) === -1) daten.aktionen.push(aktion);
    merken();
    zeichnen();
    var neu = document.getElementById("befund-" + aktion);
    if (neu) neu.focus();
  }
  function hilfeZeigen(stufe) {
    var daten = auftrag();
    if (daten.hilfen.indexOf(stufe) === -1) daten.hilfen.push(stufe);
    merken();
    zeichnen();
    var ziel = document.getElementById("hilfe-text");
    if (ziel) ziel.focus();
  }
  function abgeben() {
    var daten = auftrag();
    var ergebnis = kern.bewerten(zustand.aktuell, daten);
    daten.abgegeben = true;
    daten.urteil = ergebnis.urteil;
    merken();
    zeichnen();
    var ziel = document.getElementById("ergebnis");
    if (ziel) ziel.focus();
  }
  function aufgeben() {
    var daten = auftrag();
    daten.aufgegeben = true;
    daten.abgegeben = false;
    daten.urteil = "aufgegeben";
    merken();
    zeichnen();
  }
  function neuBeginnen() {
    zustand.auftraege[zustand.aktuell] = leerAuftrag();
    merken();
    zeichnen();
  }
  function andererAuftrag() {
    var index = zustand.reihenfolge.indexOf(zustand.aktuell);
    zustand.aktuell = zustand.reihenfolge[(index + 1) % zustand.reihenfolge.length];
    merken();
    zeichnen();
    var ziel = document.getElementById("auftrag-titel");
    if (ziel) ziel.focus();
  }

  function zeichnen() {
    var daten = auftrag();
    var info = fall();
    var netz = kern.netz;
    var gesperrt = daten.abgegeben || daten.aufgegeben;
    wurzel.textContent = "";

    var kopf = el("div", "diagnose-kopf");
    var titel = el("h2", null, "Auftrag " + nummer() + " von " + zustand.reihenfolge.length);
    titel.id = "auftrag-titel";
    titel.tabIndex = -1;
    kopf.appendChild(titel);
    kopf.appendChild(el("p", null, "Mira-01 soll den Dienst Auftragskarte erreichen. Der Benutzer sagt: Ich kann den vorgesehenen Netzwerkdienst nicht erreichen."));
    var plan = el("p", "diagnose-plan");
    plan.appendChild(el("span", null, "Vorgesehenes Netz " + netz.vorgesehen + ", Gateway " + netz.gateway + ", DNS " + netz.dns + ". Dienst " + netz.dienstName + " unter " + netz.dienstIp + "."));
    kopf.appendChild(plan);
    wurzel.appendChild(kopf);

    var kette = el("ol", "diagnose-kette");
    kette.setAttribute("aria-label", "Fiktive Verbindung, ohne gemessenen Zustand");
    ["Mira-01", "Dose " + netz.dose, netz.switchName + " Port " + netz.port, "Dienst " + netz.dienstIp].forEach(function (name) {
      kette.appendChild(el("li", null, name));
    });
    wurzel.appendChild(kette);
    wurzel.appendChild(el("p", "diagnose-hinweis", "Die Kette zeigt nur den vorgesehenen Weg. Link und Konfiguration bleiben unbekannt, bis du sie prüfst."));

    var aktionen = el("div", "diagnose-aktionen");
    aktionen.setAttribute("role", "group");
    aktionen.setAttribute("aria-label", "Untersuchungen");
    kern.aktionen.forEach(function (aktion) {
      var button = knopf(aktion.text, "knopf");
      button.disabled = gesperrt;
      button.setAttribute("aria-pressed", daten.aktionen.indexOf(aktion.id) !== -1 ? "true" : "false");
      button.addEventListener("click", function () { untersuchen(aktion.id); });
      aktionen.appendChild(button);
    });
    wurzel.appendChild(aktionen);

    var protokoll = el("section", "diagnose-protokoll");
    protokoll.setAttribute("aria-label", "Gesammelte Beobachtungen");
    protokoll.appendChild(el("h3", null, "Beobachtungen"));
    if (!daten.aktionen.length) {
      protokoll.appendChild(el("p", null, "Noch keine Untersuchung. Die Ursache ist daraus nicht ableitbar."));
    }
    daten.aktionen.forEach(function (aktion) {
      var block = el("div", "diagnose-block");
      block.id = "befund-" + aktion;
      block.tabIndex = -1;
      var name = kern.aktionen.find(function (ein) { return ein.id === aktion; });
      block.appendChild(el("h4", null, name ? name.text : aktion));
      kern.beobachtungen(zustand.aktuell, aktion).forEach(function (obs) {
        block.appendChild(el("p", null, obs.text));
      });
      protokoll.appendChild(block);
    });
    wurzel.appendChild(protokoll);

    var form = el("form", "diagnose-form");
    form.addEventListener("submit", function (event) { event.preventDefault(); abgeben(); });
    form.appendChild(el("h3", null, "Diagnose"));
    form.appendChild(feld("Ursache", "ursache", kern.ursachen, daten.ursache, gesperrt));
    form.appendChild(feld("Maßnahme", "massnahme", kern.massnahmen, daten.massnahme, gesperrt));
    form.appendChild(befunde(daten, gesperrt));
    var reihe = el("div", "knopf-reihe");
    var pruefen = knopf("Diagnose prüfen", "knopf knopf-haupt");
    pruefen.type = "submit";
    pruefen.disabled = gesperrt;
    reihe.appendChild(pruefen);
    form.appendChild(reihe);
    wurzel.appendChild(form);

    var hilfen = el("section", "diagnose-hilfen");
    hilfen.appendChild(el("h3", null, "Hilfen"));
    hilfen.appendChild(el("p", null, "Die Hilfen nennen die Ursache dieses Auftrags nicht. Verwendete Stufen bleiben im Pilotprotokoll."));
    var hilfeReihe = el("div", "knopf-reihe");
    [1, 2, 3].forEach(function (stufe) {
      var button = knopf("Stufe " + stufe, "knopf");
      button.setAttribute("aria-pressed", daten.hilfen.indexOf(stufe) !== -1 ? "true" : "false");
      button.addEventListener("click", function () { hilfeZeigen(stufe); });
      hilfeReihe.appendChild(button);
    });
    hilfen.appendChild(hilfeReihe);
    if (daten.hilfen.length) {
      var text = el("div", "diagnose-hilfe-text");
      text.id = "hilfe-text";
      text.tabIndex = -1;
      daten.hilfen.slice().sort().forEach(function (stufe) {
        var inhalt = kern.hilfe(zustand.aktuell, stufe);
        text.appendChild(el("p", null, "Stufe " + stufe + ": " + (inhalt ? inhalt.text : "")));
      });
      hilfen.appendChild(text);
    }
    wurzel.appendChild(hilfen);

    if (daten.abgegeben || daten.aufgegeben) {
      var ergebnis = el("section", "diagnose-ergebnis");
      ergebnis.id = "ergebnis";
      ergebnis.tabIndex = -1;
      ergebnis.setAttribute("aria-live", "polite");
      if (daten.aufgegeben) {
        ergebnis.appendChild(el("h3", null, "Auftrag aufgegeben"));
        ergebnis.appendChild(el("p", null, "Der Abschluss ist nicht erreicht. Die Musterlösung gilt nur für diesen aufgegebenen Auftrag."));
      } else {
        var bewertung = kern.bewerten(zustand.aktuell, daten);
        ergebnis.appendChild(el("h3", null, bewertung.vollstaendig ? "Tragfähige Diagnose" : "Noch kein Abschluss"));
        ergebnis.appendChild(el("p", null, bewertung.erklaerung));
        ergebnis.appendChild(el("p", null, "Urteil: " + bewertung.urteil + ". Hilfestufen: " + (daten.hilfen.length ? daten.hilfen.join(", ") : "keine") + "."));
      }
      if (kern.loesungSichtbar({ abgegeben: daten.abgegeben, aufgegeben: daten.aufgegeben === true && daten.abgegeben !== true ? true : daten.aufgegeben })) {
        var muster = kern.musterloesung(zustand.aktuell);
        if (daten.aufgegeben || daten.urteil === "tragfaehig") {
          ergebnis.appendChild(el("h4", null, "Musterlösung"));
          ergebnis.appendChild(el("p", null, muster.ursache));
          ergebnis.appendChild(el("p", null, muster.massnahme));
          ergebnis.appendChild(el("p", null, muster.weg));
        }
      }
      wurzel.appendChild(ergebnis);
    }

    var navigation = el("div", "knopf-reihe");
    if (!gesperrt) {
      var abbruch = knopf("Auftrag aufgeben und Lösung zeigen", "knopf");
      abbruch.addEventListener("click", aufgeben);
      navigation.appendChild(abbruch);
    } else {
      var nochmal = knopf("Diesen Auftrag neu beginnen", "knopf");
      nochmal.addEventListener("click", neuBeginnen);
      navigation.appendChild(nochmal);
    }
    var weiter = knopf("Anderen Auftrag öffnen", "knopf");
    weiter.addEventListener("click", andererAuftrag);
    navigation.appendChild(weiter);
    wurzel.appendChild(navigation);

    var stand = kern.faelle.filter(function (ein) { return zustand.auftraege[ein.id].urteil === "tragfaehig"; }).length;
    wurzel.appendChild(el("p", "diagnose-stand", "Pilotstand: " + stand + " von " + kern.faelle.length + " Aufträgen tragfähig abgeschlossen. Dieser Stand ist nicht Teil der Lernzielkontrollen."));
  }

  function feld(legend, name, optionen, wert, gesperrt) {
    var gruppe = el("fieldset");
    gruppe.appendChild(el("legend", null, legend));
    optionen.forEach(function (option) {
      var label = el("label", "diagnose-option");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = option.id;
      input.checked = wert === option.id;
      input.disabled = gesperrt;
      input.addEventListener("change", function () {
        auftrag()[name] = option.id;
        merken();
      });
      label.appendChild(input);
      label.appendChild(el("span", null, option.text));
      gruppe.appendChild(label);
    });
    return gruppe;
  }
  function befunde(daten, gesperrt) {
    var gruppe = el("fieldset");
    gruppe.appendChild(el("legend", null, "Begründung: welche Beobachtungen tragen die Ursache?"));
    var liste = gesammelt();
    if (!liste.length) {
      gruppe.appendChild(el("p", null, "Erst nach einer Untersuchung kannst du einen Befund auswählen."));
      return gruppe;
    }
    liste.forEach(function (obs) {
      var label = el("label", "diagnose-option");
      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = obs.id;
      input.checked = daten.befunde.indexOf(obs.id) !== -1;
      input.disabled = gesperrt;
      input.addEventListener("change", function () {
        var aktuell = auftrag();
        var index = aktuell.befunde.indexOf(obs.id);
        if (input.checked && index === -1) aktuell.befunde.push(obs.id);
        if (!input.checked && index !== -1) aktuell.befunde.splice(index, 1);
        merken();
      });
      label.appendChild(input);
      label.appendChild(el("span", null, obs.text));
      gruppe.appendChild(label);
    });
    return gruppe;
  }

  zeichnen();
})();
