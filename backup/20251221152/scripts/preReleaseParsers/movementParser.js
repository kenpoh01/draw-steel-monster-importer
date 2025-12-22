// scripts/preReleaseParsers/movementParser.js
import { validMovementTypes } from "../keywordParser.js";

export function parseMovementLine(line) {
  let speed = 0;
  let movementTypes = ["walk"];

  const speedMatch = line.match(/Speed\s+(\d+)/i);
  if (speedMatch) speed = parseInt(speedMatch[1], 10);

  const typeMatch = line.match(/\(([^)]+)\)/);
  if (typeMatch) {
    const types = typeMatch[1].split(/[,;]/).map(t => t.trim().toLowerCase());
    movementTypes = types.filter(t => validMovementTypes.includes(t));
  }

  return { speed, movementTypes };
}