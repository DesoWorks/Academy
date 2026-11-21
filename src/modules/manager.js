"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { compare } = require("../updates/semver");
const { ModuleError } = require("./errors");
const { openRegistry } = require("./registry");
const { verifyPackage } = require("./signature");
const { validateManifest, satisfies, assertRelativeFile } = require("./spec");

const EXPORT_FORMAT = "desoworks.academy.module-data";
const EXPORT_FORMAT_VERSION = 1;
const BUNDLED_PLATFORM = {
  id: "dev.desoworks.it-ausbildung",
  name: "IT-Ausbildung",
  version: "bundled",
  trust: "official",
  state: "bundled",
  publisher: "DesoWorks",
  uninstallable: false,
  updateAvailable: false,
  note: "Bestehende Plattform. Noch nicht in den Moduldatenbereich migriert."
};

function fail(code, message, details) {
  throw new ModuleError(code, message, details);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stable(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function checksumOf(body) {
  return crypto.createHash("sha256").update(JSON.stringify(stable(body))).digest("hex");
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readPackage(sourceDir) {
  const root = fs.realpathSync(path.resolve(sourceDir));
  const manifestPath = path.join(root, "academy-module.json");
  if (!fs.existsSync(manifestPath) || !fs.lstatSync(manifestPath).isFile()) {
    fail("invalid-package", "Das Paket enthält kein academy-module.json.");
  }
  if (fs.statSync(manifestPath).size > 65536) fail("too-large", "Das Manifest ist zu groß.");
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail("invalid-manifest", "Das Modulmanifest ist kein gültiges JSON.");
  }
  validateManifest(manifest);
  const files = {};
  let size = 0;
  for (const relative of manifest.files) {
    assertRelativeFile(relative);
    const full = path.resolve(root, relative);
    const inside = path.relative(root, full);
    if (inside.startsWith("..") || path.isAbsolute(inside)) fail("bad-file", "Ein Modulpfad verlässt das Paket.", { file: relative });
    let stat;
    try {
      stat = fs.lstatSync(full);
    } catch (error) {
      fail("invalid-package", "Eine deklarierte Datei fehlt.", { file: relative });
    }
    if (stat.isSymbolicLink() || !stat.isFile()) fail("bad-file", "Symlinks und Verzeichnisse werden nicht installiert.", { file: relative });
    const realFile = fs.realpathSync(full);
    const insideReal = path.relative(root, realFile);
    if (insideReal.startsWith("..") || path.isAbsolute(insideReal)) {
      fail("bad-file", "Eine Datei verlässt das Paket über einen Link.", { file: relative });
    }
    if (stat.size > 524288) fail("too-large", "Eine Moduldatei ist zu groß.", { file: relative });
    size += stat.size;
    files[relative] = { full, sha256: hashFile(full), size: stat.size };
  }
  if (size > 2097152 || manifest.sizeBytes !== size) {
    fail("integrity", "Die Installationsgröße stimmt nicht oder das Paket ist zu groß. Es wurde nicht installiert.", { declared: manifest.sizeBytes, measured: size });
  }
  return { root, manifest, files, size };
}

function stripAnswers(value) {
  if (Array.isArray(value)) return value.map(stripAnswers);
  if (!value || typeof value !== "object") return value;
  const next = {};
  for (const key of Object.keys(value)) {
    if (key === "answer" || key === "answers" || key.startsWith("$")) continue;
    next[key] = stripAnswers(value[key]);
  }
  return next;
}

function asText(value, max) {
  const text = String(value == null ? "" : value).replace(/<[^>]*>/g, "").slice(0, max);
  return text;
}

function sanitizeCourse(raw) {
  if (!raw || typeof raw !== "object") fail("bad-content", "Der Lerninhalt ist kein Objekt.");
  return stripAnswers({
    offer: { id: asText(raw.offer && raw.offer.id, 80), kind: asText(raw.offer && raw.offer.kind, 40), title: asText(raw.offer && raw.offer.title, 160) },
    path: { id: asText(raw.path && raw.path.id, 80), title: asText(raw.path && raw.path.title, 160) },
    area: { id: asText(raw.area && raw.area.id, 80), title: asText(raw.area && raw.area.title, 160) },
    responsibility: asText(raw.responsibility, 400),
    tutorPolicy: {
      revealSolutions: false,
      hintBeforeSolution: true,
      level: asText(raw.tutorPolicy && raw.tutorPolicy.level, 40) || "ausbildung"
    },
    sections: Array.isArray(raw.sections) ? raw.sections.slice(0, 40).map((section) => ({
      id: asText(section.id, 80),
      title: asText(section.title, 160),
      lessons: Array.isArray(section.lessons) ? section.lessons.slice(0, 40).map((lesson) => ({
        id: asText(lesson.id, 80),
        title: asText(lesson.title, 160),
        objectives: Array.isArray(lesson.objectives) ? lesson.objectives.slice(0, 12).map((item) => asText(item, 240)) : [],
        prerequisites: Array.isArray(lesson.prerequisites) ? lesson.prerequisites.slice(0, 12).map((item) => asText(item, 240)) : [],
        blocks: Array.isArray(lesson.blocks) ? lesson.blocks.slice(0, 40).map((block) => ({
          type: asText(block.type, 20),
          id: asText(block.id, 80),
          text: asText(block.text, 4000),
          prompt: asText(block.prompt, 800),
          hint: asText(block.hint, 400)
        })) : []
      })) : []
    })) : [],
    assessment: raw.assessment ? {
      id: asText(raw.assessment.id, 80),
      title: asText(raw.assessment.title, 160),
      criteria: Array.isArray(raw.assessment.criteria) ? raw.assessment.criteria.slice(0, 12).map((item) => asText(item, 240)) : [],
      questions: Array.isArray(raw.assessment.questions) ? raw.assessment.questions.slice(0, 40).map((question) => ({
        id: asText(question.id, 80),
        prompt: asText(question.prompt, 800),
        choices: Array.isArray(question.choices) ? question.choices.slice(0, 8).map((item) => asText(item, 240)) : []
      })) : []
    } : null,
    sources: Array.isArray(raw.sources) ? raw.sources.slice(0, 20).map((source) => ({
      title: asText(source.title, 200),
      note: asText(source.note, 400)
    })) : []
  });
}

function createModuleManager(options) {
  const dataDir = path.resolve(options.dataDir);
  const coreVersion = options.coreVersion;
  const trustedKeys = options.trustedKeys || { official: [], reviewed: [] };
  const registry = openRegistry({ dataDir, now: options.now });
  const packageRoot = path.join(dataDir, "module-packages");
  fs.mkdirSync(packageRoot, { recursive: true });

  function notice(moduleId, level, message) {
    if (!registry.available) return;
    registry.db.prepare("INSERT INTO module_notice (module_id, level, message, created_at) VALUES (?, ?, ?, ?)").run(
      moduleId || null,
      level,
      message,
      (options.now || (() => new Date()))().toISOString()
    );
  }

  function requireRegistry() {
    if (!registry.available) {
      fail(registry.code || "registry-unavailable", registry.message || "Die Modulverwaltung ist nicht verfügbar. Der Core bleibt nutzbar.");
    }
  }

  function row(id) {
    requireRegistry();
    return registry.db.prepare("SELECT * FROM module_install WHERE id = ?").get(id) || null;
  }

  function publicRow(entry) {
    const manifest = JSON.parse(entry.manifest_json);
    return {
      id: entry.id,
      name: manifest.name,
      description: manifest.description,
      version: entry.version,
      trust: entry.trust,
      state: entry.state,
      publisher: manifest.publisher.name,
      permissions: manifest.permissions,
      sizeBytes: entry.size_bytes,
      subject: manifest.subject,
      audience: manifest.audience,
      license: manifest.license,
      language: manifest.language,
      core: manifest.core,
      compatible: satisfies(coreVersion, manifest.core),
      updateAvailable: false,
      uninstallable: entry.state !== "bundled",
      faultReason: entry.fault_reason || null,
      signature: manifest.signature ? "present" : "absent"
    };
  }

  function verifyTrust(manifest, files) {
    const hashes = {};
    for (const [relative, file] of Object.entries(files)) hashes[relative] = file.sha256;
    if (manifest.trust === "official" || manifest.trust === "reviewed") {
      const keys = manifest.trust === "official" ? trustedKeys.official : trustedKeys.reviewed;
      const key = manifest.signature && manifest.signature.publicKey;
      if (!key || !keys.includes(key) || !verifyPackage(manifest, hashes, key)) {
        fail("signature-rejected", "Die Signatur ist ungültig oder der Schlüssel ist nicht hinterlegt. Das Paket wurde nicht installiert.");
      }
    } else if (manifest.signature && !verifyPackage(manifest, hashes, manifest.signature.publicKey)) {
      fail("signature-rejected", "Die angegebene Signatur stimmt nicht. Das Paket wurde nicht installiert.");
    }
    return hashes;
  }

  function dependencyState(manifest) {
    for (const dependency of manifest.dependencies) {
      const found = row(dependency.id);
      if (!found || found.state !== "active" || !satisfies(found.version, dependency.version)) {
        fail("dependency-missing", "Eine Abhängigkeit fehlt oder ist nicht aktiv.", { id: dependency.id });
      }
    }
  }

  function markFault(id, reason) {
    if (!registry.available) return;
    const current = registry.db.prepare("SELECT id FROM module_install WHERE id = ?").get(id);
    if (!current) return;
    registry.db.prepare("UPDATE module_install SET state = 'faulted', fault_reason = ? WHERE id = ?").run(reason, id);
    notice(id, "fault", reason);
  }

  function readCourse(entry) {
    const manifest = JSON.parse(entry.manifest_json);
    const courseFile = path.resolve(entry.install_path, manifest.entry);
    const relative = path.relative(entry.install_path, courseFile);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(courseFile)) {
      markFault(entry.id, "Der Lerninhalt fehlt. Das Modul wurde deaktiviert, andere Module bleiben unberührt.");
      fail("module-faulted", "Der Lerninhalt fehlt. Das Modul wurde deaktiviert, andere Module bleiben unberührt.");
    }
    for (const relativeFile of manifest.files) {
      const full = path.resolve(entry.install_path, relativeFile);
      if (!fs.existsSync(full) || hashFile(full) !== expectedHash(entry, relativeFile)) {
        markFault(entry.id, "Die Integrität des Moduls stimmt nicht. Es wurde nicht gelöscht und nicht ausgeführt.");
        fail("module-faulted", "Die Integrität des Moduls stimmt nicht. Es wurde nicht gelöscht und nicht ausgeführt.");
      }
    }
    try {
      return { manifest, course: JSON.parse(fs.readFileSync(courseFile, "utf8")) };
    } catch (error) {
      markFault(entry.id, "Der Lerninhalt ist beschädigt. Das Modul wurde deaktiviert.");
      fail("module-faulted", "Der Lerninhalt ist beschädigt. Das Modul wurde deaktiviert.");
    }
  }

  function expectedHash(entry, relativeFile) {
    const manifest = JSON.parse(entry.manifest_json);
    return manifest.fileHashes ? manifest.fileHashes[relativeFile] : null;
  }

  const api = {
    available: registry.available,
    code: registry.code || null,
    message: registry.message || null,
    path: registry.path,
    packageRoot,
    coreVersion,
    close() {
      registry.close();
    },
    list() {
      const installed = registry.available
        ? registry.db.prepare("SELECT * FROM module_install ORDER BY id").all().map(publicRow)
        : [];
      return { platform: BUNDLED_PLATFORM, installed, available: registry.available, message: registry.message || null };
    },
    notices() {
      if (!registry.available) return [];
      return registry.db.prepare("SELECT id, module_id, level, message, created_at FROM module_notice ORDER BY id DESC LIMIT 20").all();
    },
    preview(sourceDir) {
      requireRegistry();
      const pack = readPackage(sourceDir);
      const existing = row(pack.manifest.id);
      return {
        sourceDir: pack.root,
        id: pack.manifest.id,
        name: pack.manifest.name,
        version: pack.manifest.version,
        publisher: pack.manifest.publisher.name,
        trust: pack.manifest.trust,
        permissions: pack.manifest.permissions.slice(),
        replaces: existing && existing.state !== "uninstalled" ? existing.version : null
      };
    },
    installFromDirectory(sourceDir) {
      requireRegistry();
      const pack = readPackage(sourceDir);
      if (!satisfies(coreVersion, pack.manifest.core)) {
        fail("incompatible-core", "Das Modul passt nicht zu dieser Core-Version. Es wurde nicht installiert.", { core: coreVersion, required: pack.manifest.core });
      }
      verifyTrust(pack.manifest, pack.files);
      dependencyState(pack.manifest);
      const existing = row(pack.manifest.id);
      if (existing && existing.state !== "uninstalled") {
        const previous = JSON.parse(existing.manifest_json);
        if (!previous.publisher || previous.publisher.id !== pack.manifest.publisher.id) {
          fail("publisher-mismatch", "Ein anderes Modul mit dieser ID ist bereits installiert. Lernstände werden nicht übernommen.");
        }
        if (previous.trust !== pack.manifest.trust) {
          fail("trust-mismatch", "Die Vertrauensstufe eines installierten Moduls wird nicht stillschweigend geändert.");
        }
        if (compare(pack.manifest.version, existing.version) < 0) {
          fail("downgrade-blocked", "Ein älteres Modulpaket ersetzt keine neuere Installation.");
        }
      }
      if (pack.manifest.id === BUNDLED_PLATFORM.id) {
        fail("reserved-id", "Die gebündelte Plattform kann nicht als Paket installiert werden.");
      }
      const dest = path.join(packageRoot, pack.manifest.id, pack.manifest.version);
      const incoming = dest + ".incoming";
      fs.rmSync(incoming, { recursive: true, force: true });
      fs.mkdirSync(incoming, { recursive: true });
      const fileHashes = {};
      for (const [relative, file] of Object.entries(pack.files)) {
        const target = path.resolve(incoming, relative);
        const inside = path.relative(path.resolve(incoming), target);
        if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) fail("bad-file", "Zielpfad verlässt das Modulverzeichnis.");
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(file.full, target);
        fileHashes[relative] = file.sha256;
      }
      if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
      fs.renameSync(incoming, dest);
      const stored = Object.assign({}, pack.manifest, { fileHashes, sizeBytes: pack.size });
      const at = (options.now || (() => new Date()))().toISOString();
      registry.db.prepare(`
        INSERT INTO module_install (id, version, trust, state, manifest_json, install_path, installed_at, fault_reason, size_bytes)
        VALUES (?, ?, ?, 'active', ?, ?, ?, NULL, ?)
        ON CONFLICT(id) DO UPDATE SET
          version = excluded.version,
          trust = excluded.trust,
          state = 'active',
          manifest_json = excluded.manifest_json,
          install_path = excluded.install_path,
          installed_at = excluded.installed_at,
          fault_reason = NULL,
          size_bytes = excluded.size_bytes
      `).run(pack.manifest.id, pack.manifest.version, pack.manifest.trust, JSON.stringify(stored), dest, at, pack.size);
      notice(pack.manifest.id, pack.manifest.signature ? "info" : "warn", pack.manifest.signature
        ? "Modul installiert."
        : "Modul ohne Signatur installiert. Es gilt als ungeprüft und erhält keine erweiterten Rechte.");
      return publicRow(row(pack.manifest.id));
    },
    setState(id, state) {
      requireRegistry();
      if (state !== "active" && state !== "disabled") fail("bad-state", "Nur aktiv oder deaktiviert ist erlaubt.");
      const current = row(id);
      if (!current || current.state === "uninstalled") fail("missing-module", "Das Modul ist nicht installiert.");
      if (current.state === "faulted" && state === "active") {
        fail("module-faulted", "Ein fehlerhaftes Modul wird nicht automatisch wieder aktiviert.");
      }
      registry.db.prepare("UPDATE module_install SET state = ? WHERE id = ?").run(state, id);
      return publicRow(row(id));
    },
    uninstall(id, choice) {
      requireRegistry();
      if (!choice || choice.confirm !== true) fail("cancelled", "Ohne Bestätigung wird nichts deinstalliert und nichts gelöscht.");
      const current = row(id);
      if (!current || current.state === "uninstalled") fail("missing-module", "Das Modul ist nicht installiert.");
      const expected = path.resolve(packageRoot, current.id, current.version);
      if (path.resolve(current.install_path) !== expected) {
        fail("bad-path", "Der gespeicherte Modulpfad ist nicht der Installationspfad. Es wurde nichts gelöscht.");
      }
      if (fs.existsSync(expected) && fs.lstatSync(expected).isSymbolicLink()) {
        fail("bad-path", "Ein Symlink wird nicht entfernt. Es wurde nichts gelöscht.");
      }
      if (fs.existsSync(expected)) fs.rmSync(expected, { recursive: true, force: true });
      registry.db.prepare("UPDATE module_install SET state = 'uninstalled', fault_reason = NULL WHERE id = ?").run(id);
      const kept = registry.db.prepare("SELECT COUNT(*) AS count FROM module_kv WHERE module_id = ?").get(id).count;
      notice(id, "info", "Moduldateien entfernt. Lernstände bleiben erhalten (" + kept + ").");
      return { id, state: "uninstalled", progressKept: kept };
    },
    open(id) {
      requireRegistry();
      if (id === BUNDLED_PLATFORM.id) return { kind: "bundled", href: "/index.html", module: BUNDLED_PLATFORM };
      const current = row(id);
      if (!current || current.state === "uninstalled") fail("missing-module", "Das Modul ist nicht installiert.");
      if (current.state === "disabled") fail("module-disabled", "Das Modul ist deaktiviert. Der Core und andere Module bleiben nutzbar.");
      if (current.state === "faulted") fail("module-faulted", current.fault_reason || "Das Modul ist deaktiviert.");
      const loaded = readCourse(current);
      const progress = api.progress(id);
      return {
        kind: "module",
        module: publicRow(current),
        course: sanitizeCourse(loaded.course),
        progress
      };
    },
    progress(id, value) {
      requireRegistry();
      const current = row(id);
      if (!current) fail("missing-module", "Das Modul ist nicht installiert.");
      if (arguments.length < 2) {
        const saved = registry.db.prepare("SELECT value FROM module_kv WHERE module_id = ? AND key = 'progress'").get(id);
        return saved ? JSON.parse(saved.value) : { tasks: {}, assessment: {} };
      }
      const manifest = JSON.parse(current.manifest_json);
      if (!manifest.permissions.includes("progress.write")) fail("permission-denied", "Dieses Modul darf keine Lernstände schreiben.");
      const encoded = JSON.stringify(value);
      if (encoded.length > 200000) fail("invalid-value", "Der Lernstand ist zu groß und wurde nicht gespeichert.");
      registry.db.prepare(`
        INSERT INTO module_kv (module_id, key, value, updated_at) VALUES (?, 'progress', ?, ?)
        ON CONFLICT(module_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(id, encoded, (options.now || (() => new Date()))().toISOString());
      return JSON.parse(encoded);
    },
    check(id, taskId, response) {
      requireRegistry();
      const current = row(id);
      if (!current || current.state !== "active") fail("module-disabled", "Die Aufgabe kann nur in einem aktiven Modul geprüft werden.");
      const loaded = readCourse(current);
      const found = findTask(loaded.course, taskId);
      if (!found) fail("missing-task", "Diese Aufgabe gibt es in dem Modul nicht.");
      const correct = grade(found, response);
      const progress = api.progress(id);
      if (found.kind === "assessment") progress.assessment[taskId] = { correct, at: (options.now || (() => new Date()))().toISOString() };
      else progress.tasks[taskId] = { correct, at: (options.now || (() => new Date()))().toISOString() };
      api.progress(id, progress);
      return { correct, hint: correct ? "" : asText(found.hint, 400), solution: null };
    },
    exportModule(id) {
      requireRegistry();
      const current = row(id);
      if (!current) fail("missing-module", "Das Modul ist nicht installiert.");
      const items = {};
      for (const entry of registry.db.prepare("SELECT key, value FROM module_kv WHERE module_id = ? ORDER BY key").all(id)) {
        items[entry.key] = entry.value;
      }
      const body = {
        format: EXPORT_FORMAT,
        formatVersion: EXPORT_FORMAT_VERSION,
        moduleId: id,
        moduleVersion: current.version,
        items
      };
      return JSON.stringify(Object.assign({ checksum: checksumOf(body) }, body));
    },
    importModule(id, raw, choice) {
      requireRegistry();
      if (!choice || choice.confirm !== true) fail("cancelled", "Ohne Bestätigung wird nichts importiert.");
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        fail("invalid-import", "Die Importdatei ist kein JSON. Es wurde nichts geändert.");
      }
      if (parsed.format !== EXPORT_FORMAT || parsed.moduleId !== id) {
        fail("invalid-import", "Die Datei gehört nicht zu diesem Modul. Es wurde nichts geändert.");
      }
      const body = Object.assign({}, parsed);
      delete body.checksum;
      if (parsed.checksum !== checksumOf(body)) fail("invalid-import", "Die Prüfsumme stimmt nicht. Es wurde nichts geändert.");
      if (choice.mode !== "replace" && choice.mode !== "merge") fail("invalid-import", "Der Importmodus fehlt. Es wurde nichts geändert.");
      const before = registry.db.prepare("SELECT key, value FROM module_kv WHERE module_id = ?").all(id);
      try {
        if (choice.mode === "replace") registry.db.prepare("DELETE FROM module_kv WHERE module_id = ?").run(id);
        const at = (options.now || (() => new Date()))().toISOString();
        for (const [key, value] of Object.entries(parsed.items || {})) {
          if (choice.mode === "merge") {
            const exists = registry.db.prepare("SELECT key FROM module_kv WHERE module_id = ? AND key = ?").get(id, key);
            if (exists) continue;
          }
          registry.db.prepare("INSERT INTO module_kv (module_id, key, value, updated_at) VALUES (?, ?, ?, ?)").run(id, key, String(value), at);
        }
      } catch (error) {
        registry.db.prepare("DELETE FROM module_kv WHERE module_id = ?").run(id);
        for (const entry of before) {
          registry.db.prepare("INSERT INTO module_kv (module_id, key, value, updated_at) VALUES (?, ?, ?, ?)").run(id, entry.key, entry.value, (options.now || (() => new Date()))().toISOString());
        }
        fail("import-failed", "Der Import wurde abgebrochen und der vorherige Stand wiederhergestellt.");
      }
      return { id, mode: choice.mode };
    }
  };

  return api;
}

function findTask(course, taskId) {
  const sections = Array.isArray(course.sections) ? course.sections : [];
  for (const section of sections) {
    for (const lesson of section.lessons || []) {
      for (const block of lesson.blocks || []) {
        if (block.id === taskId) return Object.assign({ kind: "task" }, block);
      }
    }
  }
  const questions = course.assessment && course.assessment.questions;
  if (Array.isArray(questions)) {
    for (const question of questions) {
      if (question.id === taskId) return Object.assign({ kind: "assessment" }, question);
    }
  }
  return null;
}

function grade(task, response) {
  if (Array.isArray(task.choices)) return Number(response) === Number(task.answer);
  return asText(response, 200).trim().toLowerCase() === asText(task.answer, 200).trim().toLowerCase();
}

module.exports = {
  EXPORT_FORMAT,
  BUNDLED_PLATFORM,
  createModuleManager,
  readPackage,
  sanitizeCourse
};
