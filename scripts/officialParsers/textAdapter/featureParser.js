// scripts/officialParsers/textAdapter/featureParser.js

import { parseNarrativeBlock } from "../../narrativeParser.js";
import { splitFeatureLabels } from "./featureLabelSplitter.js";
/**
 * Parse a feature block (array of lines).
 * Uses narrativeParser for clean paragraphing and enrichment.
 */
export function parseFeatureBlock(lines) {
  if (!Array.isArray(lines) || !lines.length) return null;

  const name = lines[0].trim();

  let before = "";
  let after = "";
  const descriptionLines = [];

  // ------------------------------------------------------------
  // Extract effect.before, effect.after, and narrative lines
  // ------------------------------------------------------------
  for (const line of lines.slice(1)) {
    if (line.startsWith("Effect:")) {
      before = line.replace("Effect:", "").trim();
      continue;
    }
    if (line.startsWith("After:")) {
      after = line.replace("After:", "").trim();
      continue;
    }

    descriptionLines.push(line);
  }

  // ------------------------------------------------------------
  // Join description lines into a single narrative block
  // ------------------------------------------------------------
// Join raw description with preserved line breaks
let descriptionText = descriptionLines.join("\n").trim();

// Normalize hidden punctuation
descriptionText = splitFeatureLabels(descriptionText)
  .replace(/\u00A0/g, " ")   // NBSP → space
  .replace(/[\u2024\u2025\u2026\uFE52\uFF0E]/g, "."); // weird periods → ASCII

// TEMP diagnostic
console.log("FEATURE RAW BEFORE LABEL SPLIT:", JSON.stringify(descriptionText));

// Robust label-break rule
descriptionText = descriptionText.replace(
  /\. *([A-Z][^:]{0,50}):/g,
  ".\n$1:"
);

  // ------------------------------------------------------------
  // Use narrativeParser to convert the cleaned text into paragraphs
  // ------------------------------------------------------------
  const { paragraphs } = parseNarrativeBlock(descriptionText.split("\n"));

  const descriptionHtml = paragraphs.join("\n");

  // ------------------------------------------------------------
  // Build final feature item
  // ------------------------------------------------------------
  return {
    name,
    type: "feature",
    img: pickFeatureIcon(),

    system: {
      description: {
        value: descriptionHtml,
        director: ""
      },

      effect: { before, after },
      spend: { text: "", value: null },
      source: { book: "", page: "", license: "" },
      story: "",
      resource: null,
      trigger: "",
      _dsid: name.toLowerCase().replace(/\s+/g, "-")
    },

    effects: [],
    folder: null,
    flags: {}
  };
}

/**
 * All features use the same icon.
 */
function pickFeatureIcon() {
  return "icons/creatures/unholy/demon-hairy-winged-pink.webp";
}