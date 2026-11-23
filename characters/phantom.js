const { makeActor } = require("./actorFactory");
const skillData = {
  mirazhel: require("./skillData/mirazhel"),
  elishia_p: require("./skillData/elishia_p"),
  lucaz: require("./skillData/lucaz"),
  clarke: require("./skillData/clarke"),
  liezli: require("./skillData/liezli"),
};

const TYPES = [
  "Energy",
  "Kinetic",
  "Electromagnetic",
  "Toxic",
  "Nuclear",
  "Nanotech",
  "Cryogenic",
  "Anomaly",
];

// Combat-facing Phantom roster values are migrated from characterTerraData.json.
// EVA is normalized to the engine's Evasion stat key; Mpow is normalized to MPow.
const MEMBERS = [
  {
    id: "mirazhel", name: "Mirazhel", role: "tactician", mastery: "Anomaly",
    stats: { HP: 1300, MP: 145, ATK: 90, MPow: 135, DEF: 80, RES: 100, SPD: 100, Evasion: 10, CritRate: 18 },
  },
  {
    id: "elishia_p", name: "Unknown", role: "stalker", mastery: "Anomaly",
    stats: { HP: 1100, MP: 160, ATK: 120, MPow: 165, DEF: 65, RES: 80, SPD: 115, Evasion: 18, CritRate: 25 },
  },
  {
    id: "lucaz", name: "Lucaz", role: "juggernaut", mastery: "Kinetic",
    stats: { HP: 1950, MP: 100, ATK: 118, MPow: 20, DEF: 120, RES: 100, SPD: 42, Evasion: 10, CritRate: 8 },
  },
  {
    id: "clarke", name: "Clarke", role: "vanguard", mastery: "Electromagnetic",
    stats: { HP: 1325, MP: 110, ATK: 112, MPow: 60, DEF: 82, RES: 82, SPD: 105, Evasion: 20, CritRate: 18 },
  },
  {
    id: "liezli", name: "Liezli", role: "stalker", mastery: "Anomaly",
    stats: { HP: 1020, MP: 130, ATK: 118, MPow: 0, DEF: 62, RES: 84, SPD: 104, Evasion: 14, CritRate: 22 },
  },
];

function createPhantomParty({ side = "ally" } = {}) {
  if (!["ally", "enemy"].includes(side)) throw new TypeError('Phantom party side must be "ally" or "enemy".');
  return MEMBERS.map((member) => makeActor({
    id: member.id,
    name: member.name,
    side,
    faction: "phantom",
    role: member.role,
    skillSet: member.id,
    mastery: member.mastery,
    passive: structuredClone(skillData[member.id].passive),
    stats: {
      ...member.stats,
      masteryBonus: Object.fromEntries(TYPES.map((type) => [type, type === member.mastery ? 15 : 0])),
      masteryResistance: Object.fromEntries(TYPES.map((type) => [type, 0])),
    },
  }));
}

module.exports = { TYPES, MEMBERS, createPhantomParty };
