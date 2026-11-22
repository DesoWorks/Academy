"use strict";

const { compare } = require("./semver");
const { MESSAGES } = require("./messages");

const PINNED_REPOSITORY = "DesoWorks/Academy";

const DEFAULT_HOSTS = [
  "github.com",
  "api.github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "github-releases.githubusercontent.com"
];

function assertAllowedUrl(url, extraHosts) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    const failure = new Error(MESSAGES.hostRejected);
    failure.code = "host-rejected";
    throw failure;
  }
  const hosts = new Set(DEFAULT_HOSTS.concat(extraHosts || []));
  const local = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (parsed.protocol === "https:" && hosts.has(parsed.hostname)) return parsed;
  if (parsed.protocol === "http:" && local) return parsed;
  const failure = new Error(MESSAGES.hostRejected);
  failure.code = "host-rejected";
  throw failure;
}

function readSha256Asset(text) {
  const match = String(text || "").trim().match(/^[a-fA-F0-9]{64}/);
  return match ? match[0].toLowerCase() : "";
}

function pathParts(url) {
  const parsed = new URL(url);
  return { parsed, parts: parsed.pathname.split("/").filter(Boolean).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch (error) {
      return part;
    }
  }) };
}

function sameRepo(left, right) {
  return String(left || "").toLowerCase() === String(right || "").toLowerCase();
}

function repositoryPinned(url, repository, extraHosts) {
  const repo = repository || PINNED_REPOSITORY;
  const [owner, name] = repo.split("/");
  let parsed;
  let parts;
  try {
    const split = pathParts(url);
    parsed = split.parsed;
    parts = split.parts;
  } catch (error) {
    return false;
  }
  if (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") return true;
  const extras = new Set(extraHosts || []);
  if (extras.has(parsed.hostname) && parsed.hostname !== "github.com" && parsed.hostname !== "api.github.com") return true;
  if (parsed.hostname === "github.com") {
    return parts.length >= 4 && sameRepo(parts[0], owner) && sameRepo(parts[1], name) && parts[2] === "releases" && parts[3] === "download";
  }
  if (parsed.hostname === "api.github.com") {
    return parts.length >= 4 && parts[0] === "repos" && sameRepo(parts[1], owner) && sameRepo(parts[2], name) && parts[3] === "releases";
  }
  return false;
}

function safeAssetName(name) {
  return typeof name === "string" && name.length > 0 && name.length < 180 && !/[\\/\u0000]/.test(name);
}

function pairAssets(assets) {
  const list = assets || [];
  const exe = list.find((asset) => /\.exe$/i.test(asset.name) && !/\.sha256$/i.test(asset.name));
  if (!exe) return null;
  const checksum = list.find((asset) => asset.name === `${exe.name}.sha256`);
  return { exe, checksum: checksum || null };
}

function fromGitHubReleases(payload) {
  return (Array.isArray(payload) ? payload : [])
    .filter((release) => release && !release.draft)
    .map((release) => ({
      version: String(release.tag_name || "").replace(/^v/, ""),
      prerelease: Boolean(release.prerelease),
      notes: release.body || "",
      commit: release.target_commitish || "",
      publishedAt: release.published_at || "",
      assets: (release.assets || []).map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size || 0
      }))
    }));
}

function releaseMeta(release) {
  return {
    commit: typeof release.commit === "string" ? release.commit.slice(0, 80) : "",
    publishedAt: typeof release.publishedAt === "string" ? release.publishedAt.slice(0, 40) : "",
    prerelease: release.prerelease === true
  };
}

function acceptInstaller(release, installed, repository, extraHosts, message) {
  const paired = pairAssets(release.assets);
  if (!paired || !paired.exe || !safeAssetName(paired.exe.name) || !paired.exe.url) {
    return {
      action: "rejected",
      message: MESSAGES.metadataInvalid,
      installed,
      available: release.version,
      notes: release.notes || "",
      prerelease: release.prerelease === true
    };
  }
  if (!repositoryPinned(paired.exe.url, repository, extraHosts) || (paired.checksum && !repositoryPinned(paired.checksum.url, repository, extraHosts))) {
    return {
      action: "rejected",
      message: MESSAGES.repoRejected,
      installed,
      available: release.version,
      notes: release.notes || "",
      prerelease: release.prerelease === true
    };
  }
  if (!paired.checksum) {
    return {
      action: "rejected",
      message: MESSAGES.hashMissing,
      installed,
      available: release.version,
      notes: release.notes || "",
      prerelease: release.prerelease === true
    };
  }
  return Object.assign({
    action: "available",
    message,
    installed,
    available: release.version,
    notes: release.notes || "",
    size: paired.exe.size || 0,
    asset: paired.exe,
    checksumAsset: paired.checksum
  }, releaseMeta(release));
}

