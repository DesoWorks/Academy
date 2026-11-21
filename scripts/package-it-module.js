"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const SOURCE = path.resolve("D:\\Desoworks\\Workspace\\IT-Ausbildung");
const DEST = path.resolve(__dirname, "..", "modules", "it-systemintegration");
const ALLOWED = new Set([".html", ".css", ".js", ".json", ".md", ".txt", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2"]);
const ROOT_FILES = ["index.html", "glossar.html"];
const ROOT_DIRS = ["js", "css", "module", "assets"];

function walk(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    const relative = prefix ? prefix + "/" + entry.name : entry.name;
    if (entry.isSymbolicLink()) throw new Error("Symlink wird nicht übernommen: " + relative);
    if (entry.isDirectory()) {
      walk(full, relative, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!ALLOWED.has(extension)) {
      out.skipped.push(relative);
      continue;
    }
    out.files.push({ full, relative: "web/" + relative.replace(/\\/g, "/") });
  }
}

function titleOf(file) {
  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title>([^<]+)<\/title>/i);
  return title ? title[1].replace(/\s+/g, " ").trim() : path.basename(file);
}

function main() {
  const sourceReal = fs.realpathSync(SOURCE);
  if (sourceReal.toLowerCase().startsWith(DEST.toLowerCase())) {
    throw new Error("Quelle liegt im Ziel. Abbruch.");
  }
  fs.rmSync(DEST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DEST, "content"), { recursive: true });
  fs.mkdirSync(path.join(DEST, "web"), { recursive: true });
  const found = { files: [], skipped: [] };
  for (const name of ROOT_FILES) {
    const full = path.join(SOURCE, name);
    found.files.push({ full, relative: "web/" + name });
  }
  for (const name of ROOT_DIRS) walk(path.join(SOURCE, name), name, found);
  const indexFiles = [];
  for (const file of found.files) {
    const target = path.join(DEST, file.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file.full, target);
    const body = fs.readFileSync(target);
    indexFiles.push({
      path: file.relative,
      sha256: crypto.createHash("sha256").update(body).digest("hex"),
      size: body.length
    });
  }
  indexFiles.sort((a, b) => a.path.localeCompare(b.path));
  const pages = indexFiles.filter((file) => file.path.endsWith(".html"));
  const sections = [{
    id: "it-seiten",
    title: "Vorhandene Lernseiten",
    lessons: [{
      id: "index",
      title: "Themenübersicht",
      objectives: ["Die vorhandene IT-Ausbildung über die Academy öffnen."],
      blocks: pages.map((file) => ({
        type: "text",
        id: file.path.slice("web/".length).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase(),
        text: file.path.slice("web/".length) + " — " + titleOf(path.join(DEST, file.path))
      }))
    }]
  }];
  const course = {
    offer: { id: "it-systemintegration", kind: "self-study", title: "IT-Systemintegration" },
    path: { id: "ausbildung", title: "Fachinformatiker für Systemintegration" },
    area: { id: "it", title: "IT-Ausbildung" },
    responsibility: "Die fachlichen Seiten stammen unverändert aus dem Projekt IT-Ausbildung. Die Academy ist nur der Rahmen.",
    tutorPolicy: { revealSolutions: false, level: "ausbildung" },
    sections,
    sources: [{ title: "DesoWorks/IT-Ausbildung", note: "Gelesen von feature/operation-academy-unified-platform, Commit b7c60e1. Das Ursprungsrepository wurde nicht verändert." }]
  };
  const coursePath = path.join(DEST, "content", "course.json");
  const indexPath = path.join(DEST, "content", "payload-index.json");
  fs.writeFileSync(coursePath, JSON.stringify(course, null, 2));
  fs.writeFileSync(indexPath, JSON.stringify({
    format: "desoworks.academy.payload-index",
    formatVersion: 1,
    sourceCommit: "b7c60e1ae4353b6872e9af73d5e188e129420657",
    files: indexFiles
  }, null, 2));
  const declared = ["content/course.json", "content/payload-index.json"];
  const declaredSize = declared.reduce((sum, file) => sum + fs.statSync(path.join(DEST, file)).size, 0);
  const manifest = {
    format: "desoworks.academy.module",
    formatVersion: 1,
    id: "desoworks.it-systemintegration",
    name: "IT-Systemintegration",
    description: "Die bestehende IT-Ausbildung als installierbares Lernmodul. Themenübersicht, Lernfelder, Labore und Werkzeuge bleiben erhalten.",
    publisher: { id: "publisher.desoworks", name: "DesoWorks" },
    version: "1.0.0",
    license: "UNLICENSED",
    language: "de",
    core: ">=0.3.0 <0.4.0",
    dependencies: [],
    permissions: ["content.read", "progress.write"],
    sizeBytes: declaredSize,
    subject: "IT-Systemintegration",
    audience: "Ausbildung",
    status: "private",
    review: { state: "private", signed: false },
    trust: "private",
    entry: "content/course.json",
    files: declared,
    runtime: { kind: "hosted-web", entry: "index.html", index: "content/payload-index.json" },
    optional: {
      objectives: ["Die vorhandene IT-Ausbildung in der Academy bearbeiten."],
      prerequisites: [],
      difficulty: "ausbildung",
      estimatedMinutes: 0,
      sources: ["DesoWorks/IT-Ausbildung@b7c60e1"],
      languages: ["de"]
    }
  };
  fs.writeFileSync(path.join(DEST, "academy-module.json"), JSON.stringify(manifest, null, 2));
  const payloadBytes = indexFiles.reduce((sum, file) => sum + file.size, 0);
  console.log(JSON.stringify({
    files: indexFiles.length,
    html: pages.length,
    declaredSize,
    payloadBytes,
    skipped: found.skipped
  }, null, 2));
}

main();
