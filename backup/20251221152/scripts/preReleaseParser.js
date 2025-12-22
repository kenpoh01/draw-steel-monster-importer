import { parseMonsterCore } from "./officialParsers/monsterCore.js";
import { parseItems } from "./itemParser.js";

/**
 * Orchestrator: take headerObj + features + abilities
 * and build Foundry actor JSON for pre‑release text.
 */
export async function parsePreReleaseMonster(rawData) {
  // Build the actor core system data from the header
  const coreActor = parseMonsterCore(rawData.headerObj);

  // Use the shared item parser for both features and abilities
  const items = parseItems(rawData.features || [], rawData.abilities || [], rawData.headerObj);

  // Merge into final actorData
  return { ...coreActor, items };
}