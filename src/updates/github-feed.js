"use strict";

// Phase N: feste GitHub-Quelle fuer Updates. Kein Fallback auf den Loopback-Feed,
// kein eingebautes Token. Ein Token kommt hoechstens vom Aufrufer (Nutzereinstellung)
// oder aus der Umgebungsvariable ACADEMY_UPDATE_TOKEN und wird nie protokolliert.

const { parseReleaseTag, selectCandidate } = require("./channels");

const SOURCE_URL = "https://api.github.com/repos/DesoWorks/Academy/releases";
const ASSET_PREFIX = "https://api.github.com/repos/DesoWorks/Academy/releases/assets/";
const MANIFEST_ASSET = "manifest.json";
const MANIFEST_SIGNATURE_ASSET = "manifest.json.sig";
const MANIFEST_MAX_BYTES = 256 * 1024;

// Der Abruf wird beim Laden festgehalten. Spaetere Aenderungen an global.fetch wirken nicht mehr.
const defaultFetch = typeof global.fetch === "function" ? global.fetch : null;

function resolveToken(explicit, env) {
  const source = env || process.env;
  const given = typeof explicit === "string" && explicit.trim() ? explicit : (source && source.ACADEMY_UPDATE_TOKEN);
  const token = String(given || "").trim();
  if (!token || token.length > 512) return "";
  // Nur Zeichen, die in keinem Header-Wert Zeilenumbrueche oder Trenner einschleusen.
  if (!/^[A-Za-z0-9_.=-]+$/.test(token)) return "";
  return token;
}

function buildHeaders(token, accept) {
  const headers = {
    Accept: accept || "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DesoWorks-Academy-Updater"
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function failure(state, errorCode, status) {
  return { ok: false, state, errorCode, status: status || 0, releases: [] };
}

function normalizeReleases(payload) {
  return (Array.isArray(payload) ? payload : [])
    .filter((release) => release && typeof release === "object")
    .map((release) => ({
      tag: String(release.tag_name || ""),
      draft: release.draft === true,
      prerelease: release.prerelease === true,
      commit: typeof release.target_commitish === "string" ? release.target_commitish.slice(0, 80) : "",
      publishedAt: typeof release.published_at === "string" ? release.published_at.slice(0, 40) : "",
      notes: typeof release.body === "string" ? release.body : "",
      assets: (Array.isArray(release.assets) ? release.assets : []).map((asset) => ({
        name: String((asset && asset.name) || ""),
        url: (asset && asset.browser_download_url) || "",
        apiUrl: (asset && asset.url) || "",
        size: Number(asset && asset.size) || 0
      })),
      manifest: null,
      manifestVerified: false
    }));
}

// Ruft die Releaseliste der festen Quelle ab. Gesperrt (401/403/404) und nicht erreichbar
// werden getrennt gemeldet. In beiden Faellen bleibt die Installation unveraendert.
async function fetchReleases(options) {
  const config = options || {};
  const fetchImpl = config.fetch || defaultFetch;
  if (typeof fetchImpl !== "function") return failure("unreachable", "no-fetch");
  const token = resolveToken(config.token, config.env);
  let response;
  try {
    response = await fetchImpl(SOURCE_URL, {
      headers: buildHeaders(token),
      signal: config.signal
    });
  } catch (error) {
    return failure("unreachable", "source-unreachable");
  }
  if (response.status === 401 || response.status === 403 || response.status === 404) {
    return failure("locked", "source-locked", response.status);
  }
  if (!response.ok) return failure("unreachable", `http-${response.status}`, response.status);
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    return failure("unreachable", "metadata-invalid", response.status);
  }
  if (!Array.isArray(payload)) return failure("unreachable", "metadata-invalid", response.status);
  return { ok: true, state: "ready", errorCode: null, status: response.status, releases: normalizeReleases(payload) };
}

// Liest manifest.json eines Releases ueber die API-Asset-Adresse der festen Quelle.
// Die Signatur (manifest.json.sig) wird hier NICHT geprueft: manifestVerified bleibt false.
async function fetchManifest(release, options) {
  const config = options || {};
  const fetchImpl = config.fetch || defaultFetch;
  const asset = (release.assets || []).find((item) => item.name === MANIFEST_ASSET);
  if (!asset || typeof asset.apiUrl !== "string" || !asset.apiUrl.startsWith(ASSET_PREFIX)) return null;
  if (asset.size > MANIFEST_MAX_BYTES) return null;
  if (typeof fetchImpl !== "function") return null;
  try {
    const response = await fetchImpl(asset.apiUrl, {
      headers: buildHeaders(resolveToken(config.token, config.env), "application/octet-stream"),
      signal: config.signal
    });
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > MANIFEST_MAX_BYTES) return null;
    const manifest = JSON.parse(text);
    return manifest && typeof manifest === "object" && !Array.isArray(manifest) ? manifest : null;
  } catch (error) {
    return null;
  }
}

// Haengt Manifeste nur an Releases, deren Tag zum gewaehlten Kanal gehoert (spart Abrufe).
async function attachManifests(releases, channel, options) {
  for (const release of releases) {
    if (release.draft) continue;
    const parsed = parseReleaseTag(release.tag);
    if (!parsed || parsed.channel !== channel) continue;
    release.manifest = await fetchManifest(release, options);
  }
  return releases;
}

// Liefert die Releases, die im gewaehlten Kanal ueberhaupt als Kandidat zaehlen:
// Tag-Kanal, Manifestfeld channel, Entwurf, Flag, Version und Plattform muessen passen.
// Ohne passendes Manifest bleibt die Liste leer. Gesperrte oder unerreichbare Quelle liefert
// ebenfalls eine leere Liste; den Grund nennt fetchReleases.
async function fetchCandidates(options) {
  const config = options || {};
  const result = await fetchReleases(config);
  if (!result.ok) return [];
  await attachManifests(result.releases, config.channel, config);
  return result.releases.filter((release) => {
    const verdict = selectCandidate({
      channel: config.channel,
      installedVersion: "0.0.0",
      releases: [release],
      allowDowngrade: true,
      platform: config.platform
    });
    return verdict.action === "available";
  });
}

module.exports = {
  SOURCE_URL,
  MANIFEST_ASSET,
  MANIFEST_SIGNATURE_ASSET,
  resolveToken,
  buildHeaders,
  normalizeReleases,
  fetchReleases,
  fetchManifest,
  attachManifests,
  fetchCandidates
};
