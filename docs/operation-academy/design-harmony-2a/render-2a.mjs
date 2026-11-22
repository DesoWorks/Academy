import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9333;
const outDir = "D:\\Desoworks\\Workspace\\Academy\\docs\\operation-academy\\design-harmony-2a";
const profile = outDir + "\\chrome-profile";
const pageUrl = "http://127.0.0.1:8765/module/lf3-client-anbindung.html";
mkdirSync(outDir, { recursive: true });

const child = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + profile,
  "about:blank"
], { stdio: "ignore" });

async function version() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch("http://127.0.0.1:" + port + "/json/version");
      if (res.ok) return await res.json();
    } catch { /* chrome still starting */ }
    await sleep(250);
  }
  throw new Error("Chrome DevTools-Port 9333 antwortet nicht");
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const pending = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
        else pending.resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error("timeout " + method));
        }
      }, 20000);
    });
  }
}

const probe = `(() => {
  function rgb(s) {
    const m = String(s).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    return m[1].split(",").map((x) => parseFloat(x));
  }
  function lum(c) {
    const a = c.slice(0, 3).map((v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrast(fg, bg) {
    if (!fg || !bg || fg.length < 3 || bg.length < 3) return null;
    const hi = Math.max(lum(fg), lum(bg));
    const lo = Math.min(lum(fg), lum(bg));
    return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
  }
  function sample(sel) {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      sel,
      color: cs.color,
      background: cs.backgroundColor,
      border: cs.borderTopColor,
      outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor,
      fontWeight: cs.fontWeight,
      contrast: contrast(rgb(cs.color), rgb(cs.backgroundColor)),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      offRight: rect.right > window.innerWidth + 2,
      text: (el.innerText || "").replace(/\\s+/g, " ").slice(0, 80)
    };
  }
  const active = document.activeElement;
  return {
    theme: document.documentElement.dataset.theme || "",
    scale: getComputedStyle(document.documentElement).getPropertyValue("--text-scale").trim(),
    title: document.title,
    active: active ? active.tagName + (active.className ? "." + active.className : "") + (active.getAttribute("aria-label") || active.textContent || "").replace(/\\s+/g, " ").slice(0, 60) : "",
    samples: [".skizze", ".step", ".opt", ".opt:focus-within", ".opt:has(:checked)", "body", "h1", ".result", ".hinweis-box"].map(sample)
  };
})()`;

const info = await version();
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", () => reject(new Error("websocket failed")));
});
const cdp = new Cdp(ws);
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
await cdp.send("Page.enable", {}, sessionId);
await cdp.send("Runtime.enable", {}, sessionId);
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1200,
  deviceScaleFactor: 1,
  mobile: false
}, sessionId);
await cdp.send("Page.navigate", { url: pageUrl }, sessionId);
await sleep(800);
await cdp.send("Runtime.evaluate", {
  expression: "document.fonts ? document.fonts.ready : Promise.resolve()",
  awaitPromise: true
}, sessionId);

async function evalJson(expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  }, sessionId);
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

async function shot(name) {
  const image = await cdp.send("Page.captureScreenshot", { format: "png" }, sessionId);
  const file = outDir + "\\" + name + ".png";
  writeFileSync(file, Buffer.from(image.data, "base64"));
  return file;
}

const report = { pageUrl, shots: [], probes: [] };

async function scene(name, setup) {
  await evalJson(setup);
  await sleep(150);
  const measured = await evalJson(probe);
  const file = await shot(name);
  report.shots.push(file);
  report.probes.push({ name, measured });
}

await scene("hell-start", `(() => {
  localStorage.setItem("it-ausbildung.anzeige.v1", JSON.stringify({ text: 100, spacing: false, theme: "hell", ruhig: true }));
  document.documentElement.dataset.theme = "hell";
  document.documentElement.style.setProperty("--text-scale", "1");
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "start"; });
  window.scrollTo(0, 0);
  return true;
})()`);

await scene("hell-skizze", `(() => {
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "case"; });
  window.scrollTo(0, 0);
  return true;
})()`);

await scene("hell-uebung", `(() => {
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "exercise"; });
  window.scrollTo(0, 0);
  return true;
})()`);

await scene("dunkel-skizze", `(() => {
  localStorage.setItem("it-ausbildung.anzeige.v1", JSON.stringify({ text: 100, spacing: false, theme: "dunkel", ruhig: true }));
  document.documentElement.dataset.theme = "dunkel";
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "case"; });
  window.scrollTo(0, 0);
  return true;
})()`);

await scene("dunkel-uebung", `(() => {
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "exercise"; });
  window.scrollTo(0, 0);
  return true;
})()`);

await scene("dunkel-uebung-auswahl", `(() => {
  const input = document.querySelector('input[name="q1"][value="mira"]');
  input.checked = true;
  input.focus();
  window.scrollTo(0, 0);
  return true;
})()`);

await scene("dunkel-150", `(() => {
  document.documentElement.style.setProperty("--text-scale", "1.5");
  document.documentElement.dataset.theme = "dunkel";
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "case"; });
  window.scrollTo(0, 0);
  return true;
})()`);

await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1600,
  deviceScaleFactor: 1,
  mobile: false
}, sessionId);

await scene("dunkel-200-skizze", `(() => {
  document.documentElement.style.setProperty("--text-scale", "2");
  document.documentElement.dataset.theme = "dunkel";
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "case"; });
  window.scrollTo(0, 0);
  return true;
})()`);

const tabs = [];
await evalJson(`(() => {
  document.documentElement.dataset.theme = "dunkel";
  document.documentElement.style.setProperty("--text-scale", "1");
  ["start","case","exercise","finish"].forEach((id) => { document.getElementById(id).hidden = id !== "exercise"; });
  document.querySelector(".skip-link").focus();
  return true;
})()`);
for (let i = 0; i < 8; i++) {
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
  await sleep(40);
  tabs.push(await evalJson(`(() => {
    const el = document.activeElement;
    const label = el && el.closest ? el.closest("label.opt") : null;
    return {
      tag: el ? el.tagName : "",
      type: el ? el.getAttribute("type") : "",
      name: el ? el.getAttribute("name") : "",
      text: ((label && label.innerText) || (el && el.innerText) || "").replace(/\\s+/g, " ").slice(0, 70),
      outline: label ? getComputedStyle(label).outlineWidth + " " + getComputedStyle(label).outlineStyle : ""
    };
  })()`));
}
report.tabs = tabs;
report.focusShot = await shot("dunkel-tastatur-fokus");

const hostCss = readFileSync("D:\\Desoworks\\Workspace\\Academy\\src\\renderer\\host.css", "utf8");
report.hostInjection = await evalJson(`(() => {
  const style = document.createElement("style");
  style.textContent = ${JSON.stringify(hostCss)};
  document.head.appendChild(style);
  const el = document.querySelector(".skizze");
  const cs = getComputedStyle(el);
  return { color: cs.color, background: cs.backgroundColor, note: "host.css nachträglich eingehängt" };
})()`);

writeFileSync(outDir + "\\messwerte.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ shots: report.shots.length, probes: report.probes.map((p) => ({
  name: p.name,
  theme: p.measured.theme,
  scale: p.measured.scale,
  skizze: p.measured.samples[0],
  step: p.measured.samples[1],
  opt: p.measured.samples[2]
})), tabs: report.tabs, hostInjection: report.hostInjection }, null, 2));

try { child.kill(); } catch { /* already gone */ }
ws.close();
process.exit(0);
