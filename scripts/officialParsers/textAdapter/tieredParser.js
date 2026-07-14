// scripts/officialParsers/textAdapter/tieredParser.js

import { enrichNarrative } from "../../narrativeUtils.js";
import { parseDistanceLine } from "../../distanceParser.js";
import { parseTarget, parseTiers } from "../../tierParser.js";
import { injectConditionEnrichersIntoText } from "../../helpers/enricherInjector.js";

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
    .replace(/\d+\s+malice$/i, "")      // remove trailing malice cost
    .trim();
}

/**
 * Extract the action-economy type. Matches the game system's actual
 * dropdown enum exactly: main, maneuver, freeManeuver, triggered,
 * freeTriggered, move, none, villain — confirmed directly against the
 * system's own system.type <select> markup, so this isn't a guess.
 *
 * "move action" -> "move" specifically checks for the two-word phrase,
 * not a bare "move" search — "move" alone is an extremely common word
 * in ordinary ability narrative ("the target can move up to its
 * speed"), so a bare substring match would misfire constantly.
 */
function extractActionType(lines) {
  const joined = lines.join(" ").toLowerCase();

  if (joined.includes("free maneuver")) return "freeManeuver";
  if (joined.includes("free triggered action")) return "freeTriggered";
  if (joined.includes("triggered action")) return "triggered";
  if (joined.includes("main action")) return "main";
  if (joined.includes("move action")) return "move";
  if (joined.includes("maneuver")) return "maneuver";
  if (joined.includes("villain action")) return "villain";
  if (joined.includes("no action")) return "none";

  return "main";
}

/**
 * Extract the ability's category/tier (signature, heroic, villain,
 * main). This is a DIFFERENT field from the action-economy type above —
 * an ability can be a "Signature Ability" that uses a "Main action" at
 * the same time, so these must be detected independently rather than
 * sharing one result (a signature ability was previously never actually
 * tagged "signature", since the "main action" check ran first and
 * matched instead).
 */
function extractAbilityCategory(lines) {
  const joined = lines.join(" ").toLowerCase();

  if (joined.includes("signature ability")) return "signature";
  if (joined.includes("villain action")) return "villain";
  if (joined.includes("heroic")) return "heroic";

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
  const header = lines[0];

  lines[0] = lines[0].replace(/^(?:[mtglfbcdr!\)]|a(?=\s[A-Z]))\s+/, "");

  // Extract name
  const name = extractAbilityName(lines[0]);


