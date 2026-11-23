"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const kern = require("../modules/it-systemintegration/web/js/lf3-diagnose-kern.js");
const katalog = require("../modules/it-systemintegration/web/js/module-daten.js");

const WEB = path.join(__dirname, "..", "modules", "it-systemintegration", "web");
const VERBOTEN = ["fetch(", "XMLHttpRequest", "WebSocket", "child_process", "powershell", "exec(", "execSync", "net.connect", "http.request", "https.request"];

function felder() {
  return katalog.MODULE_DATEN.flatMap((jahr) => jahr.module || []);
}
function feld(id) {
  return felder().find((eintrag) => eintrag.id === id);
}
function alleAktionen() {
  return kern.aktionen.map((aktion) => aktion.id);
}
function befundIds(fallId, aktionen) {
  return aktionen.flatMap((aktion) => kern.beobachtungen(fallId, aktion).map((obs) => obs.id));
}
function gold(fallId, extra) {
  const fall = kern.fallVon(fallId);
  const aktionen = extra && extra.aktionen ? extra.aktionen : alleAktionen();
  return kern.bewerten(fallId, {
    aktionen,
    befunde: extra && extra.befunde ? extra.befunde : fall.pflichtBefunde,
    ursache: extra && Object.prototype.hasOwnProperty.call(extra, "ursache") ? extra.ursache : fall.ursache,
    massnahme: extra && Object.prototype.hasOwnProperty.call(extra, "massnahme") ? extra.massnahme : fall.massnahme
  });
}

test("drei Fälle sind fachlich konsistent und unterscheiden sich", () => {
  assert.equal(kern.simulation, true);
  assert.equal(kern.netzwerkzugriff, false);
  assert.deepEqual(kern.faelle.map((fall) => fall.id), ["physisch", "ip", "dns"]);
  assert.deepEqual(kern.faelle.map((fall) => fall.ursache), ["physisch", "ip", "dns"]);
  for (const fall of kern.faelle) assert.equal(kern.konsistent(fall), true, fall.id);
  assert.equal(kern.fallVon("ip").fakten.linkAktiv, true);
  assert.equal(kern.imNetz(kern.fallVon("ip").fakten.adresse), false);
  assert.equal(kern.fallVon("dns").fakten.pingIp, true);
  assert.equal(kern.fallVon("dns").fakten.pingName, false);
  assert.notEqual(kern.fallVon("dns").fakten.dns, kern.netz.dns);
});

test("der goldene Weg ist nur mit Untersuchung, Befund und passender Maßnahme vollständig", () => {
  for (const fall of kern.faelle) {
    const ergebnis = gold(fall.id);
    assert.equal(ergebnis.urteil, "tragfaehig", fall.id);
    assert.equal(ergebnis.vollstaendig, true, fall.id);
  }
});

test("raten ohne Untersuchung ist kein Abschluss", () => {
  for (const fall of kern.faelle) {
    const ergebnis = kern.bewerten(fall.id, {
      aktionen: [],
      befunde: [],
      ursache: fall.ursache,
      massnahme: fall.massnahme
    });
    assert.equal(ergebnis.urteil, "ohne-untersuchung", fall.id);
    assert.equal(ergebnis.vollstaendig, false);
  }
});

test("ein DNS-Fehler wird nicht als Kabeldefekt bewertet", () => {
  const ergebnis = gold("dns", { ursache: "physisch", massnahme: "kabel" });
  assert.equal(ergebnis.urteil, "falsche-diagnose");
  assert.match(ergebnis.erklaerung, /IP-Prüfung gelingt/);
});

test("ein aktiver Link schließt den IP-Fehler nicht aus", () => {
  const nurLink = kern.bewerten("ip", {
    aktionen: ["link"],
    befunde: ["link-mira-up"],
    ursache: "ip",
    massnahme: "adresse"
  });
  assert.equal(nurLink.urteil, "ohne-untersuchung");
  const vollstaendig = gold("ip");
  assert.equal(vollstaendig.urteil, "tragfaehig");
  assert.match(gold("ip", { ursache: "physisch", massnahme: "kabel" }).erklaerung, /Link ist aktiv/);
});

test("Ursache und Maßnahme müssen zusammenpassen", () => {
  const ergebnis = gold("physisch", { massnahme: "dns-korrigieren" });
  assert.equal(ergebnis.urteil, "unpassende-massnahme");
  assert.equal(ergebnis.vollstaendig, false);
});

test("ohne den trennenden Befund fehlt die Begründung", () => {
  const ergebnis = gold("dns", { befunde: ["link-mira-up"] });
  assert.equal(ergebnis.urteil, "ohne-begruendung");
});

test("Hilfen verraten die Falllösung nicht, die Musterlösung erst nach Abschluss", () => {
  const verboten = ["10.20.40.21", "10.20.99.53", "neu aufstecken", "Dose D-12 und Mira-01"];
  for (const fall of kern.faelle) {
    for (const stufe of [1, 2, 3]) {
      const text = kern.hilfe(fall.id, stufe).text;
      for (const wort of verboten) assert.equal(text.includes(wort), false, fall.id + " Stufe " + stufe + " enthält " + wort);
    }
    assert.equal(kern.hilfe(fall.id, 4), null);
  }
  assert.equal(kern.loesungSichtbar({}), false);
  assert.equal(kern.loesungSichtbar({ abgegeben: true }), true);
  assert.equal(kern.loesungSichtbar({ aufgegeben: true }), true);
  assert.match(kern.musterloesung("ip").massnahme, /10\.20\.30\.21/);
});

