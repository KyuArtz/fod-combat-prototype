// Lucaz converts sustained incoming pressure into a limited Kinetic payoff.
module.exports = {
  characterId: "lucaz",
  passive: {
    id: "colossusFrame",
    name: "Colossus Frame",
    description: "Lucaz takes 10% less damage. Incoming hits build DEF reinforcement up to 2 stacks; his next Kinetic skill gains 20% damage and consumes the primed reinforcement.",
    damageTakenPercent: -10,
    events: {
      damageTaken: [{
        handler: "lucazReinforcement",
        statusId: "reinforcement",
        chargeStatusId: "reinforcementKineticCharge",
        primedFlag: "reinforcementPrimed",
        stat: "DEF",
        amountPerStack: 8,
        maxStacks: 2,
        duration: 2,
        nextSkillDamagePercent: 20,
        damageType: "Kinetic",
      }],
      skillUsed: [{
        handler: "consumeReinforcementOnChargedSkill",
        primedFlag: "reinforcementPrimed",
        reinforcementStatusId: "reinforcement",
      }],
    },
  },
  skills: [
    {
      key: "ironwake", name: "Ironwake Impact", cost: 15, cooldown: 1,
      tags: ["offensive"], targeting: "enemy",
      effects: [{
        type: "masteryHit", element: "Kinetic", power: 1.5, scalingStat: "ATK",
        powerModifiers: [{ when: { targetStatus: "staggered" }, percent: 20, bonusText: " (Stagger bonus)" }],
      }],
      message: "{actor} strikes {target} with Ironwake Impact for {damage} Kinetic damage{bonusText}.",
    },
    {
      key: "bastion", name: "Bastion of the Unyielding", cost: 25, cooldown: 3,
      tags: ["defensive"], targeting: "none",
      effects: [
        { type: "statusSelf", id: "bastionDef", stat: "DEF", amount: 25, turns: 2 },
        { type: "statusSelf", id: "bastionRes", stat: "RES", amount: 15, turns: 2 },
        { type: "statusSelf", id: "taunt", taunt: true, turns: 2 },
        { type: "statusSelf", id: "bastionSpeedPenalty", stat: "SPD", amount: -15, turns: 2, debuff: true },
      ],
      message: "{actor} assumes Bastion of the Unyielding, gaining DEF +25%, RES +15%, and Taunt while SPD is reduced by 15% for 2 turns.",
    },
    {
      key: "faultline", name: "Faultline Breaker", cost: 35, cooldown: 4,
      tags: ["offensive", "control"], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Kinetic", power: 0.9, scalingStat: "ATK" },
        { type: "statusEnemies", id: "staggered", turns: 1, delayCR: 20, debuff: true, onlyHitTargets: true },
      ],
      message: "{actor} unleashes Faultline Breaker, dealing Kinetic damage to all enemies and Staggering them for 1 turn.",
    },
    {
      key: "ultimate", name: "Cataclysm of the Iron Titan", category: "Ultimate", cost: 55, cooldown: 6,
      tags: ["offensive", "control", "team-support"], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Kinetic", power: 1.8, scalingStat: "ATK" },
        { type: "statusEnemies", id: "staggered", turns: 1, delayCR: 20, debuff: true, onlyHitTargets: true },
        { type: "statusAllies", id: "ironTitanDamageGuard", damageTakenPercent: -10, turns: 2 },
      ],
      message: "{actor} unleashes Cataclysm of the Iron Titan, damaging and Staggering all enemies while active allies gain 10% damage reduction for 2 turns.",
    },
  ],
};
