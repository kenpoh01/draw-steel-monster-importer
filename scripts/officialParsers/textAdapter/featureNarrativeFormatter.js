/**
 * Clean, deterministic formatter for Draw Steel feature descriptions.
 * - Preserves the header (first non-empty line)
 * - Merges wrapped lines into a single paragraph
 * - Strips asterisks
 * - Inserts paragraph breaks before labels like "Solo Turns:"
 * - Never skips lines
 * - Never uses narrative heuristics
 */
export function formatFeatureNarrative(lines) {
  if (!Array.isArray(lines) || !lines.length) return "";

  // Strip asterisks and trim lines
  const cleaned = lines
    .map(l => l.replace(/^\*+|\*+$/g, "").trim())
    .filter(l => l.length > 0);

  if (!cleaned.length) return "";

  // First line is always the header
  const header = cleaned[0];

  // Remaining lines form the body
  const bodyLines = cleaned.slice(1);

  // Merge wrapped lines into one block
  let body = bodyLines.join(" ").trim();

  // Normalize NBSP + weird periods
  body = body
    .replace(/\u00A0/g, " ")
    .replace(/[\u2024\u2025\u2026\uFE52\uFF0E]/g, ".");

  // Insert a paragraph break before labels like "Solo Turns:"
  body = body.replace(
    /\. *([A-Z][^:]{0,50}):/g,
    ".\n\n$1:"
  );

  // Build final HTML
  const paragraphs = body
    .split(/\n{2,}/)
    .map(p => `<p>${p.trim()}</p>`)
    .join("\n");

  // Header + first paragraph merged
  return `<p><strong>${header}.</strong> ${body.split(/\n{2,}/)[0].trim()}</p>` +
         (body.split(/\n{2,}/).length > 1
           ? "\n" + paragraphs.split("\n").slice(1).join("\n")
           : "");
}