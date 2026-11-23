const { createBleedingEffect } = require("./effects/bleeding");

module.exports = {
  characterId: "liezli",
  passive: {
    id: "mirageSynchronization",
    name: "Mirage Synchronization",
    description: "A successful evasion grants CritRate +10 for up to 2 turns. The bonus is consumed by the next offensive skill.",
    events: {
      evade: [{
        handler: "applyStatusesOnEvade",
        statuses: [{ id: "mirageCritBoost", data: { stat: "CritRate", amount: 10, turns: 2 }, refresh: false }],
      }],
      skillUsed: [{ handler: "consumeStatusesOnSkillUse", skillTag: "offensive", statusIds: ["mirageCritBoost"] }],
    },
  },
  skills: [
    {
      key: "ghostlight", name: "Ghostlight Volley", cost: 15, cooldown: 1,
      tags: ["offensive"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Anomaly", power: 1.6, scalingStat: "ATK" },
        createBleedingEffect(),
      ],
      message: "{actor} fires Ghostlight Volley at {target} for {damage} Anomaly damage and applies Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).",
    },
    {
      key: "refraction", name: "Phantom Refraction", cost: 20, cooldown: 3,
      tags: ["defensive"], targeting: "none",
      effects: [
        { type: "statusSelf", id: "phantomRefractionEvasion", stat: "Evasion", amount: 20, turns: 2 },
        { type: "statusSelf", id: "phantomRefractionDamage", nextSkillDamagePercent: 20, turns: 2 },
      ],
      message: "{actor} activates Phantom Refraction, gaining 20 Evasion and empowering the next offensive skill by 20% for up to 2 turns.",
    },
    {
      key: "silverpoint", name: "Silverpoint Barrage", cost: 35, cooldown: 4,
      tags: ["offensive", "control"], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Anomaly", power: 1.0, scalingStat: "ATK" },
        createBleedingEffect({ side: "opponent" }),
        { type: "statusEnemies", id: "silverpointAccuracyDown", accuracyPenalty: 15, turns: 2, debuff: true, onlyHitTargets: true },
      ],
      message: "{actor} unleashes Silverpoint Barrage against all enemies, applying Bleeding (15% of the applier's ATK as Anomaly damage per tick) and reducing their accuracy by 15% for 2 turns.",
    },
    {
      key: "ultimate", name: "Last Light, No Witnesses", category: "Ultimate", cost: 55, cooldown: 6,
      tags: ["offensive"], targeting: "enemy",
      effects: [{
        type: "masteryHit", element: "Anomaly", power: 3.0, scalingStat: "ATK",
        powerModifiers: [{ when: { targetHpPercentBelow: 30 }, percent: 25, bonusText: " (execute bonus)" }],
      }],
      message: "{actor} fires Last Light, No Witnesses at {target} for {damage} Anomaly damage{bonusText}.",
    },
  ],
};
