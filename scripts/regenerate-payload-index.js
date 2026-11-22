"use strict";

// Bringt modules/it-systemintegration/content/payload-index.json mit den
// kanonischen Git-Blobs in Einklang, nicht mit der Windows-Arbeitskopie.
//
// Hintergrund (belegt in docs/operation-academy/CI-RECOVERY-N1-W3.md):
//  1. Der Index wurde aus einer CRLF-Arbeitskopie berechnet. Ein frischer
//     GitHub-Checkout liefert wegen .gitattributes (* text=auto eol=lf) LF-Bytes.
//     Der Installationspfad (src/modules/manager.js, readPayload) vergleicht
//     Größe und SHA-256 der Dateien auf dem Datenträger mit dem Index.
//     Textdateien: Der Index wird aus den LF-Blobs neu berechnet.
//  2. Der Commit 4a93e1a hatte "modules/** text eol=lf" und hat dadurch auch
//     PNG, ICO und JPG von CRLF zu LF umgeschrieben. Die Blobs dieser Binärdateien
//     sind beschädigt, der Index beschreibt dagegen die intakten Originale.
//     Binärdateien: Der Index-Eintrag bleibt unverändert. Weicht der Blob ab,
//     die Arbeitskopie stimmt aber mit dem Index überein, wird die Datei mit
//     --restage-binaries erneut erfasst, sodass der Blob wieder dem Original entspricht.
//
// Aufruf (aus dem Repository-Wurzelverzeichnis):
//   node scripts/regenerate-payload-index.js --check              nur prüfen, nichts ändern (Exit 1 bei Abweichung)
//   node scripts/regenerate-payload-index.js --restage-binaries   Index/Manifest schreiben und beschädigte Binärblobs neu stagen
//   node scripts/regenerate-payload-index.js --sync-worktree      zusätzlich CRLF-Arbeitskopien von Textdateien auf die
//                                                                  Blob-Bytes (LF) setzen, nur wenn der Unterschied ausschließlich CRLF ist
//
// Das Skript committet und pusht nie. Gestagt werden ausschließlich die beschädigten
// Binärdateien und nur mit --restage-binaries. Index und Manifest werden nur in der
// Arbeitskopie geschrieben.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const MODULE_DIR = "modules/it-systemintegration";
const INDEX_REL = MODULE_DIR + "/content/payload-index.json";
const MANIFEST_REL = MODULE_DIR + "/academy-module.json";

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const SYNC_WORKTREE = args.has("--sync-worktree");
const RESTAGE = args.has("--restage-binaries");
for (const arg of args) {
  if (arg !== "--check" && arg !== "--sync-worktree" && arg !== "--restage-binaries") {
    console.error("Unbekannte Option: " + arg);
    process.exit(2);
  }
}
if (CHECK_ONLY && (SYNC_WORKTREE || RESTAGE)) {
  console.error("--check darf nicht mit schreibenden Optionen kombiniert werden.");
  process.exit(2);
}

