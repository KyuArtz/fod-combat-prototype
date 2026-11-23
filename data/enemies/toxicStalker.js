module.exports = {
  id: "toxic-stalker",
  name: "Toxic Stalker",
  mastery: "Toxic",
  skillSet: "toxicStalker",
  aiPolicy: "toxicStalker",
  targetSelection: "weakest",
  passive: {
    id: "virulentCore",
    name: "Virulent Core",
    description: "A volatile catalyst core increases Mpow by 12% and strengthens its Toxic techniques.",
    statMods: [{ stat: "MPow", percent: 12 }],
    events: { battleStart: [{ handler: "announcePassive" }] },
  },
  stats: {
    HP: 1322, MP: 140, ATK: 118, MPow: 157, DEF: 88, RES: 99, SPD: 100,
    CritRate: 12, Evasion: 10,
    masteryBonus: { Toxic: 15 }, masteryResistance: {},
  },
};
