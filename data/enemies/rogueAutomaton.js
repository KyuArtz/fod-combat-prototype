module.exports = {
  id: "rogue-automaton",
  capabilities: ["mechanical", "electronic-systems"],
  name: "Rogue Automaton",
  mastery: "Kinetic",
  skillSet: "rogueAutomaton",
  aiPolicy: "rogueAutomaton",
  targetSelection: "weakest",
  passive: {
    id: "reactivePlating",
    name: "Reactive Plating",
    description: "When its HP falls to 55% or lower, reinforced armor engages and grants DEF +20% for the rest of the encounter.",
    initialFlags: { reactivePlatingActive: false },
    statMods: [{ stat: "DEF", percent: 20, when: { flag: "reactivePlatingActive", equals: true } }],
    events: {
      battleStart: [{ handler: "announcePassive" }],
      damageTaken: [{ handler: "activateFlagBelowHpPercent", flag: "reactivePlatingActive", thresholdPercent: 55 }],
    },
  },
  stats: {
    HP: 1702, MP: 130, ATK: 134, MPow: 112, DEF: 116, RES: 110, SPD: 70,
    CritRate: 10, Evasion: 0,
    masteryBonus: { Kinetic: 15 }, masteryResistance: {},
  },
};
