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
  // Example:
  // "3 8 350 3 6"
  // Size Speed Stamina Stability Free Strike
  // ---------------------------------------------
  const statNumbers = lines.find(l => /^\d+\s+\d+\s+\d+\s+\d+\s+\d+/.test(l));
  if (statNumbers) {
    const [size, speed, stamina, stability, freeStrike] = statNumbers
      .split(/\s+/)
      .map(n => Number(n));

    headerObj.size = size;
    headerObj.speed = speed;
    headerObj.stamina = stamina;
    headerObj.stability = stability;
    headerObj.freeStrike = freeStrike;
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

  return headerObj;
}