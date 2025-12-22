/**
 * Parse forced movement text (push/pull).
 * Handles prefixes like "✦", "★", "✸", or "Effect:" gracefully.
 *
 * @param {string} text - raw tier chunk
 * @returns {Object|null} movement object { name, distance } or null
 */
export function parseMovement(text = "") {
  // Strip common prefixes and symbols
  const cleaned = text
    .replace(/^Effect:\s*/i, "")
    .replace(/^[✦★✸]\s*/, "")
    .trim();

  // Regex: match "push 1", "pull 2", etc.
  const movementRegex = /\b(push|pull)\s+(\d+)\b/i;
  const match = cleaned.match(movementRegex);

  console.log("🔎 parseMovement input:", text);
  console.log("🧹 Cleaned text:", cleaned);
  console.log("🔎 parseMovement regex match:", match);

  if (!match) return null;

  return {
    name: match[1].toLowerCase(),
    distance: Number(match[2])
  };
}