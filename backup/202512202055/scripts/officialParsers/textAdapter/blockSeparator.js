// scripts/officialParsers/textAdapter/blockSeparator.js

import { parseHeaderLines } from "../../headerAdapter.js";
import { parseAbilitiesAndFeatures } from "./abilityParser.js";

/**
 * Compute highest characteristic from flattened header fields.
 */
function computeHighestCharacteristic(header) {
  const statKeys = ["might", "agility", "reason", "intuition", "presence"];

  let best = "might";
  let bestValue = -999;

  for (const key of statKeys) {
    const value = header[key];
    if (typeof value === "number" && value > bestValue) {
      best = key;
      bestValue = value;
    }
  }

  return best;
}

/**
 * Detect whether a block is the monster header.
 */
function isHeaderBlock(block) {
  return (
    /Level\s+\d+\s+(Solo|Elite|Standard|Minion)/i.test(block) ||
    /EV\s*\d+/i.test(block) ||
    /Might\s+[+\-]?\d+/i.test(block) ||
    /Immunity:/i.test(block) ||
    /Weakness:/i.test(block)
  );
}

/**
 * Main official text parser.
 */
export function parseOfficialText(rawText) {

  if (!rawText || typeof rawText !== "string") {
    return { header: null, features: [], abilities: [] };
  }

  // ⭐ Robust block splitting:
  const blocks = rawText
    .split(/^\s*\*\s*$|\n\s*\n+/m)
    .map(b => b.trim())
    .filter(Boolean);


  let header = null;
  const features = [];
  const abilities = [];

  blocks.forEach((block, index) => {

    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) {
      return;
    }

    // HEADER
    if (!header && isHeaderBlock(block)) {
      header = parseHeaderLines(block);

      // Compute highest characteristic
      header.highestCharacteristic = computeHighestCharacteristic(header);

      return;
    }

    // ABILITIES / FEATURES
    const { abilities: a, features: f } =
      parseAbilitiesAndFeatures(block, header);

    if (a?.length) {
      abilities.push(...a);
    }

    if (f?.length) {
      features.push(...f);
    }
  });

  return { header, features, abilities };
}