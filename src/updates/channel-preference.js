"use strict";

// Die gewaehlte Updatequelle liegt in der vorhandenen Einstellungsablage (kv) unter diesem Schluessel.
// Ohne gespeicherte oder bei ungueltiger Wahl gilt STABLE.
const PREFERENCE_KEY = "academy.updateChannel";
const VALID = ["dev", "beta", "stable"];

function normalizeChannel(value) {
  const text = String(value == null ? "" : value).trim().toLowerCase();
  return VALID.includes(text) ? text : "stable";
}

function isChannelName(value) {
  return VALID.includes(value);
}

function readPreference(store) {
  try {
    return normalizeChannel(store && typeof store.get === "function" ? store.get(PREFERENCE_KEY) : "");
  } catch (error) {
    return "stable";
  }
}

module.exports = { PREFERENCE_KEY, VALID, normalizeChannel, isChannelName, readPreference };
