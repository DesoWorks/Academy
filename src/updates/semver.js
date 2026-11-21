"use strict";

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

function isSafeVersion(version) {
  return VERSION_PATTERN.test(String(version || ""));
}

function parse(version) {
  const raw = String(version || "").trim().replace(/^v/, "");
  const [core, pre = ""] = raw.split("-");
  const parts = core.split(".").map((part) => {
    const number = Number.parseInt(part, 10);
    return Number.isFinite(number) ? number : 0;
  });
  while (parts.length < 3) parts.push(0);
  return { parts: parts.slice(0, 3), pre };
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
  return a.pre < b.pre ? -1 : 1;
}

module.exports = { VERSION_PATTERN, isSafeVersion, parse, compare };
