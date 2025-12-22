// scripts/officialParsers/textAdapter/abilityParser.js

import { parseAbilityBlock } from "./tieredParser.js";
import { parseFeatureBlock } from "./featureParser.js";

/**
 * Detect whether a line is a book-format distance line.
 */
function isBookDistance(line = "") {

  // Normalize Unicode × variants to ASCII x
  const normalized = line.replace(/[\u00D7\u2715\u2A09\u2573]/g, "x");

  const result =
    /^Melee\s+\d+/i.test(normalized) ||
    /^Ranged\s+\d+/i.test(normalized) ||
    /^Self\b/i.test(normalized) ||
    /^\d+\s*cube\b/i.test(normalized) ||
    /^\d+\s*x\s*\d+\s+line\b/i.test(normalized) ||
    /^\d+\s*cube\s+within\b/i.test(normalized) ||
    /^\d+\s*x\s*\d+\s+line\s+within\b/i.test(normalized);

  return result;
}

/**
 * A block is an ABILITY if line 3 is a book-format distance line.
 */
function isAbilityBlock(lines) {

  if (lines.length < 3) {
    return false;
  }

  const line3 = lines[2];

  const isDist = isBookDistance(line3);

  return isDist;
}

/**
 * A block is a FEATURE if it is not an ability.
 */
function isFeatureBlock(lines) {
  return !isAbilityBlock(lines);
}

/**
 * Main router for ability + feature parsing.
 */
export function parseAbilitiesAndFeatures(rawText, headerObj) {
  const lines = rawText
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);


  if (!lines.length) {
    console.log("❌ Empty block");
    return { abilities: [], features: [] };
  }

  const ability = isAbilityBlock(lines);

  if (ability) {
    const abilityItem = parseAbilityBlock(lines, headerObj);
    return { abilities: [abilityItem], features: [] };
  }

  const featureItem = parseFeatureBlock(lines);

  return { abilities: [], features: [featureItem] };
}