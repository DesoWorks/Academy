"use strict";

const fs = require("node:fs");
const path = require("node:path");

const APP_ID = "dev.desoworks.academy";
const DATA_DIR_NAME = path.join("DesoWorks", "Academy");

function readChannelFile(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && parsed.channel === "stable" ? "stable" : "dev";
  } catch (error) {
    return "dev";
  }
}

function resolveChannel(env = process.env, channelFile = path.join(__dirname, "..", "channel.json")) {
  const fileChannel = readChannelFile(channelFile);
  const requested = env && env.ACADEMY_CHANNEL;
  if (requested === "dev") return "dev";
  if (requested === "stable" && fileChannel === "stable") return "stable";
  return fileChannel;
}

// Die Shell-Seiten liegen im Renderer. Gepackt und ungepackt ist der Inhaltsstamm derselbe.
// Der Parent-Ordner und fremde Lernplattformen sind niemals ein Inhaltsstamm.
function contentRootFrom() {
  return path.join(__dirname, "renderer");
}

function dataDirFrom(app, env = process.env) {
  if (app && app.isPackaged !== true && env.ACADEMY_DATA_DIR) return path.resolve(env.ACADEMY_DATA_DIR);
  return path.join(app.getPath("appData"), DATA_DIR_NAME);
}

module.exports = {
  APP_ID,
  DATA_DIR_NAME,
  resolveChannel,
  contentRootFrom,
  dataDirFrom,
  readChannelFile
};
