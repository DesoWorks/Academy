(function () {
  "use strict";

  var LAST_KEY = "academy.lastArea";

  // Funktionierende Bereiche. KI-Lernassistent und IDE sind nur vorgesehen und so gekennzeichnet.
  var NAV = [
    { id: "home", label: "Startseite", href: "/home.html" },
    { id: "areas", label: "Meine Lernbereiche", href: "/module.html" },
    { id: "catalog", label: "Modul-Katalog", href: "/catalog.html" },
    { id: "settings", label: "Einstellungen", href: "/settings.html" },
    { id: "verwaltung", label: "Daten und Updates", href: "/verwaltung.html" },
    { id: "backup", label: "Datensicherung", href: "/verwaltung.html#sicherung" },
    { id: "ki", label: "KI-Lernassistent (vorgesehen)", href: "/ki.html", planned: true },
    { id: "ide", label: "IDE (vorgesehen)", href: "/ide.html", planned: true },
    { id: "about", label: "Über DesoWorks Academy", href: "/about.html" }
  ];

  function text(node, value) {
    node.textContent = value == null ? "" : String(value);
  }

  function el(tag, className, value) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) text(node, value);
    return node;
  }

  function buildNavigation() {
    var host = document.getElementById("navigation");
    if (!host) return;
    var current = document.body.getAttribute("data-seite") || "";
    var list = el("ul", "navigation");
    NAV.forEach(function (entry) {
      var item = document.createElement("li");
      var link = el("a", entry.planned ? "vorgesehen" : "", entry.label);
      link.href = entry.href;
      if (entry.id === current) link.setAttribute("aria-current", "page");
      item.appendChild(link);
      list.appendChild(item);
    });
    host.replaceChildren(list);
  }

  function readLastArea() {
    var api = window.academyDesktop;
    if (!api || typeof api.storageLoadAll !== "function") return null;
    var snapshot = api.storageLoadAll();
    if (!snapshot || snapshot.ok !== true || !snapshot.items) return null;
    var value = snapshot.items[LAST_KEY];
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  // Wird nur aufgerufen, wenn der Nutzer ein Modul öffnet.
  function writeLastArea(moduleId) {
    var api = window.academyDesktop;
    if (!api || typeof api.storageSet !== "function") return false;
    var result = api.storageSet(LAST_KEY, String(moduleId));
    return Boolean(result && result.ok === true);
  }

  function visibleModules(response) {
    var installed = response && response.installed ? response.installed : [];
    return installed.filter(function (entry) { return entry && entry.state !== "uninstalled"; });
  }

  function stateLabel(state) {
    if (state === "active") return "Installiert und aktiv";
    if (state === "disabled") return "Installiert, deaktiviert";
    if (state === "faulted") return "Installiert, gestört";
    return "Installiert";
  }

  function updateLabel(entry) {
    if (entry.updateAvailable === true) return "Aktualisierung verfügbar";
    if (entry.updateAvailable === false) return "Aktuell";
    return "Aktualisierung: nicht geprüft";
  }

  function progressLabel(entry) {
    if (!entry.progress || typeof entry.progress !== "object") return "";
    var tasks = entry.progress.tasks ? Object.keys(entry.progress.tasks).length : 0;
    var assessment = entry.progress.assessment ? Object.keys(entry.progress.assessment).length : 0;
    if (!tasks && !assessment) return "";
    return "Letzter Lernfortschritt: " + tasks + " Aufgaben, " + assessment + " Prüfungsfragen bearbeitet.";
  }

  function moduleCard(entry) {
    var card = el("article", "karte");
    card.appendChild(el("h3", "", entry.name + " " + entry.version));
    if (entry.description) card.appendChild(el("p", "", entry.description));
    card.appendChild(el("p", "meta", "Herausgeber: " + entry.publisher));
    card.appendChild(el("p", "meta", stateLabel(entry.state) + " · " + updateLabel(entry)));
    var progress = progressLabel(entry);
    if (progress) card.appendChild(el("p", "meta", progress));
    var actions = el("div", "zeile");
    var open = el("a", "knopf", "Öffnen");
    open.href = "/module.html#" + encodeURIComponent(entry.id);
    actions.appendChild(open);
    card.appendChild(actions);
    return card;
  }

  window.AcademyShell = {
    LAST_KEY: LAST_KEY,
    NAV: NAV,
    text: text,
    el: el,
    readLastArea: readLastArea,
    writeLastArea: writeLastArea,
    visibleModules: visibleModules,
    moduleCard: moduleCard
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildNavigation);
  else buildNavigation();
})();
