(function () {
  "use strict";

  var api = window.academyDesktop;
  var shell = window.AcademyShell;
  var meldung = document.getElementById("meldung");

  // Darstellung: speichert sofort, wirksam erst nach erfolgreichem Speichern.
  var THEME_TITEL = { hell: "Hell", dunkel: "Dunkel", kontrast: "Hoher Kontrast" };
  var darstellung = document.querySelectorAll("input[name=darstellung]");
  var darstellungInfo = document.getElementById("darstellung-info");

  function zeigeDarstellung() {
    var aktiv = shell.activeTheme();
    Array.prototype.forEach.call(darstellung, function (radio) { radio.checked = radio.value === aktiv; });
    return aktiv;
  }

  zeigeDarstellung();
  shell.text(darstellungInfo, "Aktuell: " + THEME_TITEL[shell.activeTheme()] + ".");
  Array.prototype.forEach.call(darstellung, function (radio) {
    radio.addEventListener("change", function () {
      if (shell.writeTheme(radio.value)) {
        zeigeDarstellung();
        shell.text(darstellungInfo, "Darstellung gespeichert: " + THEME_TITEL[radio.value] + ".");
        darstellungInfo.className = "meta";
      } else {
        zeigeDarstellung();
        shell.text(darstellungInfo, "Die Darstellung konnte nicht gespeichert werden. Es gilt weiter: " + THEME_TITEL[shell.activeTheme()] + ".");
        darstellungInfo.className = "fehler";
      }
    });
  });

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
    shell.text(document.getElementById("kanal"), "Installierter Build: Version " + (versions.desktop || "?") + " · Herkunftskanal " + (versions.channel || "unbekannt"));
  }).catch(function () {
    shell.text(meldung, "Status konnte nicht gelesen werden.");
    meldung.className = "fehler";
  });

  var TITEL = { dev: "DEV – Aktuelle Entwicklung", beta: "BETA – Vorabversionen", stable: "STABLE – Freigegebene Versionen" };
  var radios = document.querySelectorAll("input[name=updatekanal]");
  var gewaehlt = "stable";

  function zeigeWahl(kanal) {
    gewaehlt = kanal;
    Array.prototype.forEach.call(radios, function (radio) { radio.checked = radio.value === kanal; });
    shell.text(document.getElementById("kanalwahl-info"), "Gewählter Kanal: " + TITEL[kanal] + ". Die Quelle bleibt gesperrt, bis sie erreichbar und freigegeben ist.");
  }

  if (typeof api.updateChannel === "function") {
    api.updateChannel().then(function (result) {
      zeigeWahl(result && result.ok === true ? result.preferred : "stable");
    }).catch(function () { zeigeWahl("stable"); });
    Array.prototype.forEach.call(radios, function (radio) {
      radio.addEventListener("change", function () {
        api.setUpdateChannel(radio.value).then(function (result) {
          if (result && result.ok === true) {
            zeigeWahl(result.preferred);
            shell.text(meldung, "Updatekanal gespeichert. Es wurde nichts installiert.");
            meldung.className = "ok";
          } else {
            zeigeWahl(gewaehlt);
            shell.text(meldung, (result && result.message) || "Der Kanal wurde nicht gewechselt.");
            meldung.className = "fehler";
          }
        });
      });
    });
  }
})();
