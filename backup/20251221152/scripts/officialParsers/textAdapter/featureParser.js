// scripts/officialParsers/textAdapter/featureParser.js

/**
 * Parse a feature block (array of lines).
 * This is the version that worked when effect.before/after were fixed.
 */
export function parseFeatureBlock(lines) {
  if (!Array.isArray(lines) || !lines.length) return null;

  const name = lines[0].trim();

  // Extract effect.before and effect.after
  let before = "";
  let after = "";

  for (const line of lines.slice(1)) {
    if (line.startsWith("Effect:")) {
      before = line.replace("Effect:", "").trim();
    }
    if (line.startsWith("After:")) {
      after = line.replace("After:", "").trim();
    }
  }

  return {
    name,
    type: "feature",
    img: pickFeatureIcon(name),

    system: {
      effect: {
        before,
        after
      },

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
 * Feature icons were correct in your working version.
 * This is the restored mapping.
 */
function pickFeatureIcon(name) {
  const lower = name.toLowerCase();

  if (lower.includes("immunity")) {
    return "icons/magic/defensive/shield-barrier-glowing-blue.webp";
  }
  if (lower.includes("weakness")) {
    return "icons/magic/death/skull-horned-worn-green.webp";
  }
  if (lower.includes("resistance")) {
    return "icons/magic/defensive/shield-barrier-flaming-orange.webp";
  }

  // Default feature icon
  return "icons/skills/misc/ability-yellow.webp";
}