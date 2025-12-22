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
      console.log(`⏭️ Skipping non-narrative line ${i}`);
      i++;
      continue;
    }

    // Append line to buffer
    buffer += (buffer ? " " : "") + line;
    console.log(`🧱 Buffer after line ${i}: "${buffer}"`);

    // Look ahead to next line
    const nextLine = lines[i + 1]?.trim();
    const nextIsNarrative = nextLine && isNarrativeLine(nextLine);
    console.log(`👀 Next line narrative? ${nextIsNarrative ? "Yes" : "No"}`);

    // Check if buffer ends with sentence punctuation
    const endsWithSentence = /[.!?]["']?$/.test(buffer.trim());
    console.log(`✅ Ends with sentence? ${endsWithSentence ? "Yes" : "No"}`);

    // Flush only if sentence ends AND next line is not narrative
    if (endsWithSentence && !nextIsNarrative) {
      console.log(`📤 Flushing paragraph: "${buffer.trim()}"`);
      paragraphs.push(`<p>${enrichNarrative(buffer.trim())}</p>`);
      buffer = "";
    }

    i++;
  }

  // Final flush if buffer remains
  if (buffer.trim()) {
    console.log(`📤 Final flush: "${buffer.trim()}"`);
    paragraphs.push(`<p>${enrichNarrative(buffer.trim())}</p>`);
  }

  console.log(`✅ Parsed ${paragraphs.length} paragraph(s) from lines ${startIndex} to ${i}`);
  return { paragraphs, nextIndex: i };
}