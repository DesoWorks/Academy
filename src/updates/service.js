"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { MESSAGES } = require("./messages");
const { assertAllowedUrl, readSha256Asset, selectRelease, selectModuleUpdates, fromGitHubReleases } = require("./feed");
const { isLoopbackUrl, DEV_FEED_HEADER } = require("./dev-feed");
const { compare, isSafeVersion } = require("./semver");
const { isChannelName } = require("./channel-preference");
const { selectCandidate, parseReleaseTag } = require("./channels");
const { verifyManifest } = require("./manifest-sign");
const github = require("./github-feed");

// Fehlergruende, die auf eine fehlende oder ungueltige Signatur hindeuten.
const SIGNATURE_REASONS = new Set([
  "bytes-invalid", "signature-missing", "signature-unreadable", "signature-invalid-format", "key-missing",
  "key-invalid", "key-not-ed25519", "signature-mismatch", "verify-failed"
]);

// Grund einer Ablehnung, der nicht zum gewaehlten Kanal oder zur Plattform gehoert und daher keine Warnung ist.
const CHANNEL_AVAILABLE = {
  dev: MESSAGES.devAvailable,
  beta: "Eine neuere Beta-Version ist verfügbar. Es wird noch nichts installiert.",
  stable: MESSAGES.available
};
function safeName(name) {
  return typeof name === "string" && name.length > 0 && name.length < 180 && !/[\\/\u0000]/.test(name);
}
const FOREIGN_REASONS = new Set(["wrong-channel", "other-package", "draft", "tag-invalid", "wrong-platform"]);

