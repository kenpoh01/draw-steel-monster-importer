/**
 * Deterministic formatter for Draw Steel feature descriptions.
 * Assumptions based on current pipeline:
 *  - Feature title has ALREADY been stripped before this function.
 *  - This function only sees the descriptive lines.
 *  - A feature is either:
 *      * Unlabelled: no "X:" style labels → single paragraph.
 *      * Labelled: one or more label lines starting with "X:" → one paragraph per label.
 *  - Labels appear at the start of a line, e.g. "End Effect: ..." or "Solo Turns: ...".
 */

export function formatFeatureNarrative(lines) {

  if (!Array.isArray(lines) || !lines.length) return "";

  // Strip asterisks and trim
  const cleaned = lines
    .map(l => (l ?? "").replace(/^\*+|\*+$/g, "").trim())
    .filter(l => l.length > 0);

  if (!cleaned.length) return "";

  // Merge wrapped lines
  let body = cleaned.join(" ").trim();

  // Normalize Unicode punctuation
  body = body
    .replace(/\u00A0/g, " ")
    .replace(/[\u2024\u2025\u2026\uFE52\uFF0E\uFF61\u3002\u2027]/g, ".")
    .replace(/\.{2,}/g, ".");

// Find all labels of the form "X:" where X starts with capital,
// contains no ":" or "." (so it can't swallow whole sentences)
const labelRegex = /([A-Z][^:.\n]{0,50}:)/g;
const labels = [];
let match;

while ((match = labelRegex.exec(body)) !== null) {
  labels.push({ label: match[1], index: match.index });
}


if (labels.length === 0) {
  return `<p>${body}</p>`;
}

const paragraphs = [];

for (let i = 0; i < labels.length; i++) {
  const { label, index } = labels[i];
  const nextIndex = i + 1 < labels.length ? labels[i + 1].index : body.length;

  const labelEnd = index + label.length;
  const paragraphBody = body.slice(labelEnd, nextIndex).trim();


  paragraphs.push(
    `<p><strong>${label}</strong> ${paragraphBody}</p>`
  );
}

return paragraphs.join("\n");
}