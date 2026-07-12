// scripts/officialMaliceParsers/maliceHeaderParser.js

/**
 * Parse a single official Draw Steel malice header line.
 *
 * Expected format (official PDFs):
 *   Guarding Gale 3 Malice
 *   Breath Weapon 2d10 + 3 5 Malice
 *   Scaleshatter Burst 2d10 + 3 7 Malice
 *   Viper Lash 2+ Malice          (a trailing "+" just means the
 *                                  ability's own text describes scaling
 *                                  further spend — the base cost is what
 *                                  matters for resource/trigger purposes)
 *
 * The parser assumes the caller has already ensured this line
 * *is* a malice header (block segmentation is now structural, not
 * dependent on a delimiter).
 */
export function parseMaliceHeader(line) {
  // Remove any leading/trailing whitespace just in case
  line = line.trim();

  // Capture:
  //   group 1 = name + optional damage formula
  //   group 2 = base cost (the trailing "+", if any, is intentionally
  //             not captured — it's a narrative "spend more" note, not a
  //             different cost)
  const match = line.match(/^(.+?)\s+(\d+)\+?\s+malice$/i);
  if (!match) return null;

  return {
    name: match[1].trim(),
    cost: parseInt(match[2], 10),
    category: "malice"
  };
}