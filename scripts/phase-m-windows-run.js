"use strict";

const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { zipDirectory } = require("../src/updates/zip");
const { openDatabase } = require("../src/store/database");
const { createModuleManager } = require("../src/modules/manager");
const { CORE_VERSION } = require("../src/core/version");

const root = path.join(__dirname, "..");
const dataDir = path.join(process.env.APPDATA, "DesoWorks", "Academy");
const installDir = path.join(process.env.LOCALAPPDATA, "DesoWorksAcademyPhaseM");
const exe = path.join(installDir, "DesoWorks Academy.exe");
const setupA = path.join(root, "dist", "DesoWorks-Academy-Setup-0.3.1-dev.1.exe");
const setupB = path.join(root, "dist", "DesoWorks-Academy-Setup-0.3.1-dev.2.exe");
const evidence = path.join(root, "docs", "operation-academy", "windows-update-evidence.json");
const result = { started: new Date().toISOString(), steps: [] };

function note(step, detail) {
  result.steps.push({ step, at: new Date().toISOString(), detail });
  process.stdout.write(`${step}: ${JSON.stringify(detail)}\n`);
}

function fileVersion(file) {
  if (!fs.existsSync(file)) return "";
  const output = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `(Get-Item -LiteralPath ${JSON.stringify(file)}).VersionInfo.FileVersion`], { encoding: "utf8" });
  return output.trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(label, fn, timeoutMs) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeoutMs) {
    try {
      const value = await fn();
      if (value) return value;
      last = value;
    } catch (error) {
      last = error.message;
    }
    await sleep(1000);
  }
  throw new Error(`${label} nicht erreicht: ${last}`);
}

async function cdp(expression, timeoutMs = 180000) {
  const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
  const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
  if (!page) throw new Error("kein CDP-Ziel");
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("CDP-Zeitüberschreitung"));
    }, timeoutMs);
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression, awaitPromise: true, returnByValue: true }
      }));
    });
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== 1) return;
      clearTimeout(timer);
      ws.close();
      resolve(message.result);
    });
    ws.addEventListener("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function launchApp() {
  const child = spawn(exe, ["--remote-debugging-port=9223"], { detached: true, stdio: "ignore" });
  child.unref();
  return child.pid;
}

async function stopApp() {
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Get-Process | Where-Object { $_.Path -eq '" + exe.replace(/'/g, "''") + "' } | Stop-Process -Force -ErrorAction SilentlyContinue"]);
  await sleep(1000);
}

