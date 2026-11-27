module.exports = {
  id: "recon-drone",
  capabilities: ["mechanical", "electronic-systems"],
  name: "Recon Drone",
  mastery: "Kinetic",
  skillSet: "reconDrone",
  aiPolicy: "reconDrone",
  targetSelection: "highestMasteryPower",
  passive: {
    id: "evasiveArray",
    name: "Evasive Array",
    description: "Predictive movement algorithms grant Evasion +15.",
    statMods: [{ stat: "Evasion", points: 15 }],
    events: { battleStart: [{ handler: "announcePassive" }] },
  },
  stats: {
    HP: 1092, MP: 125, ATK: 101, MPow: 134, DEF: 72, RES: 99, SPD: 125,
    CritRate: 12, Evasion: 18,
    masteryBonus: { Kinetic: 10 }, masteryResistance: {},
  },
};
