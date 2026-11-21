(function () {
  "use strict";

  var api = window.academyDesktop;
  var shell = window.AcademyShell;
  var meldung = document.getElementById("meldung");

  if (!api || typeof api.status !== "function") {
    shell.text(document.getElementById("version"), "Diese Seite läuft nur in der Desktop-Anwendung.");
    return;
  }
  api.status().then(function (result) {
    if (!result || result.ok !== true) {
      shell.text(meldung, (result && result.message) || "Status nicht lesbar.");
      meldung.className = "fehler";
      return;
    }
    var versions = result.versions || {};
    shell.text(document.getElementById("version"), (versions.name || "DesoWorks Academy") + " " + (versions.desktop || "?") + " · Core " + (versions.core || "?"));
    shell.text(document.getElementById("kanal"), "Aktualisierungskanal: " + (versions.channel || "unbekannt"));
  }).catch(function () {
    shell.text(meldung, "Status konnte nicht gelesen werden.");
    meldung.className = "fehler";
  });
})();
