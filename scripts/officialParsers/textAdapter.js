import { normalizeText } from "../preReleaseParsers/normalizeText.js";

/**
 * Parse raw official monster text into structured { features, abilities }.
 * Splits on "*" separators (used in official PDFs).
 */
export function parseOfficialText(rawText) {

  const blocks = rawText.split("*").map(b => b.trim()).filter(Boolean);
  console.log("🔎 Found blocks:", blocks.length);

  const features = [];
  const abilities = [];

  for (const [i, block] of blocks.entries()) {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    if (!lines.length) continue;

    const isAbility =
  /\d+d\d+/.test(block) ||
  /^[!@#]/m.test(block) ||
  /action/i.test(block) ||
  /maneuver/i.test(block);


    console.log("   ➡ isAbility?", isAbility);

    if (isAbility) {
      const parsedAbility = parseAbilityBlock(lines);
      abilities.push(parsedAbility);
    } else {
      const parsedFeature = parseFeatureBlock(lines);
      features.push(parsedFeature);
    }
  }

  return { features, abilities };
}

function parseFeatureBlock(lines) {
  const name = lines[0];
  const description = normalizeText(lines.slice(1).join(" "));
  return {
    name,
    effects: description ? [{ effect: description }] : []
  };
}

function parseAbilityBlock(lines) {
  const ability = {
    name: "",
    type: "",
    category: "",
    keywords: [],
    distance: "",
    target: "",
    effects: [],
    damageDisplay: "",
    spendText: "",
    spendValue: null,
    effectAfter: "",
    trigger: ""
  };

  const header = lines[0];

  const diceMatch = header.match(/(\d+d\d+\s*\+\s*\d+)/);
  ability.formula = diceMatch ? diceMatch[1] : "@chr";

  // Clean name: strip dice, category, and malice cost
  ability.name = header
    .replace(/(\d+d\d+\s*\+\s*\d+)/, "")
    .replace(/\bSignature Ability\b/i, "")
    .replace(/\bVillain Action\s*\d+\b/i, "")
    .replace(/\bHeroic\b/i, "")
    .replace(/\b\d+\s*Malice\b/i, "")
    .trim();

  if (/Signature Ability/i.test(header)) ability.category = "signature";
  if (/Villain Action/i.test(header)) ability.category = "villain";
  if (/Heroic/i.test(header)) ability.category = "heroic";

  // Keywords vs action type
  const keywordsLine = lines.find(l => /(Melee|Area|Ranged|Weapon|Magic|Strike)/i.test(l)) || "";
  ability.keywords = keywordsLine
    .replace(/\b(Main action|Triggered action|Maneuver)\b/ig, "")
    .split(/,\s*/)
    .map(k => k.toLowerCase())
    .filter(Boolean);

if (/maneuver/i.test(keywordsLine) || /maneuver/i.test(header)) {
  ability.type = "maneuver";
  ability.distance = "Self";
  ability.target = "Self";
} else if (/triggered/i.test(keywordsLine) || /triggered/i.test(header)) {
  ability.type = "triggered";
  ability.distance = "Self";
  ability.target = "Self";
} else if (/villain/i.test(header)) {
  ability.type = "villain";
} else {
  ability.type = "main";
}

// Only assign raw distance/target if not maneuver/triggered
if (ability.type !== "maneuver" && ability.type !== "triggered") {
  const distanceTargetLine = lines.find(l =>
    /(Melee|cube|line|Self|within|×)/i.test(l)
  ) || "";
  ability.distance = distanceTargetLine;
  ability.target = distanceTargetLine;
}

  // Damage display
  if (ability.keywords.includes("magic")) ability.damageDisplay = "magic";
  else if (ability.keywords.includes("ranged")) ability.damageDisplay = "ranged";
  else if (ability.keywords.includes("weapon")) ability.damageDisplay = "weapon";
  else ability.damageDisplay = "melee";

  // Tiered effects
  lines.forEach(l => {
    if (l.startsWith("!")) ability.effects.push({ t1: normalizeText(l.slice(1).trim()) });
    if (l.startsWith("@")) ability.effects.push({ t2: normalizeText(l.slice(1).trim()) });
    if (l.startsWith("#")) ability.effects.push({ t3: normalizeText(l.slice(1).trim()) });
  });

  // Effect line
  const effectLine = lines.find(l => /^Effect:/i.test(l));
  if (effectLine) ability.effectAfter = normalizeText(effectLine.replace(/^Effect:/i, "").trim());

  // Trigger line
  const triggerLine = lines.find(l => /^Trigger:/i.test(l));
  if (triggerLine) ability.trigger = normalizeText(triggerLine.replace(/^Trigger:/i, "").trim());

  // Malice spend line
  const spendLine = lines.find(l => /Malice/i.test(l));
  if (spendLine) {
    ability.spendText = spendLine.replace(/^[A-Za-z\s\d\+\-]+/, "").trim();
    const valMatch = spendLine.match(/(\d+)\s*Malice/i);
    if (valMatch) ability.spendValue = parseInt(valMatch[1], 10);
  }

  return ability;
}