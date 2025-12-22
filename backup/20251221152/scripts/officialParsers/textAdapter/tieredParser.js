// scripts/officialParsers/textAdapter/tieredParser.js

import { enrichNarrative } from "../../narrativeUtils.js";
import { parseDistanceLine } from "../../distanceParser.js";
import { parseTarget, parseTiers } from "../../tierParser.js";

/**
 * Extract the ability name from the header line.
 */
function extractAbilityName(header) {
  return header
    .replace(/\d+d\d+.*/i, "")          // remove dice + bonus
    .replace(/Signature Ability/i, "")  // remove signature tag
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
 * Parse a unified ability block (tiered or non-tiered).
 */
export function parseAbilityBlock(lines, headerObj) {
  console.log("🛠 parseAbilityBlock START ----------------");
  console.log("📌 Raw lines:", lines);

  const header = lines[0];
  console.log("📌 Header line:", header);

  // Extract name
  const name = extractAbilityName(header);
  console.log("📛 Ability name:", name);

  // Extract category
  const category = extractAbilityCategory(lines);
  console.log("🏷 Category:", category);

  // Extract keywords
  const keywords = lines.length > 1 ? extractKeywords(lines[1]) : [];
  console.log("🔑 Keywords:", keywords);

  // Distance + target
  let distance = null;
  let target = null;

  if (lines.length > 2) {
    console.log("📏 Raw distance line:", lines[2]);
    const dt = parseDistanceLine("e " + lines[2]);
    console.log("📐 Parsed distance:", dt);

    if (dt) {
      distance = dt.distance;
      target = dt.target;
    }
  }

  console.log("📏 Final distance:", distance);
  console.log("🎯 Final target:", target);

  // -------------------------
  // TIER LINES
  // -------------------------
  const tierLines = lines.filter(l =>
    /^[!@#]/.test(l) ||
    /^[✦★✸]/.test(l) ||
    /^(T1|T2|T3|Tier 1|Tier 2|Tier 3)/i.test(l)
  );

  console.log("📚 Tier lines:", tierLines);

  let t1 = null, t2 = null, t3 = null;
  let tierStartIndex = -1;

  if (tierLines.length) {
    tierStartIndex = lines.findIndex(l => tierLines.includes(l));
    const parsed = parseTiers(tierLines.join("\n"));
    console.log("📊 Parsed tiers:", parsed);
    t1 = parsed.t1;
    t2 = parsed.t2;
    t3 = parsed.t3;
  }

  // Highest characteristic
  const highest = headerObj?.highestCharacteristic ?? "might";
  console.log("💪 Highest characteristic:", highest);

  // -------------------------
  // EFFECT BEFORE / AFTER
  // -------------------------
  let effectBefore = "";
  let effectAfter = "";
  let inEffect = false;
  let effectStartedAt = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Start of Effect block
    if (/^effect:/i.test(line)) {
      inEffect = true;
      effectStartedAt = i;

      const remainder = line.replace(/^effect:\s*/i, "");
      if (remainder) {
        if (tierStartIndex === -1 || i < tierStartIndex) effectBefore += remainder + "\n";
        else effectAfter += remainder + "\n";
      }
      continue;
    }

    // End of Effect block
    if (inEffect && /^\*/.test(line)) {
      inEffect = false;
      continue;
    }

    // Inside Effect block
    if (inEffect) {
      if (tierStartIndex === -1 || effectStartedAt < tierStartIndex) {
        effectBefore += line + "\n";
      } else {
        effectAfter += line + "\n";
      }
    }
  }

  effectBefore = effectBefore.trim();
  effectAfter = effectAfter.trim();

  // -------------------------
  // BUILD ABILITY OBJECT
  // -------------------------
  const ability = {
    name,
    type: "ability",
    img: "icons/skills/melee/strike-polearm-glowing-white.webp",

    system: {
      type: category,
      category,
      keywords,
      distance,
      target,
      damageDisplay: null,
      highestCharacteristic: highest,

      power: {
        roll: {
          formula: "@chr",
          characteristics: [highest]
        },
        effects: {}
      },

      effect: {
        before: effectBefore,
        after: effectAfter
      },

      spend: { text: "", value: null },
      source: { book: "", page: "", license: "" },
      story: "",
      resource: null,
      trigger: "",
      _dsid: name.toLowerCase().replace(/\s+/g, "-")
    },

    t1,
    t2,
    t3,

    effects: [],
    folder: null,
    flags: {}
  };

  console.log("🧩 FINAL ABILITY OBJECT:", ability);
  console.log("🛠 parseAbilityBlock END ----------------");

  return ability;
}