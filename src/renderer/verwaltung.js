(function () {
  "use strict";
  var api = window.academyDesktop;
  var meldung = document.getElementById("meldung");

  function say(text, ok) {
    meldung.textContent = text;
    meldung.className = ok ? "ok" : "fehler";
  }

  function stamp(ms) {
    if (!ms) return "noch keine";
    return new Date(ms).toLocaleString("de-DE");
  }

  function fillBackups(list) {
    var select = document.getElementById("sicherungen");
    select.innerHTML = "";
    (list || []).forEach(function (entry) {
      var option = document.createElement("option");
      option.value = entry.name;
      option.textContent = entry.name;
      select.appendChild(option);
    });
  }

  function paint(result) {
    document.getElementById("lade").hidden = true;
    if (!result || result.ok !== true) {
      say((result && result.message) || "Status nicht lesbar.", false);
      return;
    }
    var versions = result.versions || {};
    document.getElementById("version").textContent = (versions.name || "DesoWorks Academy")
      + " · Version " + (versions.desktop || "?")
      + " · Kanal " + (versions.channel || "?")
      + " · Commit " + (versions.commit || "nicht im Build hinterlegt")
      + " · Schema " + result.schemaVersion;
    var last = result.lastBackup;
    document.getElementById("letzte").textContent = last
      ? ("Letzte Sicherung: " + stamp(last.mtimeMs) + (last.intact ? " · intakt" : " · nicht intakt, nicht als Erfolg werten"))
      : "Letzte Sicherung: noch keine.";
    document.getElementById("ort").textContent = "Speicherort: " + (result.dataPath || "unbekannt");
    var policy = result.policy || {};
    document.getElementById("intervall").value = String(policy.intervalHours || 0);
    document.getElementById("begrenzen").value = String(policy.maxBackups || 12);
    var update = result.updates || {};
    document.getElementById("update").textContent = update.message || "Keine Updateprüfung gelaufen.";
    var meta = [];
    if (update.checkedAt) meta.push("Letzte Prüfung: " + update.checkedAt);
    if (update.available) meta.push("Core " + update.installed + " → " + update.available + (update.prerelease ? " · DEV-Prerelease" : " · Core"));
    if (update.commit) meta.push("Commit " + update.commit);
    if (update.publishedAt) meta.push("Veröffentlicht " + update.publishedAt);
    if (update.size) meta.push("Download " + update.size + " Bytes");
    document.getElementById("update-meta").textContent = meta.join(" · ");
    document.getElementById("update-notes").textContent = update.notes || "";
    var modules = update.moduleUpdates || [];
    var moduleNode = document.getElementById("modul-update");
    moduleNode.dataset.moduleId = modules.length ? modules[0].id : "";
    moduleNode.textContent = modules.length
      ? modules.map(function (entry) {
          return "Modul " + entry.id + ": " + entry.installed + " → " + entry.available + " · " + (entry.message || entry.action) + (entry.size ? " · " + entry.size + " Bytes" : "");
        }).join(" ")
      : (update.moduleMessage || "Kein Modulupdate gemeldet.");
    if (update.moduleMessage && modules.length) {
      moduleNode.textContent += " · " + update.moduleMessage;
    }
    if (update.received) {
      document.getElementById("fortschritt").textContent = update.total
        ? ("Download " + update.received + " / " + update.total + " Bytes")
        : ("Download " + update.received + " Bytes");
    }
    var runtime = result.runtime || {};
    document.getElementById("system").textContent = "Electron " + (runtime.electron || "?") + " · " + (runtime.platform || "?");
    document.getElementById("offline").hidden = navigator.onLine !== false;
    api.backups().then(function (list) {
      if (list && list.ok) fillBackups(list.backups);
    });
  }

  function refresh() {
    return api.status().then(paint).catch(function () {
      say("Status konnte nicht gelesen werden.", false);
    });
  }

  document.getElementById("sichern").addEventListener("click", function () {
    api.backup().then(function (result) {
      if (!result || result.ok !== true) {
        say((result && result.message) || "Sicherung fehlgeschlagen. Es wurde kein Erfolg gespeichert.", false);
        return;
      }
      say("Sicherung angelegt.", true);
      fillBackups(result.backups);
      refresh();
    });
  });

  document.getElementById("zurueck").addEventListener("click", function () {
    var name = document.getElementById("sicherungen").value;
    if (!name) {
      say("Keine Sicherung ausgewählt.", false);
      return;
    }
    api.restore(name).then(function (result) {
      say(result && result.ok ? "Wiederherstellung abgeschlossen." : ((result && result.message) || "Wiederherstellung fehlgeschlagen. Der aktuelle Stand bleibt, wenn die Sicherung unbrauchbar war."), result && result.ok);
      refresh();
    });
  });

  document.getElementById("intervall").addEventListener("change", savePolicy);
  document.getElementById("begrenzen").addEventListener("change", savePolicy);

  function savePolicy() {
    api.policy({
      intervalHours: Number(document.getElementById("intervall").value),
      maxBackups: Number(document.getElementById("begrenzen").value)
    }).then(function (result) {
      say(result && result.ok ? "Sicherungsregel gespeichert." : "Die Regel wurde nicht gespeichert.", result && result.ok);
    });
  }

  document.getElementById("export").addEventListener("click", function () {
    api.exportFile().then(function (result) {
      say(result && result.ok ? "Export geschrieben." : ((result && result.message) || "Export fehlgeschlagen."), result && result.ok);
    });
  });

  document.getElementById("import").addEventListener("click", function () {
    api.pickImport().then(function (picked) {
      if (!picked || picked.ok !== true) {
        say((picked && picked.message) || "Import abgebrochen. Es wurde nichts geändert.", false);
        return null;
      }
      var mode = document.getElementById("import-modus").value;
      return api.importBundle({ mode: mode }).then(function (first) {
        // Ältere IT-Ausbildung-Exporte werden nur nach ausdrücklicher Bestätigung übernommen.
        if (first && first.code === "legacy-unconfirmed" && window.confirm("Dieser Export stammt aus dem älteren Format der IT-Ausbildung. Trotzdem als Academy-Daten übernehmen?")) {
          return api.importBundle({ mode: mode, allowLegacy: true });
        }
        return first;
      });
    }).then(function (result) {
      if (!result) return;
      say(result.ok ? "Import abgeschlossen." : (result.message || "Import fehlgeschlagen. Vorhandene Daten bleiben unverändert."), result.ok === true);
      refresh();
    });
  });

  document.getElementById("pruefen").addEventListener("click", function () {
    api.checkUpdate().then(function (result) {
      var state = result && result.state;
      say(state ? state.message : "Prüfung ohne Ergebnis.", state && state.phase !== "failed");
      refresh();
    });
  });

  document.getElementById("laden").addEventListener("click", function () {
    api.downloadUpdate().then(function (result) {
      var state = result && result.state;
      say(state ? state.message : "Download ohne Ergebnis.", state && state.phase === "ready");
      refresh();
    });
  });

  document.getElementById("abbrechen").addEventListener("click", function () {
    api.abortUpdate().then(function (result) {
      var state = result && result.state;
      say(state ? state.message : "Abbruch ohne Ergebnis.", true);
      refresh();
    });
  });

  document.getElementById("installieren").addEventListener("click", function () {
    api.installUpdate().then(function (result) {
      say(result && result.ok ? "Installation wurde vorbereitet. Die Anwendung beendet sich dafür." : ((result && result.message) || "Installation nicht gestartet."), result && result.ok);
    });
  });

  document.getElementById("modul-laden").addEventListener("click", function () {
    var moduleId = document.getElementById("modul-update").dataset.moduleId;
    if (!moduleId) {
      say("Kein Modulupdate zum Herunterladen.", false);
      return;
    }
    api.downloadModuleUpdate(moduleId).then(function (result) {
      var state = result && result.state;
      say(state && state.moduleMessage ? state.moduleMessage : "Moduldownload ohne Ergebnis.", state && state.preparedModule);
      refresh();
    });
  });

  document.getElementById("modul-installieren").addEventListener("click", function () {
    var moduleId = document.getElementById("modul-update").dataset.moduleId;
    if (!moduleId) {
      say("Kein Modulupdate zum Installieren.", false);
      return;
    }
    api.installModuleUpdate(moduleId).then(function (result) {
      say(result && result.ok ? "Modulupdate installiert. Der Core bleibt unverändert." : ((result && result.message) || "Modulupdate nicht installiert."), result && result.ok);
      refresh();
    });
  });

  var startBox = document.getElementById("beim-start");
  try {
    var stored = api.storageLoadAll();
    startBox.checked = stored && stored.items && stored.items["academy.updateCheckOnStart"] === "1";
  } catch (error) {
    startBox.checked = false;
  }
  startBox.addEventListener("change", function () {
    api.storageSet("academy.updateCheckOnStart", startBox.checked ? "1" : "0");
    say(startBox.checked ? "Prüfung beim Start ist an. Es wird nicht automatisch heruntergeladen." : "Prüfung beim Start ist aus.", true);
  });

  window.addEventListener("offline", function () { document.getElementById("offline").hidden = false; });
  window.addEventListener("online", function () { document.getElementById("offline").hidden = true; });

  if (!api) {
    say("Diese Seite läuft nur in der Desktop-Anwendung.", false);
    return;
  }
  refresh();
})();
