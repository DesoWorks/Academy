"use strict";

const { listPorts } = require("./extensions/ports");

function fromApp(event) {
  const url = event && event.senderFrame && event.senderFrame.url;
  return typeof url === "string" && url.startsWith("academy://app/");
}

function reject(event, sync) {
  const result = { ok: false, code: "forbidden", message: "Diese Anfrage kommt nicht aus der Anwendung." };
  if (sync) event.returnValue = result;
  return result;
}

function ok(value) {
  return Object.assign({ ok: true }, value || {});
}

function fail(error) {
  return {
    ok: false,
    code: error.code || "error",
    message: error.message || "Die Aktion ist fehlgeschlagen."
  };
}

function registerIpc(options) {
  const { ipcMain, dialog, storeRef, updates, versions, channel } = options;
  const fs = require("node:fs");
  let store = storeRef.current;
  let pendingImport = null;

  function replaceStore(next) {
    store = next;
    storeRef.current = next;
  }

  ipcMain.on("academy:storage-load-all", (event) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      event.returnValue = ok({ items: store.all(), schemaVersion: store.schemaVersion });
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.on("academy:storage-set", (event, key, value) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      store.set(key, value);
      event.returnValue = ok();
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.on("academy:storage-remove", (event, key) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      store.remove(key);
      event.returnValue = ok();
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.on("academy:storage-clear", (event) => {
    if (!fromApp(event)) return reject(event, true);
    try {
      const result = store.clear();
      event.returnValue = ok({ backup: result.backup });
    } catch (error) {
      event.returnValue = fail(error);
    }
  });

  ipcMain.handle("academy:status", (event) => {
    if (!fromApp(event)) return reject(event, false);
    return ok({
      channel,
      versions,
      schemaVersion: store.schemaVersion,
      dataPath: store.path,
      backupDir: store.backupDir,
      lastBackup: store.lastBackup(),
      policy: store.readPolicy(),
      updates: updates.status(),
      extensions: listPorts(),
      runtime: {
        electron: process.versions.electron,
        platform: process.platform
      }
    });
  });

  ipcMain.handle("academy:backup", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ backup: store.backup("manual"), backups: store.listBackups() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:backups", (event) => {
    if (!fromApp(event)) return reject(event, false);
    return ok({ backups: store.listBackups() });
  });

  ipcMain.handle("academy:policy", (event, partial) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      if (!partial) return ok({ policy: store.readPolicy() });
      return ok({ policy: store.writePolicy(partial) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:export-file", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!dialog) return { ok: false, code: "unavailable", message: "Der Export-Dialog ist nicht verfügbar. Es wurde nichts geschrieben." };
    const picked = await dialog.showSaveDialog({
      title: "Ausbildungsdaten exportieren",
      defaultPath: "academy-export.json",
      filters: [{ name: "Ausbildungsdaten", extensions: ["json"] }]
    });
    if (picked.canceled || !picked.filePath) {
      return { ok: false, code: "cancelled", message: "Export abgebrochen. Es wurde nichts geschrieben." };
    }
    try {
      const raw = store.exportBundle(versions && versions.desktop);
      fs.writeFileSync(picked.filePath, raw, "utf8");
      if (fs.readFileSync(picked.filePath, "utf8") !== raw) {
        return { ok: false, code: "export-failed", message: "Die Exportdatei ist unvollständig. Sie darf nicht als erfolgreich gelten." };
      }
      return ok({ file: picked.filePath });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:pick-import", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!dialog) return { ok: false, code: "unavailable", message: "Der Import-Dialog ist nicht verfügbar. Es wurde nichts geändert." };
    const picked = await dialog.showOpenDialog({
      title: "Ausbildungsdaten importieren",
      filters: [{ name: "Ausbildungsdaten", extensions: ["json"] }],
      properties: ["openFile"]
    });
    if (picked.canceled || !picked.filePaths || !picked.filePaths[0]) {
      return { ok: false, code: "cancelled", message: "Import abgebrochen. Es wurde nichts geändert." };
    }
    try {
      const raw = fs.readFileSync(picked.filePaths[0], "utf8");
      pendingImport = { raw, file: picked.filePaths[0] };
      return ok({ file: picked.filePaths[0], bytes: Buffer.byteLength(raw) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:import", async (event, choice) => {
    if (!fromApp(event)) return reject(event, false);
    if (!pendingImport) return { ok: false, code: "missing-import", message: "Keine Importdatei ausgewählt. Es wurde nichts geändert." };
    const mode = choice && choice.mode;
    if (!dialog || typeof dialog.showMessageBox !== "function") {
      return { ok: false, code: "unavailable", message: "Ohne Bestätigung im Hauptprozess wird nichts importiert." };
    }
    const answer = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Importieren", "Abbrechen"],
      defaultId: 1,
      cancelId: 1,
      message: "Ausbildungsdaten importieren?",
      detail: "Modus: " + (mode || "fehlt") + ". Datei: " + pendingImport.file + ". Ohne diese Bestätigung bleibt der aktuelle Stand."
    });
    if (!answer || answer.response !== 0) {
      return { ok: false, code: "cancelled", message: "Import nicht bestätigt. Es wurde nichts geändert." };
    }
    try {
      const result = store.importBundle(pendingImport.raw, { mode, confirm: true, allowLegacy: Boolean(choice && choice.allowLegacy === true) });
      pendingImport = null;
      return ok(result);
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:restore", async (event, name) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      const match = store.listBackups().find((entry) => entry.name === name);
      if (!match) return { ok: false, code: "missing-backup", message: "Diese Sicherung gibt es nicht." };
      if (!dialog || typeof dialog.showMessageBox !== "function") {
        return { ok: false, code: "unavailable", message: "Ohne Bestätigung im Hauptprozess wird nichts zurückgeholt." };
      }
      const answer = await dialog.showMessageBox({
        type: "warning",
        buttons: ["Zurückholen", "Abbrechen"],
        defaultId: 1,
        cancelId: 1,
        message: "Sicherung zurückholen?",
        detail: match.name + " ersetzt den aktuellen Lernstand. Vorher wird ein Sicherheitsstand angelegt."
      });
      if (!answer || answer.response !== 0) {
        return { ok: false, code: "cancelled", message: "Wiederherstellung nicht bestätigt. Der aktuelle Stand bleibt." };
      }
      const next = store.restore(match.path);
      replaceStore(next);
      return ok({ schemaVersion: next.schemaVersion, items: Object.keys(next.all()).length });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-check", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: await updates.check() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-download", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: await updates.download() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-abort", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: updates.abort() });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules", (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules) return { ok: false, code: "unavailable", message: "Die Modulverwaltung ist nicht geladen. Die Lernseiten bleiben nutzbar." };
    return ok(options.modules.list());
  });

  ipcMain.handle("academy:modules-install", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules || !dialog) return { ok: false, code: "unavailable", message: "Ohne Dialog im Hauptprozess wird kein Modul installiert." };
    const picked = await dialog.showOpenDialog({
      title: "Modulordner wählen",
      properties: ["openDirectory"]
    });
    if (picked.canceled || !picked.filePaths || !picked.filePaths[0]) {
      return { ok: false, code: "cancelled", message: "Installation abgebrochen. Es wurde nichts kopiert." };
    }
    let preview;
    try {
      preview = options.modules.preview(picked.filePaths[0]);
    } catch (error) {
      return fail(error);
    }
    const answer = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Installieren", "Abbrechen"],
      defaultId: 1,
      cancelId: 1,
      message: preview.replaces ? "Installiertes Modul ersetzen?" : "Modul installieren?",
      detail: [
        preview.name + " " + preview.version,
        "ID: " + preview.id,
        "Herausgeber: " + preview.publisher,
        "Vertrauen: " + preview.trust,
        "Rechte: " + preview.permissions.join(", "),
        preview.replaces ? "Ersetzt Version " + preview.replaces + ". Lernstände bleiben an dieser ID." : "Neue Installation.",
        "Unsignierte Pakete bleiben ungeprüft."
      ].join("\n")
    });
    if (!answer || answer.response !== 0) {
      return { ok: false, code: "cancelled", message: "Installation nicht bestätigt. Es wurde nichts kopiert." };
    }
    try {
      return ok({ module: options.modules.installFromDirectory(picked.filePaths[0]) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-install-example", async (event) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules || !dialog || !options.exampleModuleDir) {
      return { ok: false, code: "unavailable", message: "Das Beispielmodul lässt sich ohne Modulverwaltung und Dialog nicht installieren." };
    }
    let preview;
    try {
      preview = options.modules.preview(options.exampleModuleDir);
    } catch (error) {
      return fail(error);
    }
    const answer = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Installieren", "Abbrechen"],
      defaultId: 1,
      cancelId: 1,
      message: preview.replaces ? "Installiertes Modul ersetzen?" : "Beispielmodul installieren?",
      detail: [
        preview.name + " " + preview.version,
        "ID: " + preview.id,
        "Herausgeber: " + preview.publisher,
        "Vertrauen: " + preview.trust,
        "Rechte: " + preview.permissions.join(", "),
        preview.replaces ? "Ersetzt Version " + preview.replaces + ". Lernstände bleiben an dieser ID." : "Neue Installation.",
        "Das Paket liegt der Anwendung bei und durchläuft dieselbe Prüfung wie jedes andere Paket."
      ].join("\n")
    });
    if (!answer || answer.response !== 0) {
      return { ok: false, code: "cancelled", message: "Installation nicht bestätigt. Es wurde nichts kopiert." };
    }
    try {
      return ok({ module: options.modules.installFromDirectory(options.exampleModuleDir) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-open", (event, id) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules) return { ok: false, code: "unavailable", message: "Die Modulverwaltung ist nicht geladen." };
    try {
      return ok(options.modules.open(String(id || "")));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-state", (event, id, state) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules) return { ok: false, code: "unavailable", message: "Die Modulverwaltung ist nicht geladen." };
    try {
      return ok({ module: options.modules.setState(String(id || ""), String(state || "")) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-uninstall", async (event, id) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules || !dialog) return { ok: false, code: "unavailable", message: "Ohne Bestätigung im Hauptprozess wird nichts deinstalliert." };
    const answer = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Deinstallieren", "Abbrechen"],
      defaultId: 1,
      cancelId: 1,
      message: "Moduldateien entfernen?",
      detail: "Lernstände dieses Moduls bleiben liegen."
    });
    if (!answer || answer.response !== 0) {
      return { ok: false, code: "cancelled", message: "Deinstallation nicht bestätigt. Es wurde nichts gelöscht." };
    }
    try {
      return ok(options.modules.uninstall(String(id || ""), { confirm: true }));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-check", (event, id, taskId, response) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules) return { ok: false, code: "unavailable", message: "Die Modulverwaltung ist nicht geladen." };
    try {
      return ok(options.modules.check(String(id || ""), String(taskId || ""), response));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-install-catalog", async (event, id) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules || !dialog || !options.catalogFile) {
      return { ok: false, code: "unavailable", message: "Der Katalog lässt sich ohne Modulverwaltung nicht installieren." };
    }
    let resolved;
    try {
      const { resolveBundledPackage } = require("./modules/catalog");
      resolved = resolveBundledPackage(options.catalogFile, String(id || ""));
    } catch (error) {
      return fail(error);
    }
    let preview;
    try {
      preview = options.modules.preview(resolved.dir);
    } catch (error) {
      return fail(error);
    }
    if (preview.id !== String(id || "")) {
      return { ok: false, code: "bad-path", message: "Das Paket gehört nicht zu diesem Katalogeintrag. Es wurde nichts installiert." };
    }
    const answer = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Installieren", "Abbrechen"],
      defaultId: 1,
      cancelId: 1,
      message: preview.replaces ? "Installiertes Modul ersetzen?" : "Lernangebot installieren?",
      detail: [
        preview.name + " " + preview.version,
        "ID: " + preview.id,
        "Herausgeber: " + preview.publisher,
        "Vertrauen: " + preview.trust,
        "Rechte: " + preview.permissions.join(", "),
        preview.runtime ? "Laufzeit: " + preview.runtime + ". Kein Node, kein Core-Zugriff." : "Inhaltsmodul.",
        preview.replaces ? "Ersetzt Version " + preview.replaces + ". Lernstände bleiben an dieser ID." : "Neue Installation.",
        "Das Paket liegt der Anwendung bei und durchläuft dieselbe Prüfung wie jedes andere Paket."
      ].join("\n")
    });
    if (!answer || answer.response !== 0) {
      return { ok: false, code: "cancelled", message: "Installation nicht bestätigt. Es wurde nichts kopiert." };
    }
    try {
      return ok({ module: options.modules.installFromDirectory(resolved.dir) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:modules-catalog", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      const { readCatalog } = require("./modules/catalog");
      return ok(readCatalog(options.catalogFile || ""));
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:update-install", (event) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      const backup = store.backup("pre-update");
      const plan = updates.installPlan(backup);
      if (!plan.ok) return { ok: false, message: plan.message, code: "install-blocked" };
      if (options.onInstall) options.onInstall(plan);
      return ok({ plan });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:module-update-download", async (event, id) => {
    if (!fromApp(event)) return reject(event, false);
    try {
      return ok({ state: await updates.downloadModule(String(id || "")) });
    } catch (error) {
      return fail(error);
    }
  });

  ipcMain.handle("academy:module-update-install", (event, id) => {
    if (!fromApp(event)) return reject(event, false);
    if (!options.modules || typeof options.modules.installFromDirectory !== "function") {
      return { ok: false, code: "unavailable", message: "Die Modulverwaltung ist nicht geladen. Der Core wurde nicht angetastet." };
    }
    const crypto = require("node:crypto");
    const path = require("node:path");
    const { extractZip } = require("./updates/zip");
    const prepared = updates.status().preparedModule;
    if (!prepared || prepared.kind !== "module" || prepared.id !== String(id || "")) {
      return { ok: false, code: "not-ready", message: "Es liegt kein geprüftes Modulpaket bereit. Der Core wurde nicht neu installiert." };
    }
    const actual = crypto.createHash("sha256").update(fs.readFileSync(prepared.zipPath)).digest("hex");
    if (actual !== prepared.expectedSha256) {
      return { ok: false, code: "hash-mismatch", message: "Die Integritätsprüfung des Modulpakets ist fehlgeschlagen. Es wurde nichts installiert." };
    }
    const dataDir = path.dirname(store.path);
    const dest = path.join(dataDir, "updates", "modules", "verified", prepared.id, prepared.version);
    const previous = typeof options.modules.installPath === "function" ? options.modules.installPath(prepared.id) : "";
    const snapshot = previous && fs.existsSync(previous)
      ? path.join(dataDir, "updates", "modules", "rollback", prepared.id, String(Date.now()))
      : "";
    if (snapshot) fs.cpSync(previous, snapshot, { recursive: true });
    try {
      fs.rmSync(dest, { recursive: true, force: true });
      extractZip(prepared.zipPath, dest);
      const installed = options.modules.installFromDirectory(dest);
      return ok({ module: installed, kind: "module", rollback: snapshot });
    } catch (error) {
      fs.rmSync(dest, { recursive: true, force: true });
      return {
        ok: false,
        code: error.code || "module-update-failed",
        message: (error.message || "Das Modulupdate ist fehlgeschlagen.") + " Die bisherige Modulversion bleibt. Der Academy-Core wurde nicht neu installiert.",
        rollback: snapshot
      };
    }
  });
}

module.exports = { registerIpc };
