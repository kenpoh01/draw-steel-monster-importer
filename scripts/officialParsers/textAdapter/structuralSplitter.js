// scripts/officialParsers/textAdapter/structuralSplitter.js
//
// Splits the ability/feature body of a monster stat block into blocks,
// classified as "ability" or "feature", WITHOUT depending on any single
// marker scheme. Different PDF extraction tools substitute different
// glyphs for the same underlying icons (a lowercase-letter icon font in
// some official PDFs, literal Unicode symbols like ▶/🟆/📏/🞋 in some
// pre-release copies, a "¢" block separator in others, or no separator
// at all) — so boundaries are detected from the *structure* of the text
// itself (action-type tags, distance/target shapes, tier lines), with
// any leading marker characters stripped as a bonus but never required.
//
// This heuristic was validated against three real, structurally distinct
// samples (an official-format monster with no markers at all, a
// pre-release monster using doubled Unicode emoji markers, and a
// pre-release monster using single-letter markers + a "¢" separator) and
// produced exactly correct block boundaries for all three. It is not
// bulletproof — it's tuned to patterns observed in real Draw Steel stat
// blocks — so unusual layouts may need small adjustments to the
// exclusion lists below.

const ACTION_TYPE_TAIL =
  /(signature ability|\d+\s+malice|villain action\s*\d*|heroic|main action|maneuver|free maneuver|triggered action|free triggered action|reaction)\s*$/i;

/**
 * Strip any known leading marker character/letter, if present.
 * Never required — just improves confidence and cleans the title text.
 */
export function stripLeadingMarker(line) {
  return line
    .replace(/^[▶🟆📏🞋¢]\s*/u, "")
    .replace(/^\*\s+/, "")
    .replace(/^[motglfbecdr)]\s+/, "");
}

