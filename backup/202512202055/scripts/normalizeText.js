// scripts/preReleaseParsers/normalizeText.js

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
    .replace(/−|–|—/g, "-")   // normalize all dashes to ASCII hyphen

    // Normalize Windows/Mac line endings to LF
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

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

  return rawText
    // OCR ligature fixes
    .replace(/Ɵ/g, "ti")
    .replace(/ƫ/g, "tt")
    .replace(/Ʃ/g, "t")
    .replace(/ﬁ/g, "fi")
    .replace(/ﬂ/g, "fl")

    // Unicode punctuation fixes
    .replace(/Ō/g, "o")
    .replace(/−|–|—/g, "-")

    // Collapse horizontal whitespace only
    .replace(/[ \t]+/g, " ")

    .trim();
}