import { supportedConditions } from "../keywordParser.js";

/**
 * Build effect groups for a tiered ability.
 * Handles damage, condition, movement, and narrative effects.
 *
 * @param {Object} tieredDamage - { t1, t2, t3 } parsed objects from parseTierText
 * @param {Array} potencyMap - potency values for tiers
 * @param {String} highestCharacteristic - fallback characteristic
 * @returns {Object} effectGroups keyed by group id
 */
export function buildEffectGroups(tieredDamage, potencyMap, highestCharacteristic) {
  const id = foundry.utils.randomID();

  // Create a single effect group (Draw Steel requires one group per ability)
  const group = {
    [id]: {
      _id: id,
      type: "damage",
      name: "",
      img: null,
      damage: {},
      applied: {},
      forced: {},
      other: {}
    }
  };

  // Process each tier (1, 2, 3)
  [tieredDamage.t1, tieredDamage.t2, tieredDamage.t3].forEach((parsed, i) => {
    if (!parsed) return;

    const tier = `tier${i + 1}`;
    const potency = {
      value: potencyMap[i],
      characteristic: highestCharacteristic || "none"
    };

    /* -------------------------
     * DAMAGE
     * ----------------------- */
    if (parsed.value > 0) {
      group[id].damage[tier] = {
        value: parsed.value.toString(),
        types: parsed.types || [],
        properties: [],
        potency
      };
    }

    /* -------------------------
     * CONDITION
     * ----------------------- */
    if (parsed.condition) {
      group[id].applied[tier] = {
        display: `{{potency}} ${parsed.condition}${parsed.narrative ? " " + parsed.narrative : ""}`.trim(),
        potency: {
          value: potencyMap[i],
          characteristic: parsed.trigger?.stat || "none"
        },
        effects: {
          [parsed.condition]: {
            condition: "failure",
            end: "save",
            properties: []
          }
        }
      };
    }

    /* -------------------------
     * MOVEMENT
     * ----------------------- */
    if (parsed.movement && parsed.movement.name && typeof parsed.movement.distance === "number") {
      group[id].forced[tier] = {
        movement: [parsed.movement.name],
        distance: parsed.movement.distance.toString(),
        display: "{{forced}}",
        properties: [],
        potency: {
          value: potencyMap[i],
          characteristic: parsed.trigger?.stat || "none"
        }
      };
    }

    /* -------------------------
     * NARRATIVE (only if no other effect)
     * ----------------------- */
    if (parsed.narrative && !parsed.value && !parsed.condition && !parsed.movement) {
      group[id].other[tier] = {
        display: parsed.narrative,
        potency: {
          value: potencyMap[i],
          characteristic: "none"
        }
      };
    }
  });

  return group;
}