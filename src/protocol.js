"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { protocol } = require("electron");
const { CSP, MODULE_CSP, resolveAcademyPath, mimeFor } = require("./protocol-path");

const BRIDGE = '<script src="/__desktop/bridge.js"></script>';
const HOST_LINKS = '<link rel="stylesheet" href="/__academy/design-tokens.css"><link rel="stylesheet" href="/__academy/host.css">';
const HOST_ASSETS = {
  "/__academy/design-tokens.css": "design-tokens.css",
  "/__academy/host.css": "host.css"
};

function declareScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "academy",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true,
        codeCache: true
      }
    }
  ]);
}

function injectBridge(html) {
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${BRIDGE}`);
  }
  return BRIDGE + html;
}

function injectHost(html) {
  const source = String(html);
  if (/<\/head>/i.test(source)) {
    return source.replace(/<\/head>/i, `${HOST_LINKS}</head>`);
  }
  return HOST_LINKS + source;
}

function serveHostAsset(options, url) {
  const name = HOST_ASSETS[url.pathname];
  if (!name) return null;
  const root = options.desktopRoot;
  if (!root) return new Response("Nicht gefunden", { status: 404 });
  const resolved = path.resolve(root, name);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    return new Response("Anfrage abgelehnt", { status: 403 });
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return new Response("Nicht gefunden", { status: 404 });
  }
  return new Response(fs.readFileSync(resolved), {
    headers: {
      "content-type": "text/css; charset=utf-8",
      "content-security-policy": MODULE_CSP,
      "x-content-type-options": "nosniff",
      "cache-control": "no-store"
    }
  });
}

function serveModule(options, url) {
  const hostAsset = serveHostAsset(options, url);
  if (hostAsset) return hostAsset;
  const resolve = options.resolveModuleFile;
  if (typeof resolve !== "function") return new Response("Unbekannter Host", { status: 404 });
  const id = decodeURIComponent(url.hostname);
  const file = resolve(id, url.pathname);
  if (!file) return new Response("Nicht gefunden", { status: 404 });
  const headers = {
    "content-type": mimeFor(file),
    "content-security-policy": MODULE_CSP,
    "x-content-type-options": "nosniff",
    "cache-control": "no-store"
  };
  if (path.extname(file).toLowerCase() === ".html") {
    return new Response(injectHost(fs.readFileSync(file, "utf8")), { headers });
  }
  return new Response(Readable.toWeb(fs.createReadStream(file)), { headers });
}

function registerProtocol(options) {
  const contentRoot = options.contentRoot;
  const desktopRoot = options.desktopRoot;
  protocol.handle("academy", (request) => {
    let url;
    try {
      url = new URL(request.url);
    } catch (error) {
      return new Response("Ungültige Adresse", { status: 400 });
    }
    if (url.hostname !== "app") return serveModule(options, url);
    const pathname = url.pathname;
    try {
      if (pathname === "/__desktop/bridge.js" || pathname.startsWith("/__desktop/")) {
        const file = resolveAcademyPath(desktopRoot, pathname.replace(/^\/__desktop\//, ""));
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          return new Response("Nicht gefunden", { status: 404 });
        }
        return new Response(fs.readFileSync(file), {
          headers: {
            "content-type": mimeFor(file),
            "content-security-policy": CSP,
            "x-content-type-options": "nosniff"
          }
        });
      }
      const relative = pathname.replace(/^\/+/, "");
      if (/^(?:\.git|desktop|node_modules)(?:\/|$)/i.test(relative)) {
        return new Response("Nicht verfügbar", { status: 403 });
      }
      const file = resolveAcademyPath(contentRoot, pathname === "/" ? "/home.html" : pathname);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        return new Response("Nicht gefunden", { status: 404 });
      }
      const headers = {
        "content-type": mimeFor(file),
        "content-security-policy": CSP,
        "x-content-type-options": "nosniff"
      };
      if (path.extname(file).toLowerCase() === ".html") {
        const html = injectBridge(fs.readFileSync(file, "utf8"));
        return new Response(html, { headers });
      }
      return new Response(Readable.toWeb(fs.createReadStream(file)), { headers });
    } catch (error) {
      const status = error.code === "traversal" || error.code === "bad-path" ? 403 : 500;
      return new Response("Anfrage abgelehnt", { status });
    }
  });
}

module.exports = { declareScheme, registerProtocol, injectBridge, injectHost };
