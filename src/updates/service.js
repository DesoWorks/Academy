"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { MESSAGES } = require("./messages");
const { assertAllowedUrl, readSha256Asset, selectRelease, fromGitHubReleases } = require("./feed");
const { compare, isSafeVersion } = require("./semver");

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
  const repository = options.repository;
  fs.mkdirSync(incoming, { recursive: true });
  let abortController = null;

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

  function abortDownload() {
    if (abortController) abortController.abort();
    discardPartial();
    state.phase = "aborted";
    state.message = MESSAGES.aborted;
    state.error = "aborted";
    state.installerPath = null;
    state.received = 0;
    writeState();
    return Object.assign({}, state);
  }

  async function writeResponse(response, partial) {
    if (!response.body || typeof response.body.getReader !== "function") {
      const bytes = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(partial, bytes);
      state.received = bytes.length;
      state.total = bytes.length;
      return;
    }
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    const totalHeader = response.headers && typeof response.headers.get === "function"
      ? Number(response.headers.get("content-length"))
      : 0;
    state.total = Number.isFinite(totalHeader) ? totalHeader : 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = Buffer.from(next.value);
      chunks.push(chunk);
      received += chunk.length;
      state.received = received;
      if (typeof options.onProgress === "function") options.onProgress({ received, total: state.total });
    }
    fs.writeFileSync(partial, Buffer.concat(chunks));
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
      isSafeVersion(previous.available) &&
      compare(previous.available, installed) > 0 &&
      previous.installerPath &&
      previous.expectedSha256 &&
      contained(previous.installerPath) &&
      fs.existsSync(previous.installerPath) &&
      sha256File(previous.installerPath) === previous.expectedSha256
    ) {
      state = {
        phase: "ready",
        message: MESSAGES.ready,
        installed,
        available: previous.available,
        notes: "",
        installerPath: previous.installerPath,
        expectedSha256: previous.expectedSha256,
        error: null,
        asset: null,
        checksumAsset: null
      };
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
      if (!payload || typeof payload !== "object") {
        state.phase = "failed";
        state.message = MESSAGES.metadataInvalid;
        state.error = "metadata-invalid";
        writeState();
        return Object.assign({}, state);
      }
    } catch (error) {
      state.phase = "failed";
      state.message = error.code === "host-rejected" ? MESSAGES.hostRejected : MESSAGES.checkFailed;
      state.error = error.code || "check-failed";
      writeState();
      return Object.assign({}, state);
    }
    const releases = Array.isArray(payload) ? fromGitHubReleases(payload) : payload.releases;
    if (!Array.isArray(releases)) {
      state.phase = "failed";
      state.message = MESSAGES.metadataInvalid;
      state.error = "metadata-invalid";
      writeState();
      return Object.assign({}, state);
    }
    let selected;
    try {
      selected = selectRelease(releases, { channel, installed, repository, extraHosts });
    } catch (error) {
      state.phase = "failed";
      state.message = MESSAGES.metadataInvalid;
      state.error = "metadata-invalid";
      writeState();
      return Object.assign({}, state);
    }
    state.phase = selected.action === "available" ? "available" : selected.action;
    state.error = selected.action === "rejected" ? "metadata-rejected" : null;
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
      const { repositoryPinned } = require("./feed");
      if (!repositoryPinned(state.asset.url, repository, extraHosts) || !repositoryPinned(state.checksumAsset.url, repository, extraHosts)) {
        const rejected = new Error(MESSAGES.repoRejected);
        rejected.code = "host-rejected";
        throw rejected;
      }
      abortController = typeof AbortController === "function" ? new AbortController() : null;
      const fileResponse = await fetchImpl(state.asset.url, abortController ? { signal: abortController.signal } : undefined);
      if (fileResponse.url) assertAllowedUrl(fileResponse.url, extraHosts);
      if (!fileResponse.ok) throw new Error(`HTTP ${fileResponse.status}`);
      await writeResponse(fileResponse, partial);
      const checksumResponse = await fetchImpl(state.checksumAsset.url, abortController ? { signal: abortController.signal } : undefined);
      if (checksumResponse.url) assertAllowedUrl(checksumResponse.url, extraHosts);
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
      if (partial && fs.existsSync(partial)) fs.unlinkSync(partial);
      if (error && (error.name === "AbortError" || error.code === "ABORT_ERR")) {
        state.phase = "aborted";
        state.message = MESSAGES.aborted;
        state.error = "aborted";
        state.installerPath = null;
        writeState();
        return Object.assign({}, state);
      }
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
    let expectedFile;
    try {
      expectedFile = installerFile(state.available);
    } catch (error) {
      return { ok: false, message: error.message };
    }
    if (path.resolve(state.installerPath) !== path.resolve(expectedFile)) {
      return { ok: false, message: "Der Installer entspricht nicht der geprüften Version. Es wurde nichts gestartet." };
    }
    if (!isSafeVersion(state.available) || compare(state.available, installed) <= 0) {
      return { ok: false, message: "Es wird keine ältere oder gleiche Version installiert. Die Anwendung bleibt unverändert." };
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
    abort: abortDownload,
    installPlan,
    status() {
      return Object.assign({}, state);
    }
  };
}

module.exports = { createUpdateService, sha256File };
