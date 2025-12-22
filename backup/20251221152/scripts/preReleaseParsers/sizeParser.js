// scripts/preReleaseParsers/sizeParser.js

export function parseSizeLine(line) {
  let sizeValue = 1;
  let sizeLetter = "";

  const sizeMatch = line.match(/Size\s+(\d+)(?:\s*([TSML]))?/i);
  if (sizeMatch) {
    sizeValue = parseInt(sizeMatch[1], 10);

    // Only assign a letter if sizeValue === 1
    if (sizeValue === 1 && sizeMatch[2]) {
      sizeLetter = sizeMatch[2].toUpperCase();
    }
  }

  return { sizeValue, sizeLetter };
}