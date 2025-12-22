// helpers/typeNormalization.js

export function normalizeType(type = "", cost = "") {
  const map = {
    "main action": "main",
    "maneuver": "maneuver",
    "free maneuver": "freeManeuver",
    "triggered action": "triggered",
    "free triggered action": "freeTriggered",
    "no action": "none"
  };

  const normalized = map[type.toLowerCase().trim()];
  if (normalized) return normalized;

  if (cost?.toLowerCase().includes("villain action")) return "villain";
  return "main";
}

export function determineCategory(ability) {
  const costText = ability.cost?.toLowerCase() || "";
  const rawCategory = ability.category?.toLowerCase();

  if (costText.includes("signature")) return "signature";
  if (costText.includes("malice")) return "heroic";
  if (costText.includes("villain")) return "villain";
  if (rawCategory) return rawCategory;
  return "";
}

export function getImageForType(type, itemType) {
  const images = {
    ability: {
      main: "icons/skills/melee/strike-polearm-glowing-white.webp",
      maneuver: "icons/magic/air/air-pressure-shield-blue.webp",
      freeTriggered: "icons/magic/air/air-wave-gust-blue.webp",
      triggered: "icons/skills/movement/arrow-upward-yellow.webp",
      none: "icons/magic/unholy/silhouette-robe-evil-power.webp",
      villain: "icons/magic/death/skull-horned-worn-fire-blue.webp"
    },
    feature: {
      withCaptain: "icons/skills/social/intimidation-impressing.webp",
      default: "icons/creatures/unholy/demon-hairy-winged-pink.webp"
    }
  };

  if (itemType === "feature") {
    return type === "with-captain"
      ? images.feature.withCaptain
      : images.feature.default;
  }
  return images.ability[type] || "";
}