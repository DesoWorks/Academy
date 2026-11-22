"use strict";

// Phase N: Kanalmodell der Academy-Updates. Reine Logik ohne Netzwerk und ohne Dateizugriff.
// Vertrag: docs/operation-academy/CHANNEL-ARCHITECTURE-N.md

const { compare, isSafeVersion } = require("./semver");

const NUM = "(?:0|[1-9]\\d*)";
const CORE = `${NUM}\\.${NUM}\\.${NUM}`;
const COUNTER = "[1-9]\\d*";
const MODULE_ID = "[a-z0-9]+(?:[.-][a-z0-9]+)+";
const TAG_PATTERN = new RegExp(`^(dev|beta|stable)\\/(?:modules\\/(${MODULE_ID})\\/)?v(${CORE}(?:-(?:dev|beta)\\.${COUNTER})?)$`);

const CHANNELS = Object.freeze({
  dev: Object.freeze({
    id: "dev",
    label: "DEV",
    title: "DEV \u2013 Aktuelle Entwicklung",
    branch: "dev",
    prerelease: true,
    rank: 0,
    versionPattern: new RegExp(`^${CORE}-dev\\.${COUNTER}$`)
  }),
  beta: Object.freeze({
    id: "beta",
    label: "BETA",
    title: "BETA \u2013 Vorabversionen",
    branch: "beta",
    prerelease: true,
    rank: 1,
    versionPattern: new RegExp(`^${CORE}-beta\\.${COUNTER}$`)
  }),
  stable: Object.freeze({
    id: "stable",
    label: "STABLE",
    title: "STABLE \u2013 Freigegebene Versionen",
    branch: "main",
    prerelease: false,
    rank: 2,
    versionPattern: new RegExp(`^${CORE}$`)
  })
});

function isChannel(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(CHANNELS, value);
}

// Interne, ausfuehrliche Tagpruefung mit Ablehnungsgrund.
function inspectTag(tag) {
  if (typeof tag !== "string" || tag.length === 0 || tag.length > 200) return { valid: false, reason: "tag-invalid" };
  const match = TAG_PATTERN.exec(tag);
  if (!match) return { valid: false, reason: "tag-invalid" };
  const channel = match[1];
  const moduleId = match[2] || null;
  const version = match[3];
  if (!CHANNELS[channel].versionPattern.test(version)) return { valid: false, reason: "version-channel-mismatch" };
  return { valid: true, channel, moduleId, kind: moduleId ? "module" : "core", version };
}

// Zulaessig sind nur Kanaltags: dev/v0.4.0-dev.12, beta/v0.4.0-beta.2, stable/v0.4.0 und
// Modultags wie beta/modules/desoworks.it-systemintegration/v1.0.2-beta.1.
// Ungueltig (null): ein blosses v0.4.0 und jeder Tag, dessen Version nicht zum Kanal passt.
function parseReleaseTag(tag) {
  const info = inspectTag(tag);
  if (!info.valid) return null;
  const result = { channel: info.channel, version: info.version };
  if (info.moduleId) result.module = info.moduleId;
  return result;
}

function tagOf(release) {
  if (!release || typeof release !== "object") return "";
  return typeof release.tag_name === "string" ? release.tag_name : (typeof release.tag === "string" ? release.tag : "");
}

function manifestPackage(manifest) {
  const pkg = manifest && manifest.package;
  if (typeof pkg === "string") return { kind: pkg, moduleId: manifest.moduleId || null };
  if (pkg && typeof pkg === "object") return { kind: pkg.kind, moduleId: pkg.moduleId || manifest.moduleId || null };
  return { kind: undefined, moduleId: null };
}

function defaultPlatform() {
  return `${process.platform}-${process.arch}`;
}

