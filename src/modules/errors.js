"use strict";

class ModuleError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "ModuleError";
    this.code = code;
    this.details = details || null;
  }
}

module.exports = { ModuleError };