// ---------------------------------------------
// MALICE COST IN HEADER (e.g. "3 Malice")
// ---------------------------------------------
let maliceCost = null;
const maliceMatch = header.match(/(\d+)\s+malice$/i);
if (maliceMatch) {
  maliceCost = parseInt(maliceMatch[1]);
  console.log("🔥 Malice cost detected:", maliceCost);
}

  // Extract action-economy type and ability category independently —
  // they're different fields (see extractActionType/extractAbilityCategory).
  const actionType = extractActionType(lines);
  const category = extractAbilityCategory(lines);

  // Extract keywords
  const keywords = lines.length > 1 ? extractKeywords(lines[1]) : [];

  // Distance + target
  let distance = null;
  let target = null;

  if (lines.length > 2) {
    const dt = parseDistanceLine("e " + lines[2]);

    if (dt) {
      distance = dt.distance;
      target = dt.target;
    }
  }

  // -------------------------
  // TIER LINES
  // -------------------------
  // A tier section can wrap across multiple physical lines (e.g. "! 19
  // damage; pull 6; the target is slowed (save ends) unless their" /
  // "player gives Peero a compliment they haven't heard before" is ONE
  // tier's text across two lines). Only the first physical line of each
  // tier carries the marker — the rest must be captured too, or that
  // trailing text is lost entirely rather than just misfiled.
  const TIER_START_RE =
    /^(?:[áéí]|[!@#]|[✦★✸]|(?:≤|<=|<)\s*1[0-1]\b|1[2-6]\s*[–-]\s*1[2-6]\b|1[7-9]\+(?=\D|$))/;
  const LABEL_RE = /^(effect|trigger|special)\s*:/i;

  let tierStartIndex = lines.findIndex(l => TIER_START_RE.test(l.trim()));
  let tierSectionEndIndex = tierStartIndex; // exclusive

  if (tierStartIndex !== -1) {
    let tiersSeen = 1;
    tierSectionEndIndex = tierStartIndex + 1;
    for (let i = tierStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (LABEL_RE.test(line)) break;

      if (TIER_START_RE.test(line)) {
        tiersSeen++;
        tierSectionEndIndex = i + 1;
        continue;
      }

      // A capitalized line after all 3 tiers are already found is
      // trailing narrative, not more tier text — genuine wrapped tier
      // continuations in practice always start lowercase, since they're
      // literally the middle of a sentence fragment.
      if (tiersSeen >= 3 && /^[A-Z]/.test(line)) break;

      tierSectionEndIndex = i + 1;
    }
  }

  const tierSectionLines =
    tierStartIndex !== -1 ? lines.slice(tierStartIndex, tierSectionEndIndex) : [];

  let t1 = null, t2 = null, t3 = null;
  if (tierSectionLines.length) {
    const parsed = parseTiers(tierSectionLines.join("\n"));
    t1 = parsed.t1;
    t2 = parsed.t2;
    t3 = parsed.t3;
  }

  // Highest characteristic
  const highest = headerObj?.highestCharacteristic ?? "might";

  // -------------------------
  // TRIGGER / EFFECT / SPECIAL
  // -------------------------
  // Single forward pass: skip the fixed name/keyword/distance preamble
  // and the tier section (already captured above), then attribute every
  // remaining line to whichever labeled paragraph is currently open —
  // "Trigger:" goes to the trigger field, "Effect:"/"Special:" go to
  // effect.before or effect.after depending on whether they fall before
  // or after the tier section. A line with no label yet still gets
  // folded into whichever paragraph is currently open (multi-line
  // wrapping), and any trailing narrative with no explicit label at all
  // (common right after the tier lines) is still captured as
  // effect.after rather than silently dropped.
  let trigger = "";
  let effectBefore = "";
  let effectAfter = "";
  let mode = null; // "trigger" | "before" | "after" | null

  const preambleEnd = Math.min(3, lines.length);

  for (let i = 0; i < lines.length; i++) {
    if (i < preambleEnd) continue;
    if (tierStartIndex !== -1 && i >= tierStartIndex && i < tierSectionEndIndex) continue;

    if (tierStartIndex !== -1 && i === tierSectionEndIndex && mode === "before") {
      mode = "after";
    }

    const line = lines[i].trim();
    if (!line) continue;

    const labelMatch = line.match(/^(effect|trigger|special)\s*:\s*(.*)/i);
    if (labelMatch) {
      const label = labelMatch[1].toLowerCase();
      const remainder = labelMatch[2];

      if (label === "trigger") {
        mode = "trigger";
        if (remainder) trigger += remainder + " ";
        continue;
      }

      const prefix = label === "special" ? "Special: " : "";
      mode = (tierStartIndex === -1 || i < tierStartIndex) ? "before" : "after";
      if (remainder) {
        if (mode === "before") effectBefore += prefix + remainder + "\n";
        else effectAfter += prefix + remainder + "\n";
      }
      continue;
    }

    if (mode === "trigger") {
      trigger += line + " ";
    } else if (mode === "before") {
      effectBefore += line + "\n";
    } else if (mode === "after") {
      effectAfter += line + "\n";
    } else if (tierStartIndex === -1 || i < tierStartIndex) {
      effectBefore += line + "\n";
    } else if (i >= tierSectionEndIndex) {
      effectAfter += line + "\n";
    }
  }

  trigger = trigger.trim();
  effectBefore = effectBefore.trim();
  effectAfter = effectAfter.trim();

  // First enrich narrative normally
  effectBefore = enrichNarrative(effectBefore);
  effectAfter = enrichNarrative(effectAfter);

  // Then inject clickable condition enrichers (no mechanical effects)
  effectBefore = injectConditionEnrichersIntoText(effectBefore);
  effectAfter = injectConditionEnrichersIntoText(effectAfter);

  // -------------------------
  // BUILD ABILITY OBJECT
  // -------------------------
  const ability = {
    name,
    type: "ability",
    img: "icons/skills/melee/strike-polearm-glowing-white.webp",

    system: {
      type: actionType,
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
        before: effectBefore,
        after: effectAfter
      },

      spend: { text: "", value: null },
      source: { book: "", page: "", license: "" },
      story: "",
      resource: maliceCost,
      trigger
    },

    t1,
    t2,
    t3,

    effects: [],
    folder: null,
    flags: {}
  };

  return ability;
}