function selectRelease(releases, options) {
  const channel = options.channel;
  const installed = options.installed;
  const repository = options.repository || PINNED_REPOSITORY;
  const extraHosts = options.extraHosts || [];
  const { isSafeVersion } = require("./semver");
  const ranked = (releases || [])
    .filter((release) => release && isSafeVersion(release.version))
    .filter((release) => channel === "stable" ? release.prerelease !== true : true)
    .slice()
    .sort((a, b) => compare(b.version, a.version));
  if (channel !== "stable") {
    const newerPre = ranked.filter((release) => release.prerelease === true).find((release) => compare(release.version, installed) > 0);
    const newerStable = ranked.filter((release) => release.prerelease !== true).find((release) => compare(release.version, installed) > 0);
    if (!newerPre) {
      return {
        action: newerStable ? "blocked" : "current",
        message: newerStable ? MESSAGES.devChannel : MESSAGES.upToDate,
        installed,
        available: newerStable ? newerStable.version : null,
        notes: newerStable ? (newerStable.notes || "") : "",
        prerelease: false
      };
    }
    return acceptInstaller(newerPre, installed, repository, extraHosts, MESSAGES.devAvailable);
  }
  const newer = ranked.find((release) => compare(release.version, installed) > 0);
  if (!newer) {
    return { action: "current", message: MESSAGES.upToDate, installed, available: null, notes: "", prerelease: false };
  }
  return acceptInstaller(newer, installed, repository, extraHosts, MESSAGES.available);
}

function safeModuleId(id) {
  return typeof id === "string" && /^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(id) && id.length < 80;
}

function selectModuleUpdates(entries, installed, options) {
  const channel = options.channel === "stable" ? "stable" : "dev";
  const coreVersion = options.coreVersion || "0.0.0";
  const repository = options.repository || PINNED_REPOSITORY;
  const extraHosts = options.extraHosts || [];
  const { isSafeVersion } = require("./semver");
  const { satisfies } = require("../modules/spec");
  const list = Array.isArray(installed) ? installed : [];
  if (channel === "stable") return [];
  const updates = [];
  for (const entry of entries || []) {
    if (!entry || entry.prerelease !== true || !safeModuleId(entry.id) || !isSafeVersion(entry.version)) continue;
    const current = list.find((item) => item && item.id === entry.id);
    if (!current) continue;
    if (compare(entry.version, current.version) <= 0) continue;
    if (entry.core && !satisfies(coreVersion, entry.core)) {
      updates.push({
        id: entry.id,
        action: "rejected",
        message: "Das Modulpaket passt nicht zu dieser Core-Version. Es wird nicht installiert.",
        installed: current.version,
        available: entry.version,
        kind: "module"
      });
      continue;
    }
    const assets = entry.assets || [];
    const zip = assets.find((asset) => asset && /\.zip$/i.test(asset.name) && !/\.sha256$/i.test(asset.name));
    const checksum = zip ? assets.find((asset) => asset && asset.name === `${zip.name}.sha256`) : null;
    if (!zip || !safeAssetName(zip.name) || !zip.url || !checksum || !checksum.url) {
      updates.push({
        id: entry.id,
        action: "rejected",
        message: MESSAGES.hashMissing,
        installed: current.version,
        available: entry.version,
        kind: "module"
      });
      continue;
    }
    if (!repositoryPinned(zip.url, repository, extraHosts) || !repositoryPinned(checksum.url, repository, extraHosts)) {
      updates.push({
        id: entry.id,
        action: "rejected",
        message: MESSAGES.repoRejected,
        installed: current.version,
        available: entry.version,
        kind: "module"
      });
      continue;
    }
    updates.push({
      id: entry.id,
      action: "available",
      message: MESSAGES.moduleAvailable,
      installed: current.version,
      available: entry.version,
      notes: entry.notes || "",
      commit: typeof entry.commit === "string" ? entry.commit.slice(0, 80) : "",
      publishedAt: typeof entry.publishedAt === "string" ? entry.publishedAt.slice(0, 40) : "",
      size: zip.size || 0,
      asset: zip,
      checksumAsset: checksum,
      prerelease: true,
      kind: "module"
    });
  }
  return updates;
}

// Entscheidet, welche Feed-Adresse der Updatedienst bekommt. Ein gepackter Build ignoriert
// ACADEMY_UPDATE_FEED vollstaendig und benutzt nur den signierten GitHub-Weg (leere Adresse).
// Nur ein ungepackter Lauf darf die Variable fuer Tests nutzen. Ohne Electron aufrufbar.
function resolveFeedUrl(options) {
  const opts = options || {};
  if (opts.isPackaged) return "";
  const env = opts.env || {};
  const value = env.ACADEMY_UPDATE_FEED;
  return typeof value === "string" ? value.trim() : "";
}

module.exports = {
  PINNED_REPOSITORY,
  DEFAULT_HOSTS,
  resolveFeedUrl,
  assertAllowedUrl,
  repositoryPinned,
  readSha256Asset,
  pairAssets,
  fromGitHubReleases,
  selectRelease,
  selectModuleUpdates
};
