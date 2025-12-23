// scripts/helpers/enricherInjector.js
import { supportedConditions, durationMap } from "../keywordParser.js";

/**
 * Inline-replace condition words in narrative text with clickable /apply enrichers.
 * Detects bracketed durations immediately following the condition.
 * Does NOT enrich tier effects.
 */
export function injectConditionEnrichersIntoText(effectText) {
  if (!effectText) return effectText;

  let output = effectText;

  for (const cond of supportedConditions) {
    // Match:
    //   weakened
    //   weakened (save ends)
    //   weakened [save ends]
    //
    // Capture group 1 = optional bracketed duration text
    const regex = new RegExp(
      `\\b${cond}\\b(?:\\s*[\\[(]([^\\])]+)[\\])])?`,
      "gi"
    );

    output = output.replace(regex, (match, bracketText) => {
      let ending = "";

      if (bracketText) {
        const lowered = bracketText.toLowerCase().trim();

        // Look for any duration keyword inside the bracket text
        for (const key of Object.keys(durationMap)) {
          if (lowered.includes(key)) {
            // Convert durationMap value into enricher suffix
            if (key === "save ends") ending = " save";
            else if (key === "start of turn") ending = " start";
            else if (key === "end of turn") ending = " end";
            else if (key === "until moved") ending = " untilMoved";
            else if (key === "until damaged") ending = " untilDamaged";
            else if (key === "until end of round") ending = " endRound";
            else if (key === "until end of encounter") ending = " endEncounter";
            break;
          }
        }
      }

      return `[[/apply ${cond}${ending}]]`;
    });
  }

  return output;
}