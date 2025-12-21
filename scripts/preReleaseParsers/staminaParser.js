// scripts/preReleaseParsers/staminaParser.js
import { normalizeResistance } from "../keywordParser.js";

export function parseStaminaLine(line) {
  let stamina = 0;
  let immunities = [];
  let weaknesses = [];

  const staminaMatch = line.match(/Stamina\s+(\d+)/i);
  if (staminaMatch) stamina = parseInt(staminaMatch[1], 10);

  const immMatch = line.match(/Immunity\s+(.+)/i);
  if (immMatch) {
    const immList = immMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
    immunities = immList.map(normalizeResistance).filter(r => r !== null);
  }

  const weakMatch = line.match(/Weakness\s+(.+)/i);
  if (weakMatch) {
    const weakList = weakMatch[1].split(/[,;]/).map(s => s.trim()).filter(Boolean);
    weaknesses = weakList.map(normalizeResistance).filter(r => r !== null);
  }

  return { stamina, immunities, weaknesses };
}