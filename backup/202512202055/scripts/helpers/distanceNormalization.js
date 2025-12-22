// helpers/distanceNormalization.js

export function normalizeDistance(raw = "") {
  // If already an object, return it untouched
  if (raw && typeof raw === "object") {
    return raw;
  }

  // If not a string, default to melee
  if (typeof raw !== "string") {
    return { type: "melee", primary: 1 };
  }

  const text = raw.toLowerCase().trim();

  if (text.includes("burst")) {
    const primary = Number(text.match(/\d+/)?.[0]) || 1;
    return { type: "burst", primary };
  }
  if (text.includes("cube")) {
    const [primary, secondary] = text.match(/\d+/g)?.map(Number) || [1, 1];
    return { type: "cube", primary, secondary };
  }
  if (text.includes("line")) {
    const [primary, secondary, tertiary] = text.match(/\d+/g)?.map(Number) || [1, 1, 1];
    return { type: "line", primary, secondary, tertiary };
  }
  if (text.includes("aura")) {
    const primary = Number(text.match(/\d+/)?.[0]) || 1;
    return { type: "aura", primary };
  }
  if (text.includes("melee or ranged")) {
    return { type: "meleeRanged", primary: 1 };
  }
  if (text.includes("ranged")) {
    return { type: "ranged", primary: Number(text.match(/\d+/)?.[0]) || 1 };
  }
  if (text.includes("melee")) {
    return { type: "melee", primary: 1 };
  }
  if (text.includes("self")) {
    return { type: "self" };
  }
  if (text.includes("special")) {
    return { type: "special" };
  }

  // Default fallback
  return { type: "melee", primary: 1 };
}