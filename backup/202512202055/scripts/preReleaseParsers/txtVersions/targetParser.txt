// scripts/preReleaseParsers/targetParser.js

import { normalizeText } from "./normalizeText.js";

export function parseTarget(line) {
  const clean = normalizeText(line);
  console.log("🎯 Parsing target line:", clean);

  // Strip the leading "Target"
  const targetText = clean.replace(/^Target\s+/i, "").trim();

  // Default schema
  const target = {
    type: "creature",
    value: null,
    custom: targetText
  };

  // Heuristics based on keywords
  if (/object/i.test(targetText) && !/creature/i.test(targetText)) {
    target.type = "object";
  } else if (/creature/i.test(targetText) || /enemy/i.test(targetText) || /ally/i.test(targetText)) {
    target.type = "creature";
  }

  // Try to capture numeric values (e.g. "Target 1 creature")
  const numMatch = targetText.match(/(\d+)/);
  if (numMatch) {
    target.value = Number(numMatch[1]);
  }

  console.log("✅ Parsed target:", target);
  return target;
}