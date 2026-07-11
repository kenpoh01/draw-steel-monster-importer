// scripts/headerAdapter.js
import { validMovementTypes } from "./keywordParser.js";
import { validOrganizations, validRoles } from "./keywordParser.js"

/**
 * Parse the monster header block into a clean headerObj.
 * This is the OFFICIAL-ONLY header parser.
 */

export function parseHeaderLines(block) {
  const lines = block
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const headerObj = {
    name: "",
    level: 1,
    role: "",
    organization: "",
    keywords: [],
    ev: 0,

    // stats
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,

    size: 1,
    sizeLetter: "M",
    speed: 4,
    stamina: 1,
    stability: 0,
    freeStrike: 0,

    immunities: {},
    weaknesses: {},

    // movement
    movementTypes: [],
    withCaptain: null,

    // source metadata
    sourceBook: "",
    sourcePage: "",
    sourceLicense: ""
  };

 // ---------------------------------------------
// 1. NAME + LEVEL + ORGANIZATION + ROLE
// Example: "Angulotl Cleaver Level 1 Minion Ambusher"
// ---------------------------------------------
const nameLine = lines.find(l => /Level\s+\d+/i.test(l));
if (nameLine) {
  // Extract level
  const levelMatch = nameLine.match(/Level\s+(\d+)/i);
  headerObj.level = levelMatch ? Number(levelMatch[1]) : 1;

  // Extract organization (solo, elite, standard, minion, horde, platoon, leader)
  const orgMatch = nameLine
    .toLowerCase()
    .split(/\s+/)
    .find(word => validOrganizations.includes(word));

  headerObj.organization = orgMatch || "";

  // Extract role (ambusher, brute, controller, etc.)
  const roleMatch = nameLine
    .toLowerCase()
    .split(/\s+/)
    .find(word => validRoles.includes(word));

  headerObj.role = roleMatch || "";

  // Name is everything before "Level"
  headerObj.name = nameLine.split(/Level/i)[0].trim();
}

  // ---------------------------------------------
  // 2. KEYWORDS + EV
  // Example: "Construct, Undead EV 72"
  // ---------------------------------------------
  const keywordLine = lines.find(l => /EV\s*\d+/i.test(l));
  if (keywordLine) {
    const evMatch = keywordLine.match(/EV\s*(\d+)/i);
    headerObj.ev = evMatch ? Number(evMatch[1]) : 0;

    // Keywords are everything before "EV"
    const beforeEV = keywordLine.split(/EV/i)[0].trim();
    headerObj.keywords = beforeEV
      .split(/[,;]/)
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);
  }

  // ---------------------------------------------
  // 3. CHARACTERISTICS
  // Example:
  // "Might +4 Agility -2 Reason -2 Intuition 0 Presence -5"
  // ---------------------------------------------
  const statLine = lines.find(l => /Might/i.test(l));
  if (statLine) {
    const extract = (label) => {
      const m = statLine.match(new RegExp(`${label}\\s*([+\\-]?\\d+)`, "i"));
      return m ? Number(m[1]) : 0;
    };

    headerObj.might = extract("Might");
    headerObj.agility = extract("Agility");
    headerObj.reason = extract("Reason");
    headerObj.intuition = extract("Intuition");
    headerObj.presence = extract("Presence");
  }

  // ---------------------------------------------
  // 4. SIZE / SPEED / STAMINA / STABILITY / FREE STRIKE
  // Supports three known layouts, depending on PDF extraction tool:
  //   Plain:      "3 8 350 3 6"          or  "1L 7 700 2 11"
  //   Piped:      "1S|Size| 5|Speed| 10 |Stamina| 0|Stability| 3|Free Strike"
  //   Alternating: each value and label on its own line —
  //     "2" / "Size" / "5" / "Speed" / "100" / "Stamina" / "1" /
  //     "Stabilty" / "5" / "Free Strike"
  //     (note: some extractions misspell "Stability" as "Stabilty" —
  //     matched with a loose "stabil" prefix rather than an exact word)
  // The size token may carry a letter suffix (T/S/M/L) for
  // Tiny/Small/Medium/Large creatures — this must be captured separately,
  // not blindly Number()-converted along with the rest of the line.
  // Stability is sometimes "All" instead of a number (a real Draw Steel
  // rule meaning immune to all forced movement). The system schema field
  // is numeric, so this is stored as 999 — a placeholder sentinel, not a
  // literal game value — rather than defaulting to 0, which would
  // silently mean the opposite (no resistance at all).
  // ---------------------------------------------
  let statParsed = null;
  let statConsumedLines = [];

  for (let i = 0; i + 9 < lines.length; i++) {
    if (
      /^\d+[TSML]?$/i.test(lines[i]) && /^size$/i.test(lines[i + 1]) &&
      /^\d+$/.test(lines[i + 2]) && /^speed$/i.test(lines[i + 3]) &&
      /^\d+$/.test(lines[i + 4]) && /^stamina$/i.test(lines[i + 5]) &&
      /^(?:\d+|all)$/i.test(lines[i + 6]) && /^stabil\w*$/i.test(lines[i + 7]) &&
      /^\d+$/.test(lines[i + 8]) && /^free\s*strike$/i.test(lines[i + 9])
    ) {
      const sizeMatch = lines[i].match(/^(\d+)([TSML]?)$/i);
      statParsed = {
        size: Number(sizeMatch[1]),
        sizeLetter: sizeMatch[2] || "M",
        speed: Number(lines[i + 2]),
        stamina: Number(lines[i + 4]),
        stability: /^\d+$/.test(lines[i + 6]) ? Number(lines[i + 6]) : 999,
        freeStrike: Number(lines[i + 8])
      };
      statConsumedLines = lines.slice(i, i + 10);
      break;
    }
  }

  const statNumbersLine = statParsed ? null : lines.find(l =>
    /^\d+[TSML]?(\s+\d+\s+\d+\s+(?:\d+|all)\s+\d+\s*$|\|)/i.test(l)
  );

  if (statNumbersLine) {
    let parsed = null;

    if (statNumbersLine.includes("|")) {
      const sizeMatch = statNumbersLine.match(/^(\d+)([TSML]?)\s*\|/i);
      const speedMatch = statNumbersLine.match(/\|\s*(\d+)\s*\|\s*Speed/i);
      const staminaMatch = statNumbersLine.match(/\|\s*(\d+)\s*\|\s*Stamina/i);
      const stabilityMatch = statNumbersLine.match(/\|\s*(\d+|all)\s*\|\s*Stability/i);
      const freeStrikeMatch = statNumbersLine.match(/\|\s*(\d+)\s*\|\s*Free\s*Strike/i);

      if (sizeMatch && speedMatch && staminaMatch && stabilityMatch && freeStrikeMatch) {
        parsed = {
          size: Number(sizeMatch[1]),
          sizeLetter: sizeMatch[2] || "M",
          speed: Number(speedMatch[1]),
          stamina: Number(staminaMatch[1]),
          stability: /^\d+$/.test(stabilityMatch[1]) ? Number(stabilityMatch[1]) : 999,
          freeStrike: Number(freeStrikeMatch[1])
        };
      }
    } else {
      const m = statNumbersLine.match(/^(\d+)([TSML]?)\s+(\d+)\s+(\d+)\s+(\d+|all)\s+(\d+)\s*$/i);
      if (m) {
        parsed = {
          size: Number(m[1]),
          sizeLetter: m[2] || "M",
          speed: Number(m[3]),
          stamina: Number(m[4]),
          stability: /^\d+$/.test(m[5]) ? Number(m[5]) : 999,
          freeStrike: Number(m[6])
        };
      }
    }

    statParsed = parsed;
  }

  if (statParsed) {
    const parsed = statParsed;
    headerObj.size = parsed.size;
    headerObj.sizeLetter = parsed.sizeLetter;
    headerObj.speed = parsed.speed;
    headerObj.stamina = parsed.stamina;
    headerObj.stability = parsed.stability;
    headerObj.freeStrike = parsed.freeStrike;
  }

  // ---------------------------------------------
  // 5. IMMUNITY / WEAKNESS
  // Example:
  // "Immunity: — Weakness: Holy 5"
  // ---------------------------------------------
  const resistLine = lines.find(l => /Immunity:/i.test(l) || /Weakness:/i.test(l));
  if (resistLine) {
    // Immunities
    const immMatch = resistLine.match(/Immunity:\s*([^W]+)/i);
    if (immMatch) {
      const immText = immMatch[1].trim();
      if (immText !== "—" && immText !== "-") {
        immText.split(/[,;]/).forEach(entry => {
          const [type, value] = entry.trim().split(/\s+/);
          if (type) headerObj.immunities[type.toLowerCase()] = Number(value) || 0;
        });
      }
    }

    // Weaknesses
    const weakMatch = resistLine.match(/Weakness:\s*(.+)$/i);
    if (weakMatch) {
      const weakText = weakMatch[1].trim();
      if (weakText !== "—" && weakText !== "-") {
        weakText.split(/[,;]/).forEach(entry => {
          const [type, value] = entry.trim().split(/\s+/);
          if (type) headerObj.weaknesses[type.toLowerCase()] = Number(value) || 0;
        });
      }
    }
  }

  // ---------------------------------------------
  // 6a. CAPTION LINE (no data, just noise)
  // Some layouts print a plain label row under the stat-numbers line:
  // "Size Speed Stamina Stability Free Strike"
  // ---------------------------------------------
  const captionLine = lines.find(l => /^Size\s+Speed\s+Stamina\s+Stability\s+Free\s+Strike\s*$/i.test(l));

  // ---------------------------------------------
  // 6. MOVEMENT TYPES + WITH CAPTAIN
  // Example:
  // "Movement: Burrow"
  // "Movement: Climb, swim"
  // "Movement: Climb, swim With Captain: +1 damage bonus to strikes"
  // ---------------------------------------------
  const movementLine = lines.find(l => /^Movement:/i.test(l));
  if (movementLine) {
    let line = movementLine.trim();
    let withCaptain = null;

    // Extract "With Captain: ..."
    const captainMatch = line.match(/with captain:\s*(.+)$/i);
    if (captainMatch) {
      withCaptain = captainMatch[1].trim();
      line = line.replace(/with captain:.+$/i, "").trim();
    }

    // Remove "Movement:" prefix
    line = line.replace(/^movement:\s*/i, "").trim();

    // Normalize whitespace
    line = line.replace(/\s+/g, " ").trim();

    // Split into tokens by comma or semicolon
    const tokens = line.split(/[,;]/).map(t => t.trim()).filter(Boolean);

    const types = [];

    for (const token of tokens) {
      const type = token.toLowerCase();
      if (validMovementTypes.includes(type)) {
        types.push(type);
      }
    }

    headerObj.movementTypes = types;
    headerObj.withCaptain = withCaptain;
  }

  // Lines consumed by header parsing, so the caller can remove them from
  // the remaining text before splitting the ability/feature body.
  headerObj._consumedLines = new Set(
    [nameLine, keywordLine, statLine, statNumbersLine, resistLine, captionLine, movementLine, ...statConsumedLines]
      .filter(Boolean)
  );

  return headerObj;
}