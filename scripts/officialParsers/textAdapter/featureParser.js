// scripts/officialParsers/textAdapter/featureParser.js

import { formatFeatureNarrative } from "./featureNarrativeFormatter.js";

export function parseFeatureBlock(lines) {
  if (!Array.isArray(lines) || !lines.length) return null;

  const name = lines[0].trim();

  let before = "";
  let after = "";
  const descriptionLines = [];

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

  const descriptionHtml = formatFeatureNarrative(descriptionLines);
console.log("🧾 [FEATURE PARSED] Description HTML:", descriptionHtml);
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

function pickFeatureIcon() {
  return "icons/creatures/unholy/demon-hairy-winged-pink.webp";
}