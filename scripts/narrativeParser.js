import { enrichNarrative } from "./narrativeUtils.js";
import { isNarrativeLine } from "./keywordParser.js";

export function parseNarrativeBlock(lines, startIndex = 0) {
  const paragraphs = [];
  let buffer = "";
  let i = startIndex;

  const abilityHeaderRegex = /^[a-z]\s+.+?(?:\s+\d+\s+malice|\s+signature ability)$/i;

  while (i < lines.length) {
    const line = lines[i].trim();

    console.log(`🔎 Line ${i}: "${line}"`);

    // Stop if we hit a new ability header
    if (abilityHeaderRegex.test(line)) {
      break;
    }

    // Skip non-narrative lines
    if (!isNarrativeLine(line)) {
      i++;
      continue;
    }

    // Append line to buffer
    buffer += (buffer ? " " : "") + line;

    // Look ahead to next line
    const nextLine = lines[i + 1]?.trim();
    const nextIsNarrative = nextLine && isNarrativeLine(nextLine);

    // Check if buffer ends with sentence punctuation
    const endsWithSentence = /[.!?]["']?$/.test(buffer.trim());

    // Flush only if sentence ends AND next line is not narrative
    if (endsWithSentence && !nextIsNarrative) {
      paragraphs.push(`<p>${enrichNarrative(buffer.trim())}</p>`);
      buffer = "";
    }

    i++;
  }

  // Final flush if buffer remains
  if (buffer.trim()) {
    paragraphs.push(`<p>${enrichNarrative(buffer.trim())}</p>`);
  }
  return { paragraphs, nextIndex: i };
}