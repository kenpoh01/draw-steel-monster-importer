// scripts/preReleaseParsers/ancestryParser.js
import { normalizeAncestry } from "../keywordParser.js";

export function parseAncestry(lines) {
  const ancestryLine = lines.find(l => {
    const firstWord = l.split(" ")[0].toLowerCase();
    return normalizeAncestry(firstWord) !== "";
  });
  if (ancestryLine) {
    const firstWord = ancestryLine.split(" ")[0].toLowerCase();
    return normalizeAncestry(firstWord);
  }
  return "";
}