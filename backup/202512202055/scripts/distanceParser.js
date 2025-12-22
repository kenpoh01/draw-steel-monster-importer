// distanceParser.js
import { parseTarget } from "./tierParser.js";

export function parseDistanceLine(line = "") {
  if (!line.startsWith("e ")) return null;

  const raw = line.slice(2).trim();
  const lowerRaw = raw.toLowerCase();

  // Split on the LAST occurrence of " x " or " × "
  const splitMatch = lowerRaw.match(/^(.*)\s+[x×]\s+(.*)$/i);
  const distancePart = splitMatch ? splitMatch[1].trim() : raw.trim();
  const targetPart = splitMatch ? splitMatch[2].trim() : "";

  let distance = {};
  const target = parseTarget(targetPart);

  // Match "10 × 1 line within 1"
  const lineMatch = distancePart.match(/(\d+)\s*[×x]\s*(\d+)\s+(\w+)\s+within\s+(\d+)/i);
  if (lineMatch) {
    const [, primary, secondary, shape, range] = lineMatch;
    distance = {
      type: shape.toLowerCase(),
      primary: parseInt(primary),
      secondary: parseInt(secondary),
      tertiary: parseInt(range)
    };
  } else {
    // Match "2 cube within 2"
    const cubeMatch = distancePart.match(/^(\d+)\s+cube\s+within\s+(\d+)$/i);
    if (cubeMatch) {
      const [, size, range] = cubeMatch;
      distance = {
        type: "cube",
        primary: parseInt(size),
        secondary: parseInt(range)
      };
    } else {
      // Fallback: assign "special"
      distance = { type: "special" };
    }
  }

  return { distance, target };
}