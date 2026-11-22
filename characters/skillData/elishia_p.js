const { createBleedingEffect } = require("./effects/bleeding");

module.exports = {
  characterId: "elishia_p",
  passive: {
    id: "sovereignAuthority",
    name: "Sovereign Authority",
    description: "Anomaly damage reduces the target’s DEF and RES by 10% for 2 turns.",
    events: {
      damageDealt: [{
        handler: "applyStatusesOnDamageDealt",
        damageTypes: ["Anomaly"],
        onlyAgainstOpponents: true,
        statuses: [
          { id: "sovereignDefDown", data: { stat: "DEF", amount: -10, turns: 2, debuff: true } },
          { id: "sovereignResDown", data: { stat: "RES", amount: -10, turns: 2, debuff: true } },
        ],
      }],
    },
  },
  skills: [
    {
      key: "severance", name: "Scarlet Severance", cost: 20, cooldown: 1,
      tags: ["offensive"], targeting: "enemy",
      effects: [{ type: "masteryHit", element: "Anomaly", power: 1.5, scalingStat: "MPow" }],
      message: "{actor} delivers Scarlet Severance against {target}, dealing {damage} Anomaly damage.",
    },
    {
      key: "aegis", name: "Aegis of the Scarlet Veil", cost: 30, cooldown: 3,
      tags: ["defensive", "support"], targeting: "ally",
      effects: [{ type: "shield", scalingStat: "MPow", multiplier: 1.2, turns: 2, replaceGroup: "scarletVeilAegis" }],
      message: "{actor} deploys Aegis of the Scarlet Veil on {target}, granting a replaceable barrier for 2 turns.",
    },
    {
      key: "phalanx", name: "Crimson Phalanx", cost: 40, cooldown: 4,
      tags: ["offensive"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Anomaly", power: 2.0, scalingStat: "MPow" },
        createBleedingEffect(),
      ],
      message: "{actor} executes Crimson Phalanx against {target}, resolving its three-strike sequence as one {damage} Anomaly damage instance and applying Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).",
    },
    {
      key: "ultimate", name: "Scarlet Eclipse", category: "Ultimate", cost: 60, cooldown: 6,
      tags: ["offensive"], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Anomaly", power: 1.1, scalingStat: "MPow" },
        { type: "statusSelf", id: "scarletEclipseDamage", damageDealtPercent: 15, turns: 2 },
      ],
      message: "{actor} releases Scarlet Eclipse against all enemies and gains 15% increased damage dealt for 2 turns.",
    },
  ],
};
