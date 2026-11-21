(function () {
  "use strict";
  var api = window.academyDesktop;
  if (!api || typeof api.storageLoadAll !== "function") return;

  var snapshot = api.storageLoadAll();
  var banner = document.createElement("div");
  banner.setAttribute("role", "status");
  banner.className = "desktop-status";

  if (!snapshot || snapshot.ok !== true) {
    banner.textContent = (snapshot && snapshot.message) || "Die Lerndatenbank ist nicht verfügbar. Es wird nichts stillschweigend verworfen.";
    document.addEventListener("DOMContentLoaded", function () {
      var kopf = document.querySelector(".kopf-inhalt");
      (kopf || document.body).appendChild(banner);
    });
    return;
  }

  var data = snapshot.items || {};
  var proto = Object.getPrototypeOf(window.localStorage);

  function fail(result) {
    throw new Error((result && result.message) || "Speichern fehlgeschlagen");
  }

  proto.getItem = function (key) {
    key = String(key);
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
  };
  proto.setItem = function (key, value) {
    key = String(key);
    value = String(value);
    var result = api.storageSet(key, value);
    if (!result || result.ok !== true) fail(result);
    data[key] = value;
  };
  proto.removeItem = function (key) {
    key = String(key);
    var result = api.storageRemove(key);
    if (!result || result.ok !== true) fail(result);
    delete data[key];
  };
  proto.clear = function () {
    var result = api.storageClear();
    if (!result || result.ok !== true) fail(result);
    data = {};
  };
  proto.key = function (index) {
    return Object.keys(data)[index] || null;
  };
  try {
    Object.defineProperty(proto, "length", {
      configurable: true,
      get: function () { return Object.keys(data).length; }
    });
  } catch (error) {
    /* length bleibt dann der native Wert. getItem/setItem sind trotzdem an SQLite gebunden. */
  }

  function paint(status) {
    var versions = status && status.versions ? status.versions : {};
    var update = status && status.updates ? status.updates : {};
    var offline = typeof navigator !== "undefined" && navigator.onLine === false;
    banner.textContent = "Desktop " + (versions.desktop || "?") + " · Kanal " + (versions.channel || "?") + " · " + (update.message || "Bereit") + (offline ? " · Offline, Lernseiten bleiben lokal." : "");
  }

  function mount() {
    document.querySelectorAll("[data-version]").forEach(function (element) {
      if (element.dataset.desktopBound) return;
      element.dataset.desktopBound = "1";
    });
    var foot = document.querySelector(".fuss p");
    if (foot && foot.textContent.indexOf("Desktop-Anwendung") === -1) {
      foot.appendChild(document.createTextNode(" Desktop-Anwendung, Daten liegen außerhalb des Programmordners."));
    }
    var kopf = document.querySelector(".kopf-inhalt");
    (kopf || document.body).appendChild(banner);
    api.status().then(function (result) {
      if (result && result.ok) paint(result);
    }).catch(function () {
      banner.textContent = "Status konnte nicht gelesen werden. Die Lernseiten bleiben nutzbar.";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  if (typeof api.onMenu === "function") {
    api.onMenu(function (action) {
      if (action === "check") {
        api.checkUpdate().then(function (result) {
          banner.textContent = result && result.state ? result.state.message : "Prüfung ohne Ergebnis.";
        });
      }
      if (action === "backup") {
        api.backup().then(function (result) {
          banner.textContent = result && result.ok ? "Sicherung angelegt." : ((result && result.message) || "Sicherung fehlgeschlagen. Es wurde kein Erfolg gespeichert.");
        }).catch(function () {
          banner.textContent = "Sicherung fehlgeschlagen. Es wurde kein Erfolg gespeichert.";
        });
      }
      if (action === "verwaltung") {
        window.location.href = "/verwaltung.html";
      }
      var pages = { home: "/home.html", areas: "/module.html", catalog: "/catalog.html", settings: "/settings.html", about: "/about.html" };
      if (Object.prototype.hasOwnProperty.call(pages, action)) {
        window.location.href = pages[action];
      }
      if (action === "module") {
        window.location.href = "/module.html";
      }
    });
  }
})();
