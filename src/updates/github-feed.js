"use strict";

// Phase N/N.1: feste, oeffentliche GitHub-Quelle fuer Updates. Kein Fallback auf den Loopback-Feed,
// kein eingebautes Token. Die Releaseliste und alle Dateien sind oeffentlich lesbar; ein Token ist nie
// Pflicht. Ein optionales Token (Aufrufer oder ACADEMY_UPDATE_TOKEN) geht nur an die Releaseliste der
// GitHub-API (hoeheres Ratenlimit), nie an Downloads, und wird nie protokolliert.
// Manifeste und Installationspaket kommen von browser_download_url (github.com/.../releases/download/...).
// Ein Manifest zaehlt nur nach erfolgreicher Ed25519-Pruefung von manifest.json.sig.

const { parseReleaseTag, selectCandidate } = require("./channels");
const { verifyManifest } = require("./manifest-sign");

const SOURCE_URL = "https://api.github.com/repos/DesoWorks/Academy/releases";
const DOWNLOAD_PREFIX = "https://github.com/DesoWorks/Academy/releases/download/";
const MANIFEST_ASSET = "manifest.json";
const MANIFEST_SIGNATURE_ASSET = "manifest.json.sig";
const MANIFEST_MAX_BYTES = 256 * 1024;
const SIGNATURE_MAX_BYTES = 1024;

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

// Ein Asset ist nur dann zulaessig, wenn browser_download_url exakt auf
// https://github.com/DesoWorks/Academy/releases/download/<Tag>/<Name> zeigt.
function isDownloadUrl(url, tag, name) {
  if (typeof url !== "string" || !url.startsWith(DOWNLOAD_PREFIX) || !tag || !name) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return false;
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parsed.username || parsed.password || parsed.search || parsed.hash) {
    return false;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch (error) {
    return false;
  }
  return pathname === `/DesoWorks/Academy/releases/download/${tag}/${name}`;
}

// Hosts, auf die GitHub Release-Downloads weiterleitet. Alles andere (auch http) wird abgewiesen.
const REDIRECT_HOSTS = new Set([
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "github-releases.githubusercontent.com"
]);

function isAllowedFinalUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (error) {
    return false;
  }
  return parsed.protocol === "https:" && REDIRECT_HOSTS.has(parsed.hostname) && !parsed.username && !parsed.password;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;

// Strenge Inhaltspruefung eines bereits signaturgeprueften Manifests gegen den Release-Tag.
// Liefert null (gueltig) oder den Ablehnungsgrund.
// Ohne strict (Feed-Ebene): Produkt, Kanal, Version, SHA-256 und Paketart.
// Mit strict (Installationspfad im Service): zusaetzlich releaseTag und ein sicherer Installername.
function validateManifest(manifest, tag, options) {
  const strict = !!(options && options.strict === true);
  const parsed = parseReleaseTag(tag);
  if (!parsed || parsed.module) return "tag-invalid";
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) return "manifest-invalid";
  if (manifest.product !== "desoworks-academy") return "manifest-invalid";
  if (manifest.channel !== parsed.channel) return "channel-conflict";
  if (manifest.version !== parsed.version) return "version-conflict";
  if (typeof manifest.sha256 !== "string" || !SHA256_PATTERN.test(manifest.sha256)) return "hash-invalid";
  const pkg = manifest.package;
  const kind = typeof pkg === "string" ? pkg : (pkg && typeof pkg === "object" ? pkg.kind : undefined);
  if (kind !== "core") return "package-conflict";
  if (strict) {
    if (manifest.releaseTag !== tag) return "tag-conflict";
    if (!pkg || typeof pkg !== "object" || typeof pkg.name !== "string" || !/^[^\\/\u0000]{1,175}\.exe$/i.test(pkg.name)) return "package-invalid";
  }
  return null;
}

function assetOf(release, name) {
  return (release.assets || []).find((item) => item.name === name) || null;
}

