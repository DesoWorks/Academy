"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { DEV_FEED_HOST, DEV_FEED_PORT, DEV_FEED_HEADER, devFeedDir, devFeedKeyFile } = require("../src/updates/dev-feed");

const feedDir = path.resolve(process.argv[2] || devFeedDir());
const dataDir = process.argv[3] || path.join(process.env.APPDATA || "", "DesoWorks", "Academy");
const keyFile = devFeedKeyFile(dataDir);

function readKey() {
  try {
    return fs.readFileSync(keyFile, "utf8").trim();
  } catch (error) {
    return "";
  }
}

const server = http.createServer((request, response) => {
  const key = readKey();
  const presented = String(request.headers[DEV_FEED_HEADER] || "");
  if (!key || presented !== key) {
    response.writeHead(401, { "content-type": "text/plain; charset=utf-8" });
    response.end("dev-feed-unauthorized");
    return;
  }
  const url = new URL(request.url, `http://${DEV_FEED_HOST}:${DEV_FEED_PORT}`);
  if (request.method !== "GET" || !url.pathname.startsWith("/dev/")) {
    response.writeHead(404);
    response.end("nicht gefunden");
    return;
  }
  const name = decodeURIComponent(url.pathname.slice("/dev/".length));
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\") || name.includes("\0")) {
    response.writeHead(400);
    response.end("ungueltiger pfad");
    return;
  }
  const file = path.join(feedDir, name);
  if (path.relative(feedDir, file).startsWith("..") || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end("nicht gefunden");
    return;
  }
  response.writeHead(200, {
    "content-type": name.endsWith(".json") ? "application/json; charset=utf-8" : "application/octet-stream",
    "content-length": fs.statSync(file).size,
    "cache-control": "no-store"
  });
  fs.createReadStream(file).pipe(response);
});

server.listen(DEV_FEED_PORT, DEV_FEED_HOST, () => {
  process.stdout.write(`DEV-Feed ${DEV_FEED_HOST}:${DEV_FEED_PORT} ${feedDir}\n`);
});
