"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const MAX_ENTRIES = 4000;
const MAX_ENTRY_BYTES = 40 * 1024 * 1024;
const MAX_TOTAL_BYTES = 120 * 1024 * 1024;

function fail(message) {
  const error = new Error(message);
  error.code = "bad-zip";
  throw error;
}

function dosTime(date) {
  const d = date || new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const day = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, day };
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function walk(dir, prefix, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "." || name === "..") continue;
    const full = path.join(dir, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, relative, out);
    else if (stat.isFile()) out.push({ relative: relative.replace(/\\/g, "/"), full });
  }
}

function zipDirectory(dir, outFile) {
  const files = [];
  walk(dir, "", files);
  if (files.length > MAX_ENTRIES) fail("Das Modulpaket hat zu viele Dateien.");
  const locals = [];
  const central = [];
  let offset = 0;
  let total = 0;
  for (const file of files) {
    const data = fs.readFileSync(file.full);
    total += data.length;
    if (data.length > MAX_ENTRY_BYTES || total > MAX_TOTAL_BYTES) fail("Das Modulpaket ist zu groß.");
    const name = Buffer.from(file.relative, "utf8");
    const compressed = zlib.deflateRawSync(data);
    const stamp = dosTime(fs.statSync(file.full).mtime);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(stamp.time, 10);
    local.writeUInt16LE(stamp.day, 12);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    locals.push(local, compressed);
    const header = Buffer.alloc(46 + name.length);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(8, 10);
    header.writeUInt16LE(stamp.time, 12);
    header.writeUInt16LE(stamp.day, 14);
    header.writeUInt32LE(crc32(data), 16);
    header.writeUInt32LE(compressed.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);
    name.copy(header, 46);
    central.push(header);
    offset += local.length + compressed.length;
  }
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, Buffer.concat(locals.concat([centralBuf, eocd])));
  return outFile;
}

function safeRelative(name) {
  const value = String(name || "").replace(/\\/g, "/");
  if (!value || value.length > 240 || value.includes("\0") || value.startsWith("/") || /^[a-zA-Z]:/.test(value)) return "";
  const parts = value.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return "";
  return parts.join("/");
}

function extractZip(file, dest) {
  const input = fs.readFileSync(file);
  fs.mkdirSync(dest, { recursive: true });
  let offset = 0;
  let entries = 0;
  let total = 0;
  while (offset + 30 <= input.length) {
    const signature = input.readUInt32LE(offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) fail("Das Modulpaket ist kein gültiges ZIP.");
    const flags = input.readUInt16LE(offset + 6);
    const method = input.readUInt16LE(offset + 8);
    const compressedSize = input.readUInt32LE(offset + 18);
    const nameLength = input.readUInt16LE(offset + 26);
    const extraLength = input.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    if (flags & 0x1) fail("Verschlüsselte Modulpakete werden nicht angenommen.");
    if (dataStart + compressedSize > input.length) fail("Das Modulpaket ist unvollständig.");
    const relative = safeRelative(input.slice(nameStart, nameStart + nameLength).toString("utf8"));
    const compressed = input.slice(dataStart, dataStart + compressedSize);
    offset = dataStart + compressedSize;
    if (!relative) {
      if (relative === "" && input.slice(nameStart, nameStart + nameLength).toString("utf8").endsWith("/")) continue;
      if (!input.slice(nameStart, nameStart + nameLength).toString("utf8").endsWith("/")) fail("Ein Pfad im Modulpaket ist ungültig.");
      continue;
    }
    if (input.slice(nameStart, nameStart + nameLength).toString("utf8").endsWith("/")) continue;
    entries += 1;
    if (entries > MAX_ENTRIES) fail("Das Modulpaket hat zu viele Dateien.");
    let data;
    if (method === 0) data = compressed;
    else if (method === 8) data = zlib.inflateRawSync(compressed);
    else fail("Das Modulpaket verwendet ein nicht unterstütztes ZIP-Verfahren.");
    total += data.length;
    if (data.length > MAX_ENTRY_BYTES || total > MAX_TOTAL_BYTES) fail("Das Modulpaket ist zu groß.");
    const target = path.resolve(dest, relative);
    const inside = path.relative(path.resolve(dest), target);
    if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) fail("Ein Pfad verlässt das Modulpaket.");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
  if (entries === 0) fail("Das Modulpaket enthält keine Dateien.");
  return dest;
}

module.exports = { zipDirectory, extractZip };
