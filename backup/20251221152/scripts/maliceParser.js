import { parseDamage } from "./damageParser.js";
import { parseDistanceLine } from "./distanceParser.js";
import { parseTarget } from "./tierParser.js";
import { enrichNarrative } from "./narrativeUtils.js";
import { finalizeEffectTable } from "./effectTableBuilder.js";
import { parseHeaderLine } from "./headerParser.js";
import { parseKeywordLine, isNarrativeLine, supportedConditions } from "./keywordParser.js";
import { parseConditionEffect } from "./conditionParser.js";



export function parseMaliceText(rawText) {
  const lines = rawText.split("\n").map(l => l.trim());
  const items = [];
  let current = null;
  let typeKey = "";
  let tierLines = [];
  let postTierLines = [];
  let afterTierStarted = false;

  let collectingTier = false;
  let currentTier = "";
  let tierBuffer = [];

  let narrativeBuffer = [];

  const abilityHeaderRegex = /^[a-z]\s+.+?(?:\s+\d+\s+malice|\s+signature ability)$/i;

  function flushNarrativeBuffer(target = "before", force = false) {
    if (!current || narrativeBuffer.length === 0) return;

    const joined = narrativeBuffer.join(" ");
    const endsWithSentence = /[.!?]["']?$/.test(joined.trim());

    if (force || endsWithSentence) {
      current.system.effect[target] += `<p>${enrichNarrative(joined.trim())}</p>`;
      narrativeBuffer = [];
    }
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (i === 0 && /malice features/i.test(line)) {
      typeKey = line.split(" ")[0].trim();
      i++;
      continue;
    }

    if (line.startsWith("e ") && current) {
      flushNarrativeBuffer("before", true);
      const parsed = parseDistanceLine(line);
      if (parsed) {
        current.system.distance = parsed.distance;
        current.system.target = parsed.target;
      }
      i++;
      continue;
    }

    const header = parseHeaderLine(line);
    if (header) {
      flushNarrativeBuffer("before", true);
      flushNarrativeBuffer("after", true);

      if (current) {
        if (collectingTier && currentTier) {
          tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
          tierBuffer = [];
          collectingTier = false;
          currentTier = "";
        }
        finalizeEffectTable(current, tierLines);
        if (postTierLines.length) {
  

  const afterHtml = postTierLines
  .filter(line => {
    const parsed = parseConditionEffect(line);
    return !(parsed.condition && supportedConditions.has(parsed.condition));
  })
  .map(l => `<p>${enrichNarrative(l)}</p>`)
  .join("");
  
  
          current.system.effect.after += afterHtml;
        }
        items.push(current);
        tierLines = [];
        postTierLines = [];
        afterTierStarted = false;
      }

      const { name, cost, category } = header;
      const nextLine = lines[i + 1]?.trim();
let type = "none";
const keywords = [];

const keywordPhrases = [
  "main action", "triggered action", "reaction", "maneuver",
  "area", "melee", "ranged", "weapon", "magic"
];

const isKeywordLine = /^[A-Z][a-z]+(,\s*[A-Z][a-z]+)*\s+(Main|Triggered|Reaction|Maneuver) action$/i.test(nextLine);


if (isKeywordLine) {
  const { type: parsedType, keywords: parsedKeywords } = parseKeywordLine(nextLine);
  type = parsedType;
  keywords.push(...parsedKeywords);
  lines[i + 1] = ""; // prevent reprocessing
} else {
  // Start narrative buffering immediately
  narrativeBuffer.push(nextLine);
  lines[i + 1] = ""; // prevent reprocessing
}

      current = {
        name,
        type: "ability",
        img: "icons/magic/unholy/silhouette-robe-evil-power.webp",
        system: {
          type,
          category: "heroic",
          resource: cost,
          trigger: `A ${typeKey.toLowerCase()} starts its turn.`,
          distance: { type: "special" },
          target: { type: "special" },
          damageDisplay: "melee",
          power: {
            roll: { formula: "", characteristics: [] },
            effects: {}
          },
          effect: { before: "", after: "" },
          spend: { text: "", value: null },
          source: {
            book: "Monsters",
            page: "",
            license: "Draw Steel Creator License",
            revision: 1
          },
          story: "",
          keywords
        },
        effects: [],
        folder: null,
        sort: 0,
        flags: {},
        _stats: {
          coreVersion: "13.347",
          systemId: "draw-steel",
          systemVersion: "0.8.0",
          lastModifiedBy: null
        }
      };

      // Buffer narrative lines immediately after header
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (/^[123áéí]\s+/.test(nextLine) || abilityHeaderRegex.test(nextLine) || nextLine.startsWith("e ")) break;

        if (isNarrativeLine(nextLine)) {
          narrativeBuffer.push(nextLine);
          const joined = narrativeBuffer.join(" ");
          const endsWithSentence = /[.!?]["']?$/.test(joined.trim());
          if (endsWithSentence) {
            current.system.effect.before += `<p>${enrichNarrative(joined.trim())}</p>`;
            narrativeBuffer = [];
          }
        }

        j++;
      }

      i = j;
      continue;
    }

    const tierStart = line.match(/^([123áéí])\s+(.*)/);
    if (tierStart) {
      flushNarrativeBuffer("before", true);
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

    if (collectingTier) {
      const isNewAbility = abilityHeaderRegex.test(line);
      const isNewTier = /^[123áéí]\s/.test(line);

      if (isNewAbility || isNewTier) {
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

    const tierLineMatch = line.match(/^([123áéí])\s+/);
    if (current && !collectingTier && tierLineMatch) {
      flushNarrativeBuffer("before", true);
      afterTierStarted = true;
    }

    if (afterTierStarted && current) {
      flushNarrativeBuffer("after");


if (/^effect:/i.test(line)) {
  const effectText = line.replace(/^effect:/i, "").trim();
  const parsed = parseConditionEffect(effectText);

  // Suppress enrichable conditions
  if (parsed.condition && supportedConditions.has(parsed.condition)) {
    i++;
    continue;
  }

  current.system.effect.after += `<p>${enrichNarrative(effectText)}</p>`;
} else {
        postTierLines.push(line);
      }
      i++;
      continue;
    }

    if (current && isNarrativeLine(line)) {
      narrativeBuffer.push(line);
      const joined = narrativeBuffer.join(" ");
      const endsWithSentence = /[.!?]["']?$/.test(joined.trim());
      if (endsWithSentence) {
        current.system.effect.before += `<p>${enrichNarrative(joined.trim())}</p>`;
        narrativeBuffer = [];
      }
    }

    i++;
  }

  flushNarrativeBuffer("before", true);
  flushNarrativeBuffer("after", true);

  if (collectingTier && currentTier) {
    tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
  }

  if (current) {
    finalizeEffectTable(current, tierLines);
    if (postTierLines.length) {
      const afterHtml = postTierLines.map(l => `<p>${enrichNarrative(l)}</p>`).join("");
      current.system.effect.after += afterHtml;
    }
    items.push(current);
  }

  return {
    typeKey,
    items
  };
}