// scripts/builders/effectGroups.js
import { supportedConditions } from "../keywordParser.js";

export function buildEffectGroups(tieredDamage, potencyMap, highestCharacteristic) {
  const effectGroups = {};

  // -------------------------
  // DAMAGE GROUP
  // -------------------------
  const dmgId = foundry.utils.randomID();
  effectGroups[dmgId] = {
    _id: dmgId,
    type: "damage",
    name: "",
    img: null,
    damage: {},
    applied: {},
    forced: {},
    other: {}
  };

  const dmgGroup = effectGroups[dmgId];

  [tieredDamage.t1, tieredDamage.t2, tieredDamage.t3].forEach((parsed, i) => {
    if (!parsed) return;
    const tier = `tier${i + 1}`;
    const dmg = parsed.damage;

    if (dmg) {
      dmgGroup.damage[tier] = {
        value: String(dmg.value),
        types: dmg.types || [],
        properties: dmg.properties || [],
        potency: dmg.potency || {
          value: potencyMap?.[i],
          characteristic: highestCharacteristic
        }
      };
    }
  });

  // -------------------------
  // APPLIED GROUPS (one per condition)
  // -------------------------
  const tiers = [tieredDamage.t1, tieredDamage.t2, tieredDamage.t3];
  const conditionNames = new Set();

  tiers.forEach(t => {
    if (!t) return;
    for (const c of t.conditions || []) {
      conditionNames.add(c.name);
    }
  });

  for (const condName of conditionNames) {
    const id = foundry.utils.randomID();

    const group = {
      _id: id,
      type: "applied",
      name: condName[0].toUpperCase() + condName.slice(1),
      img: null,
      applied: {},
      damage: {},
      forced: {},
      other: {}
    };

    tiers.forEach((parsed, i) => {
      if (!parsed) return;
      const tier = `tier${i + 1}`;
      const cond = (parsed.conditions || []).find(c => c.name === condName);
      if (!cond) return;

      const rawClause = (parsed.rawClauses || []).find(c =>
        c.includes(condName)
      );

      let display = rawClause || `{{potency}} ${condName}`;
      display = display.replace(/([maria])<\d+\]/gi, "{{potency}}");

      group.applied[tier] = {
        display,
        potency: {
          value: cond.potency,
          characteristic: cond.characteristic || "none"
        },
        effects: {
          [condName]: {
            condition: "failure",
            end: cond.end || "",
            properties: []
          }
        }
      };
    });

    effectGroups[id] = group;
  }

  // -------------------------
  // FORCED MOVEMENT GROUP
  // -------------------------
  const hasForced = tiers.some(t => t && t.forced);

  if (hasForced) {
    const id = foundry.utils.randomID();

    const group = {
      _id: id,
      type: "forced",
      name: "Push",
      img: null,
      applied: {},
      damage: {},
      forced: {},
      other: {}
    };

    tiers.forEach((parsed, i) => {
      if (!parsed || !parsed.forced) return;

      const tier = `tier${i + 1}`;
      const mv = parsed.forced;

      group.forced[tier] = {
        display: mv.display,          // "{{forced}}"
        movement: mv.movement,        // ["push"], ["slide"], etc.
        distance: mv.distance,        // "2"
        properties: mv.properties,    // ["vertical"], []
        potency: mv.potency
      };
    });

    effectGroups[id] = group;
  }

  // -------------------------
  // OTHER GROUP (pure narrative)
  // -------------------------
  const hasPureNarrative = tiers.some(t => t && t.narrative && !t.conditions.length);

  if (hasPureNarrative) {
    const id = foundry.utils.randomID();
    const group = {
      _id: id,
      type: "other",
      name: "",
      img: null,
      applied: {},
      damage: {},
      forced: {},
      other: {}
    };

    tiers.forEach((parsed, i) => {
      if (!parsed || !parsed.narrative) return;
      if (parsed.conditions.length) return;

      const tier = `tier${i + 1}`;
      group.other[tier] = {
        display: parsed.narrative
      };
    });

    effectGroups[id] = group;
  }

  return effectGroups;
}