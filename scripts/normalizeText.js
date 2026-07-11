// scripts/normalizeText.js

// ------------------------------------------------------------
// PDF-EXTRACTION ARTIFACT NORMALIZATION
// ------------------------------------------------------------
// Different PDF readers/copy tools extract Draw Steel stat blocks with
// wildly different glyph substitutions for the same underlying icons:
// some produce plain lowercase "icon letters" (an artifact of a custom
// icon font), others produce literal doubled Unicode symbols (e.g. a
// ruler emoji doubled for a bold rendering: "📏📏"), and characteristic
// initials sometimes come through as doubled Mathematical Alphanumeric
// Symbols (e.g. "𝗠𝗠ight" for a bold "M" glyph followed by "ight").
//
// This collapses any immediately-repeated non-ASCII character down to a
// single occurrence, then applies Unicode NFKD normalization, which (per
// the Unicode Character Database) maps Mathematical Alphanumeric Symbols
// to their plain ASCII letter/digit equivalents. Example:
//   "𝗠𝗠ight +3"  →  "𝗠ight +3"  →  "Might +3"
//   "📏📏 Melee 2 🞋🞋 Two creatures"  →  "📏 Melee 2 🞋 Two creatures"
// Real doubled ASCII letters (e.g. "recess") are never touched, since the
// collapse only matches non-ASCII code points.
// ------------------------------------------------------------
function normalizeUnicodeArtifacts(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/([\u0080-\u{10FFFF}])\1/gu, "$1")
    .normalize("NFKD");
}

// ------------------------------------------------------------
// SPLIT CHARACTERISTIC LABEL REPAIR
// ------------------------------------------------------------
// Some PDF column/table extractions render each characteristic's
// leading initial as a separate styled glyph, which comes through as
// the initial letter, a space (or even a line wrap), and then the rest
// of the word — sometimes with no space at all against a neighboring
// value, e.g.:
//   "M ight +0 A gility +2R eason 0 I ntuition 0 P\nresence 0"
// This repairs each of the five characteristic names specifically
// (never touching ordinary standalone "A"/"I" words elsewhere in the
// text) by rejoining "<initial> <rest-of-word>" — using \s so it also
// bridges a line-wrap split like "P\nresence" — back into one word.
// ------------------------------------------------------------
function repairSplitCharacteristicLabels(text) {
  if (typeof text !== "string") return text;
  const labels = ["Might", "Agility", "Reason", "Intuition", "Presence"];
  let result = text;
  for (const label of labels) {
    const first = label[0];
    const rest = label.slice(1);
    const re = new RegExp(`${first}\\s+${rest}\\b`, "i");
    result = result.replace(re, label);
  }
  return result;
}

// ------------------------------------------------------------
// SAFE, NON-DESTRUCTIVE NORMALIZATION
// ------------------------------------------------------------
// This version keeps:
//   • dice notation (2d10 + 4)
//   • plus/minus signs
//   • punctuation
//   • tier markers (!, @, #, ✦, ★, ✸)
//   • asterisk separators (*)
//   • action keywords
//   • block structure
//
// It ONLY fixes:
//   • OCR ligatures
//   • Unicode punctuation
//   • Unicode dashes
//   • non-breaking spaces
//   • Windows/Mac line endings
//   • excessive horizontal whitespace
//
// NOTHING ELSE is touched.
// ------------------------------------------------------------


// ------------------------------------------------------------
// Line-preserving normalization for raw import text.
// ------------------------------------------------------------
export function normalizeTextPreserveLines(rawText = "") {
  if (typeof rawText !== "string") return "";

  rawText = normalizeUnicodeArtifacts(rawText);
  rawText = repairSplitCharacteristicLabels(rawText);

  // Unicode + OCR cleanup (safe)
  const normalized = rawText
    // OCR ligature fixes
    .replace(/Ɵ/g, "ti")
    .replace(/ƫ/g, "tt")
    .replace(/Ʃ/g, "t")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")

    // Unicode punctuation fixes
    .replace(/Ō/g, "o")
// Normalize all dashes to ASCII hyphen
.replace(/−|–|—/g, "-")
// Normalize "-o" keyword marker (after dash normalization)
.replace(/-\s*o\b/gi, "-")


    // Normalize Windows/Mac line endings to LF
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
	
	 // NEW: Remove zero-width characters
  .replace(/[\u200B-\u200D\uFEFF]/g, "");



  // Collapse horizontal whitespace *within* lines only
  return normalized
    .split("\n")
    .map(line =>
      line
        .replace(/\u00A0/g, " ")   // non-breaking space → space
        .replace(/[ \t]+/g, " ")   // collapse spaces/tabs
        .trim()                    // trim per-line
    )
    .join("\n");
}


// ------------------------------------------------------------
// Field-level normalization (safe for single-line fields).
// ------------------------------------------------------------
export function normalizeText(rawText = "") {
  if (typeof rawText !== "string") return "";

  rawText = normalizeUnicodeArtifacts(rawText);
  rawText = repairSplitCharacteristicLabels(rawText);

  return rawText
    // OCR ligature fixes
    .replace(/Ɵ/g, "ti")
    .replace(/ƫ/g, "tt")
    .replace(/Ʃ/g, "t")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")

    // Unicode punctuation fixes
    .replace(/Ō/g, "o")
// Normalize all dashes to ASCII hyphen
.replace(/−|–|—/g, "-")
// Normalize "-o" keyword marker (after dash normalization)
.replace(/-\s*o\b/gi, "-")

    // Collapse horizontal whitespace only
    .replace(/[ \t]+/g, " ")

    .trim();
}