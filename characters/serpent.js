const { makeActor } = require("./actorFactory");
const skillData = {
  verra: require("./skillData/verra"),
  kane: require("./skillData/kane"),
  galloz: require("./skillData/galloz"),
  claude: require("./skillData/claude"),
  tekushiki: require("./skillData/tekushiki"),
};

const TYPES = [
  "Energy", "Kinetic", "Electromagnetic", "Toxic",
  "Nuclear", "Nanotech", "Cryogenic", "Anomaly",
];

// Values are sourced from the supplied Terra character roster. EVA is normalized
// to the combat engine's Evasion key; Mpow is normalized to MPow.
const MEMBERS = [
  {
    id: "verra", name: "Verra", role: "field-medic", roles: ["field-medic", "demolitionist"], mastery: "Toxic",
    stats: { HP: 1125, MP: 150, ATK: 65, MPow: 160, DEF: 72, RES: 100, SPD: 88, Evasion: 5, CritRate: 12 },
  },
  {
    id: "kane", name: "Kane", role: "stalker", roles: ["stalker"], mastery: "Toxic",
    stats: { HP: 1080, MP: 135, ATK: 65, MPow: 150, DEF: 68, RES: 78, SPD: 112, Evasion: 14, CritRate: 18 },
  },
  {
    id: "galloz", name: "Galloz", role: "juggernaut", roles: ["juggernaut"], mastery: "Kinetic",
    stats: { HP: 1950, MP: 110, ATK: 115, MPow: 0, DEF: 120, RES: 95, SPD: 42, Evasion: 0, CritRate: 8 },
  },
  {
    id: "claude", name: "Claude", role: "tactician", roles: ["tactician", "demolitionist"], mastery: "Toxic",
    stats: { HP: 1200, MP: 155, ATK: 65, MPow: 145, DEF: 80, RES: 100, SPD: 100, Evasion: 5, CritRate: 12 },
  },
  {
    id: "tekushiki", name: "Tekushiki", role: "vanguard", roles: ["vanguard", "demolitionist"], mastery: "Kinetic",
    stats: { HP: 1200, MP: 125, ATK: 115, MPow: 0, DEF: 85, RES: 90, SPD: 95, Evasion: 8, CritRate: 14 },
  },
];

function createSerpentParty({ side = "ally" } = {}) {
  if (!["ally", "enemy"].includes(side)) throw new TypeError('Serpent party side must be "ally" or "enemy".');
  return MEMBERS.map((member) => makeActor({
    id: member.id,
    name: member.name,
    side,
    faction: "serpent",
    role: member.role,
    roles: [...member.roles],
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

module.exports = { TYPES, MEMBERS, createSerpentParty };
