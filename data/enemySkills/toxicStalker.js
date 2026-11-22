module.exports = {
  characterId: "toxicStalker",
  skills: [
    {
      key: "venomStrike", name: "Venom Strike", cost: 22, cooldown: 2, tags: ["Toxic", "DamageOverTime"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Toxic", power: 0.85 },
        { type: "damageOverTime", id: "toxicVenom", element: "Toxic", power: 0.18, turns: 2,
          turnStart: { damageField: "dotDamage", damageTypeField: "damageType", message: "{actor} suffers {damage} Toxic damage from Venom Strike." } },
      ],
      message: "{actor} strikes {target} with VENOM STRIKE: {damage} Toxic damage and lingering venom (2 turns).",
    },
    {
      key: "causticSpit", name: "Caustic Spit", cost: 25, cooldown: 3, tags: ["Toxic", "Debuff"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Toxic", power: 0.95 },
        { type: "status", id: "causticResistanceDown", stat: "RES", amount: -15, turns: 2, debuff: true },
      ],
      message: "{actor} spits CAUSTIC COMPOUND at {target}: {damage} Toxic damage and RES -15% (2 turns).",
    },
    {
      key: "predatorInstinct", name: "Predator Instinct", cost: 22, cooldown: 4, tags: ["SelfBuff"], targeting: "none",
      effects: [
        { type: "statusSelf", id: "predatorSpeed", stat: "SPD", amount: 15, turns: 2 },
        { type: "statusSelf", id: "predatorMpow", stat: "MPow", amount: 10, turns: 2 },
      ],
      message: "{actor} activates PREDATOR INSTINCT (SPD +15% and Mpow +10% for 2 turns).",
    },
    {
      key: "blightSurge", name: "Blight Surge", category: "Ultimate", cost: 55, cooldown: 6, tags: ["Toxic", "Ultimate"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Toxic", power: 1.55 },
        { type: "damageOverTime", id: "blightSurgeDot", element: "Toxic", power: 0.25, turns: 3,
          turnStart: { damageField: "dotDamage", damageTypeField: "damageType", message: "{actor} suffers {damage} Toxic damage from Blight Surge." } },
      ],
      message: "{actor} unleashes BLIGHT SURGE on {target}: {damage} Toxic damage and a 3-turn Toxic effect!",
    },
  ],
};
