"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { MESSAGES } = require("./messages");
const { assertAllowedUrl, readSha256Asset, selectRelease, fromGitHubReleases } = require("./feed");
const { isSafeVersion } = require("./semver");

function sha256File(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function createUpdateService(options) {
  const dataDir = path.resolve(options.dataDir);
  const incoming = path.join(dataDir, "updates", "incoming");
  const stateFile = path.join(dataDir, "updates", "state.json");
  const channel = options.channel === "stable" ? "stable" : "dev";
  const installed = options.installedVersion;
  const fetchImpl = options.fetch || global.fetch;
  const feedUrl = options.feedUrl || "";
  const extraHosts = options.extraHosts || [];
  fs.mkdirSync(incoming, { recursive: true });

  let state = {
    phase: "idle",
    message: "",
    installed,
    available: null,
    notes: "",
    installerPath: null,
    error: null
  };

  function writeState() {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }

  function readState() {
    try {
      return JSON.parse(fs.readFileSync(stateFile, "utf8"));
    } catch (error) {
      return null;
    }
  }

  function contained(file) {
    const resolved = path.resolve(file);
    const relative = path.relative(incoming, resolved);
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
  }

  function installerFile(version) {
    if (!isSafeVersion(version)) {
      const error = new Error("Die Versionsangabe ist ungültig und wird nicht als Dateiname verwendet.");
      error.code = "bad-version";
      throw error;
    }
    const file = path.join(incoming, `${version}.exe`);
    if (!contained(file)) {
      const error = new Error("Der Updatepfad liegt außerhalb des Updateordners.");
      error.code = "bad-path";
      throw error;
    }
    return file;
  }

  function discardPartial() {
    if (!fs.existsSync(incoming)) return [];
    const removed = [];
    for (const name of fs.readdirSync(incoming)) {
      if (name.endsWith(".partial")) {
        fs.unlinkSync(path.join(incoming, name));
        removed.push(name);
      }
    }
    return removed;
  }

  function reconcile() {
    const previous = readState();
    const partials = discardPartial();
    if (previous && previous.phase === "installing") {
      state = Object.assign({}, previous, {
        phase: "interrupted",
        message: MESSAGES.installInterrupted,
        error: "install-interrupted"
      });
    } else if (partials.length || (previous && previous.phase === "downloading")) {
      state = {
        phase: "interrupted",
        message: MESSAGES.interrupted,
        installed,
        available: previous ? previous.available : null,
        notes: "",
        installerPath: null,
        error: "download-interrupted"
      };
    } else if (
      previous &&
      previous.phase === "ready" &&
      previous.installerPath &&
      previous.expectedSha256 &&
      contained(previous.installerPath) &&
      fs.existsSync(previous.installerPath) &&
      sha256File(previous.installerPath) === previous.expectedSha256
    ) {
      state = previous;
    } else {
      state.installed = installed;
    }
    writeState();
    return Object.assign({}, state);
  }

  async function check() {
    state.phase = "checking";
    state.error = null;
    state.installed = installed;
    writeState();
    if (!feedUrl) {
      state.phase = channel === "dev" ? "blocked" : "idle";
      state.message = channel === "dev" ? MESSAGES.devChannel : MESSAGES.noFeed;
      state.available = null;
      writeState();
      return Object.assign({}, state);
    }
    let payload;
    try {
      assertAllowedUrl(feedUrl, extraHosts);
      const response = await fetchImpl(feedUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      payload = await response.json();
    } catch (error) {
      state.phase = "failed";
      state.message = error.code === "host-rejected" ? MESSAGES.hostRejected : MESSAGES.checkFailed;
      state.error = error.code || "check-failed";
      writeState();
      return Object.assign({}, state);
    }
    const releases = Array.isArray(payload) ? fromGitHubReleases(payload) : (payload.releases || []);
    const selected = selectRelease(releases, { channel, installed });
    state.phase = selected.action === "available" ? "available" : selected.action;
    state.message = selected.message;
    state.available = selected.available;
    state.notes = selected.notes || "";
    state.asset = selected.asset || null;
    state.checksumAsset = selected.checksumAsset || null;
    writeState();
    return Object.assign({}, state);
  }

  async function download() {
    if (channel !== "stable") {
      state.phase = "blocked";
      state.message = MESSAGES.devChannel;
      writeState();
      return Object.assign({}, state);
    }
    if (!state.asset || !state.checksumAsset) {
      state.phase = "failed";
      state.message = MESSAGES.hashMissing;
      state.error = "hash-missing";
      writeState();
      return Object.assign({}, state);
    }
    let partial;
    let finalPath;
    try {
      finalPath = installerFile(state.available);
      partial = `${finalPath}.partial`;
    } catch (error) {
      state.phase = "failed";
      state.message = error.message;
      state.error = error.code || "bad-version";
      writeState();
      return Object.assign({}, state);
    }
    state.phase = "downloading";
    state.installerPath = null;
    state.error = null;
    writeState();
    try {
      assertAllowedUrl(state.asset.url, extraHosts);
      assertAllowedUrl(state.checksumAsset.url, extraHosts);
      const fileResponse = await fetchImpl(state.asset.url);
      if (!fileResponse.ok) throw new Error(`HTTP ${fileResponse.status}`);
      const bytes = Buffer.from(await fileResponse.arrayBuffer());
      fs.writeFileSync(partial, bytes);
      const checksumResponse = await fetchImpl(state.checksumAsset.url);
      if (!checksumResponse.ok) throw new Error(`HTTP ${checksumResponse.status}`);
      const expected = readSha256Asset(await checksumResponse.text());
      if (!expected) {
        fs.unlinkSync(partial);
        state.phase = "failed";
        state.message = MESSAGES.hashMissing;
        state.error = "hash-missing";
        writeState();
        return Object.assign({}, state);
      }
      state.phase = "verifying";
      writeState();
      const actual = sha256File(partial);
      if (actual !== expected) {
        fs.unlinkSync(partial);
        state.phase = "failed";
        state.message = MESSAGES.hashMismatch;
        state.error = "hash-mismatch";
        writeState();
        return Object.assign({}, state);
      }
      fs.renameSync(partial, finalPath);
      state.phase = "ready";
      state.message = MESSAGES.ready;
      state.installerPath = finalPath;
      state.expectedSha256 = actual;
      writeState();
      return Object.assign({}, state);
    } catch (error) {
      if (fs.existsSync(partial)) fs.unlinkSync(partial);
      state.phase = "failed";
      state.message = error.code === "host-rejected" ? MESSAGES.hostRejected : MESSAGES.downloadFailed;
      state.error = error.code || "download-failed";
      state.installerPath = null;
      writeState();
      return Object.assign({}, state);
    }
  }

  function installPlan(backupPath) {
    if (channel !== "stable") {
      return { ok: false, message: MESSAGES.stableOnly };
    }
    if (state.phase !== "ready" || !state.installerPath || !contained(state.installerPath) || !fs.existsSync(state.installerPath)) {
      return { ok: false, message: "Es liegt kein geprüftes Update im Updateordner bereit." };
    }
    if (!state.expectedSha256 || sha256File(state.installerPath) !== state.expectedSha256) {
      state.phase = "failed";
      state.message = MESSAGES.hashMismatch;
      state.installerPath = null;
      writeState();
      return { ok: false, message: MESSAGES.hashMismatch };
    }
    if (!backupPath || !fs.existsSync(backupPath)) {
      return { ok: false, message: "Vor der Installation fehlt eine Sicherung der Lerndaten. Es wurde nichts gestartet." };
    }
    const thumbprint = options.publisherThumbprint || "";
    if (!thumbprint || typeof options.verifyPublisher !== "function") {
      return { ok: false, message: "Für eine Stable-Installation fehlt die erwartete Herausgebersignatur. Es wurde nichts gestartet." };
    }
    const signature = options.verifyPublisher(state.installerPath, thumbprint);
    if (!signature || signature.ok !== true) {
      return { ok: false, message: "Die Signatur des Updates ist nicht die erwartete. Es wurde nichts gestartet." };
    }
    state.phase = "installing";
    state.message = MESSAGES.running;
    writeState();
    return {
      ok: true,
      message: MESSAGES.running,
      command: state.installerPath,
      args: [],
      quitFirst: true,
      backupPath
    };
  }

  return {
    channel,
    reconcile,
    check,
    download,
    installPlan,
    status() {
      return Object.assign({}, state);
    }
  };
}

module.exports = { createUpdateService, sha256File };
