// scripts/preReleaseParsers/traitParser.js
import { isNarrativeLine } from "../keywordParser.js";

export function parseTraits(lines) {
  return lines.filter(isNarrativeLine);
}