// Mirazhel's combat identity centres on faction-aware marking and ally support.
module.exports = {
  characterId: "mirazhel",
  passive: {
    id: "phantomMark",
    name: "Phantom Mark",
    description: "When Mirazhel deals Anomaly damage to an opponent, she marks them for 2 turns. Phantom allies deal 10% increased damage to marked enemies.",
    events: {
      damageDealt: [{
        handler: "applyStatusesOnDamageDealt",
        damageTypes: ["Anomaly"],
        onlyAgainstOpponents: true,
        statuses: [{
          id: "phantomMark",
          data: { damageTakenPercent: 10, damageTakenFaction: "phantom", turns: 2, debuff: true },
        }],
      }],
    },
  },
  skills: [
    {
      key: "wraithfang", name: "Wraithfang Pursuit", cost: 20, cooldown: 1,
      tags: ["offensive"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Anomaly", power: 1.25, scalingStat: "MPow" },
        { type: "conditionalStatus", to: "self", id: "wraithfangEvasion", stat: "Evasion", amount: 15, turns: 1 },
      ],
      message: "{actor} uses Wraithfang Pursuit against {target}, dealing {damage} Anomaly damage and gaining 15 Evasion for 1 turn.",
    },
    {
      key: "veil", name: "Veil of the Unseen", cost: 25, cooldown: 3,
      tags: ["support"], targeting: "ally", excludeSelf: true, targetFaction: "phantom",
      effects: [
        { type: "status", to: "target", id: "veilUnseenSpeed", stat: "SPD", amount: 15, turns: 2 },
        { type: "status", to: "target", id: "veilUnseenCrit", stat: "CritRate", amount: 10, turns: 2 },
      ],
      message: "{actor} cloaks {target} in Veil of the Unseen, granting SPD +15% and CritRate +10% for 2 turns.",
    },
    {
      key: "requiem", name: "Requiem of the Vanishing Blade", cost: 40, cooldown: 4,
      tags: ["offensive"], targeting: "enemy",
      effects: [{
        type: "masteryHit", element: "Anomaly", power: 2.0, scalingStat: "MPow",
        powerModifiers: [{ when: { targetStatus: "phantomMark" }, percent: 25, bonusText: " (Phantom Mark bonus)" }],
      }],
      message: "{actor} executes {target} with Requiem of the Vanishing Blade for {damage} Anomaly damage{bonusText}.",
    },
    {
      key: "ultimate", name: "Nocturne of the Phantom Queen", category: "Ultimate", cost: 60, cooldown: 6,
      tags: ["offensive", "team-support"], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Anomaly", power: 1.0, scalingStat: "MPow" },
        { type: "statusAllies", id: "nocturneAttackBuff", stat: "ATK", amount: 15, turns: 2 },
      ],
      message: "{actor} releases Nocturne of the Phantom Queen, striking all enemies and empowering active allies with ATK +15% for 2 turns.",
    },
  ],
};
