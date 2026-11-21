(function () {
  "use strict";

  var api = window.academyDesktop;
  var meldung = document.getElementById("meldung");
  var liste = document.getElementById("liste");
  var offen = { moduleId: null, taskId: null };

  function text(node, value) {
    node.textContent = value == null ? "" : String(value);
  }

  function say(value, fehler) {
    text(meldung, value);
    meldung.className = fehler ? "fehler" : "ok";
  }

  function renderList(result) {
    liste.replaceChildren();
    var installed = result && result.installed ? result.installed : [];
    if (!installed.length) {
      var leer = document.createElement("p");
      text(leer, "Noch kein Zusatzmodul installiert. Die bestehenden Lernseiten bleiben über die Themenübersicht erreichbar.");
      liste.appendChild(leer);
      return;
    }
    installed.forEach(function (entry) {
      var box = document.createElement("article");
      box.className = "modul";
      var title = document.createElement("h3");
      text(title, entry.name + " " + entry.version);
      var meta = document.createElement("p");
      text(meta, entry.publisher + " · " + entry.trust + " · " + entry.state + " · " + entry.sizeBytes + " Bytes");
      var actions = document.createElement("div");
      actions.className = "zeile";
      var open = document.createElement("button");
      open.type = "button";
      text(open, "Öffnen");
      open.addEventListener("click", function () { show(entry.id); });
      var toggle = document.createElement("button");
      toggle.type = "button";
      text(toggle, entry.state === "disabled" ? "Aktivieren" : "Deaktivieren");
      toggle.addEventListener("click", function () {
        api.moduleSetState(entry.id, entry.state === "disabled" ? "active" : "disabled").then(refresh);
      });
      var remove = document.createElement("button");
      remove.type = "button";
      text(remove, "Deinstallieren");
      remove.addEventListener("click", function () {
        api.moduleUninstall(entry.id).then(function (response) {
          say(response && response.ok ? "Dateien entfernt. Lernstände bleiben liegen." : (response && response.message) || "Deinstallation abgebrochen.", !(response && response.ok));
          refresh();
        });
      });
      actions.append(open, toggle, remove);
      box.append(title, meta, actions);
      liste.appendChild(box);
    });
  }

  function show(id) {
    api.moduleOpen(id).then(function (response) {
      var view = document.getElementById("ansicht");
      var inhalt = document.getElementById("inhalt");
      inhalt.replaceChildren();
      if (!response || !response.ok) {
        say((response && response.message) || "Das Modul lässt sich nicht öffnen.", true);
        return;
      }
      if (response.kind === "bundled") {
        window.location.href = response.href;
        return;
      }
      offen = { moduleId: id, taskId: null };
      view.hidden = false;
      text(document.getElementById("modul-titel"), response.module.name);
      var course = response.course || {};
      var lead = document.createElement("p");
      text(lead, course.responsibility || "");
      inhalt.appendChild(lead);
      (course.sections || []).forEach(function (section) {
        var heading = document.createElement("h3");
        text(heading, section.title);
        inhalt.appendChild(heading);
        (section.lessons || []).forEach(function (lesson) {
          (lesson.blocks || []).forEach(function (block) {
            var paragraph = document.createElement("p");
            text(paragraph, block.text || block.prompt || "");
            inhalt.appendChild(paragraph);
            if (block.id) offen.taskId = block.id;
          });
        });
      });
    });
  }

  function refresh() {
    return api.modules().then(function (response) {
      text(document.getElementById("lade"), "");
      if (!response || !response.ok) {
        say((response && response.message) || "Die Modulverwaltung ist nicht verfügbar. Die Lernseiten bleiben nutzbar.", true);
        return;
      }
      var platform = response.platform;
      text(document.getElementById("plattform"), platform.name + " · " + platform.note);
      renderList(response);
    });
  }

  document.getElementById("installieren").addEventListener("click", function () {
    api.moduleInstall().then(function (response) {
      say(response && response.ok ? "Modul installiert." : (response && response.message) || "Installation abgebrochen.", !(response && response.ok));
      refresh();
    });
  });
  document.getElementById("katalog").addEventListener("click", function () {
    api.moduleCatalog().then(function (response) {
      var node = document.getElementById("katalog-text");
      if (!response || !response.ok) {
        text(node, (response && response.message) || "Katalog nicht erreichbar. Installierte Module bleiben nutzbar.");
        return;
      }
      text(node, "Lokaler Katalog, nicht verbunden. Einträge: " + ((response.modules && response.modules.length) || 0) + ".");
    });
  });
  document.getElementById("antwort-form").addEventListener("submit", function (event) {
    event.preventDefault();
    if (!offen || !offen.moduleId) return;
    api.moduleCheck(offen.moduleId, offen.taskId, document.getElementById("antwort").value).then(function (response) {
      var node = document.getElementById("ergebnis");
      if (!response || !response.ok) {
        text(node, (response && response.message) || "Prüfung fehlgeschlagen.");
        return;
      }
      text(node, response.correct ? "Richtig. Eine Lösung wird hier nicht angezeigt." : ("Noch nicht richtig. " + (response.hint || "")));
    });
  });

  refresh();
})();
