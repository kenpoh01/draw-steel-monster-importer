// scripts/narrativeUtils.js
import { normalizeText } from "./normalizeText.js";

export function enrichNarrative(text) {
  const normalized = normalizeText(text);

  const collapsed = normalized
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

const withDamage = collapsed.replace(
  /((\d+d\d+(?:\s*\+\s*\d+)?)|\d+)\s*(\w+)?\s*damage/gi,
  (_, amount, _dice, type) => {
    const dmgType = type?.toLowerCase();
    const enriched = dmgType && dmgType !== "damage"
      ? `[[/damage ${amount} ${dmgType}]] damage`
      : `[[/damage ${amount}]] damage`;
    return enriched;
  }
);



  const skillList = ["Might", "Intuition", "Agility", "Reason", "Presence"];
  const skillRegex = new RegExp(`\\b(${skillList.join("|")})\\s+test\\b`, "gi");

  const withSkills = withDamage.replace(skillRegex, (_, skill) => {
    return `<span style="text-decoration:underline"><strong>${skill} test</strong></span>`;
  });

  const skillInitials = ["m", "i", "a", "r", "p"];
  const skillRangeRegex = new RegExp(`\\b([${skillInitials.join("")}])\\s*<\\s*([0-9]+)\\s*]`, "gi");

  const withSkillRanges = withSkills.replace(skillRangeRegex, (_, letter, num) => {
    return `${letter.toUpperCase()}<${num}`;
  });

  return withSkillRanges;
}