function sha256File(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function createUpdateService(options) {
  const dataDir = path.resolve(options.dataDir);
  const incoming = path.join(dataDir, "updates", "incoming");
  const stateFile = path.join(dataDir, "updates", "state.json");
  const explicitFeed = options.feedUrl || "";
  const hasPreference = typeof options.channelPreference === "function";

  // Zulaessig sind nur dev, beta und stable. Ein fremder Wert ergibt null und wird abgelehnt, nie ersetzt.
  // Mit ausdruecklicher Feed-Adresse gilt der Kanal des Builds. Ohne sie steuert die gespeicherte Wahl.
  // Ohne gespeicherte Wahl gilt stable.
  function resolveChannel() {
    if (explicitFeed || !hasPreference) return isChannelName(options.channel) ? options.channel : null;
    let raw = "";
    try {
      raw = options.channelPreference();
    } catch (error) {
      raw = "";
    }
    const text = String(raw == null ? "" : raw).trim().toLowerCase();
    if (text === "") return "stable";
    return isChannelName(text) ? text : null;
  }
  let channel = resolveChannel();
  const installed = options.installedVersion;
  const fetchImpl = options.fetch || global.fetch;
  const feedUrl = explicitFeed;
  const extraHosts = options.extraHosts || [];
  const repository = options.repository;
  fs.mkdirSync(incoming, { recursive: true });
  let abortController = null;
  const moduleIncoming = path.join(dataDir, "updates", "modules", "incoming");
  // Rohbytes und Signatur des zuletzt geprueften Manifests (nur im Speicher). Download und Installation
  // pruefen sie erneut mit verifyManifest und brechen bei ok !== true ab.
  let pending = null;

  function hostError() {
    const rejected = new Error(MESSAGES.hostRejected);
    rejected.code = "host-rejected";
    return rejected;
  }

  function pendingManifestOk() {
    if (!pending || pending.version !== state.available || channel === null) return false;
    if (verifyManifest(pending.raw, pending.signature, options.updatePublicKey).ok !== true) return false;
    try {
      const manifest = JSON.parse(Buffer.from(pending.raw).toString("utf8"));
      return manifest.channel === channel && manifest.version === state.available && manifest.sha256 === state.manifestSha256;
    } catch (error) {
      return false;
    }
  }

  // Das beim Download abgelegte Manifest wird vor Wiederaufnahme und Installation erneut geprueft.
  function storedManifestOk(version, sha) {
    if (!isSafeVersion(version) || !sha || channel === null) return false;
    try {
      const raw = fs.readFileSync(path.join(incoming, `${version}.manifest.json`));
      const signature = fs.readFileSync(path.join(incoming, `${version}.manifest.json.sig`), "utf8");
      if (verifyManifest(raw, signature, options.updatePublicKey).ok !== true) return false;
      const manifest = JSON.parse(raw.toString("utf8"));
      return manifest.channel === channel && manifest.version === version && manifest.sha256 === sha;
    } catch (error) {
      return false;
    }
  }

  function newerUnverifiedReason(releases) {
    if (!isSafeVersion(installed)) return null;
    for (const entry of releases) {
      if (entry.draft || entry.manifestVerified === true || !entry.manifestReason) continue;
      const parsed = parseReleaseTag(entry.tag);
      if (!parsed || parsed.module || parsed.channel !== channel || compare(parsed.version, installed) <= 0) continue;
      return entry.manifestReason;
    }
    return null;
  }

  function currentKey() {
    if (typeof options.devFeedKey === "function") return String(options.devFeedKey() || "").trim();
    return String(options.devFeedKey || "").trim();
  }

  // Optionales Token (Option oder ACADEMY_UPDATE_TOKEN), nur fuer die Releaseliste der GitHub-API.
  // Die Quelle ist oeffentlich: ohne Token wird normal abgerufen. Es ist nirgends eingebettet
  // und wird weder gespeichert noch in Zustand oder Meldungen geschrieben.
  function githubToken() {
    const given = typeof options.githubToken === "function" ? options.githubToken() : options.githubToken;
    return github.resolveToken(given, options.env);
  }

  async function fetchFeed(url, init) {
    const headers = Object.assign({}, init && init.headers);
    const key = currentKey();
    if (key && isLoopbackUrl(url)) headers[DEV_FEED_HEADER] = key;
    // Downloads von github.com/DesoWorks/Academy/releases/download sind oeffentlich und bekommen nie ein Token.
    if (typeof url === "string" && url.startsWith(github.DOWNLOAD_PREFIX)) {
      headers.Accept = "application/octet-stream";
      headers["User-Agent"] = "DesoWorks-Academy-Updater";
    }
    return fetchImpl(url, Object.assign({}, init, { headers }));
  }

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
    channel = resolveChannel();
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
      (!previous.channel || previous.channel === channel) &&
      isSafeVersion(previous.available) &&
      compare(previous.available, installed) > 0 &&
      previous.installerPath &&
      previous.expectedSha256 &&
      contained(previous.installerPath) &&
      fs.existsSync(previous.installerPath) &&
      sha256File(previous.installerPath) === previous.expectedSha256 &&
      (explicitFeed || storedManifestOk(previous.available, previous.expectedSha256))
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
      state.prerelease = previous.prerelease === true;
      state.channel = channel;
      state.kind = previous.kind || "core";
      state.commit = previous.commit || "";
      state.publishedAt = previous.publishedAt || "";
      state.size = previous.size || 0;
      if (state.prerelease) state.message = MESSAGES.devReady;
    } else {
      state.installed = installed;
    }
    writeState();
    return Object.assign({}, state);
  }

  function stop(phase, message, code) {
    state.phase = phase;
    state.message = message;
    state.error = code;
    state.available = null;
    state.asset = null;
    state.checksumAsset = null;
    state.manifestSha256 = "";
    state.installerPath = null;
    writeState();
    return Object.assign({}, state);
  }

  // Feste oeffentliche GitHub-Quelle: Kanal aus der gespeicherten Wahl. Ein Token ist optional.
  // Bei 401/403/404 oder unerreichbarer Quelle bleibt alles unveraendert.
  async function checkGithub() {
    const token = githubToken();
    const fetched = await github.fetchReleases({ fetch: fetchImpl, token });
    if (!fetched.ok) {
      return fetched.state === "locked"
        ? stop("failed", MESSAGES.githubLocked, "source-locked")
        : stop("failed", MESSAGES.githubUnreachable, "source-unreachable");
    }
    pending = null;
    await github.attachManifests(fetched.releases, channel, { fetch: fetchImpl, token, publicKey: options.updatePublicKey });
    // Nur signaturgepruefte Manifeste zaehlen. Der Service prueft die exakten Bytes selbst noch einmal;
    // bei ok !== true faellt das Release aus der Kandidatenliste.
    for (const entry of fetched.releases) {
      if (entry.manifestVerified === true) {
        const again = verifyManifest(entry.manifestRaw, entry.manifestSignature, options.updatePublicKey);
        if (again.ok !== true) {
          entry.manifestVerified = false;
          entry.manifestReason = again.reason;
        }
      }
      if (entry.manifestVerified !== true) entry.manifest = null;
    }
    const verdict = selectCandidate({
      channel,
      installedVersion: installed,
      releases: fetched.releases,
      allowDowngrade: false,
      platform: options.platform
    });
    state.channel = channel;
    state.checkedAt = new Date().toISOString();
    state.kind = "core";
    state.moduleUpdates = [];
    state.prerelease = false;
    state.commit = "";
    state.publishedAt = "";
    state.size = 0;
    state.notes = "";
    if (verdict.action === "blocked") return stop("failed", MESSAGES.metadataInvalid, "metadata-invalid");
    if (verdict.action !== "available") {
      const badReason = newerUnverifiedReason(fetched.releases);
      if (badReason) {
        return SIGNATURE_REASONS.has(badReason)
          ? stop("rejected", MESSAGES.signatureInvalid, "signature-invalid")
          : stop("rejected", MESSAGES.metadataInvalid, "metadata-rejected");
      }
      const suspicious = (verdict.rejected || []).some((entry) => !FOREIGN_REASONS.has(entry.reason));
      return suspicious
        ? stop("rejected", MESSAGES.metadataInvalid, "metadata-rejected")
        : stop("current", MESSAGES.upToDate, null);
    }
    const release = verdict.release;
    const manifest = release.manifest;
    const sha = String(manifest.sha256 || "").trim().toLowerCase();
    const exes = (release.assets || []).filter((asset) => /\.exe$/i.test(asset.name));
    const exe = exes.length === 1 ? exes[0] : null;
    if (!/^[a-f0-9]{64}$/.test(sha)) return stop("rejected", MESSAGES.hashMissing, "metadata-rejected");
    if (!exe || !safeName(exe.name) || release.manifestVerified !== true || !github.isDownloadUrl(exe.url, release.tag, exe.name)) {
      return stop("rejected", MESSAGES.metadataInvalid, "metadata-rejected");
    }
    // Das Paket muss genau das sein, was das signierte Manifest beschreibt.
    const described = manifest.package || {};
    if (github.validateManifest(manifest, release.tag, { strict: true }) !== null) {
      return stop("rejected", MESSAGES.metadataInvalid, "metadata-rejected");
    }
    if (described.name !== exe.name || (exe.size && described.size && exe.size !== described.size)) {
      return stop("rejected", MESSAGES.metadataInvalid, "metadata-rejected");
    }
    pending = { version: verdict.version, tag: release.tag, raw: release.manifestRaw, signature: release.manifestSignature };
    state.phase = "available";
    state.error = null;
    state.message = CHANNEL_AVAILABLE[channel] || MESSAGES.available;
    state.available = verdict.version;
    state.notes = release.notes || "";
    state.asset = { name: exe.name, url: exe.url, size: exe.size || 0 };
    state.checksumAsset = { name: "manifest.json", url: exe.url, fromManifest: true };
    state.manifestSha256 = sha;
    state.prerelease = release.prerelease === true;
    state.commit = release.commit || "";
    state.publishedAt = release.publishedAt || "";
    state.size = exe.size || 0;
    writeState();
    return Object.assign({}, state);
  }

  async function check() {
    channel = resolveChannel();
    state.phase = "checking";
    state.error = null;
    state.installed = installed;
    writeState();
    if (channel === null) return stop("blocked", MESSAGES.channelRejected, "unknown-channel");
    if (!feedUrl) return checkGithub();
    if (isLoopbackUrl(feedUrl) && !currentKey()) {
      state.phase = "failed";
      state.message = MESSAGES.devFeedUnauthorized;
      state.error = "dev-feed-unauthorized";
      state.available = null;
      writeState();
      return Object.assign({}, state);
    }
    let payload;
    try {
      assertAllowedUrl(feedUrl, extraHosts);
      const response = await fetchFeed(feedUrl);
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
      state.message = error.code === "host-rejected"
        ? MESSAGES.hostRejected
        : (channel === "dev" && /ECONNREFUSED|fetch failed|ENOTFOUND/i.test(String(error.message || error.cause || "")))
          ? MESSAGES.devFeedDown
          : (/HTTP 401/.test(String(error.message || "")) ? MESSAGES.devFeedUnauthorized : MESSAGES.checkFailed);
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
    state.prerelease = selected.prerelease === true;
    state.commit = selected.commit || "";
    state.publishedAt = selected.publishedAt || "";
    state.size = selected.size || 0;
    state.kind = "core";
    state.checkedAt = new Date().toISOString();
    const installedModules = typeof options.installedModules === "function" ? options.installedModules() : (options.installedModules || []);
    state.moduleUpdates = selectModuleUpdates(payload.modules, installedModules, {
      channel,
      coreVersion: options.coreVersion,
      repository,
      extraHosts
    });
    writeState();
    return Object.assign({}, state);
  }

  // Ein vorbereitetes Paket gehoert nur zum Kanal, in dem es geprueft wurde.
  function foreignPackage() {
    channel = resolveChannel();
    return channel === null || (state.channel && state.channel !== channel);
  }

  async function download() {
    if (foreignPackage()) {
      return stop("blocked", channel === null ? MESSAGES.channelRejected : MESSAGES.channelSwitched, channel === null ? "unknown-channel" : "channel-switched");
    }
    if (channel !== "stable" && state.prerelease !== true) {
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
    if (isSafeVersion(state.available) && compare(state.available, installed) <= 0) {
      return stop("blocked", MESSAGES.downgradeRejected, "downgrade-rejected");
    }
    if (!feedUrl && !pendingManifestOk()) {
      return stop("failed", MESSAGES.signatureInvalid, "signature-invalid");
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
      if (!feedUrl && !(typeof state.asset.url === "string" && state.asset.url.startsWith(github.DOWNLOAD_PREFIX))) throw hostError();
      assertAllowedUrl(state.asset.url, extraHosts);
      assertAllowedUrl(state.checksumAsset.url, extraHosts);
      const { repositoryPinned } = require("./feed");
      if (!repositoryPinned(state.asset.url, repository, extraHosts) || !repositoryPinned(state.checksumAsset.url, repository, extraHosts)) {
        const rejected = new Error(MESSAGES.repoRejected);
        rejected.code = "host-rejected";
        throw rejected;
      }
      abortController = typeof AbortController === "function" ? new AbortController() : null;
      const fileResponse = await fetchFeed(state.asset.url, abortController ? { signal: abortController.signal } : undefined);
      if (fileResponse.url) {
        // Weiterleitungen weg von GitHub (auch auf http oder Loopback) werden im GitHub-Pfad abgewiesen.
        if (!feedUrl && !github.isAllowedFinalUrl(fileResponse.url)) throw hostError();
        assertAllowedUrl(fileResponse.url, extraHosts);
      }
      if (!fileResponse.ok) throw new Error(`HTTP ${fileResponse.status}`);
      await writeResponse(fileResponse, partial);
      let expected;
      if (state.checksumAsset.fromManifest === true) {
        expected = /^[a-f0-9]{64}$/.test(String(state.manifestSha256 || "")) ? state.manifestSha256 : "";
      } else {
        const checksumResponse = await fetchFeed(state.checksumAsset.url, abortController ? { signal: abortController.signal } : undefined);
        if (checksumResponse.url) assertAllowedUrl(checksumResponse.url, extraHosts);
        if (!checksumResponse.ok) throw new Error(`HTTP ${checksumResponse.status}`);
        expected = readSha256Asset(await checksumResponse.text());
      }
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
      if (!feedUrl) {
        fs.writeFileSync(path.join(incoming, `${state.available}.manifest.json`), pending.raw);
        fs.writeFileSync(path.join(incoming, `${state.available}.manifest.json.sig`), `${pending.signature}\n`);
      }
      fs.renameSync(partial, finalPath);
      state.phase = "ready";
      state.message = state.prerelease === true ? MESSAGES.devReady : MESSAGES.ready;
      state.installerPath = finalPath;
      state.channel = channel;
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
    if (foreignPackage()) {
      return { ok: false, message: channel === null ? MESSAGES.channelRejected : MESSAGES.channelSwitched };
    }
    if (channel !== "stable" && state.prerelease !== true) {
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
    if (!feedUrl && !storedManifestOk(state.available, state.expectedSha256)) {
      return { ok: false, message: MESSAGES.signatureInvalid };
    }
    if (!backupPath || !fs.existsSync(backupPath)) {
      return { ok: false, message: "Vor der Installation fehlt eine Sicherung der Lerndaten. Es wurde nichts gestartet." };
    }
    if (channel === "stable") {
      const thumbprint = options.publisherThumbprint || "";
      if (!thumbprint || typeof options.verifyPublisher !== "function") {
        return { ok: false, message: "Für eine Stable-Installation fehlt die erwartete Herausgebersignatur. Es wurde nichts gestartet." };
      }
      const signature = options.verifyPublisher(state.installerPath, thumbprint);
      if (!signature || signature.ok !== true) {
        return { ok: false, message: "Die Signatur des Updates ist nicht die erwartete. Es wurde nichts gestartet." };
      }
    }
    state.phase = "installing";
    state.message = channel === "stable" ? MESSAGES.running : MESSAGES.devRunning;
    writeState();
    return {
      ok: true,
      message: state.message,
      command: state.installerPath,
      args: ["/S"],
      quitFirst: true,
      backupPath
    };
  }

  async function downloadModule(id) {
    const entry = (state.moduleUpdates || []).find((item) => item.id === id && item.action === "available" && item.prerelease === true);
    if (channel !== "dev" || !entry) {
      state.moduleMessage = MESSAGES.moduleFailed;
      writeState();
      return Object.assign({}, state);
    }
    fs.mkdirSync(moduleIncoming, { recursive: true });
    const zipPath = path.join(moduleIncoming, `${entry.id}-${entry.available}.zip`);
    const relative = path.relative(moduleIncoming, path.resolve(zipPath));
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      state.moduleMessage = MESSAGES.moduleFailed;
      writeState();
      return Object.assign({}, state);
    }
    const partial = `${zipPath}.partial`;
    try {
      assertAllowedUrl(entry.asset.url, extraHosts);
      assertAllowedUrl(entry.checksumAsset.url, extraHosts);
      const { repositoryPinned } = require("./feed");
      if (!repositoryPinned(entry.asset.url, repository, extraHosts) || !repositoryPinned(entry.checksumAsset.url, repository, extraHosts)) {
        const rejected = new Error(MESSAGES.repoRejected);
        rejected.code = "host-rejected";
        throw rejected;
      }
      const fileResponse = await fetchFeed(entry.asset.url);
      if (!fileResponse.ok) throw new Error(`HTTP ${fileResponse.status}`);
      await writeResponse(fileResponse, partial);
      const checksumResponse = await fetchFeed(entry.checksumAsset.url);
      if (!checksumResponse.ok) throw new Error(`HTTP ${checksumResponse.status}`);
      const expected = readSha256Asset(await checksumResponse.text());
      const actual = sha256File(partial);
      if (!expected || actual !== expected) {
        fs.unlinkSync(partial);
        state.moduleMessage = MESSAGES.hashMismatch;
        state.preparedModule = null;
        writeState();
        return Object.assign({}, state);
      }
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      fs.renameSync(partial, zipPath);
      state.preparedModule = {
        id: entry.id,
        version: entry.available,
        zipPath,
        expectedSha256: actual,
        kind: "module"
      };
      state.moduleMessage = MESSAGES.moduleReady;
      writeState();
      return Object.assign({}, state);
    } catch (error) {
      if (fs.existsSync(partial)) fs.unlinkSync(partial);
      state.moduleMessage = error.code === "host-rejected" ? MESSAGES.hostRejected : MESSAGES.moduleFailed;
      state.preparedModule = null;
      writeState();
      return Object.assign({}, state);
    }
  }

  return {
    get channel() {
      return channel;
    },
    reconcile,
    check,
    download,
    downloadModule,
    abort: abortDownload,
    installPlan,
    status() {
      return Object.assign({}, state);
    }
  };
}

module.exports = { createUpdateService, sha256File };
