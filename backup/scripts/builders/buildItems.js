// scripts/builders/buildItems.js

import { buildEffectGroups } from "./effectGroups.js";

/* -------------------------------------------------------------
 * ICON MAPPING
 * ----------------------------------------------------------- */

function getAbilityIcon(a) {
  const type = a.system?.type?.toLowerCase() || "";

  switch (type) {
    case "main":
      return "icons/skills/melee/strike-polearm-glowing-white.webp";
    case "maneuver":
      return "icons/magic/air/air-pressure-shield-blue.webp";
    case "triggered":
      return "icons/magic/air/air-wave-gust-blue.webp";
    case "villain":
      return "icons/magic/death/skull-horned-worn-fire-blue.webp";
    default:
      return "icons/magic/unholy/silhouette-robe-evil-power.webp";
  }
}

function getFeatureIcon() {
  return "icons/creatures/unholy/demon-hairy-winged-pink.webp";
}

/* -------------------------------------------------------------
 * FEATURE DESCRIPTION NORMALIZATION
 * ----------------------------------------------------------- */

function normalizeFeatureDescription(text) {
  if (!text) return "";

  let clean = text.replace(/\r/g, "").trim();

  // If HTML, strip to plain text first
  if (clean.includes("<p")) {
    clean = clean
      .replace(/<\/p>\s*/gi, "\n")
      .replace(/<p[^>]*>/gi, "");
  }

  // Merge lines ending with ":" with the next line
  clean = clean.replace(/:\s*\n\s*/g, ": ");

  // Paragraphs split only on blank lines
  const paragraphs = clean
    .split(/\n{2,}/)
    .map(p => p.replace(/\n+/g, " ").trim())
    .filter(p => p.length);

  return paragraphs.map(p => `<p>${p}</p>`).join("");
}

/* -------------------------------------------------------------
 * ABILITY EFFECT NORMALIZATION
 * ----------------------------------------------------------- */

function normalizeAbilityEffects(a) {
  return {
    before: a.effectBefore ?? a.system?.effect?.before ?? "",
    after:  a.effectAfter  ?? a.system?.effect?.after  ?? ""
  };
}

/* -------------------------------------------------------------
 * MAIN ITEM BUILDER
 * ----------------------------------------------------------- */

export function buildItems(features, abilities, headerObj) {
  const items = [];

  /* -------------------------
   * FEATURES
   * ----------------------- */
  for (const f of features) {
    const raw = f.description ?? f.system?.description?.value ?? "";
    const desc = normalizeFeatureDescription(raw);

    items.push({
      name: f.name,
      type: "feature",
      img: getFeatureIcon(),
      system: {
        description: {
          value: desc,
          director: ""
        },
        source: headerObj?.source || {},
        advancements: {},
        _dsid: f.system?._dsid || ""
      }
    });
  }

  /* -------------------------
   * ABILITIES
   * ----------------------- */
  for (const a of abilities) {

    // 🔍 LOG 1 — RAW ABILITY FROM OFFICIAL PARSER
    console.log("ABILITY RAW:", {
      name: a.name,
      t1: a.t1,
      t2: a.t2,
      t3: a.t3,
      t1Text: a.t1Text,
      t2Text: a.t2Text,
      t3Text: a.t3Text,
      potencyMap: a.potencyMap,
      systemType: a.system?.type
    });

    const effects = normalizeAbilityEffects(a);

    const tierInput = {
      t1: a.t1,
      t2: a.t2,
      t3: a.t3
    };

    // 🔍 LOG 2 — WHAT WE SEND INTO buildEffectGroups
    console.log("TIER INPUT TO buildEffectGroups:", {
      name: a.name,
      tierInput,
      potencyMap: a.potencyMap,
      highestCharacteristic: headerObj.highestCharacteristic
    });

    const tierEffects = buildEffectGroups(
      tierInput,
      a.potencyMap || [
        "@potency.weak",
        "@potency.average",
        "@potency.strong"
      ],
      headerObj.highestCharacteristic
    );

    // 🔍 LOG 3 — OUTPUT OF buildEffectGroups
    console.log("TIER EFFECTS OUTPUT:", {
      name: a.name,
      tierEffects
    });

    items.push({
      name: a.name,
      type: "ability",
      img: getAbilityIcon(a),
      system: {
        ...a.system,

        effect: effects,

        damageDisplay: a.damageDisplay ?? null,

        power: {
          roll: {
            formula: "@chr",
            characteristics: [headerObj.highestCharacteristic]
          },
          effects: tierEffects
        }
      }
    });
  }

  return items;
}