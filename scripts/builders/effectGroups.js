import { supportedConditions } from "../keywordParser.js";

/**
 * Build effect groups for a tiered ability.
 * Handles damage, condition, movement, and narrative effects.
 *
 * @param {Object} tieredDamage - { t1, t2, t3 } from official parser
 *   Each tier is shaped like:
 *   {
 *     damage: {
 *       value: number | string,
 *       types: string[],
 *       properties: string[],
 *       potency: { value: string, characteristic: string }
 *     },
 *     movement: { name: string, distance: number } | null,
 *     conditions: Array<any>
 *   }
 * @param {Array} potencyMap - potency values for tiers (fallback)
 * @param {String} highestCharacteristic - fallback characteristic
 * @returns {Object} effectGroups keyed by group id
 */
export function buildEffectGroups(tieredDamage, potencyMap, highestCharacteristic) {
  const id = foundry.utils.randomID();

  const effectGroups = {
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

  const group = effectGroups[id];

  [tieredDamage.t1, tieredDamage.t2, tieredDamage.t3].forEach((parsed, i) => {
    if (!parsed) return;

    const tier = `tier${i + 1}`;

    /* -------------------------
     * DAMAGE
     * ----------------------- */
    const dmg = parsed.damage;
    if (dmg && (dmg.value !== undefined && dmg.value !== null)) {
      const valueStr = typeof dmg.value === "number" ? dmg.value.toString() : String(dmg.value);

      // Prefer official potency if present, else use potencyMap + highestCharacteristic
      const potency = dmg.potency || {
        value: potencyMap?.[i],
        characteristic: highestCharacteristic || "none"
      };

      group.damage[tier] = {
        value: valueStr,
        types: Array.isArray(dmg.types) ? dmg.types : [],
        properties: Array.isArray(dmg.properties) ? dmg.properties : [],
        potency
      };
    }

    /* -------------------------
     * CONDITIONS
     * ----------------------- */
    if (Array.isArray(parsed.conditions) && parsed.conditions.length > 0) {
      // For now, just build a generic applied block based on presence of conditions.
      // If your official parser has richer condition objects, we can wire them in next.
      group.applied[tier] = {
        display: "{{potency}} " + parsed.conditions.map(String).join(", "),
        potency: {
          value: potencyMap?.[i],
          characteristic: parsed.damage?.potency?.characteristic || "none"
        },
        effects: {} // can be enriched with specific condition metadata if available
      };
    }

    /* -------------------------
     * MOVEMENT
     * ----------------------- */
    if (parsed.movement && parsed.movement.name && typeof parsed.movement.distance === "number") {
      group.forced[tier] = {
        movement: [parsed.movement.name],
        distance: parsed.movement.distance.toString(),
        display: "{{forced}}",
        properties: [],
        potency: {
          value: potencyMap?.[i],
          characteristic: parsed.damage?.potency?.characteristic || "none"
        }
      };
    }

    /* -------------------------
     * NARRATIVE
     * ----------------------- */
    // If your official parser carries narrative text somewhere (e.g. parsed.narrative),
    // we can hook it here. For now, we leave `other` empty.
  });

  return effectGroups;
}