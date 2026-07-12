// scripts/officialMaliceParsers/maliceParser.js

import { parseMaliceHeader } from "./maliceHeaderParser.js";
import { finalizeEffectTable } from "./maliceEffectTableBuilder.js";
import { enrichNarrative } from "../narrativeUtils.js";
import { parseConditionEffect } from "../conditionParser.js";
import { supportedConditions } from "../keywordParser.js";
import { parseKeywordLine } from "../keywordParser.js";
import { stripLeadingMarker, stripPureMarkerLines } from "../officialParsers/textAdapter/structuralSplitter.js";

// Valid Draw Steel action types (canonical)
const ACTION_REGEX = /(Main action|Maneuver|Free maneuver|Reaction|Triggered(?: action)?|Move action)$/i;

// A malice item's header always ends in "N Malice" or "N+ Malice" — this
// is a strong, self-contained signal (no lookahead needed), so block
// boundaries can be found the same marker-independent way the main
// ability pipeline finds them, rather than depending on any one
// delimiter character. Malice-pool text has been seen using "*" as a
// delimiter, "¢" as a delimiter, or no delimiter at all.
const MALICE_HEADER_RE = /\d+\+?\s+malice\s*$/i;

/**
 * Split raw malice-pool text into per-item chunks of lines.
 */
function segmentMaliceText(rawText) {
  const rawLines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  // Strip pure separator/marker lines (a lone "*" or "¢") and any leading
  // marker character on each remaining line (e.g. "* Slink Away 5 Malice"
  // -> "Slink Away 5 Malice", "t Viper Lash 2+ Malice" -> "Viper Lash 2+
  // Malice") — malice item names use the same marker conventions as
  // regular ability/feature titles.
  const lines = stripPureMarkerLines(rawLines).map(stripLeadingMarker);

  const segments = [];
  let current = null;

  for (const line of lines) {
    if (MALICE_HEADER_RE.test(line)) {
      if (current) segments.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    }
    // Lines before the first recognized header (e.g. the pool's shared
    // intro narrative, "At the start of any inantzicatl's turn...") are
    // dropped, same as previously — that text isn't a distinct item.
  }
  if (current) segments.push(current);

  return segments;
}

/**
 * Parse one malice item's lines (lines[0] is the already-validated header)
 * into a full Draw Steel item.
 */
function parseMaliceItem(lines) {
  const header = parseMaliceHeader(lines[0]);
  if (!header) return null;

  const current = {
    name: header.name,
    type: "ability",
    img: "icons/magic/unholy/silhouette-robe-evil-power.webp",
    system: {
      type: "none", // default; metadata may override
      category: "malice",
      resource: header.cost,
      trigger: `Spend ${header.cost} Malice.`,
      distance: { type: "special" },
      target: { type: "special" },
      power: { roll: { formula: "", characteristics: [] }, effects: {} },
      effect: { before: "", after: "" },
      spend: { text: "", value: null },
      source: {
        book: "Monsters",
        page: "",
        license: "Draw Steel Creator License"
      },
      story: "",
      keywords: []
    },
    effects: [],
    folder: null,
    sort: 0,
    flags: {}
  };

  let tierLines = [];
  let narrativeBuffer = [];      // narrative BEFORE tiers
  let narrativeAfterBuffer = []; // narrative AFTER tiers
  let collectingTier = false;
  let currentTier = "";
  let tierBuffer = [];
  let expectingMetadata = true;

  function flushNarrative(target = "before") {
    if (narrativeBuffer.length === 0) return;
    const joined = narrativeBuffer.join(" ");
    current.system.effect[target] += `<p>${enrichNarrative(joined.trim())}</p>`;
    narrativeBuffer = [];
  }

  function flushAfterNarrative() {
    if (narrativeAfterBuffer.length === 0) return;
    const joined = narrativeAfterBuffer.join(" ");
    current.system.effect.after += `<p>${enrichNarrative(joined.trim())}</p>`;
    narrativeAfterBuffer = [];
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // ------------------------------------------------------------
    // Metadata line (keywords + action type) — only right after header
    // ------------------------------------------------------------
    if (expectingMetadata && line.length > 0) {
      const { type: parsedType, keywords } = parseKeywordLine(line);
      const actionMatch = line.match(ACTION_REGEX);

      if (actionMatch) {
        current.system.type = parsedType || "none";
        current.system.keywords = keywords;
        expectingMetadata = false;
        continue;
      }

      // Otherwise it's narrative — fall through to the rest of the checks
      expectingMetadata = false;
    }

    // ------------------------------------------------------------
    // Tier lines: ! @ #
    // ------------------------------------------------------------
    const tierStart = line.match(/^([!@#])\s+(.*)/);
    if (tierStart) {
      flushNarrative("before");
      flushAfterNarrative();

      if (collectingTier && currentTier) {
        tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
        tierBuffer = [];
      }

      collectingTier = true;
      currentTier = tierStart[1];
      tierBuffer.push(tierStart[2]);
      continue;
    }

    // ------------------------------------------------------------
    // Continuation of the current tier, unless a new label starts
    // ------------------------------------------------------------
    if (collectingTier) {
      if (/^(effect|trigger)\s*:/i.test(line)) {
        tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
        tierBuffer = [];
        collectingTier = false;
        currentTier = "";
        // fall through to Effect:/Trigger: handling below
      } else {
        tierBuffer.push(line);
        continue;
      }
    }

    // ------------------------------------------------------------
    // "Effect:" blocks
    // ------------------------------------------------------------
    if (/^effect:/i.test(line)) {
      const effectText = line.replace(/^effect:/i, "").trim();
      const parsed = parseConditionEffect(effectText);

      if (!(parsed.condition && supportedConditions.has(parsed.condition))) {
        current.system.effect.after += `<p>${enrichNarrative(effectText)}</p>`;
      }

      continue;
    }

    // ------------------------------------------------------------
    // Narrative (before or after tiers)
    // ------------------------------------------------------------
    if (tierLines.length > 0 && !collectingTier) {
      narrativeAfterBuffer.push(line);
    } else {
      narrativeBuffer.push(line);
    }
  }

  flushNarrative("before");
  flushAfterNarrative();

  if (collectingTier && currentTier) {
    tierLines.push(`${currentTier} ${tierBuffer.join(" ")}`.trim());
  }

  finalizeEffectTable(current, tierLines);
  return current;
}

/**
 * Parse a full malice pool (one or more malice items) from raw text.
 */
export function parseMaliceText(rawText) {
  if (!rawText || typeof rawText !== "string") return { items: [] };

  const segments = segmentMaliceText(rawText);
  const items = segments.map(parseMaliceItem).filter(Boolean);

  return { items };
}
