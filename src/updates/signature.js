"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

function verifyPublisher(file, thumbprint) {
  const expected = String(thumbprint || "").replace(/\s+/g, "").toUpperCase();
  if (!expected || !file || !fs.existsSync(file)) {
    return { ok: false, status: "Missing", thumbprint: "" };
  }
  const command = [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "$s = Get-AuthenticodeSignature -FilePath $env:ACADEMY_SIGN_FILE; $tp = ''; if ($s.SignerCertificate) { $tp = $s.SignerCertificate.Thumbprint }; @{ status = [string]$s.Status; thumbprint = [string]$tp } | ConvertTo-Json -Compress"
  ];
  let parsed;
  try {
    const powershell = process.env.SystemRoot
    ? require("node:path").join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    : "powershell.exe";
  const stdout = execFileSync(powershell, command, {
      env: Object.assign({}, process.env, { ACADEMY_SIGN_FILE: file }),
      encoding: "utf8",
      windowsHide: true,
      timeout: 20000
    });
    parsed = JSON.parse(stdout);
  } catch (error) {
    return { ok: false, status: "CheckFailed", thumbprint: "", cause: error.message };
  }
  const actual = String(parsed.thumbprint || "").replace(/\s+/g, "").toUpperCase();
  const valid = parsed.status === "Valid" && actual.length > 0 && actual === expected;
  return { ok: valid, status: parsed.status || "Unknown", thumbprint: actual };
}

module.exports = { verifyPublisher };