// Streng: Tag, Manifest, Entwurf, Flag, Version, Paketart und Plattform muessen zusammenpassen.
// Liefert { reason } bei Ablehnung, sonst { reason: null, parsed }.
function judge(release, context) {
  if (!release || typeof release !== "object") return { reason: "release-invalid" };
  if (release.draft !== false) return { reason: "draft" };
  const parsed = inspectTag(tagOf(release));
  if (!parsed.valid) return { reason: parsed.reason };
  if (parsed.channel !== context.channel) return { reason: "wrong-channel" };
  if (parsed.kind !== context.kind || (parsed.kind === "module" && parsed.moduleId !== context.moduleId)) {
    return { reason: "other-package" };
  }
  const manifest = release.manifest;
  if (!manifest || typeof manifest !== "object") return { reason: "manifest-missing" };
  if (manifest.product !== "desoworks-academy") return { reason: "manifest-invalid" };
  if (manifest.channel !== parsed.channel) return { reason: "channel-conflict" };
  if (release.prerelease !== CHANNELS[parsed.channel].prerelease) return { reason: "flag-conflict" };
  if (manifest.version !== parsed.version) return { reason: "version-conflict" };
  const pkg = manifestPackage(manifest);
  if (pkg.kind !== parsed.kind || (parsed.kind === "module" && pkg.moduleId !== parsed.moduleId)) {
    return { reason: "package-conflict" };
  }
  const platformOk = manifest.platform === context.platform || (parsed.kind === "module" && manifest.platform === "any");
  if (!platformOk) return { reason: "wrong-platform" };
  return { reason: null, parsed };
}

// Reine Tag-Auswahl: selectCandidate(releases, { channel, currentVersion, allowDowngrade, module }).
// Prueft nur Entwurf, Tag und Kanal und liefert das Release mit der hoechsten Version oder null.
// Sie prueft KEIN Manifest und ist daher nie die Freigabe zum Installieren; dafuer gilt die strenge Form.
function selectByTag(releases, options) {
  const opts = options || {};
  if (!isChannel(opts.channel) || !Array.isArray(releases)) return null;
  const hasCurrent = isSafeVersion(opts.currentVersion);
  const wantedModule = typeof opts.module === "string" && opts.module ? opts.module : null;
  let best = null;
  for (const release of releases) {
    if (!release || typeof release !== "object" || release.draft !== false) continue;
    const info = inspectTag(tagOf(release));
    if (!info.valid || info.channel !== opts.channel) continue;
    if ((info.moduleId || null) !== wantedModule) continue;
    if (hasCurrent) {
      const order = compare(info.version, opts.currentVersion);
      if (order === 0) continue;
      if (order < 0 && opts.allowDowngrade !== true) continue;
    }
    if (!best || compare(info.version, best.version) > 0) {
      best = Object.assign({}, release, { version: info.version, channel: info.channel });
    }
  }
  return best;
}

// Strenge Auswahl: selectCandidate({ channel, installedVersion, releases, allowDowngrade, platform, kind, moduleId }).
// Nie "neuestes Release", nie das Prerelease-Flag allein, nie die Reihenfolge der Liste.
function selectStrict(options) {
  const channel = options.channel;
  const rejected = [];
  const outcome = (action, extra) => Object.assign({
    action,
    channel: isChannel(channel) ? channel : null,
    installedVersion: options.installedVersion || null,
    release: null,
    version: null,
    downgrade: false,
    rejected
  }, extra || {});

  if (!isChannel(channel)) return outcome("blocked", { reason: "unknown-channel" });
  if (!isSafeVersion(options.installedVersion)) return outcome("blocked", { reason: "installed-invalid" });
  const kind = options.kind === "module" ? "module" : "core";
  if (kind === "module" && (typeof options.moduleId !== "string" || !options.moduleId)) {
    return outcome("blocked", { reason: "module-id-missing" });
  }
  const context = {
    channel,
    kind,
    moduleId: kind === "module" ? options.moduleId : null,
    platform: options.platform || defaultPlatform()
  };
  const allowDowngrade = options.allowDowngrade === true;

  const valid = [];
  for (const release of Array.isArray(options.releases) ? options.releases : []) {
    const verdict = judge(release, context);
    if (verdict.reason) {
      const tag = tagOf(release);
      rejected.push({ tag: tag || null, reason: verdict.reason });
    } else {
      valid.push({ release, version: verdict.parsed.version });
    }
  }

  // Widerspruechliche Pakete zur selben Identitaet blockieren diese Version.
  const byVersion = new Map();
  for (const entry of valid) {
    const list = byVersion.get(entry.version) || [];
    list.push(entry);
    byVersion.set(entry.version, list);
  }
  const usable = [];
  for (const [, list] of byVersion) {
    const hashes = new Set(list.map((entry) => String(entry.release.manifest.sha256 || "")));
    if (hashes.size > 1) {
      for (const entry of list) rejected.push({ tag: tagOf(entry.release), reason: "duplicate-conflict" });
    } else {
      usable.push(list[0]);
    }
  }

  let best = null;
  for (const entry of usable) {
    const order = compare(entry.version, options.installedVersion);
    if (order === 0) continue;
    if (order < 0 && !allowDowngrade) continue;
    if (!best || compare(entry.version, best.version) > 0) best = entry;
  }
  if (!best) return outcome("current", { reason: "no-candidate" });
  return outcome("available", {
    release: best.release,
    version: best.version,
    downgrade: compare(best.version, options.installedVersion) < 0
  });
}

