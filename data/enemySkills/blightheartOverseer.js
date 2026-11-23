module.exports = {
  characterId: "blightheartOverseer",
  skills: [
    {
      key: "sporeLance", name: "Spore Lance", cost: 24, cooldown: 2, tags: ["Toxic", "DamageOverTime"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Toxic", power: 1.1 },
        { type: "damageOverTime", id: "overseerSporeRot", element: "Toxic", power: 0.16, turns: 2,
          turnStart: { damageField: "dotDamage", damageTypeField: "damageType", message: "{actor} suffers {damage} Toxic damage from Spore Lance." } },
      ],
      message: "The Overseer fires SPORE LANCE at {target}: {damage} Toxic damage and lingering spore rot.",
    },
    {
      key: "miasmaWave", name: "Miasma Wave", cost: 34, cooldown: 4, tags: ["Toxic", "Area"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Toxic", power: 0.62, excludeSummons: false },
        { type: "damageOverTime", side: "ally", id: "overseerMiasma", element: "Toxic", power: 0.1, turns: 2,
          turnStart: { damageField: "dotDamage", damageTypeField: "damageType", message: "{actor} suffers {damage} Toxic damage from the Miasma Wave." } },
      ],
      message: "MIASMA WAVE! The Overseer damages all opposing units and leaves a two-turn Toxic haze.",
    },
    {
      key: "heartbark", name: "Heartbark Guard", cost: 28, cooldown: 4, tags: ["Defense"], targeting: "none",
      effects: [
        { type: "shieldSelf", percentMaxHP: 16, turns: 2 },
        { type: "statusSelf", id: "overseerHeartbark", stat: "DEF", amount: 15, turns: 2 },
      ],
      message: "The Overseer raises HEARTBARK GUARD, gaining a shield equal to 16% Max HP and DEF +15% for 2 turns.",
    },
    {
      key: "cataclysmicBloom", name: "Cataclysmic Bloom", category: "Ultimate", cost: 68, cooldown: 7, tags: ["Toxic", "Area", "Ultimate"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Toxic", power: 0.95, excludeSummons: false },
        { type: "damageOverTime", side: "ally", id: "overseerCataclysmRot", element: "Toxic", power: 0.14, turns: 3,
          turnStart: { damageField: "dotDamage", damageTypeField: "damageType", message: "{actor} suffers {damage} Toxic damage from Cataclysmic Bloom." } },
      ],
      message: "CATACLYSMIC BLOOM! The Blightheart bursts across the battlefield, striking every opposing unit and applying three turns of Toxic damage.",
    },
  ],
};
