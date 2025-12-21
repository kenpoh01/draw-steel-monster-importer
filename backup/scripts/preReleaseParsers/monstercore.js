import {
  validRoles,
  validOrganizations,
  validMovementTypes,
  validAncestryKeywords
} from "../keywordParser.js";

/**
 * Build the core actor shell for a monster.
 * This handles roles, organization, movement, immunities, size, EV, and metadata.
 *
 * @param {Object} rawData - Parsed header data for the monster
 * @returns {Object} Actor data shell
 */
export function parseMonsterCore(rawData) {
  // Extract role and organization
  const roleParts = rawData.roles?.[0]?.toLowerCase().split(" ") || [];
  const organization = roleParts.find(part => validOrganizations.includes(part));
  const role = roleParts.find(part => validRoles.includes(part)) || "minion";

  // Movement types
  const movementTypes = rawData.movement?.split(",").map(m => m.trim().toLowerCase()) || [];
  const filteredMovement = movementTypes.filter(m => validMovementTypes.includes(m));
  const finalMovement = filteredMovement.length ? filteredMovement : ["walk"];

  // Keywords
  const filteredKeywords = rawData.ancestry?.map(k => k.toLowerCase())
    .filter(k => validAncestryKeywords.includes(k)) || [];

  // Poison immunity
  const poisonValue = Number(
    rawData.immunities?.find(i => i.toLowerCase().includes("poison"))?.match(/\d+/)?.[0]
  ) || 0;

  // Size parsing
  const sizeString = rawData.size?.toString().trim() || "1M";
  const sizeValue = Number(sizeString.match(/\d+/)?.[0]) || 1;
  const sizeLetterMatch = sizeString.match(/[A-Z]/i);
  const sizeLetter = sizeLetterMatch ? sizeLetterMatch[0].toUpperCase() : "M";

  // EV parsing
  const evValue = Number(rawData.ev?.match(/\d+/)?.[0]) || 0;

  // Role-based image path
  const actorImagePath = `systems/draw-steel/assets/roles/${role}.webp`;

  return {
    name: rawData.name || "Unnamed Monster",
    type: "npc",
    img: actorImagePath,
    token: { img: actorImagePath, name: rawData.name || "Unnamed Monster" },
    system: {
      stamina: { value: Number(rawData.stamina) || 0, max: Number(rawData.stamina) || 0, temporary: 0 },
      characteristics: {
        might: { value: rawData.might ?? 0 },
        agility: { value: rawData.agility ?? 0 },
        reason: { value: rawData.reason ?? 0 },
        intuition: { value: rawData.intuition ?? 0 },
        presence: { value: rawData.presence ?? 0 }
      },
      combat: {
        save: { threshold: 6, bonus: "" },
        size: { value: sizeValue, letter: sizeLetter },
        stability: rawData.stability ?? 0,
        turns: 1
      },
      movement: { value: rawData.speed ?? 0, types: finalMovement, hover: false, disengage: 1 },
      damage: {
        immunities: {
          all: 0, acid: 0, cold: 0, corruption: 0, fire: 0, holy: 0,
          lightning: 0, poison: poisonValue, psychic: 0, sonic: 0
        },
        weaknesses: {
          all: 0, acid: 0, cold: 0, corruption: 0, fire: 0, holy: 0,
          lightning: 0, poison: 0, psychic: 0, sonic: 0
        }
      },
      biography: { value: "", director: "", languages: [] },
      source: { book: "Monsters", page: "", license: "Draw Steel Creator License", revision: 1 },
      negotiation: { interest: 5, patience: 5, motivations: [], pitfalls: [], impression: 1 },
      monster: {
        freeStrike: rawData.free_strike ?? 0,
        keywords: filteredKeywords,
        level: rawData.level ?? 1,
        ev: evValue,
        role,
        organization: organization || "minion"
      }
    }
  };
}