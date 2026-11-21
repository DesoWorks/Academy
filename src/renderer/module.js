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
            if (!block.id) return;
            var form = document.createElement("form");
            var field = document.createElement("input");
            field.type = "text";
            field.autocomplete = "off";
            var button = document.createElement("button");
            button.type = "submit";
            text(button, "Prüfen");
            form.append(field, button);
            form.addEventListener("submit", function (event) {
              event.preventDefault();
              api.moduleCheck(id, block.id, field.value).then(function (response) {
                var node = document.getElementById("ergebnis");
                if (!response || !response.ok) {
                  text(node, (response && response.message) || "Prüfung fehlgeschlagen.");
                  return;
                }
                text(node, response.correct ? "Richtig. Eine Lösung wird hier nicht angezeigt." : ("Noch nicht richtig. " + (response.hint || "")));
              });
            });
            inhalt.appendChild(form);
          });
        });
      });
      var assessment = course.assessment;
      if (assessment && assessment.questions) {
        var heading = document.createElement("h3");
        text(heading, assessment.title || "Prüfung");
        inhalt.appendChild(heading);
        assessment.questions.forEach(function (question) {
          var paragraph = document.createElement("p");
          var chosen = "";
          text(paragraph, question.prompt || "");
          inhalt.appendChild(paragraph);
          (question.choices || []).forEach(function (choice, index) {
            var label = document.createElement("label");
            var radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "pruefung-" + assessment.questions.indexOf(question);
            radio.value = String(index);
            radio.addEventListener("change", function () { chosen = radio.value; });
            label.append(radio, document.createTextNode(" " + choice));
            inhalt.appendChild(label);
          });
          var button = document.createElement("button");
          button.type = "button";
          text(button, "Prüfung prüfen");
          button.addEventListener("click", function () {
            api.moduleCheck(id, question.id, chosen).then(function (response) {
              var node = document.getElementById("ergebnis");
              if (!response || !response.ok) {
                text(node, (response && response.message) || "Prüfung fehlgeschlagen.");
                return;
              }
              text(node, response.correct ? "Richtig. Eine Lösung wird hier nicht angezeigt." : "Noch nicht richtig.");
            });
          });
          inhalt.appendChild(button);
        });
      }
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
  refresh();
})();
