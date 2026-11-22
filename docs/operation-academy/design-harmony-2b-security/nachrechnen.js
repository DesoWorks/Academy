"use strict";
// Nur lesend. Rechnet Nutzlastindex, Git-Blobs (Staging) und Arbeitskopie unabhängig nach.
// Aufruf aus dem Academy-Wurzelverzeichnis: node docs/operation-academy/design-harmony-2b-security/nachrechnen.js
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const MOD = "modules/it-systemintegration";
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
const git = (...a) => execFileSync("git", a, { maxBuffer: 256 * 1024 * 1024 });

const work = JSON.parse(fs.readFileSync(path.join(MOD, "content/payload-index.json"), "utf8"));
const head = JSON.parse(git("show", "HEAD:" + MOD + "/content/payload-index.json").toString("utf8"));
const headMap = new Map(head.files.map((e) => [e.path, e]));
const out = { eintraegeArbeitskopie: work.files.length, eintraegeHEAD: head.files.length, kopffelderGleich: true };

for (const k of Object.keys(head)) if (k !== "files" && JSON.stringify(head[k]) !== JSON.stringify(work[k])) out.kopffelderGleich = false;
out.pfadmengeGleich = work.files.length === head.files.length && work.files.every((e) => headMap.has(e.path));

const geaendert = [], arbeitskopieAbweichung = [], blobAbweichung = [];
for (const e of work.files) {
  const h = headMap.get(e.path);
  if (h && (h.sha256 !== e.sha256 || h.size !== e.size)) geaendert.push(e.path);
  const wb = fs.readFileSync(path.join(MOD, e.path));
  if (sha(wb) !== e.sha256 || wb.length !== e.size) arbeitskopieAbweichung.push(e.path);
  let blob = null;
  try { blob = git("show", ":" + MOD + "/" + e.path); } catch (x) { blob = null; }
  if (!blob || sha(blob) !== e.sha256 || blob.length !== e.size) blobAbweichung.push(e.path);
}
out.geaenderteEintraege = geaendert;
out.arbeitskopieAbweichungVomIndex = arbeitskopieAbweichung;
out.stagingBlobAbweichungVomIndex = blobAbweichung;

const modGeaendert = git("diff", "--name-only", "HEAD", "--", MOD + "/web").toString("utf8").split(/\r?\n/).filter(Boolean);
out.webDateienGeaendertGegenHEAD = modGeaendert;
console.log(JSON.stringify(out, null, 2));
