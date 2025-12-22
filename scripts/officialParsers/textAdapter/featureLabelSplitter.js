// scripts/officialParsers/textAdapter/featureLabelSplitter.js

/**
 * Insert paragraph breaks before feature labels like:
 *   Solo Turns:
 *   End Effect:
 *   Blood Frenzy:
 *   Legendary Actions:
 *
 * This runs BEFORE narrativeParser so narrativeParser
 * treats each label as a separate paragraph.
 */
export function splitFeatureLabels(text) {
  if (!text || typeof text !== "string") return text;

  // Normalize NBSP + weird periods
  text = text
    .replace(/\u00A0/g, " ")
    .replace(/[\u2024\u2025\u2026\uFE52\uFF0E]/g, ".");

  // Insert a blank line before labels
  return text.replace(
    /\. *([A-Z][^:]{0,50}):/g,
    ".\n\n$1:"
  );
}