// scripts/officialMaliceParsers/maliceEffectTableBuilder.js

import { enrichNarrative } from "../narrativeUtils.js";
import { parseDuration } from "../durationParser.js";
import { supportedConditions } from "../keywordParser.js";

/**
 * Official Draw Steel malice tier glyphs:
 *   ! → tier1
 *   @ → tier2
 *   # → tier3
 *
 * These are the ONLY tier markers used in official PDFs.
 */
const MALICE_TIER_MAP = {
  "!": { css: "tier1", glyph: "!" },
  "@": { css: "tier2", glyph: "@" },
  "#": { css: "tier3", glyph: "#" }
};

/**
 * Build the effect table for a malice ability.
 *
 * tierLines is an array of strings in the form:
 *   "! 6 damage"
 *   "@ 10 damage"
 *   "# 13 damage"
 *
 * This function:
 *   - Builds the <dl> table
 *   - Enriches narrative
 *   - Extracts conditions
 *   - Creates Active Effects for non-enrichable conditions
 */
export function finalizeEffectTable(item, tierLines) {
  if (!tierLines.length) return;

  let dl = `<dl class="power-roll-display">`;
  const activeEffects = [];

  for (const line of tierLines) {
    const match = line.match(/^([!@#])\s+(.*)/);
    if (!match) continue;

    const tierChar = match[1];
    const rawText = match[2].trim();

    const { css, glyph } = MALICE_TIER_MAP[tierChar];
    const enriched = enrichNarrative(rawText);

    // Build the table row
    dl += `
      <dt class="${css}">
        <p>${glyph}</p>
      </dt>
      <dd>
        <p>${enriched}</p>
      </dd>
    `;

    // Extract conditions from enriched text
    const conditionMatch = enriched.match(
      /\b(weakened|restrained|frightened|bleeding|slowed|taunted|dazed)\b/i
    );

    if (conditionMatch) {
      const condition = conditionMatch[1].toLowerCase();

      // Skip enrichable conditions (handled elsewhere)
      if (supportedConditions.has(condition)) continue;

      const durationData = parseDuration(enriched);

      activeEffects.push({
        name: condition.charAt(0).toUpperCase() + condition.slice(1),
        img: "icons/svg/downgrade.svg",
        origin: null,
        transfer: false,
        type: "base",
        system: { end: { type: durationData.end, roll: durationData.roll } },
        changes: [],
        disabled: false,
        duration: { rounds: durationData.rounds },
        description: "",
        tint: "#ffffff",
        statuses: [condition],
        sort: 0,
        flags: {},
        _stats: {
          coreVersion: "13.347",
          systemId: "draw-steel",
          systemVersion: "0.8.0",
          lastModifiedBy: null
        }
      });
    }
  }

  dl += `</dl>`;
  item.system.effect.before += dl;
  item.effects.push(...activeEffects);
}