async function fetchAssetBytes(release, asset, maxBytes, config) {
  const fetchImpl = config.fetch || defaultFetch;
  if (!asset || !isDownloadUrl(asset.url, release.tag, asset.name)) return null;
  if (asset.size > maxBytes || typeof fetchImpl !== "function") return null;
  try {
    // Bewusst ohne Token: Downloads sind oeffentlich.
    const response = await fetchImpl(asset.url, {
      headers: buildHeaders("", "application/octet-stream"),
      signal: config.signal
    });
    if (!response.ok) return null;
    // Eine Weiterleitung weg von GitHub verwirft das Ergebnis.
    if (response.url && !isAllowedFinalUrl(response.url)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 0 && bytes.length <= maxBytes ? bytes : null;
  } catch (error) {
    return null;
  }
}

// Laedt manifest.json und manifest.json.sig (beide ueber browser_download_url) und prueft die Signatur
// ueber die exakten Bytes. Liefert { manifest, reason }: manifest ist nur bei gueltiger Signatur gesetzt.
async function fetchVerifiedManifest(release, options) {
  const config = options || {};
  const manifestAsset = assetOf(release, MANIFEST_ASSET);
  const signatureAsset = assetOf(release, MANIFEST_SIGNATURE_ASSET);
  if (!manifestAsset) return { manifest: null, reason: "manifest-missing" };
  if (!signatureAsset) return { manifest: null, reason: "signature-missing" };
  const raw = await fetchAssetBytes(release, manifestAsset, MANIFEST_MAX_BYTES, config);
  if (!raw) return { manifest: null, reason: "manifest-unreadable" };
  const sig = await fetchAssetBytes(release, signatureAsset, SIGNATURE_MAX_BYTES, config);
  if (!sig) return { manifest: null, reason: "signature-unreadable" };
  const verdict = verifyManifest(raw, sig.toString("utf8"), config.publicKey);
  if (!verdict || verdict.ok !== true) return { manifest: null, reason: (verdict && verdict.reason) || "verify-failed" };
  try {
    const manifest = JSON.parse(raw.toString("utf8"));
    const problem = validateManifest(manifest, release.tag);
    if (problem) return { manifest: null, reason: problem };
    return { manifest, reason: null, raw, signature: sig.toString("utf8").trim() };
  } catch (error) {
    return { manifest: null, reason: "manifest-invalid" };
  }
}

// Nur ein signaturgepruefte Manifest wird zurueckgegeben, sonst null.
async function fetchManifest(release, options) {
  return (await fetchVerifiedManifest(release, options)).manifest;
}

// Haengt Manifeste nur an Releases, deren Tag zum gewaehlten Kanal gehoert (spart Abrufe).
// manifestVerified wird nur nach erfolgreicher Signaturpruefung true. Sonst bleibt manifest null,
// und das Release faellt aus der Kandidatenliste (selectCandidate lehnt es als manifest-missing ab).
async function attachManifests(releases, channel, options) {
  for (const release of releases) {
    release.manifest = null;
    release.manifestVerified = false;
    if (release.draft) continue;
    const parsed = parseReleaseTag(release.tag);
    if (!parsed || parsed.channel !== channel) continue;
    const result = await fetchVerifiedManifest(release, options);
    release.manifest = result.manifest;
    release.manifestVerified = result.manifest !== null;
    release.manifestReason = result.reason;
    // Die geprueften Rohbytes bleiben erhalten, damit der Service sie vor Download und Installation erneut pruefen kann.
    release.manifestRaw = result.manifest !== null ? result.raw : null;
    release.manifestSignature = result.manifest !== null ? result.signature : null;
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
    if (release.manifestVerified !== true) return false;
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
  DOWNLOAD_PREFIX,
  MANIFEST_ASSET,
  MANIFEST_SIGNATURE_ASSET,
  isDownloadUrl,
  isAllowedFinalUrl,
  validateManifest,
  resolveToken,
  buildHeaders,
  normalizeReleases,
  fetchReleases,
  fetchManifest,
  fetchVerifiedManifest,
  attachManifests,
  fetchCandidates
};
