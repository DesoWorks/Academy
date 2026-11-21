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
  if (parsed.protocol === "http:" && local && hosts.has(parsed.hostname)) return parsed;
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
      assets: (release.assets || []).map((asset) => ({
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size || 0
      }))
    }));
}

function selectRelease(releases, options) {
  const channel = options.channel;
  const installed = options.installed;
  const repository = options.repository || PINNED_REPOSITORY;
  const extraHosts = options.extraHosts || [];
  const { isSafeVersion } = require("./semver");
  const ranked = (releases || [])
    .filter((release) => isSafeVersion(release.version))
    .filter((release) => release && release.version)
    .filter((release) => channel === "stable" ? !release.prerelease : true)
    .slice()
    .sort((a, b) => compare(b.version, a.version));
  const newer = ranked.find((release) => compare(release.version, installed) > 0);
  if (channel !== "stable") {
    return {
      action: "blocked",
      message: MESSAGES.devChannel,
      installed,
      available: newer ? newer.version : null,
      notes: newer ? newer.notes : ""
    };
  }
  if (!newer) {
    return { action: "current", message: MESSAGES.upToDate, installed, available: null, notes: "" };
  }
  const paired = pairAssets(newer.assets);
  if (!paired || !paired.exe || !safeAssetName(paired.exe.name) || !paired.exe.url) {
    return {
      action: "rejected",
      message: MESSAGES.metadataInvalid,
      installed,
      available: newer.version,
      notes: newer.notes
    };
  }
  if (!repositoryPinned(paired.exe.url, repository, extraHosts) || (paired.checksum && !repositoryPinned(paired.checksum.url, repository, extraHosts))) {
    return {
      action: "rejected",
      message: MESSAGES.repoRejected,
      installed,
      available: newer.version,
      notes: newer.notes
    };
  }
  if (!paired.checksum) {
    return {
      action: "rejected",
      message: MESSAGES.hashMissing,
      installed,
      available: newer.version,
      notes: newer.notes
    };
  }
  return {
    action: "available",
    message: MESSAGES.available,
    installed,
    available: newer.version,
    notes: newer.notes,
    asset: paired.exe,
    checksumAsset: paired.checksum
  };
}

module.exports = {
  PINNED_REPOSITORY,
  DEFAULT_HOSTS,
  assertAllowedUrl,
  repositoryPinned,
  readSha256Asset,
  pairAssets,
  fromGitHubReleases,
  selectRelease
};
