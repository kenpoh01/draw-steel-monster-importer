/**
 * Build the core actor system data from the parsed header object.
 */
export function parseMonsterCore(rawData) {
  const actorImagePath = "systems/draw-steel/assets/roles/solo.webp";

  // Size parsing: only size 1 gets a letter
  const sizeValue = Number(rawData.size) ?? 1;
  const sizeLetter = sizeValue === 1 ? "M" : "";

  return {
    name: rawData.name || "Unnamed Monster",
    type: "npc",
    img: actorImagePath,
    token: {
      img: actorImagePath,
      name: rawData.name || "Unnamed Monster"
    },
    system: {
      stamina: {
        value: Number(rawData.stamina) || 0,
        max: Number(rawData.stamina) || 0,
        temporary: 0
      },
      characteristics: rawData.characteristics || {
        might: { value: 0 },
        agility: { value: 0 },
        reason: { value: 0 },
        intuition: { value: 0 },
        presence: { value: 0 }
      },
      combat: {
        save: { threshold: 6, bonus: "" },
        size: { value: sizeValue, letter: sizeLetter },
        stability: rawData.stability ?? 0,
        turns: rawData.turns ?? 1
      },
      movement: {
        value: Number(rawData.speed) || 0,
        types: rawData.movement ? rawData.movement.split(",").map(s => s.trim()) : [],
        hover: false,
        disengage: 1
      },
      damage: {
        immunities: rawData.immunity || {},
        weaknesses: rawData.weakness || {}
      },
      biography: { value: "", director: "", languages: [] },
      source: {}, // intentionally empty
      negotiation: {
        interest: 0,
        patience: 0,
        motivations: [],
        pitfalls: [],
        impression: 0
      },
      monster: {
        freeStrike: rawData.freeStrike ?? 0,
        keywords: rawData.keywords || [],
        level: rawData.level ?? 1,
        ev: rawData.ev ?? 0,
        role: rawData.role || "",
        organization: rawData.organization || ""
      },
      statuses: { immunities: [] }
    }
  };
}