test("unbekannte oder nicht untersuchte Befunde werden abgewiesen", () => {
  const ergebnis = kern.bewerten("dns", {
    aktionen: ["ping-ip"],
    befunde: ["ping-name-fail"],
    ursache: "dns",
    massnahme: "dns-korrigieren"
  });
  assert.equal(ergebnis.urteil, "ungueltig");
});

test("KF-01 trennt Abdeckung und Zugriff und schaltet nichts frei", () => {
  const status = katalog.UEBERSICHT_STATUS;
  assert.deepEqual(Object.keys(status.abdeckung), ["verfuegbar", "im-aufbau", "in-vorbereitung", "geplant"]);
  for (const id of ["lf1", "lf2", "lf3", "lf4", "lf5", "lf6", "lf7"]) {
    assert.equal(feld(id).status, "verfuegbar", id);
    assert.equal(feld(id).abdeckung, "im-aufbau", id);
    assert.equal(status.statusInfo(feld(id)).offen, true, id);
    assert.equal(status.feldzeile(feld(id), 3), "Im Aufbau · 3 abgeschlossen", id);
  }
  for (const id of ["lf8", "lf9"]) {
    assert.equal(feld(id).status, "kommt-bald", id);
    assert.equal(feld(id).abdeckung, "in-vorbereitung", id);
    assert.equal(status.statusInfo(feld(id)).offen, false, id);
    assert.equal(feld(id).unterthemen[0].status, "verfuegbar");
    assert.equal(status.lektionOffen(feld(id).unterthemen[0], feld(id)), false, id);
    assert.equal(status.feldzeile(feld(id), 0), "In Vorbereitung · nicht freigegeben");
  }
  for (const id of ["lf10b", "lf11b", "lf12b"]) {
    assert.equal(feld(id).status, "kommt-bald", id);
    assert.equal(feld(id).abdeckung, "geplant", id);
    assert.equal(feld(id).unterthemen, undefined, id);
    assert.equal(status.feldzeile(feld(id), 0), "Geplant · noch keine Lerninhalte");
  }
  assert.equal(felder().some((eintrag) => eintrag.abdeckung === "verfuegbar"), false);
});

test("das Diagnoselabor ist erreichbar, aber vom bestehenden Lernstand getrennt", () => {
  const labor = feld("lf3").unterthemen.find((eintrag) => eintrag.id === "lf3-diagnose-pilot");
  assert.equal(labor.fortschritt, "isoliert");
  assert.equal(labor.datei, "module/lf3-diagnose-labor.html");
  assert.equal(katalog.UEBERSICHT_STATUS.lektionOffen(labor, feld("lf3")), true);
  const fortschritt = fs.readFileSync(path.join(WEB, "js", "fortschritt.js"), "utf8");
  assert.equal(fortschritt.includes("lf3-diagnose-pilot"), false);
  assert.equal(fortschritt.includes("it-ausbildung.lf3-diagnose-pilot.v1"), false);
});

test("Labor und Übersicht führen keine System- oder Netzwerkaufrufe aus", () => {
  const dateien = [
    "js/lf3-diagnose-kern.js",
    "js/lf3-diagnose-labor.js",
    "js/startseite.js",
    "js/navigation.js",
    "module/lf3-diagnose-labor.html"
  ];
  for (const relativ of dateien) {
    const text = fs.readFileSync(path.join(WEB, relativ), "utf8");
    for (const wort of VERBOTEN) assert.equal(text.includes(wort), false, relativ + " enthält " + wort);
    assert.equal(/<[a-z][^>]*\son[a-z]+\s*=/i.test(text), false, relativ);
    assert.equal(/javascript:/i.test(text), false, relativ);
  }
  const html = fs.readFileSync(path.join(WEB, "module", "lf3-diagnose-labor.html"), "utf8");
  assert.match(html, /Fiktive Lernumgebung/);
  assert.match(html, /keine Windows-Befehle/);
  assert.doesNotThrow(() => new Function(fs.readFileSync(path.join(WEB, "js", "lf3-diagnose-labor.js"), "utf8")));
  assert.doesNotThrow(() => new Function(fs.readFileSync(path.join(WEB, "js", "startseite.js"), "utf8")));
  assert.doesNotThrow(() => new Function(fs.readFileSync(path.join(WEB, "js", "navigation.js"), "utf8")));
});

test("Release-Kandidat hebt nur die Modulversion auf 1.0.5", () => {
  const paket = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "modules", "it-systemintegration", "academy-module.json"), "utf8"));
  const version = fs.readFileSync(path.join(__dirname, "..", "src", "core", "version.js"), "utf8");
  assert.equal(paket.version, "0.3.1");
  assert.equal(manifest.version, "1.0.5");
  assert.match(version, /CORE_VERSION = "0\.3\.0"/);
});

test("gesammelte Befunde eines Falls bleiben in sich schlüssig", () => {
  const physisch = befundIds("physisch", alleAktionen());
  assert.ok(physisch.includes("link-mira-down"));
  assert.equal(physisch.includes("ping-ip-ok"), false);
  const dns = befundIds("dns", alleAktionen());
  assert.ok(dns.includes("ping-ip-ok"));
  assert.ok(dns.includes("ping-name-fail"));
  assert.equal(dns.includes("link-mira-down"), false);
});
