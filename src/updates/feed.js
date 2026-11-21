"use strict";

const { compare } = require("./semver");
const { MESSAGES } = require("./messages");

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
  if (!paired || !paired.checksum) {
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
  DEFAULT_HOSTS,
  assertAllowedUrl,
  readSha256Asset,
  pairAssets,
  fromGitHubReleases,
  selectRelease
};
