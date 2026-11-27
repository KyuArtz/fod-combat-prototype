module.exports = {
  id: "training-drone",
  capabilities: ["mechanical", "electronic-systems"],
  name: "Training Drone",
  mastery: "Kinetic",
  skillSet: "trainingDrone",
  aiPolicy: "trainingDrone",
  targetSelection: "frontline",
  passive: {
    id: "calibrationCore",
    name: "Calibration Core",
    description: "Its calibrated control system grants Evasion +8.",
    statMods: [{ stat: "Evasion", points: 8 }],
    events: { battleStart: [{ handler: "announcePassive" }] },
  },
  stats: {
    HP: 1265, MP: 120, ATK: 103, MPow: 118, DEF: 82, RES: 88, SPD: 95,
    CritRate: 9, Evasion: 4,
    masteryBonus: { Kinetic: 10 }, masteryResistance: {},
  },
};
