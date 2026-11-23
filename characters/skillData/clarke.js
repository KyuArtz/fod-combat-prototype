// Clarke's passive effects are driven by successful evasion events.
module.exports = {
  characterId: "clarke",
  passive: {
    id: "phaseStride",
    name: "Phase Stride",
    description: "A successful evasion grants Phase Advantage for up to 2 turns, empowering the next offensive skill by 20%. While Aegis Reversal is active, an evasion also empowers the next Riftpiercer.",
    events: {
      evade: [{
        handler: "applyStatusesOnEvade",
        statuses: [
          { id: "phaseAdvantage", data: { turns: 2 }, refresh: false },
          { id: "phaseStrideDamage", data: { nextSkillDamagePercent: 20, turns: 2 }, refresh: false },
          {
            id: "aegisRiftpiercerDamage",
            data: { nextSkillDamagePercent: 15, skillKey: "riftpiercer", turns: 2 },
            requiresStatus: "aegisReversal",
            refresh: false,
          },
        ],
      }],
      skillUsed: [
        { handler: "consumeStatusesOnSkillUse", skillTag: "offensive", statusIds: ["phaseAdvantage"] },
      ],
    },
  },
  skills: [
    {
      key: "riftpiercer", name: "Riftpiercer", cost: 15, cooldown: 1,
      tags: ["offensive"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Electromagnetic", power: 1.5, scalingStat: "ATK" },
        { type: "conditionalStatus", to: "target", conditionOn: "actor", id: "riftpiercerDefDown", stat: "DEF", amount: -10, turns: 2, requiresStatus: "phaseAdvantage", requireAlive: true, debuff: true },
      ],
      message: "{actor} uses Riftpiercer against {target} for {damage} Electromagnetic damage{bonusText}.",
    },
    {
      key: "aegisReversal", name: "Aegis Reversal", cost: 20, cooldown: 3,
      tags: ["defensive"], targeting: "none",
      effects: [{ type: "statusSelf", id: "aegisReversal", stat: "Evasion", amount: 20, turns: 2 }],
      message: "{actor} activates Aegis Reversal, gaining 20 Evasion for 2 turns. An evasion during this stance empowers the next Riftpiercer.",
    },
    {
      key: "thousandfold", name: "Thousandfold Pursuit", cost: 35, cooldown: 4,
      tags: ["offensive"], targeting: "enemy",
      effects: [{
        type: "masteryHit", element: "Electromagnetic", power: 2.2, scalingStat: "ATK",
        critRateBonusWhenStatus: "phaseAdvantage", critRateBonus: 10,
      }],
      message: "{actor} performs Thousandfold Pursuit against {target} for {damage} Electromagnetic damage.",
    },
    {
      key: "ultimate", name: "Eventide Impalement", category: "Ultimate", cost: 50, cooldown: 6,
      tags: ["offensive"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Electromagnetic", power: 3.0, scalingStat: "ATK", powerModifiers: [{ when: { targetHpPercentBelow: 40 }, percent: 20, bonusText: " (execute bonus)" }] },
        { type: "statusSelf", id: "eventideEvasion", stat: "Evasion", amount: 15, turns: 2 },
      ],
      message: "{actor} uses Eventide Impalement on {target} for {damage} Electromagnetic damage{bonusText} and gains 15 Evasion for 2 turns.",
    },
  ],
};
