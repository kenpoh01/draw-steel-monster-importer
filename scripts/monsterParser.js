// scripts/monsterParser.js

import { normalizeText } from "./normalizeText.js";
import { parseOfficialText } from "./officialParsers/textAdapter/blockSeparator.js";
import { parseOfficialMonster } from "./officialParser.js";
import { validOrganizations, validRoles } from "./keywordParser.js";

/**
 * Find the line indices that start a new monster's header
 * ("NAME LEVEL N ORG ROLE" — the same shape headerAdapter.js's own
 * nameLine detection looks for), so multiple monsters pasted into the
 * same box can be split apart before parsing.
 *
 * Requires a "Level N" match AND at least one known organization word
 * AND at least one known role word on the same line, so ordinary
 * flavor text mentioning "level" elsewhere can't be mistaken for a new
 * monster header.
 */
function findMonsterHeaderLineIndices(lines) {
  const indices = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/Level\s+\d+/i.test(line)) continue;

    const words = line.toLowerCase().split(/\s+/);
    const hasOrg = words.some(w => validOrganizations.includes(w));
    const hasRole = words.some(w => validRoles.includes(w));

    if (hasOrg && hasRole) indices.push(i);
  }

  return indices;
}

/**
 * Split raw text containing one or more monster stat blocks into
 * separate raw-text chunks, one per monster.
 */
function splitIntoMonsterChunks(rawText) {
  const lines = rawText.split("\n");
  const headerIndices = findMonsterHeaderLineIndices(lines);

  // No recognizable header, or only one — treat the whole text as a
  // single monster (unchanged from previous behavior).
  if (headerIndices.length <= 1) {
    return [rawText];
  }

  const chunks = [];
  for (let i = 0; i < headerIndices.length; i++) {
    const start = headerIndices[i];
    const end = i + 1 < headerIndices.length ? headerIndices[i + 1] : lines.length;
    chunks.push(lines.slice(start, end).join("\n"));
  }
  return chunks;
}

/**
 * Parse one monster's raw text into { actorData, features, abilities }.
 */
async function parseSingleMonster(rawText) {
  const { header, features, abilities } = parseOfficialText(rawText);

  const actorData = await parseOfficialMonster({
    headerObj: header,
    features,
    abilities
  });

  return { actorData, features, abilities };
}

/**
 * Parse raw text that may contain one or more monster stat blocks.
 * Always returns an array — a single monster still comes back as a
 * one-element array, so callers don't need two code paths.
 */
export async function parseMonsters(rawText) {
  rawText = normalizeText(rawText);

  const chunks = splitIntoMonsterChunks(rawText);
  const results = [];

  for (const chunk of chunks) {
    results.push(await parseSingleMonster(chunk));
  }

  return results;
}

/**
 * Backward-compatible single-monster entry point. Parses only the first
 * detected monster if multiple are present.
 */
export async function parseMonster(rawText) {
  const [first] = await parseMonsters(rawText);
  return first;
}
