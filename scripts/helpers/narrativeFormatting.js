// helpers/narrativeFormatting.js
import { normalizeText } from "../preReleaseParsers/normalizeText.js";
import { enrichNarrative } from "../narrativeUtils.js";

export function formatNarrativeBlock(block) {
  if (!block?.effect) return "";
  let text = normalizeText(block.effect.trim());

  if (text.toLowerCase().startsWith("effect:")) {
    text = text.slice(7).trim(); // Remove "Effect:" prefix
  }

  if (block.name && block.name.toLowerCase() !== "effect") {
    return `<p><strong>${block.name}:</strong> ${enrichNarrative(text)}</p>`;
  }
  return `<p>${enrichNarrative(text)}</p>`;
}