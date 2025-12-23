// scripts/officialParser.js

/**
 * Build a Draw Steel monster actor from parsed header + items.
 * This is the OFFICIAL-ONLY actor builder.
 */

export async function parseOfficialMonster({ headerObj, features, abilities }) {
  if (!headerObj) {
    return null;
  }


  // ---------------------------------------------
  // 1. BASIC ACTOR DATA
  // ---------------------------------------------
// Determine correct icon: minions always use minion.webp
const iconRole = headerObj.organization === "minion"
  ? "minion"
  : headerObj.role;

// Role-based image path
const actorImagePath = `systems/draw-steel/assets/roles/${iconRole}.webp`;

const actorData = {
  name: headerObj.name || "Unnamed Monster",
  type: "npc",
  img: actorImagePath,
  token: {
    img: actorImagePath,
    name: headerObj.name || "Unnamed Monster"
  },
    system: {
      stamina: {
        value: headerObj.stamina || 1,
        max: headerObj.stamina || 1,
        temporary: 0
      },

      characteristics: {
        might: { value: headerObj.might ?? 0 },
        agility: { value: headerObj.agility ?? 0 },
        reason: { value: headerObj.reason ?? 0 },
        intuition: { value: headerObj.intuition ?? 0 },
        presence: { value: headerObj.presence ?? 0 }
      },

      combat: {
        save: {
          threshold: headerObj.saveThreshold || 6,
          bonus: ""
        },
        size: {
          value: headerObj.size || 1,
          letter: headerObj.sizeLetter || "M"
        },
        stability: headerObj.stability || 0,
        turns: headerObj.turns || (headerObj.role === "solo" ? 2 : 1)
      },

      movement: {
        value: headerObj.speed || 4,
        types: headerObj.movementTypes || ["walk"],
        hover: false,
        disengage: 1
      },

      damage: {
        immunities: buildDamageMap(headerObj.immunities),
        weaknesses: buildDamageMap(headerObj.weaknesses)
      },

      biography: {
        value: "",
        director: "",
        languages: []
      },

      source: {
        book: headerObj.sourceBook || "",
        page: headerObj.sourcePage || "",
        license: headerObj.sourceLicense || ""
      },

      negotiation: {
        interest: headerObj.interest || 0,
        patience: headerObj.patience || 0,
        motivations: [],
        pitfalls: [],
        impression: headerObj.impression || 0
      },

      monster: {
        freeStrike: headerObj.freeStrike || 0,
        keywords: headerObj.keywords || [],
        level: headerObj.level || 1,
        ev: headerObj.ev || 0,
        role: headerObj.role || "",
        organization: headerObj.organization || ""
      },

      statuses: {
        immunities: []
      }
    }
  };

  return actorData;
}

/**
 * Build a Draw Steel damage map from parsed header data.
 * Ensures all 10 damage types exist.
 */
function buildDamageMap(input = {}) {
  const base = {
    all: 0,
    acid: 0,
    cold: 0,
    corruption: 0,
    fire: 0,
    holy: 0,
    lightning: 0,
    poison: 0,
    psychic: 0,
    sonic: 0
  };

  for (const [k, v] of Object.entries(input)) {
    const key = k.toLowerCase();
    if (base.hasOwnProperty(key)) {
      base[key] = Number(v) || 0;
    }
  }

  return base;
}