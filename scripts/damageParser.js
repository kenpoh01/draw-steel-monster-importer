// damageParser.js
export function parseDamage(text = "") {
  const match = text.match(/(\d+)\s*(\w+)?\s*damage/i);
  if (!match) return null;

  const value = Number(match[1]);
  const type = match[2]?.toLowerCase();

  return {
    value,
    types: type && type !== "damage" ? [type] : []
  };
}