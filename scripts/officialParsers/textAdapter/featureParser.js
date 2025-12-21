// scripts/officialParsers/textAdapter/featureParser.js

import { enrichNarrative } from "../../narrativeUtils.js";
import { normalizeText } from "../../normalizeText.js";

/**
 * Parse a feature block into a clean feature object.
 * A feature block looks like:
 *
 *   Bladed Body
 *   An adjacent enemy who grabs the ashen hoarder...
 *
 * The first line is the name.
 * All remaining lines form the description.
 */

export function parseFeatureBlock(block) {
  if (!block || !block.length) {
    console.warn("parseFeatureBlock received empty block:", block);
    return null;
  }

  // First line = feature name
  const name = normalizeText(block[0].trim());

  // Remaining lines = description
  const descriptionLines = block.slice(1).map(line =>
    `<p>${enrichNarrative(normalizeText(line))}</p>`
  );

  const description = descriptionLines.join("");

  const feature = {
    name,
    type: "feature",
    img: "icons/svg/book.svg",
    system: {
      description: {
        value: description,
        director: ""
      },
      source: {},
      advancements: {},
      _dsid: ""
    }
  };

  return feature;
}