function git(root, gitArgs) {
  return execFileSync("git", gitArgs, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function abort(message) {
  console.error("ABBRUCH: " + message);
  console.error("Es wurde nichts geschrieben.");
  process.exit(1);
}

function main() {
  const root = git(path.resolve(__dirname, ".."), ["rev-parse", "--show-toplevel"]).toString("utf8").trim();

  // Blob-IDs und Textstatus der Git-Datenbank (i/ = Index), nicht der Arbeitskopie.
  const oids = new Map();
  for (const record of git(root, ["ls-files", "-s", "-z", "--", MODULE_DIR]).toString("utf8").split("\0")) {
    if (!record) continue;
    const match = /^(\d+) ([0-9a-f]{40,64}) (\d)\t([\s\S]+)$/.exec(record);
    if (match) oids.set(match[4], match[2]);
  }
  const eol = new Map();
  for (const record of git(root, ["ls-files", "--eol", "-z", "--", MODULE_DIR]).toString("utf8").split("\0")) {
    if (!record) continue;
    const match = /^i\/(\S+)\s+w\/(\S+)\s+attr\/(.*?)\s*\t([\s\S]+)$/.exec(record);
    if (match) eol.set(match[4], { index: match[1], work: match[2] });
  }
  if (!oids.has(INDEX_REL) || !oids.has(MANIFEST_REL)) abort("Index oder Manifest sind nicht in Git erfasst.");

  const blobCache = new Map();
  function blob(rel) {
    if (!oids.has(rel)) abort("Datei ist nicht in Git erfasst: " + rel);
    if (!blobCache.has(rel)) blobCache.set(rel, git(root, ["cat-file", "blob", oids.get(rel)]));
    return blobCache.get(rel);
  }

  const oldIndexBytes = blob(INDEX_REL);
  let oldIndex;
  try {
    oldIndex = JSON.parse(oldIndexBytes.toString("utf8"));
  } catch (error) {
    abort("Der bestehende Nutzlastindex im Blob ist kein gültiges JSON.");
  }
  if (!oldIndex || oldIndex.format !== "desoworks.academy.payload-index" || !Array.isArray(oldIndex.files)) {
    abort("Der bestehende Nutzlastindex hat nicht das erwartete Format.");
  }

  const problems = [];
  const files = [];
  const changed = [];
  const restage = [];
  let binaryCount = 0;
  let textCount = 0;
  let totalBytes = 0;
  for (const entry of oldIndex.files) {
    const rel = MODULE_DIR + "/" + entry.path;
    if (!oids.has(rel)) {
      problems.push("Im Index genannt, aber nicht in Git: " + entry.path);
      continue;
    }
    const kind = (eol.get(rel) || {}).index;
    const bytes = blob(rel);
    const next = { path: entry.path, sha256: sha256(bytes), size: bytes.length };
    if (kind === "-text") {
      // Binärdatei: Der Indexeintrag bleibt unverändert.
      binaryCount++;
      if (entry.sha256 !== next.sha256 || entry.size !== next.size) {
        // Blob weicht ab. Nur zulässig, wenn die Arbeitskopie das Original ist (= Index)
        // und Git beim erneuten Erfassen die Bytes nicht verändert.
        let work = null;
        try {
          work = fs.readFileSync(path.join(root, rel));
        } catch (error) {
          work = null;
        }
        if (!work || sha256(work) !== entry.sha256 || work.length !== entry.size) {
          problems.push("Binärdatei: Blob und Arbeitskopie weichen vom Index ab, keine sichere Wiederherstellung: " + entry.path +
            " (Index " + entry.size + " Bytes, Blob " + next.size + " Bytes)");
          continue;
        }
        const filtered = git(root, ["hash-object", "--path=" + rel, rel]).toString("utf8").trim();
        const raw = git(root, ["hash-object", "--no-filters", rel]).toString("utf8").trim();
        if (filtered !== raw) {
          problems.push("Git würde die Binärdatei beim Erfassen verändern (Filter/Attribute prüfen): " + entry.path);
          continue;
        }
        restage.push({ rel, entry });
      }
      files.push({ path: entry.path, sha256: entry.sha256, size: entry.size });
    } else {
      textCount++;
      if (kind === "crlf" || kind === "mixed" || bytes.includes(0x0d)) {
        problems.push("Textdatei hat im Blob kein reines LF-Ende (i/" + kind + "): " + entry.path);
        continue;
      }
      files.push(next);
      if (entry.sha256 !== next.sha256 || entry.size !== next.size) {
        changed.push({ path: entry.path, alt: entry.size, neu: next.size });
      }
    }
    totalBytes += files[files.length - 1].size;
  }

  // Dateien im Modul, die der Index nicht kennt, werden gemeldet, aber nicht aufgenommen.
  const known = new Set(oldIndex.files.map((entry) => MODULE_DIR + "/" + entry.path));
  const unlisted = [...oids.keys()].filter((rel) => rel.startsWith(MODULE_DIR + "/web/") && !known.has(rel));

  if (problems.length) abort("\n  - " + problems.join("\n  - "));

  // Neuer Index im Format von scripts/package-it-module.js; weitere Kopffelder bleiben erhalten.
  const nextIndex = Object.assign({}, oldIndex, { files });
  let nextIndexText = JSON.stringify(nextIndex, null, 2);
  if (oldIndexBytes.length && oldIndexBytes[oldIndexBytes.length - 1] === 0x0a) nextIndexText += "\n";
  const nextIndexBytes = Buffer.from(nextIndexText, "utf8");

  // Manifest: sizeBytes ist die Summe der deklarierten Dateien (manager.js, readPackage).
  // Der Index ist selbst deklariert. Ändert sich seine Länge, ändert sich auch sizeBytes.
  const manifestBytes = blob(MANIFEST_REL);
  const manifestText = manifestBytes.toString("utf8");
  const manifest = JSON.parse(manifestText);
  let declaredSize = 0;
  for (const declared of manifest.files) {
    const rel = MODULE_DIR + "/" + declared;
    const bytes = rel === INDEX_REL ? nextIndexBytes : blob(rel);
    if (rel !== INDEX_REL && bytes.includes(0x0d)) abort("Deklarierte Datei enthält CR im Blob: " + declared);
    declaredSize += bytes.length;
  }
  let nextManifestText = manifestText;
  const sizeChanged = manifest.sizeBytes !== declaredSize;
  if (sizeChanged) {
    const pattern = /("sizeBytes"\s*:\s*)\d+/;
    if (!pattern.test(manifestText)) abort("sizeBytes im Manifest nicht gefunden.");
    nextManifestText = manifestText.replace(pattern, "$1" + declaredSize);
  }

  const indexChanged = !nextIndexBytes.equals(oldIndexBytes);
  const summary = {
    modus: CHECK_ONLY ? "check" : "schreiben",
    gelesenAus: "git-index (Blobs)",
    indexEintraege: files.length,
    textDateien: textCount,
    binaerDateien: binaryCount,
    nutzlastBytes: totalBytes,
    textEintraegeGeaendert: changed.length,
    indexDateiGeaendert: indexChanged,
    manifestSizeBytes: { alt: manifest.sizeBytes, neu: declaredSize, geaendert: sizeChanged },
    binaerBlobBeschaedigt: restage.map((item) => item.rel),
    nichtImIndex: unlisted,
    beispiele: changed.slice(0, 5)
  };

  try {
    const { PAYLOAD_LIMITS } = require("../src/modules/spec");
    if (PAYLOAD_LIMITS) {
      if (files.length > PAYLOAD_LIMITS.maxFiles) problems.push("Zu viele Dateien: " + files.length);
      if (totalBytes > PAYLOAD_LIMITS.maxBytes) problems.push("Nutzlast zu groß: " + totalBytes);
      for (const file of files) {
        if (file.size > PAYLOAD_LIMITS.maxFileBytes) problems.push("Datei zu groß: " + file.path);
      }
      if (nextIndexBytes.length > PAYLOAD_LIMITS.maxIndexBytes) problems.push("Index zu groß: " + nextIndexBytes.length);
    }
  } catch (error) {
    summary.limitpruefung = "übersprungen: " + error.message;
  }
  if (problems.length) abort("\n  - " + problems.join("\n  - "));

  if (CHECK_ONLY) {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(indexChanged || sizeChanged || restage.length ? 1 : 0);
  }

  if (restage.length && !RESTAGE) {
    abort("Die Git-Blobs dieser Binärdateien sind beschädigt (Arbeitskopie und Index stimmen überein, der Blob nicht).\n" +
      "Mit --restage-binaries werden genau diese Dateien erneut gestagt:\n  - " + restage.map((item) => item.rel).join("\n  - "));
  }
  for (const item of restage) {
    // --renormalize: ein einfaches "git add" überspringt die Datei, weil Größe und Zeitstempel
    // der Arbeitskopie zum Cache passen, obwohl der gespeicherte Blob beschädigt ist.
    git(root, ["add", "--renormalize", "--", item.rel]);
    const oid = git(root, ["rev-parse", ":" + item.rel]).toString("utf8").trim();
    const after = git(root, ["cat-file", "blob", oid]);
    if (sha256(after) !== item.entry.sha256 || after.length !== item.entry.size) {
      console.error("ABBRUCH: Nach dem Stagen weicht der Blob weiterhin vom Index ab: " + item.rel);
      console.error("Rückgängig machen: git restore --staged -- " + item.rel);
      process.exit(1);
    }
    blobCache.delete(item.rel);
  }
  if (restage.length) summary.binaerNeuGestagt = restage.map((item) => item.rel);

  const written = new Set();
  if (indexChanged) {
    fs.writeFileSync(path.join(root, INDEX_REL), nextIndexBytes);
    written.add(INDEX_REL);
  }
  if (sizeChanged) {
    fs.writeFileSync(path.join(root, MANIFEST_REL), Buffer.from(nextManifestText, "utf8"));
    written.add(MANIFEST_REL);
  }

  if (SYNC_WORKTREE) {
    const synced = [];
    const skipped = [];
    for (const [rel, info] of eol) {
      if (info.index === "-text" || written.has(rel) || info.work === "lf" || info.work === "none") continue;
      const target = path.join(root, rel);
      const work = fs.readFileSync(target);
      const canonical = blob(rel);
      const normalized = Buffer.from(work.toString("latin1").replace(/\r\n/g, "\n"), "latin1");
      if (normalized.equals(canonical)) {
        fs.writeFileSync(target, canonical);
        synced.push(rel);
      } else {
        skipped.push(rel);
      }
    }
    summary.arbeitskopieAngeglichen = synced.length;
    summary.arbeitskopieUebersprungenWeilGeaendert = skipped;
  }

  console.log(JSON.stringify(summary, null, 2));
}

main();
