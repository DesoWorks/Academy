(function () {
  "use strict";

  var api = window.academyDesktop;
  var shell = window.AcademyShell;
  var karten = document.getElementById("karten");
  var meldung = document.getElementById("meldung");

  // Die Startseite öffnet niemals selbst ein Modul. Sie zeigt nur, was installiert ist.
  function showLastArea(modules) {
    var lastId = shell.readLastArea();
    if (!lastId) return;
    var match = modules.filter(function (entry) { return entry.id === lastId && entry.state === "active"; })[0];
    if (!match) return;
    shell.text(document.getElementById("zuletzt-text"), "Zuletzt geöffnet: " + match.name + ".");
    document.getElementById("zuletzt").href = "/module.html#" + encodeURIComponent(match.id);
    document.getElementById("zuletzt-bereich").hidden = false;
  }

  function render(response) {
    shell.text(document.getElementById("lade"), "");
    karten.replaceChildren();
    if (!response || !response.ok) {
      shell.text(meldung, (response && response.message) || "Die Modulverwaltung ist nicht verfügbar. Der Core bleibt nutzbar.");
      meldung.className = "fehler";
      document.getElementById("leer").hidden = false;
      return;
    }
    var modules = shell.visibleModules(response);
    if (!modules.length) {
      document.getElementById("leer").hidden = false;
      return;
    }
    modules.forEach(function (entry) { karten.appendChild(shell.moduleCard(entry)); });
    showLastArea(modules);
  }

  if (!api || typeof api.modules !== "function") {
    shell.text(document.getElementById("lade"), "");
    shell.text(meldung, "Diese Seite läuft nur in der Desktop-Anwendung.");
    meldung.className = "fehler";
    document.getElementById("leer").hidden = false;
    return;
  }
  api.modules().then(render).catch(function () {
    render({ ok: false, message: "Die Lernbereiche konnten nicht gelesen werden." });
  });
})();
