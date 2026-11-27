module.exports = {
  id: "siege-turret",
  capabilities: ["mechanical", "electronic-systems"],
  name: "Siege Turret",
  mastery: "Kinetic",
  skillSet: "siegeTurret",
  aiPolicy: "siegeTurret",
  targetSelection: "highestThreat",
  passive: {
    id: "bracedEmplacement",
    name: "Braced Emplacement",
    description: "Its anchored frame grants DEF +15%, but limits its mobility and reduces SPD by 10%.",
    statMods: [
      { stat: "DEF", percent: 15 },
      { stat: "SPD", percent: -10 },
    ],
    events: { battleStart: [{ handler: "announcePassive" }] },
  },
  stats: {
    HP: 1552, MP: 110, ATK: 162, MPow: 112, DEF: 127, RES: 82, SPD: 42,
    CritRate: 12, Evasion: 0,
    masteryBonus: { Kinetic: 15 }, masteryResistance: {},
  },
};
