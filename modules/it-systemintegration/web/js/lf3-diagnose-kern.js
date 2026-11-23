/* Fiktives LF3-Diagnoselabor. Reine Daten und Bewertung, keine Netzwerkzugriffe. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.LF3_DIAGNOSE = api;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : null), function () {
  "use strict";

  var NETZ = {
    name: "Werkstatt-Nord",
    vorgesehen: "10.20.30.0/24",
    maske: "255.255.255.0",
    gateway: "10.20.30.1",
    dns: "10.20.30.53",
    dienstName: "auftrag.werkstatt-nord.test",
    dienstIp: "10.20.30.80",
    miraSoll: "10.20.30.21",
    dose: "D-12",
    switchName: "SW-EG",
    port: "12",
    nachbar: "Mira-02",
    nachbarPort: "14"
  };

  var AKTIONEN = [
    { id: "link", text: "Verkabelung und Linkstatus prüfen" },
    { id: "config", text: "Netzwerkkonfiguration anzeigen" },
    { id: "ping-ip", text: "Dienst per IP-Adresse prüfen" },
    { id: "ping-name", text: "Dienst per Hostname prüfen" },
    { id: "gateway-dns", text: "Gateway und DNS untersuchen" }
  ];

  var URSACHEN = [
    { id: "physisch", text: "Die physische Verbindung von Mira-01 zum Switch ist unterbrochen." },
    { id: "ip", text: "Adresse oder Subnetzmaske von Mira-01 passt nicht zum vorgesehenen Netz." },
    { id: "dns", text: "Die Namensauflösung schlägt fehl. Die IP-Erreichbarkeit ist davon unabhängig." },
    { id: "gateway", text: "Das Standardgateway ist falsch oder nicht erreichbar, weil der Eintrag selbst falsch ist." },
    { id: "dienst", text: "Der Netzwerkdienst selbst antwortet nicht." },
    { id: "dhcp", text: "Mira-01 hat keine Adresse erhalten, weil DHCP nicht vergibt." }
  ];

  var MASSNAHMEN = [
    { id: "kabel", passtZu: "physisch", text: "Patchkabel an Dose D-12 und Mira-01 neu aufstecken und den Link erneut prüfen." },
    { id: "adresse", passtZu: "ip", text: "Statische Adresse auf 10.20.30.21/24 setzen und danach die IP-Erreichbarkeit prüfen." },
    { id: "dns-korrigieren", passtZu: "dns", text: "DNS-Server auf 10.20.30.53 korrigieren und die Auflösung des Hostnamens erneut prüfen." },
    { id: "gateway-setzen", passtZu: "gateway", text: "Standardgateway auf 10.20.30.1 setzen." },
    { id: "dienst-neustart", passtZu: "dienst", text: "Den Dienst Auftragskarte neu starten." },
    { id: "dhcp-an", passtZu: "dhcp", text: "DHCP aktivieren und auf eine automatische Adresse warten." }
  ];

  function imNetz(adresse) {
    var teile = String(adresse || "").split(".");
    return teile.length === 4 && teile[0] === "10" && teile[1] === "20" && teile[2] === "30";
  }

  function textVerbindung(ok, ziel) {
    return ok
      ? "Verbindung zu " + ziel + " gelingt."
      : "Verbindung zu " + ziel + " scheitert.";
  }

  function fall(definition) {
    var fakten = definition.fakten;
    var configAbweichung = fakten.adresse !== NETZ.miraSoll || fakten.maske !== NETZ.maske || !imNetz(fakten.adresse);
    var dnsAbweichung = fakten.dns !== NETZ.dns;
    var beobachtungen = {
      link: [
        {
          id: fakten.linkAktiv ? "link-mira-up" : "link-mira-down",
          text: fakten.linkAktiv
            ? "Mira-01, Dose " + NETZ.dose + ", " + NETZ.switchName + " Port " + NETZ.port + ": Link aktiv. Das Kabel trägt."
            : "Mira-01, Dose " + NETZ.dose + ", " + NETZ.switchName + " Port " + NETZ.port + ": kein Link. Das Patchkabel sitzt nicht."
        },
        {
          id: "link-mira02-up",
          text: NETZ.nachbar + " an Port " + NETZ.nachbarPort + ": Link aktiv. " + NETZ.nachbar + " erreicht " + NETZ.dienstIp + "."
        }
      ],
      config: [
        {
          id: configAbweichung ? "config-falsches-netz" : "config-passend",
          text: "Mira-01: " + fakten.adresse + "/" + fakten.maske + ", Gateway " + fakten.gateway + ", DNS " + fakten.dns + ". " +
            (configAbweichung
              ? "Die Adresse liegt nicht im vorgesehenen Netz " + NETZ.vorgesehen + "."
              : "Adresse und Maske passen zum vorgesehenen Netz " + NETZ.vorgesehen + ".")
        }
      ],
      "ping-ip": [
        {
          id: fakten.pingIp ? "ping-ip-ok" : "ping-ip-fail",
          text: textVerbindung(fakten.pingIp, NETZ.dienstIp) + " Das ist die bekannte Adresse des Dienstes."
        }
      ],
      "ping-name": [
        {
          id: fakten.pingName ? "ping-name-ok" : "ping-name-fail",
          text: fakten.pingName
            ? "Der Name " + NETZ.dienstName + " wird aufgelöst und erreicht."
            : "Der Name " + NETZ.dienstName + " wird nicht erreicht. Das allein nennt die Ursache nicht."
        }
      ],
      "gateway-dns": [
        {
          id: fakten.gatewayErreichbar ? "gateway-ok" : "gateway-fail",
          text: "Gateway-Eintrag ist " + fakten.gateway + ". " +
            (fakten.gateway === NETZ.gateway ? "Das ist der vorgesehene Eintrag. " : "Das ist nicht der vorgesehene Eintrag. ") +
            (fakten.gatewayErreichbar ? "Das Gateway antwortet." : "Das Gateway antwortet nicht.")
        },
        {
          id: dnsAbweichung ? "dns-falsch" : (fakten.dnsErreichbar ? "dns-ok" : "dns-unerreichbar"),
          text: "DNS-Eintrag ist " + fakten.dns + ". " +
            (dnsAbweichung ? "Vorgesehen ist " + NETZ.dns + ". " : "Das ist der vorgesehene DNS-Server. ") +
            (fakten.dnsErreichbar ? "Eine Anfrage wird beantwortet." : "Eine Anfrage wird nicht beantwortet.")
        }
      ]
    };
    return {
      id: definition.id,
      ursache: definition.ursache,
      massnahme: definition.massnahme,
      pflichtAktionen: definition.pflichtAktionen,
      pflichtEineVon: definition.pflichtEineVon || [],
      pflichtBefunde: definition.pflichtBefunde,
      hilfen: definition.hilfen,
      erklaerung: definition.erklaerung,
      fakten: fakten,
      beobachtungen: beobachtungen
    };
  }

  var FAELLE = [
    fall({
      id: "physisch",
      ursache: "physisch",
      massnahme: "kabel",
      pflichtAktionen: ["link", "ping-ip"],
      pflichtBefunde: ["link-mira-down"],
      fakten: {
        linkAktiv: false,
        adresse: "10.20.30.21",
        maske: "255.255.255.0",
        gateway: "10.20.30.1",
        dns: "10.20.30.53",
        pingIp: false,
        pingName: false,
        gatewayErreichbar: false,
        dnsErreichbar: false
      },
      hilfen: {
        1: "Eine fehlende Namensauflösung ist erst ein eigener Befund, wenn der Weg davor schon geprüft ist. Beginne dort, wo die Daten das Gerät verlassen.",
        2: "Prüfe Verkabelung und Linkstatus. Vergleiche den Anschluss mit einem anderen Arbeitsplatz am selben Switch.",
        3: "Ein inaktiver Link bedeutet, dass Rahmen diesen Anschluss nicht verlassen. Adresse und Namensauflösung lassen sich dann nicht sinnvoll als eigene Ursache isolieren. Ein aktiver Link würde einen Konfigurationsfehler nicht ausschließen."
      },
      erklaerung: {
        tragfaehig: "Der Link an Mira-01 ist aus, der Nachbar am selben Switch erreicht den Dienst. Adresse und DNS sind passend eingetragen, werden aber nicht wirksam, solange der Anschluss keinen Link hat. Die passende Maßnahme ist das Patchkabel, nicht eine neue Adresse.",
        falsche: {
          ip: "Die eingetragene Adresse 10.20.30.21/24 passt zum vorgesehenen Netz. Der erste Bruch ist der fehlende Link, nicht die Adresse.",
          dns: "Name und IP scheitern beide, und der Link ist aus. Das isoliert keine Namensauflösung. Ein DNS-Fehler zeigt sich erst, wenn die IP-Prüfung gelingt und der Name scheitert.",
          gateway: "Das Gateway ist mit 10.20.30.1 korrekt eingetragen. Es antwortet nicht, weil der Link inaktiv ist.",
          dienst: "Mira-02 erreicht 10.20.30.80. Der Dienst antwortet. Ausgefallen ist der Anschluss von Mira-01.",
          dhcp: "Mira-01 hat eine statische Adresse. Es fehlt keine Adressvergabe."
        },
        massnahme: "Die Ursache liegt am Anschluss. Eine neue Adresse, ein anderer DNS-Server oder ein Dienstneustart stellt den Link nicht her."
      }
    }),
    fall({
      id: "ip",
      ursache: "ip",
      massnahme: "adresse",
      pflichtAktionen: ["link", "config", "ping-ip"],
      pflichtBefunde: ["config-falsches-netz"],
      fakten: {
        linkAktiv: true,
        adresse: "10.20.40.21",
        maske: "255.255.255.0",
        gateway: "10.20.30.1",
        dns: "10.20.30.53",
        pingIp: false,
        pingName: false,
        gatewayErreichbar: false,
        dnsErreichbar: false
      },
      hilfen: {
        1: "Ein aktiver Link sagt nur, dass die Leitung trägt. Er sagt nicht, ob die Adresse zum vorgesehenen Netz gehört.",
        2: "Lies die Netzwerkkonfiguration. Prüfe Adresse und Maske gegen das vorgesehene Netz und teste danach die bekannte IP des Dienstes.",
        3: "Zwei Geräte können denselben Switch sehen und trotzdem nicht im selben IP-Netz liegen. Dann scheitert der Weg zur bekannten IP, obwohl der Link aktiv ist. Das ist kein Beweis für einen Fehler der Namensauflösung."
      },
      erklaerung: {
        tragfaehig: "Der Link ist aktiv. Mira-01 steht mit 10.20.40.21/24 außerhalb von 10.20.30.0/24. Deshalb scheitert die Prüfung der bekannten Dienst-IP. Der Name scheitert mit, weil der Weg zum DNS-Server schon an der falschen Netzzugehörigkeit endet. Ein aktiver Link schließt diesen Fehler nicht aus.",
        falsche: {
          physisch: "Der Link ist aktiv und der Nachbar funktioniert. Ein unterbrochenes Kabel erklärt die falsche Netzzugehörigkeit nicht.",
          dns: "Die Namensprüfung scheitert, aber die IP-Prüfung scheitert ebenfalls. Der DNS-Eintrag ist der vorgesehene. Getrennt ist die Adresse von Mira-01 vom vorgesehenen Netz.",
          gateway: "Das Gateway ist mit 10.20.30.1 korrekt eingetragen. Es ist nicht erreichbar, weil Mira-01 nicht in 10.20.30.0/24 liegt.",
          dienst: "Mira-02 erreicht den Dienst. Der Dienst antwortet. Mira-01 liegt im falschen Netz.",
          dhcp: "Mira-01 hat eine statische Adresse. Die Adresse ist vorhanden und falsch, sie fehlt nicht."
        },
        massnahme: "Die Adresse muss in 10.20.30.0/24 liegen. Ein Kabeltausch oder ein Dienstneustart ändert die Netzzugehörigkeit nicht."
      }
    }),
    fall({
      id: "dns",
      ursache: "dns",
      massnahme: "dns-korrigieren",
      pflichtAktionen: ["ping-ip", "ping-name"],
      pflichtEineVon: [["config", "gateway-dns"]],
      pflichtBefunde: ["ping-ip-ok", "ping-name-fail"],
      fakten: {
        linkAktiv: true,
        adresse: "10.20.30.21",
        maske: "255.255.255.0",
        gateway: "10.20.30.1",
        dns: "10.20.99.53",
        pingIp: true,
        pingName: false,
        gatewayErreichbar: true,
        dnsErreichbar: false
      },
      hilfen: {
        1: "Ein Hostname und eine IP-Adresse sind nicht derselbe Weg. Prüfe beide getrennt, bevor du eine Ursache festlegst.",
        2: "Prüfe den Dienst einmal über die bekannte IP-Adresse und einmal über den Hostnamen. Lies danach den eingetragenen DNS-Server.",
        3: "Wenn die IP-Adresse antwortet und der Hostname nicht aufgelöst wird, liegt der Unterschied in der Namensauflösung. Kabel und eigene Adresse erklären diesen Unterschied nicht. Welcher Server eingetragen ist, steht in der Konfiguration."
      },
      erklaerung: {
        tragfaehig: "Der Link ist aktiv, die eigene Adresse passt, und 10.20.30.80 antwortet. Der Hostname wird nicht aufgelöst. Eingetragen ist 10.20.99.53 statt des vorgesehenen DNS-Servers 10.20.30.53. Das ist ein Namensfehler, kein Kabeldefekt.",
        falsche: {
          physisch: "Der Link ist aktiv. Ein Kabeldefekt würde auch die Prüfung der bekannten IP scheitern lassen. Die IP-Prüfung gelingt.",
          ip: "10.20.30.21/24 liegt im vorgesehenen Netz, und die bekannte IP antwortet. Die Adresse erklärt nicht, warum nur der Name scheitert.",
          gateway: "Das Gateway ist korrekt eingetragen und antwortet. Der Unterschied liegt zwischen gelingender IP-Prüfung und scheiternder Namensprüfung.",
          dienst: "Die bekannte IP des Dienstes antwortet. Der Dienst ist erreichbar. Unerreichbar ist der Name.",
          dhcp: "Mira-01 hat eine passende statische Adresse. DHCP hat hier nichts vorenthalten."
        },
        massnahme: "Zu korrigieren ist der DNS-Server. Eine neue eigene Adresse oder ein neues Kabel ändert die falsche Namensauflösung nicht."
      }
    })
  ];

  var NACH_ID = {};
  FAELLE.forEach(function (eintrag) { NACH_ID[eintrag.id] = eintrag; });

  function liste(wert) {
    if (!Array.isArray(wert)) return [];
    var gesehen = {};
    var aus = [];
    wert.slice(0, 20).forEach(function (eintrag) {
      if (typeof eintrag !== "string" || eintrag.length > 40 || gesehen[eintrag]) return;
      gesehen[eintrag] = true;
      aus.push(eintrag);
    });
    return aus;
  }

  function bekannt(listeIds, id) {
    return listeIds.some(function (eintrag) { return eintrag.id === id; });
  }

  function fallVon(id) {
    return NACH_ID[id] || null;
  }

  function beobachtungen(fallId, aktion) {
    var eintrag = fallVon(fallId);
    if (!eintrag || !eintrag.beobachtungen[aktion]) return [];
    return eintrag.beobachtungen[aktion].map(function (obs) {
      return { id: obs.id, aktion: aktion, text: obs.text };
    });
  }

  function untersuchungReicht(eintrag, aktionen) {
    var pflicht = eintrag.pflichtAktionen.every(function (id) { return aktionen.indexOf(id) !== -1; });
    var eine = (eintrag.pflichtEineVon || []).every(function (gruppe) {
      return gruppe.some(function (id) { return aktionen.indexOf(id) !== -1; });
    });
    return pflicht && eine;
  }

  function begruendungTragt(eintrag, befunde) {
    return eintrag.pflichtBefunde.every(function (id) { return befunde.indexOf(id) !== -1; });
  }

  function befundErlaubt(eintrag, aktionen, befundId) {
    return AKTIONEN.some(function (aktion) {
      if (aktionen.indexOf(aktion.id) === -1) return false;
      return (eintrag.beobachtungen[aktion.id] || []).some(function (obs) { return obs.id === befundId; });
    });
  }

  function bewerten(fallId, eingabe) {
    var eintrag = fallVon(fallId);
    var daten = eingabe || {};
    if (!eintrag) {
      return { ok: false, urteil: "ungueltig", vollstaendig: false, erklaerung: "Unbekannter Fall. Es wurde nichts bewertet." };
    }
    var aktionen = liste(daten.aktionen);
    var befunde = liste(daten.befunde);
    var ursache = typeof daten.ursache === "string" ? daten.ursache : "";
    var massnahme = typeof daten.massnahme === "string" ? daten.massnahme : "";
    if (aktionen.some(function (id) { return !bekannt(AKTIONEN, id); }) ||
        befunde.some(function (id) { return !befundErlaubt(eintrag, aktionen, id); }) ||
        (ursache && !bekannt(URSACHEN, ursache)) ||
        (massnahme && !bekannt(MASSNAHMEN, massnahme))) {
      return { ok: false, urteil: "ungueltig", vollstaendig: false, erklaerung: "Die Eingabe enthält eine unbekannte oder noch nicht untersuchte Angabe." };
    }
    var untersucht = untersuchungReicht(eintrag, aktionen);
    var begruendet = begruendungTragt(eintrag, befunde);
    var massnahmePasst = MASSNAHMEN.some(function (ein) { return ein.id === massnahme && ein.passtZu === ursache; });
    var urteil = "unzureichend";
    var erklaerung = "Ohne eine ausgewählte Ursache gibt es keine Diagnose. Untersuche zuerst und lege die Ursache dann anhand der Befunde fest.";
    if (!ursache) {
      urteil = "unzureichend";
    } else if (ursache !== eintrag.ursache) {
      urteil = "falsche-diagnose";
      erklaerung = eintrag.erklaerung.falsche[ursache] || "Diese Ursache passt nicht zu den Befunden dieses Falls.";
    } else if (!untersucht) {
      urteil = "ohne-untersuchung";
      erklaerung = "Die Ursache kann stimmen. Für eine tragfähige Diagnose fehlen noch Untersuchungen. Raten wird nicht als Abschluss gewertet.";
    } else if (!massnahmePasst) {
      urteil = "unpassende-massnahme";
      erklaerung = eintrag.erklaerung.massnahme;
    } else if (!begruendet) {
      urteil = "ohne-begruendung";
      erklaerung = "Ursache und Maßnahme passen. In der Begründung fehlt der Befund, der diese Ursache von den anderen trennt.";
    } else {
      urteil = "tragfaehig";
      erklaerung = eintrag.erklaerung.tragfaehig;
    }
    return {
      ok: true,
      fallId: eintrag.id,
      urteil: urteil,
      vollstaendig: urteil === "tragfaehig",
      untersucht: untersucht,
      begruendet: begruendet,
      erklaerung: erklaerung
    };
  }

  function hilfe(fallId, stufe) {
    var eintrag = fallVon(fallId);
    var nummer = Number(stufe);
    if (!eintrag || (nummer !== 1 && nummer !== 2 && nummer !== 3)) return null;
    return { stufe: nummer, text: eintrag.hilfen[nummer] };
  }

  function musterloesung(fallId) {
    var eintrag = fallVon(fallId);
    if (!eintrag) return null;
    var ursache = URSACHEN.find(function (ein) { return ein.id === eintrag.ursache; });
    var massnahme = MASSNAHMEN.find(function (ein) { return ein.id === eintrag.massnahme; });
    return {
      fallId: eintrag.id,
      ursache: ursache.text,
      massnahme: massnahme.text,
      weg: eintrag.erklaerung.tragfaehig
    };
  }

  function loesungSichtbar(eingabe) {
    var daten = eingabe || {};
    return daten.abgegeben === true || daten.aufgegeben === true;
  }

  function konsistent(eintrag) {
    var fakten = eintrag.fakten;
    var adressePasst = imNetz(fakten.adresse) && fakten.maske === NETZ.maske && fakten.gateway === NETZ.gateway;
    if (eintrag.ursache === "physisch") {
      return fakten.linkAktiv === false && fakten.pingIp === false && fakten.pingName === false && adressePasst && fakten.dns === NETZ.dns;
    }
    if (eintrag.ursache === "ip") {
      return fakten.linkAktiv === true && imNetz(fakten.adresse) === false && fakten.pingIp === false && fakten.dns === NETZ.dns;
    }
    if (eintrag.ursache === "dns") {
      return fakten.linkAktiv === true && adressePasst && fakten.pingIp === true && fakten.pingName === false && fakten.dns !== NETZ.dns;
    }
    return false;
  }

  return {
    netz: NETZ,
    aktionen: AKTIONEN,
    ursachen: URSACHEN,
    massnahmen: MASSNAHMEN,
    faelle: FAELLE,
    fallVon: fallVon,
    beobachtungen: beobachtungen,
    bewerten: bewerten,
    hilfe: hilfe,
    musterloesung: musterloesung,
    loesungSichtbar: loesungSichtbar,
    konsistent: konsistent,
    imNetz: imNetz,
    simulation: true,
    netzwerkzugriff: false
  };
});
