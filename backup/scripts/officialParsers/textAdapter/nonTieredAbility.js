// scripts/officialParsers/textAdapter/nonTieredAbility.js

import { enrichNarrative } from "../../narrativeUtils.js";
import { parseDistanceLine } from "../../distanceParser.js";
import { parseTarget } from "../../tierParser.js";

/**
 * Extract the ability name from the header line.
 */
function extractAbilityName(header) {
  return header
    .replace(/\d+d\d+.*/i, "")          // remove dice + bonus
    .replace(/Triggered action/i, "")   // remove triggered tag
    .replace(/Villain Action.*/i, "")   // remove villain tag
    .replace(/Maneuver/i, "")           // remove maneuver tag
    .trim();
}

/**
 * Extract category (main, triggered, villain, maneuver, signature)
 */
function extractAbilityCategory(lines) {
  const joined = lines.join(" ").toLowerCase();

  if (joined.includes("main action")) return "main";
  if (joined.includes("triggered action")) return "triggered";
  if (joined.includes("villain action")) return "villain";
  if (joined.includes("maneuver")) return "maneuver";
  if (joined.includes("signature ability")) return "signature";

  return "main";
}

/**
 * Extract keywords from the second line.
 */
function extractKeywords(line) {
  const cleaned = line
    .replace(/Main action/i, "")
    .replace(/Triggered action/i, "")
    .replace(/Villain Action/i, "")
    .replace(/Maneuver/i, "")
    .trim();

  return cleaned
    .split(/[,;]/)
    .map(k => k.trim())
    .filter(Boolean);
}

/**
 * Extract distance + target from lines like:
 *   "Self"
 *   "Melee 2 One creature"
 */
function extractDistanceAndTarget(line) {
  return {
    distance: parseDistanceLine(line),
    target: parseTarget(line)
  };
}

/**
 * Parse a non-tiered ability block into a full Draw Steel item.
 */
export function parseNonTieredAbility(lines, headerObj) {
  const header = lines[0];
  const name = extractAbilityName(header);
  const category = extractAbilityCategory(lines);

  const keywords = lines.length > 1 ? extractKeywords(lines[1]) : [];

  let distance = null;
  let target = null;

  if (lines.length > 2) {
    const dt = extractDistanceAndTarget(lines[2]);
    distance = dt.distance;
    target = dt.target;
  }

  // Effect lines
  let effectAfter = "";
  for (const line of lines) {
    if (/^Effect/i.test(line)) {
      effectAfter += `<p>${enrichNarrative(line)}</p>`;
      continue;
    }
  }

  const highest = headerObj?.highestCharacteristic ?? "might";

  return {
    name,
    type: "ability",
    img: "icons/skills/melee/strike-polearm-glowing-white.webp",

    system: {
      type: category,
      category,
      keywords,
      distance,
      target,
      damageDisplay: distance?.type || "melee",

      highestCharacteristic: highest,

      power: {
        roll: {
          formula: "@chr",
          characteristics: [highest]
        },
        effects: {}
      },

      effect: {
        before: "",
        after: effectAfter
      },

      spend: { text: "", value: null },
      source: { book: "", page: "", license: "" },
      story: "",
      resource: null,
      trigger: "",
      _dsid: name.toLowerCase().replace(/\s+/g, "-")
    },

    t1: null,
    t2: null,
    t3: null,

    effects: [],
    folder: null,
    flags: {}
  };
}