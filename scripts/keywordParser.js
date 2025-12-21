// KeywordParser that stores them in a centralized location

export const characteristicMap = {
  A: "agility", R: "reason", M: "might", I: "intuition", P: "presence"
};

export const validRoles = [
  "ambusher", "artillery", "brute", "controller", "defender",
  "harrier", "hexer", "leader", "minion", "mount", "solo", "support"
];

export const validOrganizations = [
  "minion", "horde", "platoon", "elite", "leader", "solo"
];

export const validMovementTypes = [
  "walk", "fly", "swim", "burrow", "climb", "teleport", "hover" // ✅ hover added
];

// ✅ Damage types supported for immunities/weaknesses
export const validDamageTypes = new Set([
  "acid", "corruption", "lightning", "fire", "cold", "poison",
  "psychic", "radiant", "necrotic", "force" // expand as needed
]);


export const validAncestryKeywords = [
  "abyssal", "accursed", "animal", "beast", "construct", "dragon",
  "elemental", "fey", "giant", "horror", "humanoid", "infernal",
  "plant", "swarm", "undead"
];

// ✅ Custom ancestry registry for future expansions
// NOTE: These are not yet implemented in the main rules.
// For now, parsers should ignore them and leave ancestry blank.
// When the system supports them, switch parser logic to use `allAncestries`.

export const customAncestryRegistry = new Set([
  "ooze" // first custom ancestry, future‑proofed
]);

// ✅ Unified ancestry set (official + custom)
// ⚠️ IMPORTANT: Parsers should continue to use `validAncestryKeywords`
// until custom ancestries are officially implemented.
// When ready, replace parser checks with `allAncestries` to include both.

export const allAncestries = new Set([
  ...validAncestryKeywords,
  ...customAncestryRegistry
]);

// New: full word list for characteristics
export const characteristicKeywords = [
  "Might",
  "Agility",
  "Reason",
  "Intuition",
  "Presence"
];

// Convenience regex
export const characteristicRegex = new RegExp(
  `(${characteristicKeywords.join("|")})\\s*([+-]?\\d+)`,
  "gi"
);


export const supportedConditions = new Set([
  "bleeding", "dazed", "grabbed", "frightened", "prone",
  "restrained", "slowed", "taunted", "weakened"
]);

// ✅ Custom effects not listed in Heroes book p.77
export const customEffectRegistry = new Set([
  "warped", "dragonsealed", "entangled", "phased", "corrupted",
  "marked", "unstable", "banished", "fractured", "blood soaked", "immolated"
]);


export const allConditions = new Set([
  ...supportedConditions,
  ...customEffectRegistry
]);


// ✅ Duration keywords used in condition and effect parsing
export const durationMap = {
  "eot": "endOfTurn",
  "end of turn": "endOfTurn",
  "start of turn": "startOfTurn",
  "save ends": "saveEnds",
  "until moved": "untilMoved",
  "until damaged": "untilDamaged",
  "until end of round": "endOfRound",
  "until end of encounter": "endOfEncounter"
};


/**
 * Checks whether a given text contains a known custom effect.
 * Returns the matched effect name if found, otherwise null.
 */
export function isCustomEffect(text) {
  const lowered = text.toLowerCase();
  for (const effect of customEffectRegistry) {
    if (lowered.includes(effect)) return effect;
  }
  return null;
}

/**
 * Heuristically determines whether a line is likely a keyword/action line.
 * Prevents misclassification of narrative lines like "They can..." as keywords.
 */
export function isLikelyKeywordLine(line) {
  const tokens = line.split(/(?:,\s*|\s+)(?=[A-Z])/).map(t => t.trim());
  const capitalized = tokens.filter(t => /^[A-Z]/.test(t));
  return capitalized.length >= 2 || /main action|maneuver|reaction|triggered|free maneuver/i.test(line);
}

export function parseKeywordLine(line) {
	//This type = special is for types of abilities and should remain special
  let type = "special";
  const keywords = [];

  // Split on comma OR space followed by capital letter
  const tokens = line.split(/(?:,\s*|\s+)(?=[A-Z])/).map(t => t.trim());

  for (const token of tokens) {
    const lowered = token.toLowerCase();

    if (lowered.includes("main action")) type = "main";
    else if (lowered.includes("maneuver")) type = "maneuver";
    else if (lowered.includes("reaction")) type = "reaction";
    else if (lowered.includes("triggered action") || lowered.includes("triggered")) type = "triggered";
    else if (lowered.includes("free maneuver")) type = "maneuver";
    else keywords.push(token);
  }

  return { type, keywords };
}


/**
 * Determines whether a line is narrative (not a keyword or structural line).
 */
export function isNarrativeLine(line) {
  if (!line || line.length < 2) return false;

  const trimmed = line.trim();

  if (/^[123áéí]\s+\d+/.test(trimmed)) return false;
  if (/^[A-Z][a-z]+(,\s*[A-Z][a-z]+)*\s+(Main|Triggered|Reaction|Maneuver) action$/i.test(trimmed)) return false;
  if (/^Effect:/i.test(trimmed)) return false;

  return /[.,!?;:"'()]/.test(trimmed);
}


/**
 * Utility: check ancestry keyword
 * - Returns normalized ancestry if valid
 * - Logs a warning if ancestry is in custom registry but not yet implemented
 * - Returns "" if unrecognized
 */
export function normalizeAncestry(raw) {
  if (!raw) return "";
  const lowered = raw.toLowerCase();

  if (validAncestryKeywords.includes(lowered)) {
    return lowered;
  }

  if (customAncestryRegistry.has(lowered)) {
    console.warn(`⚠️ Ancestry "${lowered}" is recognized but not yet implemented. Leaving blank.`);
    return "";
  }

  return "";
}

/**
 * Normalize an immunity/weakness string into { type, value }
 * - type must be in validDamageTypes
 * - value defaults to 1 if omitted
 */
export function normalizeResistance(raw) {
  if (!raw) return null;
  const parts = raw.trim().toLowerCase().split(/\s+/);
  const type = parts[0];
  const value = parseInt(parts[1], 10) || 1;

  if (validDamageTypes.has(type)) {
    return { type, value };
  }
  console.warn(`⚠️ Unknown damage type "${type}" in resistance parsing.`);
  return null;
}