// Zwei Aufrufformen:
//   selectCandidate({ channel, installedVersion, releases, allowDowngrade, ... })  streng, mit Manifestpruefung
//   selectCandidate(releases, { channel, currentVersion, allowDowngrade })         nur Tag-Auswahl, Release oder null
function selectCandidate(first, second) {
  if (Array.isArray(first)) return selectByTag(first, second);
  return selectStrict(first || {});
}

// Folgen eines Wechsels der Kanalwahl. Der Wechsel aendert nur die Quelle und installiert nichts.
// Optional: aktuelle Version und Zielversion, um einen moeglichen Downgrade zu erkennen.
function switchConsequences(fromChannel, toChannel, currentVersion, targetVersion) {
  if (!isChannel(fromChannel) || !isChannel(toChannel)) {
    return {
      valid: false,
      allowed: false,
      reason: "unknown-channel",
      from: fromChannel,
      to: toChannel,
      optIn: false,
      requiresOptIn: false,
      downgrade: false,
      messages: ["Dieser Updatekanal ist nicht bekannt. Die Auswahl bleibt unver\u00e4ndert."]
    };
  }
  const from = CHANNELS[fromChannel];
  const to = CHANNELS[toChannel];
  const changes = from.id !== to.id;
  const direction = !changes ? "same" : (to.rank > from.rank ? "up" : "down");
  const downgrade = isSafeVersion(currentVersion) && isSafeVersion(targetVersion)
    ? compare(targetVersion, currentVersion) < 0
    : false;
  const messages = [];
  if (!changes) {
    messages.push("Dieser Kanal ist bereits gew\u00e4hlt.");
  } else {
    messages.push("Der Wechsel \u00e4ndert nur die Updatequelle. Es wird nichts installiert und keine Moduldatei ver\u00e4ndert.");
    messages.push("Ein bereits geladenes oder vorbereitetes Paket des bisherigen Kanals wird ung\u00fcltig.");
    messages.push("Eine \u00e4ltere Zielversion ist ein Downgrade und braucht eine eigene Best\u00e4tigung f\u00fcr genau dieses Paket.");
  }
  if (direction === "down") {
    messages.push(`${to.label} liefert Vorabversionen. Sie k\u00f6nnen Fehler enthalten. Der Wechsel braucht eine ausdr\u00fcckliche Best\u00e4tigung.`);
  }
  if (downgrade) {
    messages.push("Die Zielversion ist \u00e4lter als die installierte Version. Das ist ein Downgrade.");
  }
  const optIn = direction === "down";
  return {
    valid: true,
    allowed: true,
    from: from.id,
    to: to.id,
    changes,
    direction,
    optIn,
    requiresOptIn: optIn,
    downgrade,
    installsNothing: true,
    touchesModules: false,
    invalidatesPendingUpdate: changes,
    downgradeNeedsOwnConfirmation: true,
    messages
  };
}

module.exports = { CHANNELS, parseReleaseTag, selectCandidate, switchConsequences };
