"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const desktopRoot = path.resolve(__dirname, "..");
const electron = require("electron");
const outDir = path.join(desktopRoot, "test-results");
const dataDir = path.join(os.tmpdir(), "academy-lab-" + Date.now());

function run(mode) {
  fs.mkdirSync(outDir, { recursive: true });
  const result = spawnSync(electron, [desktopRoot], {
    cwd: desktopRoot,
    env: Object.assign({}, process.env, {
      ACADEMY_LAB: mode,
      ACADEMY_DATA_DIR: dataDir,
      ACADEMY_HEADLESS: "1",
      ACADEMY_LAB_OUT: outDir
    }),
    encoding: "utf8",
    timeout: 120000
  });
  return result;
}

const seed = run("seed");
const read = seed.status === 0 ? run("read") : { status: 1, stdout: "", stderr: "Seed nicht bestanden, Neustart nicht gestartet." };
const report = {
  dataDir,
  seed: { status: seed.status, stdout: seed.stdout, stderr: seed.stderr },
  read: { status: read.status, stdout: read.stdout, stderr: read.stderr }
};
fs.writeFileSync(path.join(outDir, "laboratory-report.json"), JSON.stringify(report, null, 2));
process.stdout.write(JSON.stringify({ seed: seed.status, read: read.status }) + "\n");
process.exit(seed.status === 0 && read.status === 0 ? 0 : 1);
