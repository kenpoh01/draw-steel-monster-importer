import { normalizeText } from "../../../scripts/preReleaseParsers/normalizeText.js";

export function normalizeName(header) {
  return header
    .replace(/(\d+d\d+\s*\+\s*\d+)/, "")
    .replace(/\bSignature Ability\b/i, "")
    .replace(/\bVillain Action\s*\d+\b/i, "")
    .replace(/\bHeroic\b/i, "")
    .replace(/\b\d+\s*Malice\b/i, "")
    .trim();
}

export function extractKeywords(lines) {
  const keywordsLine = lines.find(l => /(Melee|Area|Ranged|Weapon|Magic|Strike)/i.test(l)) || "";
  return keywordsLine
    .replace(/\b(Main action|Triggered action|Maneuver)\b/ig, "")
    .split(/,\s*/)
    .map(k => k.toLowerCase())
    .filter(Boolean);
}

/**
 * Collects all consecutive lines belonging to a paragraph that starts with regex.
 */
export function collectParagraph(lines, regex) {
  const idx = lines.findIndex(l => regex.test(l));
  if (idx === -1) return "";
  const collected = [];
  for (let i = idx; i < lines.length; i++) {
    const line = lines[i];
    // stop if we hit a new header or tier marker
    if (i > idx && (/^[!@#]/.test(line) || /^[A-Z]/.test(line))) break;
    collected.push(line.replace(regex, "").trim());
  }
  return normalizeText(collected.join(" "));
}

/**
 * Parse tiered effects (!, @, # markers).
 */
export function parseTieredEffects(lines) {
  const effects = [];
  lines.forEach(l => {
    if (l.startsWith("!")) effects.push({ tier: 1, text: normalizeText(l.slice(1).trim()) });
    if (l.startsWith("@")) effects.push({ tier: 2, text: normalizeText(l.slice(1).trim()) });
    if (l.startsWith("#")) effects.push({ tier: 3, text: normalizeText(l.slice(1).trim()) });
  });
  return effects;
}

/**
 * Parse spend/malice lines.
 */
export function parseSpend(lines) {
  const spendLine = lines.find(l => /Malice/i.test(l));
  if (!spendLine) return { text: "", value: null };
  const valMatch = spendLine.match(/(\d+)\s*Malice/i);
  return {
    text: spendLine.replace(/^[A-Za-z\s\d\+\-]+/, "").trim(),
    value: valMatch ? parseInt(valMatch[1], 10) : null
  };
}