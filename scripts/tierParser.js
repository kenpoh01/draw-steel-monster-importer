// scripts/tierParser.js
import { parseDamage } from "./damageParser.js";
import { parseConditionEffect } from "./conditionParser.js";
import { parseMovement } from "./movementParser.js";
import { characteristicMap } from "./keywordParser.js";

/**
 * Parse a single tier line into structured data.
 * @param {string} text - The raw tier line text
 * @param {string} tier - "t1", "t2", or "t3" so we can assign potency
 */
export function parseTierText(text = "", tier = "t1") {
  const potencyMap = {
    t1: "@potency.weak",
    t2: "@potency.average",
    t3: "@potency.strong"
  };

  const result = {
    damage: null,
    forced: null,
    conditions: [],
    narrative: "",
    rawClauses: []
  };

  let working = text.toLowerCase();

  // Strip tier glyphs/labels
  working = working
    .replace(/^[[áéí✦★✸!@#]\s*/, "")
    .replace(/^(t1|tier 1|t2|tier 2|t3|tier 3)[:\-]?\s*/i, "")
    .replace(/^(?:≤|<=|<)\s*11\s*:?\s*/, "")
    .replace(/^12\s*[–-]\s*16\s*:?\s*/, "")
    .replace(/^17\+\s*:?\s*/, "")
    .trim();

  // -------------------------
  // DAMAGE
  // -------------------------
  const damage = parseDamage(working);
  if (damage) {
    result.damage = {
      value: damage.value,
      types: damage.types,
      properties: [],
      potency: { value: potencyMap[tier], characteristic: "none" }
    };

    working = working.replace(/(\d+)\s*[a-z]*\s*damage/i, "").trim();
  }

  // -------------------------
  // FORCED MOVEMENT
  // -------------------------
  const movement = parseMovement(working);
  if (movement) {
    result.forced = {
      movement: [movement.name],
      distance: String(movement.distance),
      properties: movement.direction !== "none" ? [movement.direction] : [],
      potency: { value: potencyMap[tier], characteristic: "none" },
      display: "{{forced}}"
    };

    working = working
      .replace(/\b(vertical|horizontal)?\s*(push|pull|slide|shift)\s+\d+\b/i, "")
      .trim();

    working = working.replace(/^,/, "").trim();
  }

  // -------------------------
  // CONDITIONS + NARRATIVE
  // -------------------------
  const clauses = working.split(";").map(s => s.trim()).filter(Boolean);

  for (const clause of clauses) {
    result.rawClauses.push(clause);

    const conditionEnd = detectConditionEnd(clause);

    // POTENCY (p<1], p<2], etc.) — tolerate a stray space after "<"
    // (some PDF extractions render "m< 2]" instead of "m<2]").
    let numericPotency = null;
    const potencyMatch = clause.match(/p<\s*(\d+)\]/i);
    if (potencyMatch) {
      numericPotency = Number(potencyMatch[1]);
    }

    // CHARACTERISTIC POTENCY (m<1], a<2], r<1], i<3], p<1])
    const charMatch = clause.match(/([marip])<\s*\d+\]/i);
    let characteristic = "none";
    if (charMatch) {
      const key = charMatch[1].toLowerCase();
      characteristic = {
        m: "might",
        a: "agility",
        r: "reason",
        i: "intuition",
        p: "presence"
      }[key] || "none";
    }

    // CONDITION TEXT — allow apostrophes (can't, doesn't) and any trailing
    // duration parenthetical, not just "(save ends)" specifically.
    let condMatch =
      clause.match(/\bthey\s+are\s+([a-z' ]+?)(?:\s*\([^)]*\))?$/i) ||
      clause.match(/\]\s*([a-z' ]+?)(?:\s*\([^)]*\))?$/i);

    if (condMatch) {
      const conditionText = condMatch[1].trim();
      const parsed = parseConditionEffect(conditionText);
      const names = Array.isArray(parsed.condition)
        ? parsed.condition
        : [parsed.condition];

      // IMPORTANT: potency stays a simple value, not an object
      const potencyValue =
        numericPotency !== null ? numericPotency : potencyMap[tier];

      for (const name of names) {
        if (!name) continue;

        result.conditions.push({
          name,
          end: conditionEnd,
          potency: potencyValue,
          characteristic
        });
      }
    } else {
      // A clause that's just a bare potency marker with nothing else
      // attached (e.g. "p<2]" gating the forced-movement effect handled
      // above, rather than a condition) carries no separate narrative —
      // don't leak the raw, unprocessed marker text.
      const bareMarker = /^(?:[marip]<\s*\d+\])\s*$/i.test(clause);
      if (!bareMarker) {
        result.narrative += clause + " ";
      }
    }
  }

  result.narrative = result.narrative.trim();
  return result;
}

/**
 * Detect a duration tag on a condition clause and normalize it to the
 * same "end" vocabulary durationParser.js already uses ("save", "turn",
 * "round", "encounter"). Draw Steel PDFs express this a few different
 * ways: "(save ends)", "(EoT)"/"(end of turn)", etc.
 */
function detectConditionEnd(clause) {
  const lower = clause.toLowerCase();
  if (/\(save ends\)/.test(lower)) return "save";
  if (/\(eot\)/.test(lower) || /end of turn/.test(lower)) return "turn";
  if (/start of turn/.test(lower)) return "startOfTurn";
  if (/end of (the )?round/.test(lower)) return "round";
  if (/end of (the )?encounter/.test(lower)) return "encounter";
  return "";
}

/**
 * Split a raw ability text block into tier segments (T1/T2/T3, !/@/#),
 * and parse each with parseTierText, passing the tier key.
 */
export function parseTiers(rawAbilityText = "") {
  if (!rawAbilityText || typeof rawAbilityText !== "string") {
    return { t1: null, t2: null, t3: null };
  }

  const lines = rawAbilityText.split("\n").map(l => l.trim()).filter(Boolean);
  const buffers = { t1: [], t2: [], t3: [] };
  let currentTier = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Determine tier based on leading glyph
if (/^[á✦!]/.test(trimmed)) {
  // tier 1: á, ✦, !
  currentTier = "t1";
  buffers.t1.push(trimmed);

} else if (/^[é★@]/.test(trimmed)) {
  // tier 2: é, ★, @
  currentTier = "t2";
  buffers.t2.push(trimmed);

} else if (/^[í✸#]/.test(trimmed)) {
  // tier 3: í, ✸, #
  currentTier = "t3";
  buffers.t3.push(trimmed);

} else if (/^(?:≤|<=|<)\s*11\b/.test(trimmed)) {
  // tier 1: numeric power-roll threshold, e.g. "≤11 8 damage; M<1 prone"
  currentTier = "t1";
  buffers.t1.push(trimmed);

} else if (/^12\s*[–-]\s*16\b/.test(trimmed)) {
  // tier 2: numeric power-roll threshold, e.g. "12–16 12 damage; M<2 prone"
  currentTier = "t2";
  buffers.t2.push(trimmed);

} else if (/^17\+/.test(trimmed)) {
  // tier 3: numeric power-roll threshold, e.g. "17+ 15 damage; M<3 prone"
  currentTier = "t3";
  buffers.t3.push(trimmed);

} else {
  // continuation lines
  if (currentTier) {
    buffers[currentTier].push(trimmed);
  }
}

  }

  return {
    t1: buffers.t1.length ? parseTierText(buffers.t1.join(" "), "t1") : null,
    t2: buffers.t2.length ? parseTierText(buffers.t2.join(" "), "t2") : null,
    t3: buffers.t3.length ? parseTierText(buffers.t3.join(" "), "t3") : null
  };
}

/**
 * Parse target text into structured target info.
 */
export function parseTarget(targetText) {
  if (!targetText || typeof targetText !== "string")
    return { type: "special", value: null };

  const numberWords = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
  };

  const lower = targetText.toLowerCase();
  let value = null;

  for (const [word, num] of Object.entries(numberWords)) {
    if (lower.includes(word)) { value = num; break; }
  }

  if (lower.includes("all") || lower.includes("each") || lower.includes("every")) {
    value = null;
  }

  let type = "special";
  if (lower.includes("creatures or objects")) type = "creatureObject";
  else if (lower.includes("creature")) type = "creature";
  else if (lower.includes("object")) type = "object";
  else if (lower.includes("enemies")) type = "enemy";
  else if (lower.includes("enemy")) type = "enemy";
  else if (lower.includes("allies")) type = "ally";
  else if (lower.includes("ally")) type = "ally";
  else if (lower.includes("self or ally")) type = "selfOrAlly";
  else if (lower.includes("self or creature")) type = "selfOrCreature";
  else if (lower.includes("self ally")) type = "selfAlly";
  else if (lower.includes("self")) type = "self";

  return { type, value };
}