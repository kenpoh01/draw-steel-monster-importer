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
    movement: null,
    conditions: [],
    narrative: ""
  };

  let working = text.toLowerCase();

  // Strip tier glyphs/labels
  working = working
    .replace(/^[✦★✸!@#]\s*/, "")
    .replace(/^(t1|tier 1|t2|tier 2|t3|tier 3)[:\-]?\s*/i, "")
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
  // MOVEMENT
  // -------------------------
  const movement = parseMovement(working);
  if (movement) {
    result.movement = {
      movement: [movement.name],
      distance: movement.distance,
      properties: [],
      potency: { value: potencyMap[tier], characteristic: "none" }
    };

    working = working.replace(/\b(slide|pull|push|shift)\s+\d+\b/i, "").trim();
  }

  // -------------------------
  // CONDITIONS + CHARACTERISTIC TRIGGERS
  // -------------------------
  const clauses = working.split(";").map(s => s.trim()).filter(Boolean);

  for (const clause of clauses) {
    const saveEnds = /\(save ends\)/i.test(clause);

    // Extract characteristic trigger: m<2], a<3], etc.
    const charMatch = clause.match(/([maria])<\d+\]/i);
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

    // Extract condition name
    const condMatch =
      clause.match(/\bthey\s+are\s+([a-z ]+?)(?:\s*\(save ends\))?$/i);

    if (condMatch) {
      const conditionText = condMatch[1].trim();
      const parsed = parseConditionEffect(conditionText);
      const names = Array.isArray(parsed.condition)
        ? parsed.condition
        : [parsed.condition];

      for (const name of names) {
        if (name) {
          result.conditions.push({
            name,
            end: saveEnds ? "save" : "",
            potency: potencyMap[tier],
            characteristic
          });
        }
      }
    } else {
      // Narrative fallback
      result.narrative += clause + " ";
    }
  }

  result.narrative = result.narrative.trim();

  return result;
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
    if (/^(T1|Tier 1|✦|!)/i.test(line)) { currentTier = "t1"; buffers.t1.push(line); }
    else if (/^(T2|Tier 2|★|@)/i.test(line)) { currentTier = "t2"; buffers.t2.push(line); }
    else if (/^(T3|Tier 3|✸|#)/i.test(line)) { currentTier = "t3"; buffers.t3.push(line); }
    else if (currentTier) { buffers[currentTier].push(line); }
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
  if (!targetText || typeof targetText !== "string") return { type: "special", value: null };

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
  else if (lower.includes("enemy")) type = "enemy";
  else if (lower.includes("ally")) type = "ally";
  else if (lower.includes("self or ally")) type = "selfOrAlly";
  else if (lower.includes("self or creature")) type = "selfOrCreature";
  else if (lower.includes("self ally")) type = "selfAlly";
  else if (lower.includes("self")) type = "self";

  return { type, value };
}