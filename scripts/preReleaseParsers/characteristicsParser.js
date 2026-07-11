// scripts/preReleaseParsers/characteristicsParser.js
import { characteristicMap } from "../keywordParser.js";

/**
 * Parse characteristics from lines, supporting both initials (A/R/M/I/P)
 * and full words (Might/Agility/Reason/Intuition/Presence).
 * Handles unicode minus (−) and plus (+).
 */
export function parseCharacteristics(lines = []) {
  // Initialize defaults
  const result = {
    might: { value: 0 },
    agility: { value: 0 },
    reason: { value: 0 },
    intuition: { value: 0 },
    presence: { value: 0 }
  };

  // Build patterns for initials and words
  const wordMap = {
    might: ["M", "Might"],
    agility: ["A", "Agility"],
    reason: ["R", "Reason"],
    intuition: ["I", "Intuition"], // ensure normalization fixed IntuiƟon → Intuition first
    presence: ["P", "Presence"]
  };

  // Precompile regexes for each characteristic
  const regexes = Object.entries(wordMap).reduce((acc, [key, labels]) => {
    // e.g., /(M|Might)\s*[+−-]?\s*\d+/
    acc[key] = new RegExp(`\\b(${labels.join("|")})\\s*[+−-]?\\s*\\d+`, "i");
    return acc;
  }, {});

  // Scan all lines; last occurrence wins
  for (const rawLine of lines) {
    const line = rawLine
      .replace(/−/g, "-")         // normalize unicode minus
      .replace(/IntuiƟon/gi, "Intuition"); // hard patch if needed

    for (const [key, re] of Object.entries(regexes)) {
      const m = line.match(re);
      if (!m) continue;

      // extract trailing signed integer
      const valueMatch = m[0].match(/[+−-]?\s*\d+/);
      if (!valueMatch) continue;

      const cleaned = valueMatch[0].replace(/\s+/g, "").replace("−", "-");
      const val = parseInt(cleaned, 10);
      if (!Number.isNaN(val)) {
        result[key] = { value: val };
      }
    }
  }

  return result;
}