"use strict";

const path = require("node:path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json"
};

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-src academy:",
  "frame-ancestors 'none'",
  "form-action 'none'"
].join("; ");

const MODULE_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "frame-ancestors academy://app",
  "form-action 'self'"
].join("; ");

function resolveAcademyPath(root, requestPath) {
  const base = path.resolve(root);
  let decoded;
  try {
    decoded = decodeURIComponent(String(requestPath || "/").split("?")[0]);
  } catch (error) {
    const failure = new Error("Ungültiger Pfad.");
    failure.code = "bad-path";
    throw failure;
  }
  if (decoded.includes("\0")) {
    const failure = new Error("Ungültiger Pfad.");
    failure.code = "bad-path";
    throw failure;
  }
  const stripped = decoded.replace(/^\/+/, "");
  const full = path.resolve(base, stripped);
  const relative = path.relative(base, full);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    const failure = new Error("Zugriff außerhalb der Plattform ist gesperrt.");
    failure.code = "traversal";
    throw failure;
  }
  return full;
}

function mimeFor(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

module.exports = { CSP, MODULE_CSP, MIME, resolveAcademyPath, mimeFor };
