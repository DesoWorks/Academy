import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9334;
const outDir = "D:\\Desoworks\\Workspace\\Academy\\docs\\operation-academy\\design-harmony-2a";
const child = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + outDir + "\\chrome-profile-2",
  "about:blank"
], { stdio: "ignore" });

async function version() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch("http://127.0.0.1:" + port + "/json/version");
      if (res.ok) return await res.json();
    } catch { /* starting */ }
    await sleep(250);
  }
  throw new Error("no cdp");
}
class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
        else p.resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error("timeout " + method)); } }, 20000);
    });
  }
}
const info = await version();
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener("open", resolve); ws.addEventListener("error", () => reject(new Error("ws"))); });
const cdp = new Cdp(ws);
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
await cdp.send("Page.enable", {}, sessionId);
await cdp.send("Runtime.enable", {}, sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
await cdp.send("Page.navigate", { url: "http://127.0.0.1:8765/module/lf3-client-anbindung.html" }, sessionId);
await sleep(900);

async function ev(expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true }, sessionId);
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function shot(name) {
  const image = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  const file = outDir + "\\" + name + ".png";
  writeFileSync(file, Buffer.from(image.data, "base64"));
  return file;
}

await ev(`(() => {
  document.documentElement.dataset.theme = "dunkel";
  document.documentElement.style.setProperty("--text-scale", "2");
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "case"; });
  document.querySelector(".skizze").scrollIntoView({ block: "start" });
  return true;
})()`);
await sleep(100);
const skizze = await ev(`(() => {
  const el = document.querySelector(".skizze");
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), inner: window.innerWidth, text: el.innerText.slice(0, 40) };
})()`);
const shot200 = await shot("dunkel-200-skizze-sichtbar");

await ev(`(() => {
  document.documentElement.style.setProperty("--text-scale", "1");
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "exercise"; });
  document.getElementById("main").focus();
  return true;
})()`);
const tabs = [];
let radioAt = null;
for (let i = 1; i <= 25; i++) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
  await sleep(30);
  const row = await ev(`(() => {
    const el = document.activeElement;
    const label = el && el.closest ? el.closest("label.opt") : null;
    return {
      tag: el ? el.tagName : "",
      type: el ? (el.getAttribute("type") || "") : "",
      text: ((label && label.innerText) || (el && (el.getAttribute("aria-label") || el.innerText)) || "").replace(/\\s+/g, " ").slice(0, 80),
      outline: label ? getComputedStyle(label).outlineStyle + " " + getComputedStyle(label).outlineWidth : ""
    };
  })()`);
  tabs.push({ i, ...row });
  if (row.type === "radio" && radioAt === null) {
    radioAt = i;
    break;
  }
}
const focusShot = radioAt ? await shot("dunkel-tastatur-radio") : null;
console.log(JSON.stringify({ skizze, shot200, radioAt, focusShot, tabs }, null, 2));
try { child.kill(); } catch { /* gone */ }
ws.close();
process.exit(0);
