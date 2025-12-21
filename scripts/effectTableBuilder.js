// effectTableBuilder.js
import { enrichNarrative } from "./narrativeUtils.js";
import { parseDuration } from "./durationParser.js";
import { supportedConditions } from "./keywordParser.js";



function convertTierLabel(tierChar) {
  switch (tierChar) {
    case "á": case "1": return "11 or less";
    case "é": case "2": return "12–16";
    case "í": case "3": return "17+";
    default: return tierChar;
  }
}

function convertTierGlyph(tierChar) {
  switch (tierChar) {
    case "á": case "1": return { css: "tier1", glyph: "!" };
    case "é": case "2": return { css: "tier2", glyph: "@" };
    case "í": case "3": return { css: "tier3", glyph: "#" };
    default: return { css: "tierX", glyph: tierChar };
  }
}

export function finalizeEffectTable(item, tierLines) {
  if (!tierLines.length) return;

  let dl = `<dl class="power-roll-display">`;
  const activeEffects = [];

  tierLines.forEach(line => {
    const match = line.match(/^([123áéí])\s+(.*)/);
    if (!match) return;

    const tier = match[1];
    let rawText = match[2].trim();
    let effectText = "";

    // Split at "Effect:" if present
    const effectSplit = rawText.split(/Effect:/i);
    if (effectSplit.length === 2) {
      rawText = effectSplit[0].trim();
      effectText = effectSplit[1].trim();
    }

    const enriched = enrichNarrative(rawText);
    const { css, glyph } = convertTierGlyph(tier);

    // Build <dt>/<dd> pair
    dl += `
      <dt class="${css}">
        <p>${glyph}</p>
      </dt>
      <dd>
        <p>${enriched}</p>
      </dd>
    `;

    if (effectText) {
      item.system.effect.after += `<p>${enrichNarrative(effectText)}</p>`;
    }

    // Condition detection
    const conditionMatch = enriched.match(/\b(weakened|restrained|frightened|bleeding|slowed|taunted|dazed)\b/i);
    if (conditionMatch) {
      const condition = conditionMatch[1].toLowerCase();

      // Suppress enrichable conditions
      if (supportedConditions.has(condition)) return;

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
  });

  dl += `</dl>`;
  item.system.effect.before += dl;
  item.effects.push(...activeEffects);
}