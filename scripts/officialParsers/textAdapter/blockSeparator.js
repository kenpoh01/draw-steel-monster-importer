// scripts/officialParsers/textAdapter/blockSeparator.js
//
// Splits raw monster stat-block text into a header object plus a list of
// ability/feature items. Header-field detection and ability/feature
// boundary detection are both structural (content-shape based) rather
// than dependent on any particular marker/glyph scheme, since different
// PDF extraction tools substitute wildly different glyphs for the same
// underlying icons. See structuralSplitter.js for details.

import { parseHeaderLines } from "../../headerAdapter.js";
import { parseAbilityBlock } from "./tieredParser.js";
import { parseFeatureBlock } from "./featureParser.js";
import { splitBodyIntoBlocks, stripPureMarkerLines } from "./structuralSplitter.js";

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
 * Main official text parser.
 */
export function parseOfficialText(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { header: null, features: [], abilities: [] };
  }

  const allLines = rawText
    .split("\n")
    .map(l =>
      l
        // strip a wide range of invisible/control/formatting chars
        .replace(/[\u0000-\u001F\u007F-\u009F\u2000-\u206F\uFE00-\uFE0F\u202A\u202B\u202C\u202D\u202E]/g, "")
        .trim()
    )
    .filter(Boolean);

  if (!allLines.length) {
    return { header: null, features: [], abilities: [] };
  }

  // Header detection scans the full line list directly (it doesn't need
  // the text pre-split into blocks) — it just looks for each field's
  // characteristic line shape (name+level, keywords+EV, characteristics,
  // stat-numbers, immunity/weakness, movement).
  const header = parseHeaderLines(allLines.join("\n"));
  header.highestCharacteristic = computeHighestCharacteristic(header);

  // Remove the lines header parsing consumed, plus any lines that are
  // purely separator/marker characters (e.g. a lone "¢" or "*" used as a
  // block delimiter in some PDF exports) — once we're splitting
  // structurally, those carry no information.
  const consumed = header._consumedLines || new Set();
  const bodyLines = stripPureMarkerLines(allLines.filter(l => !consumed.has(l)));

  const blocks = splitBodyIntoBlocks(bodyLines);

  const features = [];
  const abilities = [];

  for (const block of blocks) {
    if (block.type === "ability") {
      const ability = parseAbilityBlock(block.lines, header);
      if (ability) abilities.push(ability);
    } else {
      const feature = parseFeatureBlock(block.lines);
      if (feature) features.push(feature);
    }
  }

  return { header, features, abilities };
}
