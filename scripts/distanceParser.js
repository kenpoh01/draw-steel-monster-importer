// distanceParser.js
import { parseTarget } from "./tierParser.js";

/**
 * Parses a distance/target line like:
 *   "4 cube within 20 Each enemy in the area"
 *   "Melee 2 Two creatures or objects"
 *   "Ranged 10 One creature"
 *   "10 × 1 line within 1"
 *   "5 burst"
 *   "Aura 3"
 *   "Self"
 *
 * Returns structured distance + target objects.
 */
export function parseDistanceLine(line = "") {
  if (!line || typeof line !== "string") return null;

  // Strip optional leading "e " (legacy format)
  const raw = line.startsWith("e ") ? line.slice(2).trim() : line.trim();
  const lowerRaw = raw.toLowerCase();

  // --- SPLIT DISTANCE + TARGET ---------------------------------------------
  // Look for the start of a target phrase (each, all, one, two, any, every)
  const targetStart = lowerRaw.search(/\b(each|all|every|one|two|three|any)\b/);

  let distancePart = raw;
  let targetPart = "";

  if (targetStart > 0) {
    distancePart = raw.slice(0, targetStart).trim();
    targetPart = raw.slice(targetStart).trim();
  }

  let distance = {};
  const target = parseTarget(targetPart);

// -------------------------
// X <shape> within Y
// -------------------------
const withinRegex = /(\d+)\s*(cube|burst|line|cone)\s+within\s+(\d+)/i;
const withinMatch = distancePart.match(withinRegex);
if (withinMatch) {
  distance = {
    type: withinMatch[2].toLowerCase(),
    primary: Number(withinMatch[1]),
    secondary: null,
    tertiary: Number(withinMatch[3])
  };
  return { distance, target };
}

  // --- WALL -----------------------------------------------------------------
  const wallMatch = distancePart.match(/^(\d+)\s+wall\s+within\s+(\d+)$/i);
  if (wallMatch) {
    const [, primary, secondary] = wallMatch;
    distance = {
      type: "wall",
      primary: parseInt(primary),
      secondary: parseInt(secondary)
    };
    return { distance, target };
  }

  // --- LINE (A × B line within C) ------------------------------------------
  const lineMatch = distancePart.match(/(\d+)\s*[×x]\s*(\d+)\s+(\w+)\s+within\s+(\d+)/i);
  if (lineMatch) {
    const [, primary, secondary, shape, range] = lineMatch;
    distance = {
      type: shape.toLowerCase(),
      primary: parseInt(primary),
      secondary: parseInt(secondary),
      tertiary: parseInt(range)
    };
    return { distance, target };
  }

  // --- CUBE -----------------------------------------------------------------
  const cubeMatch = distancePart.match(/^(\d+)\s+cube\s+within\s+(\d+)$/i);
  if (cubeMatch) {
    const [, size, range] = cubeMatch;
    distance = {
      type: "cube",
      primary: parseInt(size),
      secondary: parseInt(range)
    };
    return { distance, target };
  }

  // --- BURST ----------------------------------------------------------------
  const burstMatch = distancePart.match(/^(\d+)\s+burst$/i);
  if (burstMatch) {
    const [, size] = burstMatch;
    distance = {
      type: "burst",
      primary: parseInt(size)
    };
    return { distance, target };
  }

  // --- AURA -----------------------------------------------------------------
  const auraMatch = distancePart.match(/^(\d+)\s+aura$|^aura\s+(\d+)$/i);
  if (auraMatch) {
    const size = parseInt(auraMatch[1] || auraMatch[2]);
    distance = {
      type: "aura",
      primary: size
    };
    return { distance, target };
  }

  // --- MELEE / RANGED / REACH (with number) --------------------------------
  const typedRangeMatch = distancePart.match(/^(melee|ranged|reach)\s+(\d+)$/i);
  if (typedRangeMatch) {
    const [, type, amount] = typedRangeMatch;
    distance = {
      type: type.toLowerCase(),
      primary: parseInt(amount)
    };
    return { distance, target };
  }

  // --- SELF -----------------------------------------------------------------
  if (/^self$/i.test(distancePart)) {
    distance = {
      type: "self",
      primary: 0
    };
    return { distance, target };
  }

  // --- MELEE / RANGED (no number) ------------------------------------------
  const simpleMatch = distancePart.match(/^(melee|ranged)$/i);
  if (simpleMatch) {
    distance = {
      type: simpleMatch[1].toLowerCase(),
      primary: 0
    };
    return { distance, target };
  }

if (/^self\s+self$/i.test(raw)) {
  return {
    distance: { type: "self", primary: 0 },
    target: { type: "self", value: null }
  };
}

  // --- FALLBACK -------------------------------------------------------------
  distance = { type: "special" };
  return { distance, target };
}

// Alias for compatibility
export const parseDistanceAndTarget = parseDistanceLine;