async function main() {
  const backupRoot = path.join(root, "dist", "phase-m-data-backup");
  fs.mkdirSync(backupRoot, { recursive: true });
  if (fs.existsSync(dataDir)) {
    fs.cpSync(dataDir, path.join(backupRoot, "before"), { recursive: true });
    note("backup", { path: path.join(backupRoot, "before") });
  }
  note("setup-a-exists", { file: setupA, bytes: fs.statSync(setupA).size, version: fileVersion(setupA) });
  note("setup-b-exists", { file: setupB, bytes: fs.statSync(setupB).size, version: fileVersion(setupB) });
  execFileSync(setupA, ["/S", `/D=${installDir}`], { timeout: 300000 });
  const installedA = await waitFor("Version A", () => fileVersion(exe) === "0.3.1-dev.1" ? fileVersion(exe) : "", 180000);
  note("installed-a", { exe, version: installedA });

  const store = openDatabase({ dataDir });
  store.set("phase-m-marker", "gehalten");
  store.writePolicy({ intervalHours: 24, maxBackups: 6 });
  const backup = store.backup("phase-m-before-update");
  const modules = createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [path.join(root, "modules"), path.join(dataDir, "updates", "modules", "verified")]
  });
  let moduleBefore = modules.list().installed.find((entry) => entry.id === "desoworks.it-systemintegration");
  if (!moduleBefore) {
    modules.installFromDirectory(path.join(root, "modules", "it-systemintegration"));
    moduleBefore = modules.list().installed.find((entry) => entry.id === "desoworks.it-systemintegration");
  }
  modules.progress("desoworks.it-systemintegration", { tasks: { "phase-m": { correct: true } }, assessment: {} });
  modules.close();
  note("seed", {
    marker: store.all()["phase-m-marker"],
    policy: store.readPolicy(),
    backup,
    module: moduleBefore.version
  });

  const moduleSource = path.join(root, "dist", "phase-m-module-1.0.2");
  fs.rmSync(moduleSource, { recursive: true, force: true });
  fs.cpSync(path.join(root, "modules", "it-systemintegration"), moduleSource, { recursive: true });
  const manifest = JSON.parse(fs.readFileSync(path.join(moduleSource, "academy-module.json"), "utf8"));
  manifest.version = "1.0.2";
  fs.writeFileSync(path.join(moduleSource, "academy-module.json"), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(moduleSource, "web", "phase-m-marker.txt"), "modul-1.0.2");
  const moduleZip = path.join(root, "dist", "desoworks.it-systemintegration-1.0.2.zip");
  zipDirectory(moduleSource, moduleZip);

  execFileSync(process.execPath, [path.join(root, "scripts", "publish-dev-feed.js"), "--installer", setupB, "--version", "0.3.1-dev.2", "--commit", "7876297", "--notes", "Phase M DEV-Stand B"], { cwd: root });
  const feedDir = path.join(process.env.LOCALAPPDATA, "DesoWorks", "AcademyDevFeed");
  const shaFile = path.join(feedDir, path.basename(setupB) + ".sha256");
  const goodSha = fs.readFileSync(shaFile, "utf8");
  fs.writeFileSync(shaFile, `${"ab".repeat(32)}  ${path.basename(setupB)}\n`);
  const server = spawn(process.execPath, [path.join(root, "scripts", "dev-feed-server.js"), feedDir, dataDir], { cwd: root, stdio: "ignore" });
  await sleep(500);
  note("feed-server", { pid: server.pid, feedDir });

  launchApp();
  await waitFor("CDP", async () => {
    const response = await fetch("http://127.0.0.1:9223/json");
    const targets = await response.json();
    return targets.some((target) => target.type === "page");
  }, 40000);
  const bad = await cdp("(async () => { const checked = await window.academyDesktop.checkUpdate(); const downloaded = await window.academyDesktop.downloadUpdate(); return { checked: checked.state, downloaded: downloaded.state }; })()");
  note("bad-hash", bad.result ? bad.result.value : bad);
  fs.writeFileSync(shaFile, goodSha);
  const good = await cdp("(async () => { const checked = await window.academyDesktop.checkUpdate(); const downloaded = await window.academyDesktop.downloadUpdate(); const installed = await window.academyDesktop.installUpdate(); return { checked: checked.state && checked.state.phase, available: checked.state && checked.state.available, commit: checked.state && checked.state.commit, size: checked.state && checked.state.size, downloaded: downloaded.state && downloaded.state.phase, install: installed }; })()", 300000);
  note("good-update-call", good.result ? good.result.value : good);
  const installedB = await waitFor("Version B", () => fileVersion(exe) === "0.3.1-dev.2" ? "0.3.1-dev.2" : "", 300000);
  note("installed-b", { version: installedB });
  await sleep(2000);
  const after = openDatabase({ dataDir });
  const modulesAfter = createModuleManager({
    dataDir,
    coreVersion: CORE_VERSION,
    hostedWebRoots: [path.join(root, "modules")]
  });
  note("after-core", {
    marker: after.all()["phase-m-marker"],
    policy: after.readPolicy(),
    backupExists: fs.existsSync(backup),
    module: modulesAfter.list().installed.find((entry) => entry.id === "desoworks.it-systemintegration").version,
    progress: modulesAfter.progress("desoworks.it-systemintegration").tasks["phase-m"]
  });
  modulesAfter.close();

  execFileSync(process.execPath, [path.join(root, "scripts", "publish-dev-feed.js"), "--installer", setupB, "--version", "0.3.1-dev.2", "--commit", "7876297", "--notes", "Phase M DEV-Stand B", "--module-zip", moduleZip, "--module-version", "1.0.2", "--module-notes", "Modul 1.0.2 getrennt vom Core"], { cwd: root });
  launchApp();
  await waitFor("CDP-2", async () => (await (await fetch("http://127.0.0.1:9223/json")).json()).some((target) => target.type === "page"), 40000);
  const moduleUpdate = await cdp("(async () => { const checked = await window.academyDesktop.checkUpdate(); const id = checked.state.moduleUpdates && checked.state.moduleUpdates[0] && checked.state.moduleUpdates[0].id; const downloaded = id ? await window.academyDesktop.downloadModuleUpdate(id) : null; const installed = id ? await window.academyDesktop.installModuleUpdate(id) : null; return { id, phase: checked.state.phase, module: checked.state.moduleUpdates, downloaded: downloaded && downloaded.state && downloaded.state.moduleMessage, installed }; })()", 180000);
  note("module-update", moduleUpdate.result ? moduleUpdate.result.value : moduleUpdate);
  await stopApp();
  const modulesFinal = createModuleManager({ dataDir, coreVersion: CORE_VERSION, hostedWebRoots: [path.join(root, "modules")] });
  note("after-module", {
    version: modulesFinal.list().installed.find((entry) => entry.id === "desoworks.it-systemintegration").version,
    progress: modulesFinal.progress("desoworks.it-systemintegration").tasks["phase-m"],
    coreVersion: fileVersion(exe)
  });
  modulesFinal.close();

  const failExe = path.join(root, "dist", "phase-m-fail.exe");
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Add-Type -TypeDefinition 'public class PhaseMFail { public static int Main(string[] args){ return 1; } }' -OutputAssembly ${JSON.stringify(failExe)} -OutputType ConsoleApplication`]);
  execFileSync(process.execPath, [path.join(root, "scripts", "publish-dev-feed.js"), "--installer", failExe, "--version", "0.3.1-dev.3", "--commit", "fail", "--notes", "Absichtlich fehlschlagender Installer"], { cwd: root });
  launchApp();
  await waitFor("CDP-3", async () => (await (await fetch("http://127.0.0.1:9223/json")).json()).some((target) => target.type === "page"), 40000);
  const failed = await cdp("(async () => { const checked = await window.academyDesktop.checkUpdate(); const downloaded = await window.academyDesktop.downloadUpdate(); const installed = await window.academyDesktop.installUpdate(); return { available: checked.state.available, downloaded: downloaded.state.phase, install: installed }; })()", 120000);
  note("failed-install-call", failed.result ? failed.result.value : failed);
  await sleep(4000);
  note("after-failed-install", { version: fileVersion(exe) });
  launchApp();
  await waitFor("CDP-4", async () => (await (await fetch("http://127.0.0.1:9223/json")).json()).some((target) => target.type === "page"), 40000);
  const recovered = await cdp("(async () => window.academyDesktop.status())");
  note("recovered-status", recovered.result ? recovered.result.value : recovered);
  await stopApp();
  execFileSync(process.execPath, [path.join(root, "scripts", "publish-dev-feed.js"), "--installer", setupB, "--version", "0.3.1-dev.2", "--commit", "7876297", "--notes", "Phase M DEV-Stand B bleibt der letzte gute Stand"], { cwd: root });
  server.kill();
  result.finished = new Date().toISOString();
  fs.writeFileSync(evidence, JSON.stringify(result, null, 2));
  process.stdout.write(`EVIDENCE ${evidence}\n`);
}

main().catch((error) => {
  result.error = error.stack || error.message;
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, JSON.stringify(result, null, 2));
  process.stderr.write(String(error.stack || error) + "\n");
  process.exit(1);
});
