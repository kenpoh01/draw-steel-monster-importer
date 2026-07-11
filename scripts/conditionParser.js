import { allConditions, durationMap, supportedConditions } from "./keywordParser.js";

/**
 * Parses a condition effect line and returns structured data.
 * Recognizes known conditions and classifies unknown ones as "other".
 */
export function parseConditionEffect(text) {
  const lowered = text.toLowerCase();

  for (const condition of allConditions) {
    if (lowered.includes(condition)) {
      const enrichable = supportedConditions.has(condition);
      return {
        condition,
        type: "applied",
        saveEnds: lowered.includes("save ends"),
        enrichable // internal use only
      };
    }
  }

  return {
    condition: null,
    type: "other",
    saveEnds: false,
    enrichable: false
  };
}



/**
 * Attempts to extract a duration tag from the effect text.
 * Returns a normalized duration keyword or null.
 */
export function parseDuration(text) {
  const lowered = text.toLowerCase();
  for (const key in durationMap) {
    if (lowered.includes(key)) return durationMap[key];
  }
  return null;
}