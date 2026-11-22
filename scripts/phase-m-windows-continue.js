"use strict";

const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { openDatabase } = require("../src/store/database");
const { createModuleManager } = require("../src/modules/manager");
const { CORE_VERSION } = require("../src/core/version");

const root = path.join(__dirname, "..");
const dataDir = path.join(process.env.APPDATA, "DesoWorks", "Academy");
const installDir = path.join(process.env.LOCALAPPDATA, "DesoWorksAcademyPhaseM");
const exe = path.join(installDir, "DesoWorks Academy.exe");
const setupB = path.join(root, "dist", "DesoWorks-Academy-Setup-0.3.1-dev.2.exe");
const moduleZip = path.join(root, "dist", "desoworks.it-systemintegration-1.0.2.zip");
const feedDir = path.join(process.env.LOCALAPPDATA, "DesoWorks", "AcademyDevFeed");
const evidence = path.join(root, "docs", "operation-academy", "windows-update-evidence.json");
const result = { continued: new Date().toISOString(), steps: [] };

function note(step, detail) {
  result.steps.push({ step, detail });
  process.stdout.write(`${step}: ${JSON.stringify(detail)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileVersion() {
  const output = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `(Get-Item -LiteralPath ${JSON.stringify(exe)}).VersionInfo.FileVersion`], { encoding: "utf8" });
  return output.trim();
}

async function waitFor(label, fn, timeoutMs) {
  const start = Date.now();
  let last = "";
  while (Date.now() - start < timeoutMs) {
    try {
      const value = await fn();
      if (value) return value;
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
      ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
    });
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      clearTimeout(timer);
      ws.close();
      resolve(message.result && message.result.result ? message.result.result.value : message.result);
    });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("CDP-Verbindung getrennt"));
    });
  });
}

function launch() {
  const child = spawn(exe, ["--remote-debugging-port=9223"], { detached: true, stdio: "ignore" });
  child.unref();
}

async function stopApp() {
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq ${JSON.stringify(exe)} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`]);
  await sleep(800);
}

function publish(args) {
  execFileSync(process.execPath, [path.join(root, "scripts", "publish-dev-feed.js")].concat(args), { cwd: root, stdio: "inherit" });
}

async function main() {
  note("core-already", { version: fileVersion() });
  publish(["--installer", setupB, "--version", "0.3.1-dev.2", "--commit", "7876297", "--notes", "Phase M DEV-Stand B", "--module-zip", moduleZip, "--module-version", "1.0.2", "--module-notes", "Modul 1.0.2 getrennt vom Core"]);
  const server = spawn(process.execPath, [path.join(root, "scripts", "dev-feed-server.js"), feedDir, dataDir], { cwd: root, detached: true, stdio: "ignore" });
  server.unref();
  await sleep(400);
  launch();
  await waitFor("CDP", async () => (await (await fetch("http://127.0.0.1:9223/json")).json()).some((target) => target.type === "page"), 40000);
  const moduleUpdate = await cdp("(async () => { const checked = await window.academyDesktop.checkUpdate(); const entry = (checked.state.moduleUpdates || [])[0] || null; if (!entry) return { entry: null, phase: checked.state.phase, message: checked.state.message }; const downloaded = await window.academyDesktop.downloadModuleUpdate(entry.id); const installed = await window.academyDesktop.installModuleUpdate(entry.id); return { entry, downloaded: downloaded.state && downloaded.state.moduleMessage, installed: installed.ok, module: installed.module, message: installed.message }; })()");
  note("module-update", moduleUpdate);
  await stopApp();
  const modules = createModuleManager({ dataDir, coreVersion: CORE_VERSION, hostedWebRoots: [path.join(root, "modules")] });
  const store = openDatabase({ dataDir });
  note("after-module", {
    version: modules.list().installed.find((entry) => entry.id === "desoworks.it-systemintegration").version,
    progress: modules.progress("desoworks.it-systemintegration").tasks["phase-m"],
    marker: store.all()["phase-m-marker"],
    core: fileVersion()
  });
  modules.close();

  const failExe = path.join(root, "dist", "phase-m-fail.exe");
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", `Add-Type -TypeDefinition 'public class PhaseMFail { public static int Main(string[] args){ return 1; } }' -OutputAssembly ${JSON.stringify(failExe)} -OutputType ConsoleApplication`]);
  publish(["--installer", failExe, "--version", "0.3.1-dev.3", "--commit", "fail", "--notes", "Absichtlich fehlschlagender Installer"]);
  launch();
  await waitFor("CDP-fail", async () => (await (await fetch("http://127.0.0.1:9223/json")).json()).some((target) => target.type === "page"), 40000);
  try {
    const failed = await cdp("(async () => { const checked = await window.academyDesktop.checkUpdate(); const downloaded = await window.academyDesktop.downloadUpdate(); await window.academyDesktop.installUpdate(); return { available: checked.state.available, downloaded: downloaded.state.phase }; })()");
    note("failed-call", failed);
  } catch (error) {
    note("failed-call-closed", { message: error.message, version: fileVersion() });
  }
  await sleep(3000);
  note("version-after-fail", { version: fileVersion() });
  launch();
  await waitFor("CDP-recover", async () => (await (await fetch("http://127.0.0.1:9223/json")).json()).some((target) => target.type === "page"), 40000);
  const recovered = await cdp("window.academyDesktop.status()");
  note("recovered", {
    phase: recovered.updates && recovered.updates.phase,
    message: recovered.updates && recovered.updates.message,
    desktop: recovered.versions && recovered.versions.desktop,
    channel: recovered.versions && recovered.versions.channel,
    marker: openDatabase({ dataDir }).all()["phase-m-marker"]
  });
  await stopApp();
  publish(["--installer", setupB, "--version", "0.3.1-dev.2", "--commit", "7876297", "--notes", "Letzter guter DEV-Stand"]);
  try { server.kill(); } catch (error) { note("server-kill", { message: error.message }); }
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Get-NetTCPConnection -LocalPort 47321 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"]);
  result.finished = new Date().toISOString();
  fs.writeFileSync(evidence, JSON.stringify(result, null, 2));
}

main().catch((error) => {
  result.error = String(error.stack || error);
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, JSON.stringify(result, null, 2));
  process.stderr.write(result.error + "\n");
  process.exit(1);
});
