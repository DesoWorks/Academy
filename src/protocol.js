"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Readable } = require("node:stream");
const { protocol } = require("electron");
const { CSP, resolveAcademyPath, mimeFor } = require("./protocol-path");

const BRIDGE = '<script src="/__desktop/bridge.js"></script>';

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
    if (url.hostname !== "app") return new Response("Unbekannter Host", { status: 404 });
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
      const file = resolveAcademyPath(contentRoot, pathname === "/" ? "/index.html" : pathname);
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

module.exports = { declareScheme, registerProtocol, injectBridge };
