// scripts/monsterParser.js

import { normalizeText } from "./normalizeText.js";
import { parseOfficialText } from "./officialParsers/textAdapter/blockSeparator.js";
import { parseOfficialMonster } from "./officialParser.js";

export async function parseMonster(rawText) {
  // Clean the text
  rawText = normalizeText(rawText);

  // Split into header, features, abilities
  const { header, features, abilities } = parseOfficialText(rawText);

  // Build actorData using the official parser
  const actorData = await parseOfficialMonster({
    headerObj: header,
    features,
    abilities
  });

  return {
    actorData,
    features,
    abilities
  };
}