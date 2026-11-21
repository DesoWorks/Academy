(function () {
  "use strict";

  var api = window.academyDesktop;
  var node = document.getElementById("version");
  if (!api || typeof api.status !== "function") {
    node.textContent = "Version nur in der Desktop-Anwendung sichtbar.";
    return;
  }
  api.status().then(function (result) {
    var versions = result && result.ok ? (result.versions || {}) : {};
    node.textContent = "Programm " + (versions.desktop || "?") + " · Core " + (versions.core || "?");
  }).catch(function () {
    node.textContent = "Version nicht lesbar.";
  });
})();
