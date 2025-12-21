// scripts/preReleaseParsers/abilityParser.js

import { parseKeywordLine } from "../keywordParser.js";
import { parseTierText, parseTarget } from "../tierParser.js";   // note: tierParser is in ../scripts
import { parseDistanceLine } from "../distanceParser.js";
import { enrichNarrative } from "../narrativeUtils.js";
import { normalizeText } from "./normalizeText.js";

const abilityHeaderRegex = /\((Action|Maneuver|Trait|Triggered|Reaction)\)/i;
const monsterHeaderRegex = /^[A-Z\s]+LEVEL\s+\d+/i;
const featureHeaderRegex = /^[A-Z][a-z]+$/;

export function parseAbilitiesAndFeatures(rawText) {
  const lines = rawText.split("\n").map(l => normalizeText(l.trim()));
  console.log("🔍 Raw lines after normalizeText:", lines);

  const abilities = [];
  const features = [];

  let currentBlock = [];

  const flushBlock = () => {
    if (currentBlock.length === 0) return;
    const header = currentBlock[0];

    if (abilityHeaderRegex.test(header)) {
      const match = header.match(abilityHeaderRegex);
      const name = header.split("(")[0].trim();
      const type = match[1].toLowerCase();

      const ability = {
        name,
        type: "ability",
        system: {
          subtype: type,
          keywords: [],
          distance: null,
          target: null,
          effect: { before: "", after: "" },
          tiers: []
        }
      };

      for (let i = 1; i < currentBlock.length; i++) {
        let line = currentBlock[i];

        // Keywords
        if (/^Keywords\b/i.test(line)) {
          const kws = parseKeywordLine(line);
          ability.system.keywords = Array.isArray(kws)
            ? kws
            : typeof kws === "string"
            ? kws.split(",").map(s => normalizeText(s.trim()))
            : [];
          continue;
        }

        // Tier lines (delegate to tierParser)
        if (/^[✦★✸]/.test(line)) {
          const tier = parseTierText(line);
          if (tier) ability.system.tiers.push(tier);
          continue;
        }

        // Target line (delegate to tierParser.parseTarget)
        if (/Target/i.test(line)) {
          const target = parseTarget(line);
          ability.system.target = target;
          ability.system.effect.before += `<p>${normalizeText(target.custom || line)}</p>`;
          continue;
        }

        // Distance line
        if (/Distance/i.test(line)) {
          const distance = parseDistanceLine(line);
          if (distance) ability.system.distance = distance;
          continue;
        }

        // Effect (multi-line concatenation)
        if (/^Effect/i.test(line)) {
          let effectText = normalizeText(line);
          let j = i + 1;
          while (j < currentBlock.length) {
            const nextLine = normalizeText(currentBlock[j]);
            if (
              abilityHeaderRegex.test(nextLine) ||
              monsterHeaderRegex.test(nextLine) ||
              featureHeaderRegex.test(nextLine) ||
              nextLine === ""
            ) {
              break;
            }
            effectText += " " + nextLine;
            j++;
            i = j - 1;
          }
          ability.system.effect.after += `<p>${enrichNarrative(effectText)}</p>`;
          continue;
        }

        // Narrative fallback
        ability.system.effect.after += `<p>${enrichNarrative(normalizeText(line))}</p>`;
      }

      abilities.push(ability);

    } else {
      // Feature block
      const name = header;
      const description = currentBlock.slice(1)
        .map(l => `<p>${enrichNarrative(normalizeText(l))}</p>`)
        .join("");

      const feature = {
        name,
        type: "feature",
        system: { description: { value: description } }
      };

      features.push(feature);
    }

    currentBlock = [];
  };

  // --- Robust block splitting ---
  lines.forEach(line => {
    if (abilityHeaderRegex.test(line) || monsterHeaderRegex.test(line) || featureHeaderRegex.test(line)) {
      flushBlock();
      currentBlock.push(line);
    } else if (line === "") {
      flushBlock();
    } else {
      currentBlock.push(line);
    }
  });
  flushBlock();

  return { abilities, features };
}