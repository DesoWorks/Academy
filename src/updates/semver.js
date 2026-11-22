"use strict";

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

function isSafeVersion(version) {
  return VERSION_PATTERN.test(String(version || ""));
}

function parse(version) {
  const raw = String(version || "").trim().replace(/^v/, "");
  const dash = raw.indexOf("-");
  const core = dash === -1 ? raw : raw.slice(0, dash);
  const pre = dash === -1 ? "" : raw.slice(dash + 1);
  const parts = core.split(".").map((part) => {
    const number = Number.parseInt(part, 10);
    return Number.isFinite(number) ? number : 0;
  });
  while (parts.length < 3) parts.push(0);
  return { parts: parts.slice(0, 3), pre };
}

function comparePrerelease(left, right) {
  const a = left.split(".");
  const b = right.split(".");
  const shared = Math.min(a.length, b.length);
  for (let index = 0; index < shared; index += 1) {
    const x = a[index];
    const y = b[index];
    if (x === y) continue;
    const xNum = /^\d+$/.test(x);
    const yNum = /^\d+$/.test(y);
    if (xNum && yNum) {
      const nx = Number(x);
      const ny = Number(y);
      if (nx !== ny) return nx < ny ? -1 : 1;
      continue;
    }
    if (xNum !== yNum) return xNum ? -1 : 1;
    return x < y ? -1 : 1;
  }
  if (a.length === b.length) return 0;
  return a.length < b.length ? -1 : 1;
}

function compare(left, right) {
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if (a.parts[index] !== b.parts[index]) return a.parts[index] < b.parts[index] ? -1 : 1;
  }
  if (a.pre === b.pre) return 0;
  if (!a.pre) return 1;
  if (!b.pre) return -1;
  return comparePrerelease(a.pre, b.pre);
}

module.exports = { VERSION_PATTERN, isSafeVersion, parse, compare };
