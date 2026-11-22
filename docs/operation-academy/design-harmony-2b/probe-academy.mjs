import { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const require = createRequire(path.join(root, "package.json"));
const electron = require("electron");
const script = path.join(here, "probe-main.js");

const child = spawn(electron, [script], { cwd: root, stdio: "inherit" });
child.on("exit", (code) => process.exit(code || 0));
child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
