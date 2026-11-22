module.exports = {
  id: "blightheart-overseer",
  name: "Blightheart Overseer",
  mastery: "Toxic",
  skillSet: "blightheartOverseer",
  aiPolicy: "blightheartOverseer",
  targetSelection: "supportPriority",
  passive: {
    id: "blightheartAwakening",
    name: "Blightheart Awakening",
    description: "When reduced to 55% HP, the Overseer enters an awakened phase, permanently increasing MPow by 20% and DEF by 15%.",
    initialFlags: { blightheartAwakened: false },
    statMods: [
      { stat: "MPow", percent: 20, when: { flag: "blightheartAwakened", equals: true } },
      { stat: "DEF", percent: 15, when: { flag: "blightheartAwakened", equals: true } },
    ],
    events: {
      battleStart: [{ handler: "announcePassive" }],
      damageTaken: [{
        handler: "activateFlagBelowHpPercent",
        flag: "blightheartAwakened",
        thresholdPercent: 55,
        transitionStatus: { id: "overseerCoreExposed", stat: "RES", amount: -15, turns: 2, debuff: true },
        message: "The Blightheart Overseer awakens! MPow +20% and DEF +15%; its exposed core suffers RES -15% for 2 turns.",
      }],
    },
  },
  stats: {
    HP: 3900, MP: 250, ATK: 155, MPow: 202, DEF: 132, RES: 132, SPD: 84,
    CritRate: 12, Evasion: 5,
    masteryBonus: { Toxic: 17 },
    masteryResistance: { Toxic: 10, Nanotech: 10 },
  },
};
