// distanceParser.js
import { parseTarget } from "./tierParser.js";
import { normalizeText } from "./normalizeText.js";

/**
 * Parses a distance/target line like:
 *   "4 cube within 20 x Each enemy in the area"
 *   "Melee 2 x Two creatures or objects"
 *   "Ranged 10 x One creature"
 *   "10 × 1 line within 1 x Each creature"
 *   "5 burst"
 *   "Aura 3"
 *   "Self"
 *
 * Supports:
 *   - modern official PDFs (symbol-letter prefixes + "x" separator)
 *   - prerelease format
 *   - older PDFs without "x"
 *   - OCR variants
 */
export function parseDistanceLine(line = "") {
  if (!line || typeof line !== "string") return null;

  // Normalize weird Unicode, NBSP, zero-width, etc.
  line = normalizeText(line);

  // Strip symbol-letter prefixes (modern PDFs + prerelease)
  // e.g., "e Ranged 10 x One creature"
  let raw = line.replace(/^[otglfebc\)dr!]\s+/, "").trim();
  const lowerRaw = raw.toLowerCase();

  // SPECIAL CASE: "Self x Self", "Self Self" (some PDF extractions drop the
  // separator character entirely and leave just a bare space)
  if (/^self\s*(?:[×x]\s*)?self$/i.test(lowerRaw)) {
    return {
      distance: { type: "self", primary: 0 },
      target:   { type: "self", value: null }
    };
  }

  // --- SPLIT ON A DISTANCE/TARGET SEPARATOR ----------------------------------
  // Priority: an explicit 🞋 target-glyph (some pre-release PDFs use this in
  // place of " x "), then " x ", then a fallback search for a recognizable
  // target phrase (older PDFs with no separator at all).
  let distancePart = raw;
  let targetPart = "";

  const targetGlyphIndex = raw.indexOf("🞋");
  const xIndex = raw.lastIndexOf(" x ");

  if (targetGlyphIndex !== -1) {
    distancePart = raw.slice(0, targetGlyphIndex).trim();
    targetPart   = raw.slice(targetGlyphIndex + 1).trim();
  } else if (xIndex !== -1) {
    distancePart = raw.slice(0, xIndex).trim();
    targetPart   = raw.slice(xIndex + 3).trim();
  } else {
    // fallback to old-style target detection
    const targetStart = lowerRaw.search(/\b(each|all|every|one|two|three|any|special|the triggering creature)\b/);
    if (targetStart > 0) {
      distancePart = raw.slice(0, targetStart).trim();
      targetPart   = raw.slice(targetStart).trim();
    }
  }

  // Strip symbol-letter prefix again if needed
  distancePart = distancePart.replace(/^[otglfebc\)dr!]\s+/, "");

  // Parse target using existing logic
  const target = parseTarget(targetPart);
  let distance = {};

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
  const cubeMatch = distancePart.match(/^(\d+)\s+cube\s+within\s+(\d+)\s*$/i);
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
  const burstMatch = distancePart.match(/^(\d+)\s+burst\b/i);
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

  // --- FALLBACK -------------------------------------------------------------
  distance = { type: "special" };
  return { distance, target };
}

// Alias for compatibility
export const parseDistanceAndTarget = parseDistanceLine;
