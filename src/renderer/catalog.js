(function () {
  "use strict";

  var api = window.academyDesktop;
  var shell = window.AcademyShell;
  var karten = document.getElementById("karten");
  var meldung = document.getElementById("meldung");
  var EXAMPLE_ID = "example.local.wissen-weitergeben";
  var installedIds = {};

  function say(value, fehler) {
    shell.text(meldung, value);
    meldung.className = fehler ? "fehler" : "ok";
  }

  function trustLabel(value) {
    if (value === "official") return "offiziell";
    if (value === "private") return "privat, nicht geprüft";
    return String(value || "unbekannt");
  }

  function card(entry) {
    var box = shell.el("article", "karte");
    box.appendChild(shell.el("h3", "", entry.name || entry.id));
    box.appendChild(shell.el("p", "meta", "Herausgeber: " + (entry.publisher || "unbekannt") + " · Vertrauen: " + trustLabel(entry.trust)));
    if (entry.reviewState === "sample") {
      box.appendChild(shell.el("p", "meta", "Beispielmodul zum Ausprobieren der Modulverwaltung."));
    }
    var installed = Boolean(installedIds[entry.id]);
    box.appendChild(shell.el("p", "meta", installed ? "Bereits installiert." : "Nicht installiert."));
    var actions = shell.el("div", "zeile");
    if (entry.localPackage && typeof api.moduleInstallCatalog === "function") {
      var install = shell.el("button", "", installed ? "Erneut installieren" : "Installieren");
      install.type = "button";
      install.addEventListener("click", function () {
        var call = entry.id === EXAMPLE_ID && typeof api.moduleInstallExample === "function"
          ? api.moduleInstallExample()
          : api.moduleInstallCatalog(entry.id);
        call.then(function (response) {
          say(response && response.ok ? "Modul installiert. Du findest es unter Meine Lernbereiche." : (response && response.message) || "Installation abgebrochen.", !(response && response.ok));
          loadInstalled().then(function () { loadCatalog(); });
        });
      });
      actions.appendChild(install);
    } else if (entry.id === EXAMPLE_ID && typeof api.moduleInstallExample === "function") {
      var install = shell.el("button", "", installed ? "Beispielmodul erneut installieren" : "Beispielmodul installieren");
      install.type = "button";
      install.addEventListener("click", function () {
        api.moduleInstallExample().then(function (response) {
          say(response && response.ok ? "Beispielmodul installiert. Du findest es unter Meine Lernbereiche." : (response && response.message) || "Installation abgebrochen.", !(response && response.ok));
          loadInstalled().then(function () { loadCatalog(); });
        });
      });
      actions.appendChild(install);
    } else {
      box.appendChild(shell.el("p", "meta", "Verteilung: manuell. Dieses Paket lässt sich über den Paketordner installieren."));
    }
    if (installed) {
      var open = shell.el("a", "knopf", "Öffnen");
      open.href = "/module.html#" + encodeURIComponent(entry.id);
      actions.appendChild(open);
    }
    box.appendChild(actions);
    return box;
  }

  function loadInstalled() {
    return api.modules().then(function (response) {
      installedIds = {};
      shell.visibleModules(response).forEach(function (entry) { installedIds[entry.id] = true; });
    }).catch(function () { installedIds = {}; });
  }

  function loadCatalog() {
    return api.moduleCatalog().then(function (response) {
      shell.text(document.getElementById("lade"), "");
      karten.replaceChildren();
      if (!response || !response.ok) {
        say((response && response.message) || "Katalog nicht erreichbar. Installierte Module bleiben nutzbar.", true);
        return;
      }
      var modules = response.modules || [];
      if (!modules.length) {
        karten.appendChild(shell.el("p", "", "Der lokale Katalog enthält noch keine Einträge."));
        return;
      }
      modules.forEach(function (entry) { karten.appendChild(card(entry)); });
    });
  }

  if (!api || typeof api.moduleCatalog !== "function") {
    shell.text(document.getElementById("lade"), "");
    say("Diese Seite läuft nur in der Desktop-Anwendung.", true);
    return;
  }

  document.getElementById("ordner").addEventListener("click", function () {
    api.moduleInstall().then(function (response) {
      say(response && response.ok ? "Modul installiert." : (response && response.message) || "Installation abgebrochen.", !(response && response.ok));
      loadInstalled().then(loadCatalog);
    });
  });

  loadInstalled().then(loadCatalog);
})();