// Lines that are always inline labels/continuations, never a new block title.
function looksLikeLabelLine(line) {
  if (!line) return false;
  if (/^(effect|trigger|special)\s*:/i.test(line)) return true;
  if (/^\d+\+?\s+malice\s*:/i.test(line)) return true; // "3 Malice: ..." cost-note paragraphs
  return /^[A-Z][A-Za-z' ]{1,40}:\s+\S/.test(line);
}

// Tier lines (glyph-based or numeric-threshold based) are never titles.
function looksLikeTierLine(line) {
  return /^(?:[!@#]|[áéí✦★✸]|(?:≤|<=|<)\s*\d+\b|\d+\s*[–-]\s*\d+\b|\d+\+(?=\D|$))/.test(line);
}

// Requires whitespace (not just a word boundary) after the word, so
// contractions like "Who's" or "They'll" at the start of a real title
// aren't caught by the bare relative-clause/pronoun word ("who", "they"...).
const CONTINUATION_WORDS =
  /^(?:and|or|but|the|a|an|this|that|these|those|who|which|if|while|when|each|at|additionally|however|until|before|after|then|also|whenever|any|another|to|of|in|on|for|she|he|it|they|once|during)\s/i;

function isSentenceContinuation(line) {
  if (/^[a-z]/.test(line)) return true;
  return CONTINUATION_WORDS.test(line);
}

// A real leading marker (letter-class or symbol) is a strong, reliable
// signal that a new block is starting, independent of how long or
// unusually-shaped the rest of the line is. This is what makes a fused
// "marker + title + inline body" line (some PDF extractions run a
// feature's title and its body together on one physical line, e.g.
// "t Speedy Wings Once per turn, the hawklord can...") still get
// recognized as a boundary, even though the line as a whole would fail
// the ordinary short-title shape check.
function hasKnownLeadingMarker(line) {
  return (
    /^[▶🟆📏🞋¢]/u.test(line) ||
    /^\*\s+[A-Z]/.test(line) ||
    /^[motglfbecdr)]\s+[A-Z]/.test(line)
  );
}

// When a marker-prefixed line is too long to be a plain title, it's
// likely a fused "title + inline body" line. Split at the first word
// that breaks the title pattern (lowercase-starting, or a recognized
// sentence-starter word like "Once"/"When"), capped at 4 words so an
// unusually long genuine title doesn't get mistaken for prose.
function splitInlineTitleAndBody(strippedLine) {
  const words = strippedLine.split(/\s+/);
  let titleLen = 0;
  for (let i = 0; i < words.length && i < 4; i++) {
    const w = words[i];
    if (!/^[A-Z]/.test(w)) break;
    if (i > 0 && CONTINUATION_WORDS.test(w + " ")) break;
    titleLen = i + 1;
  }
  if (titleLen === 0 || titleLen >= words.length) return null;
  return {
    title: words.slice(0, titleLen).join(" "),
    body: words.slice(titleLen).join(" ")
  };
}

// A wrapped continuation line — one that doesn't start a fresh sentence —
// can never be a title, regardless of what word it happens to start with.
// This catches proper-noun sentence starts ("Glaive against one creature.")
// that the word-list continuation check alone would miss.
function precededByUnterminatedLine(lines, i) {
  if (i === 0) return false;
  const prev = lines[i - 1].trim();
  if (!prev) return false;
  // Tier clauses ("a< 3] grabbed", "# 6 damage; pull 4") are terse
  // mechanical fragments that routinely end without a period — a new
  // ability starting right after one is common, not a wrapped
  // continuation of the tier text.
  if (looksLikeTierLine(prev)) return false;
  return !/[.!?"')\]]$/.test(prev);
}

// Distance/target lines ("Melee 1", "Ranged 6 x Two creatures", "5 burst
// x Each enemy...") share the same marker convention as feature/ability
// titles ("o", "g", etc. + space + capital letter), since they're a
// structural part of an ability's own preamble, not a new block. They're
// currently shielded from ever reaching the title checks by
// ABILITY_PREAMBLE_LINES forcing them into the block unconditionally —
// but that protection depends on the preamble always being exactly the
// expected shape. This check makes the exclusion explicit and
// unconditional, regardless of line position, so a distance line can
// never be mistaken for a title even if that positional assumption ever
// breaks.
function looksLikeDistanceLine(strippedLine) {
  return (
    /^(melee|ranged|reach|self|aura)\b/i.test(strippedLine) ||
    /^\d+\s*(burst|cube|aura|wall|line)\b/i.test(strippedLine) ||
    /^\d+\s*[×x]\s*\d+\s+line\b/i.test(strippedLine)
  );
}

// Ability-start: relies primarily on the structural action-type signature,
// which is a strong signal, so title-length isn't restricted as tightly.
// A real leading marker overrides the continuation/unterminated-line
// guards below — those exist only to catch marker-less wrapped text, and
// have no bearing on a line that already carries strong, independent
// evidence (the marker itself) of starting something new. This is what
// correctly separates a marked ability immediately following a tier line
// that doesn't end in punctuation (tier clauses routinely don't), e.g.
// "# 6 damage; pull 4; a< 3] grabbed" / "t Engulf" / "Melee Maneuver" —
// without needing a fix for every specific reason a preceding line might
// look "unterminated".
function isAbilityStart(lines, i) {
  const raw = lines[i].trim();
  const stripped = stripLeadingMarker(raw);
  if (!stripped || looksLikeLabelLine(stripped) || looksLikeTierLine(stripped)) return false;
  if (looksLikeDistanceLine(stripped)) return false;

  if (!hasKnownLeadingMarker(raw)) {
    if (isSentenceContinuation(stripped)) return false;
    if (precededByUnterminatedLine(lines, i)) return false;
  }

  if (ACTION_TYPE_TAIL.test(stripped)) return true;
  const next = lines[i + 1];
  if (next && ACTION_TYPE_TAIL.test(next.trim())) return true;
  return false;
}

// Feature-start: when no structural marker exists (some formats never
// have one), this leans on shape heuristics only — short, non-continuation,
// non-label, non-tier. When a real marker IS present, it overrides the
// continuation/unterminated-line guards for the same reason as above —
// but length still applies unconditionally, so an oversized marked line
// still falls through to the fused title+body split in the caller.
function looksLikeFeatureTitle(line, lines, i) {
  if (!line) return false;
  const stripped = stripLeadingMarker(line);
  if (stripped.length > 45) return false;
  if (looksLikeLabelLine(stripped)) return false;
  if (looksLikeTierLine(stripped)) return false;
  if (looksLikeDistanceLine(stripped)) return false;

  if (!hasKnownLeadingMarker(line)) {
    if (isSentenceContinuation(stripped)) return false;
    if (precededByUnterminatedLine(lines, i)) return false;
  }
  return true;
}

// An ability always has a fixed 3-line preamble shape: name line, then a
// keyword+action-type line, then a distance+target line. The two lines
// following a fresh ability-start are forced into the same block rather
// than re-tested, since the keyword/action-type line legitimately matches
// the ability-start signature itself (this is what makes villain actions
// with no explicit action-type suffix detectable via lookahead), and a
// bare distance/target line would otherwise pass the generic short-line
// feature-title test.
const ABILITY_PREAMBLE_LINES = 2;

/**
 * Split the ability/feature body (header lines already removed) into
 * blocks, each classified as "ability" or "feature".
 * @param {string[]} lines - trimmed, non-empty body lines
 * @returns {{type: "ability"|"feature", lines: string[]}[]}
 */
export function splitBodyIntoBlocks(lines) {
  const blocks = [];
  let current = null;
  let forceContinue = 0;

  function closeCurrent() {
    if (current && current.lines.length) blocks.push(current);
    current = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (forceContinue > 0) {
      current.lines.push(stripLeadingMarker(line));
      forceContinue--;
      continue;
    }

    if (isAbilityStart(lines, i)) {
      closeCurrent();
      current = { type: "ability", lines: [stripLeadingMarker(line)] };
      forceContinue = ABILITY_PREAMBLE_LINES;
      continue;
    }

    if (current === null || looksLikeFeatureTitle(line, lines, i)) {
      closeCurrent();
      current = { type: "feature", lines: [stripLeadingMarker(line)] };
      continue;
    }

    // Shape heuristics said "not a title" (too long), but a real marker
    // character says otherwise — trust the marker and, if the title and
    // body are fused on one line, split them. (Distance lines are
    // excluded — they share the same marker convention but are part of
    // an ability's own preamble, not a new block.)
    if (hasKnownLeadingMarker(line) && !looksLikeDistanceLine(stripLeadingMarker(line))) {
      const stripped = stripLeadingMarker(line);
      const split = splitInlineTitleAndBody(stripped);
      closeCurrent();
      if (split) {
        current = { type: "feature", lines: [split.title, split.body] };
      } else {
        current = { type: "feature", lines: [stripped] };
      }
      continue;
    }

    current.lines.push(stripLeadingMarker(line));
  }
  closeCurrent();
  return blocks;
}

/**
 * Drop lines that are purely separator/marker characters (e.g. a lone
 * "¢" or "*" used as a block delimiter) — once we're splitting
 * structurally, these carry no information and only risk confusing the
 * "did the previous line end a sentence" check.
 */
export function stripPureMarkerLines(lines) {
  return lines.filter(l => stripLeadingMarker(l).trim() !== "");
}
