// durationParser.js

export function parseDuration(text = "") {
  const lower = text.toLowerCase();

  if (/\(save ends\)/i.test(lower)) {
    return { end: "save", rounds: null, roll: "1d10 + @combat.save.bonus" };
  }

  if (/until the end of the round/.test(lower)) {
    return { end: "round", rounds: 1, roll: "" };
  }

  if (/until the end of the turn/.test(lower) || /\(eot\)/i.test(lower)) {
    return { end: "turn", rounds: 1, roll: "" };
  }

  if (/until the end of the encounter/.test(lower) || /until .* disappears/.test(lower)) {
    return { end: "encounter", rounds: null, roll: "" };
  }

  return { end: "turn", rounds: 1, roll: "" };
}