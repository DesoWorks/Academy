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
    host.setAttribute("aria-label", "Academy-Navigation");
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

  // Darstellungsmodus: die Shell ist der einzige Eigentümer (Design Harmony 2B).
  var THEME_KEY = "academy.theme";
  var THEMES = ["hell", "dunkel", "kontrast"];
  var THEME_FALLBACK = "hell";

  function validTheme(value) {
    return typeof value === "string" && THEMES.indexOf(value) !== -1 ? value : null;
  }

  // Liest nur. Fehlend, ungültig oder Lesefehler ergibt hell; der Speicher wird nicht überschrieben.
  function readTheme() {
    try {
      var api = window.academyDesktop;
      if (!api || typeof api.storageLoadAll !== "function") return THEME_FALLBACK;
      var snapshot = api.storageLoadAll();
      if (!snapshot || snapshot.ok !== true || !snapshot.items) return THEME_FALLBACK;
      return validTheme(snapshot.items[THEME_KEY]) || THEME_FALLBACK;
    } catch (error) {
      return THEME_FALLBACK;
    }
  }

  function applyTheme(value) {
    var theme = validTheme(value) || THEME_FALLBACK;
    document.documentElement.setAttribute("data-academy-theme", theme);
    return theme;
  }

  // Der aktuell wirksame Wert dieser Shell-Seite (Root-Attribut, validiert).
  function activeTheme() {
    return validTheme(document.documentElement.getAttribute("data-academy-theme")) || THEME_FALLBACK;
  }

  // Speichert nur erlaubte Werte. Erst bei ok:true wird der Wert wirksam.
  function writeTheme(value) {
    var theme = validTheme(value);
    var api = window.academyDesktop;
    if (!theme || !api || typeof api.storageSet !== "function") return false;
    var result;
    try {
      result = api.storageSet(THEME_KEY, theme);
    } catch (error) {
      return false;
    }
    if (!result || result.ok !== true) return false;
    applyTheme(theme);
    return true;
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
    return "Nicht geprüft";
  }

  function availableLabel(entry) {
    return entry.availableVersion ? String(entry.availableVersion) : "Nicht geprüft";
  }

  function canOpen(entry) {
    return entry.compatible !== false && entry.state === "active";
  }

  function updateFailure(entry) {
    return typeof entry.lastUpdateError === "string" && entry.lastUpdateError ? entry.lastUpdateError : null;
  }

  // Fünf Zustände, jeweils mit eigenem Satz. Der Installationszustand (aktiv, gestört) bleibt davon getrennt.
  function statusReason(entry) {
    var failure = updateFailure(entry);
    if (failure) return "Aktualisierung fehlgeschlagen: " + failure;
    if (entry.compatible === false) {
      var reason = entry.compatibilityReason || "Das Modul passt nicht zu dieser Academy.";
      if (entry.updateAvailable === true) return "Inkompatibel, Aktualisierung erforderlich: " + reason;
      if (entry.updateAvailable === false) return "Keine Aktualisierung verfügbar: " + reason;
      return "Inkompatibel: " + reason;
    }
    if (entry.state === "disabled") return "Deaktiviert: Aktivieren, um das Modul zu öffnen.";
    if (entry.state === "faulted") return "Gestört: " + (entry.faultReason || "Das Modul wurde angehalten.");
    if (entry.state === "active") return entry.updateAvailable === true ? "Aktualisierung verfügbar" : "Kompatibel und startbereit";
    return stateLabel(entry.state);
  }

  // Startet die vorhandene Katalog-Installation. Der Bestätigungsdialog der Anwendung bleibt davor.
  function updateButton(entry, status) {
    var button = el("button", "", "Aktualisieren");
    button.type = "button";
    button.addEventListener("click", function () {
      var api = window.academyDesktop;
      if (!api || typeof api.moduleInstallCatalog !== "function") {
        text(status, "Die Aktualisierung ist nur in der Desktop-Anwendung möglich.");
        return;
      }
      button.disabled = true;
      text(status, "Aktualisierung läuft …");
      api.moduleInstallCatalog(entry.id).then(function (response) {
        if (response && response.ok) {
          text(status, "Aktualisiert. Die Ansicht wird neu geladen.");
          window.location.reload();
          return;
        }
        text(status, (response && response.message) || "Die Aktualisierung wurde abgebrochen. Es wurde nichts verändert.");
        button.disabled = false;
      }).catch(function () {
        text(status, "Die Aktualisierung ist fehlgeschlagen. Es wurde nichts verändert.");
        button.disabled = false;
      });
    });
    return button;
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
    card.appendChild(el("p", "meta", "Installiert: " + entry.version + " · Verfügbar: " + availableLabel(entry)));
    card.appendChild(el("p", "meta", statusReason(entry)));
    var progress = progressLabel(entry);
    if (progress) card.appendChild(el("p", "meta", progress));
    var openable = canOpen(entry);
    var updatable = entry.canUpdate === true;
    if (openable || updatable) {
      var actions = el("div", "zeile");
      if (openable) {
        var open = el("a", "knopf", "Öffnen");
        open.href = "/module.html#" + encodeURIComponent(entry.id);
        actions.appendChild(open);
      }
      if (updatable) {
        var status = el("p", "meta");
        status.setAttribute("role", "status");
        actions.appendChild(updateButton(entry, status));
        card.appendChild(actions);
        card.appendChild(status);
      } else {
        card.appendChild(actions);
      }
    }
    return card;
  }

  window.AcademyShell = {
    LAST_KEY: LAST_KEY,
    NAV: NAV,
    text: text,
    el: el,
    readLastArea: readLastArea,
    writeLastArea: writeLastArea,
    THEME_KEY: THEME_KEY,
    THEMES: THEMES,
    readTheme: readTheme,
    applyTheme: applyTheme,
    activeTheme: activeTheme,
    writeTheme: writeTheme,
    visibleModules: visibleModules,
    canOpen: canOpen,
    statusReason: statusReason,
    availableLabel: availableLabel,
    moduleCard: moduleCard
  };

  // Jede Shell-Seite setzt ihr Root-Attribut vor dem Aufbau, auch bevor ein Modul-iframe entsteht.
  applyTheme(readTheme());

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildNavigation);
  else buildNavigation();
})();
