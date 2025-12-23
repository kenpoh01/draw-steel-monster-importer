// scripts/officialMaliceParsers/maliceHeaderParser.js

/**
 * Parse a single official Draw Steel malice header line.
 *
 * Expected format (official PDFs):
 *   Guarding Gale 3 Malice
 *   Breath Weapon 2d10 + 3 5 Malice
 *   Scaleshatter Burst 2d10 + 3 7 Malice
 *
 * The parser assumes the caller has already ensured this line
 * *is* a malice header (e.g., via "*" delimiter in the main parser).
 */
export function parseMaliceHeader(line) {
  // Remove any leading/trailing whitespace just in case
  line = line.trim();

  // Capture:
  //   group 1 = name + optional damage formula
  //   group 2 = cost (last integer before "Malice")
  const match = line.match(/^(.+?)\s+(\d+)\s+malice$/i);
  if (!match) return null;

  return {
    name: match[1].trim(),
    cost: parseInt(match[2], 10),
    category: "malice"
  };
}