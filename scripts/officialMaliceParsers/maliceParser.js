// scripts/officialMaliceParsers/maliceParser.js

import { parseMaliceHeader } from "./maliceHeaderParser.js";
import { finalizeEffectTable } from "./maliceEffectTableBuilder.js";
import { enrichNarrative } from "../narrativeUtils.js";
import { parseConditionEffect } from "../conditionParser.js";
import { supportedConditions } from "../keywordParser.js";

/**
 * Parse a full malice block using official Draw Steel formatting.
 */
export function parseMaliceText(rawText) {
  const lines = rawText.split("\n").map(l => l.trim());
  const items = [];

  let current = null;
  let tierLines = [];
  let narrativeBuffer = [];        // narrative BEFORE tiers
  let narrativeAfterBuffer = [];   // narrative AFTER tiers (NEW)
  let collectingTier = false;
  let currentTier = "";
  let tierBuffer = [];

  function flushNarrative(target = "before") {
    if (!current || narrativeBuffer.length === 0) return;
    const joined = narrativeBuffer.join(" ");
    current.system.effect[target] += `<p>${enrichNarrative(joined.trim())}</p>`;
    narrativeBuffer = [];
  }

  function flushAfterNarrative() {
    if (!current || narrativeAfterBuffer.length === 0) return;
    const joined = narrativeAfterBuffer.join(" ");
    current.system.effect.after += `<p>${enrichNarrative(joined.trim())}</p>`;
    narrativeAfterBuffer = [];
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // ------------------------------------------------------------
    // 1. Detect new malice ability start: "*" on its own line
    // ------------------------------------------------------------
    if (line === "*") {
      flushNarrative("before");
      flushAfterNarrative();

      if (collectingTier && currentTier) {
        tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
      }

      if (current) {
        finalizeEffectTable(current, tierLines);
        items.push(current);
      }

      // Reset state for next ability
      current = null;
      tierLines = [];
      tierBuffer = [];
      narrativeBuffer = [];
      narrativeAfterBuffer = [];
      collectingTier = false;
      currentTier = "";

      i++;
      continue;
    }

    // ------------------------------------------------------------
    // 2. Header
    // ------------------------------------------------------------
    if (!current) {
      const header = parseMaliceHeader(line);
      if (!header) {
        i++;
        continue;
      }

      current = {
        name: header.name,
        type: "ability",
        img: "icons/magic/unholy/silhouette-robe-evil-power.webp",
        system: {
          type: "none",
          category: "malice",
          resource: header.cost,
          trigger: `Spend ${header.cost} Malice.`,
          distance: { type: "special" },
          target: { type: "special" },
		  power: { roll: { formula: "", characteristics: [] }, effects: {} },
          effect: { before: "", after: "" },
          spend: { text: "", value: null },
          source: {
            book: "Monsters",
            page: "",
            license: "Draw Steel Creator License"
          },
          story: "",
          keywords: []
        },
        effects: [],
        folder: null,
        sort: 0,
        flags: {}
      };

      i++;
      continue;
    }

    // ------------------------------------------------------------
    // 3. Tier lines
    // ------------------------------------------------------------
    const tierStart = line.match(/^([!@#])\s+(.*)/);
    if (tierStart) {
      flushNarrative("before");
      flushAfterNarrative();

      if (collectingTier && currentTier) {
        tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
        tierBuffer = [];
      }

      collectingTier = true;
      currentTier = tierStart[1];
      tierBuffer.push(tierStart[2]);
      i++;
      continue;
    }

    // ------------------------------------------------------------
    // 4. Continue collecting tier lines
    // ------------------------------------------------------------
    if (collectingTier) {
      const isNewTier = /^[!@#]\s+/.test(line);
      const isNewAbility = line === "*";

      if (isNewTier || isNewAbility) {
        tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
        tierBuffer = [];
        collectingTier = false;
        currentTier = "";
      } else {
        tierBuffer.push(line);
        i++;
        continue;
      }
    }

    // ------------------------------------------------------------
    // 5. "Effect:" blocks
    // ------------------------------------------------------------
    if (/^effect:/i.test(line)) {
      const effectText = line.replace(/^effect:/i, "").trim();
      const parsed = parseConditionEffect(effectText);

      if (!(parsed.condition && supportedConditions.has(parsed.condition))) {
        current.system.effect.after += `<p>${enrichNarrative(effectText)}</p>`;
      }

      i++;
      continue;
    }

    // ------------------------------------------------------------
    // 6. Narrative (before or after tiers)
    // ------------------------------------------------------------
    if (tierLines.length > 0 && !collectingTier) {
      // We are in post-tier narrative
      narrativeAfterBuffer.push(line);
    } else {
      // Pre-tier narrative
      narrativeBuffer.push(line);
    }

    i++;
  }

  // ------------------------------------------------------------
  // 7. Final flush
  // ------------------------------------------------------------
  flushNarrative("before");
  flushAfterNarrative();

  if (collectingTier && currentTier) {
    tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
  }

  if (current) {
    finalizeEffectTable(current, tierLines);
    items.push(current);
  }

  return { items };
}