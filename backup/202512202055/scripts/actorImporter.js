import { buildEffectGroups } from "./builders/effectGroups.js";

/**
 * Import a full NPC actor with abilities and features.
 * This builds the complete JSON structure explicitly,
 * so Foundry doesn't auto-fill defaults.
 *
 * @param {Object} actorData - top-level actor info (name, type, img, system)
 * @param {Array} abilities - array of { name, tieredText, potencyMap, highestCharacteristic }
 * @param {Array} features - array of { name, description }
 */
export async function importActor(actorData, abilities = [], features = []) {
  // Build the base actor object
  const actorPayload = {
    name: actorData.name,
    type: actorData.type || "npc",
    img: actorData.img || "icons/svg/mystery-man.svg",
    system: actorData.system || {},
    items: []
  };

  // Add features explicitly
  for (const feat of features) {
    actorPayload.items.push({
      name: feat.name,
      type: "feature",
      img: feat.img || "icons/svg/book.svg",
      system: {
        description: { value: feat.description, director: "" },
        source: { book: actorData.system?.source?.book || "", license: "Draw Steel Creator License", page: "" },
        advancements: {},
        _dsid: ""
      }
    });
  }

  // Add abilities explicitly
  for (const ability of abilities) {
    const effectGroups = buildEffectGroups(ability.tieredText, ability.potencyMap, ability.highestCharacteristic);

    actorPayload.items.push({
      name: ability.name,
      type: "ability",
      img: ability.img || "icons/skills/melee/strike-polearm-glowing-white.webp",
      system: {
        type: "main",
        category: "signature",
        distance: { type: "melee", primary: 1 },
        target: { type: "creature", value: 1, custom: "" },
        damageDisplay: "melee",
        power: {
          roll: { formula: "@chr", characteristics: [ability.highestCharacteristic] },
          // 👇 Explicitly set the effects object — no schema defaults
          effects: effectGroups
        },
        effect: { before: "", after: "" },
        spend: { text: "", value: null },
        source: { book: actorData.system?.source?.book || "", license: "Draw Steel Creator License", page: "" },
        story: "",
        resource: null,
        trigger: "",
        _dsid: ""
      }
    });
  }

  // Create the actor in Foundry
  return await Actor.create(actorPayload);
}