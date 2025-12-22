// scripts/itemParser.js

import { normalizeText } from "./normalizeText.js";
import { enrichNarrative } from "./narrativeUtils.js";

/**
 * Selects an appropriate image for features.
 * Abilities already come with their own images (or null).
 */
function getImageForFeature() {
  return "icons/creatures/unholy/demon-hairy-winged-pink.webp";
}

/**
 * Convert parsed traits and abilities into full Draw Steel item objects.
 * Abilities are passed through exactly as parsed by abilityParser.js.
 */
export function parseItems(traits = [], abilities = [], rawData = {}) {
  const items = [];

  /* -------------------------------------------------------------
   * FEATURES
   * ----------------------------------------------------------- */
  traits.forEach((trait, index) => {
    items.push({
      name: trait.name || `Trait ${index + 1}`,
      type: "feature",
      img: getImageForFeature(),
      system: {
        description: {
          value:
            trait.effects
              ?.map(e => `<p>${enrichNarrative(normalizeText(e.effect))}</p>`)
              .join("") || "",
          director: ""
        },
        _dsid: trait.name
          ? trait.name.toLowerCase().replace(/\s+/g, "-")
          : `trait-${index + 1}`,
        advancements: {}
      }
    });
  });

  /* -------------------------------------------------------------
   * ABILITIES (PASS THROUGH EXACTLY AS PARSED)
   * ----------------------------------------------------------- */
  abilities.forEach(ability => {
    // ability is already a fully-formed Draw Steel item
    // do NOT rebuild or overwrite its system data
    items.push(ability);
  });

  return items;
}