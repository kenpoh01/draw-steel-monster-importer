// scripts/movementParser.js

/**
 * Parse forced movement text (push/pull/slide/shift).
 * Supports optional "vertical" or "horizontal" prefixes.
 *
 * @param {string} text - raw tier chunk
 * @returns {Object|null} movement object { name, distance, direction } or null
 */
export function parseMovement(text = "") {
  const cleaned = text
    .replace(/^Effect:\s*/i, "")
    .replace(/^[✦★✸]\s*/, "")
    .trim();

  // Only allow: push, pull, slide, shift
  const movementRegex =
    /\b(?:vertical|horizontal)?\s*(push|pull|slide|shift)\s+(\d+)\b/i;

  const match = cleaned.match(movementRegex);
  if (!match) return null;

  const verb = match[1].toLowerCase();
  const distance = Number(match[2]);

  const direction =
    cleaned.includes("vertical") ? "vertical" :
    cleaned.includes("horizontal") ? "horizontal" :
    "none";

  return {
    name: verb,          // "push", "slide", etc.
    distance,            // 2
    direction            // "vertical", "horizontal", or "none"
  };
}