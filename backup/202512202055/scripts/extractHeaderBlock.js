/**
 * Split raw monster text into header, stats, and ability/feature sections
 * using a single "*" on its own line as a delimiter.
 *
 * Example expected input:
 *   Header lines...
 *   *
 *   Stats lines...
 *   *
 *   Ability 1...
 *   *
 *   Ability 2...
 *   ...
 */
export function extractHeaderBlock(rawText) {
  // Split only on lines that contain exactly "*"
  const sections = rawText.split(/\n\*\n/).map(s => s.trim()).filter(Boolean);

  // At minimum we expect: header + stats + abilities
  const headerBlock = sections[0] || "";
  const statsBlock = sections[1] || "";
  const abilitySections = sections.slice(2);

  // Preserve separators between abilities so parseOfficialText can split again
  const abilityText = abilitySections.join("\n*\n");

  // Debug logs
  console.log("⭐ extractHeaderBlock sections count:", sections.length);
  console.log("⭐ headerBlock preview:", headerBlock.slice(0, 100));
  console.log("⭐ statsBlock preview:", statsBlock.slice(0, 100));
  console.log("⭐ abilityText preview:", abilityText.slice(0, 200));
  console.log("⭐ abilityText contains * ?", abilityText.includes("*"));

  return { headerBlock, statsBlock, abilityText };
}