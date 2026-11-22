"use strict";

const path = require("node:path");

const DEV_FEED_PORT = 47321;
const DEV_FEED_HOST = "127.0.0.1";
const DEV_FEED_URL = `http://${DEV_FEED_HOST}:${DEV_FEED_PORT}/dev/manifest.json`;
const DEV_FEED_HEADER = "x-academy-dev-key";
const DEV_FEED_DIR_NAME = path.join("DesoWorks", "AcademyDevFeed");

function devFeedDir(home = process.env.LOCALAPPDATA || "") {
  return path.join(home, DEV_FEED_DIR_NAME);
}

function devFeedKeyFile(dataDir) {
  return path.join(dataDir, "updates", "dev-feed.key");
}

function isLoopbackUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" && (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost");
  } catch (error) {
    return false;
  }
}

module.exports = {
  DEV_FEED_PORT,
  DEV_FEED_HOST,
  DEV_FEED_URL,
  DEV_FEED_HEADER,
  devFeedDir,
  devFeedKeyFile,
  isLoopbackUrl
};
