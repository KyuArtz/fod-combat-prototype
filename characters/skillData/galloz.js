module.exports = {
  characterId: "galloz",
  passive: {
    id: "catalystHusk",
    name: "Catalyst Husk",
    description: "Galloz passively reduces incoming damage by 8%. When hit by an enemy skill, he gains one Reinforcement stack, increasing DEF by 5% per stack for 3 turns, up to 2 stacks. At 2 stacks, his next damaging skill gains its defined reinforcement payoff and consumes both stacks.",
    damageTakenPercent: -8,
    events: {
      turnStart: [{ handler: "clearPrimedFlagWithoutCharge", primedFlag: "gallozReinforcementPrimed", chargeStatusId: "gallozKineticCharge" }],
      turnEnd: [{ handler: "clearPrimedFlagWithoutCharge", primedFlag: "gallozReinforcementPrimed", chargeStatusId: "gallozKineticCharge" }],
      damageTaken: [{
        handler: "stackReinforcement",
        requireEnemySkill: true,
        statusId: "gallozReinforcement",
        chargeStatusId: "gallozKineticCharge",
        primedFlag: "gallozReinforcementPrimed",
        stat: "DEF",
        amountPerStack: 5,
        maxStacks: 2,
        duration: 3,
        nextSkillPowerAdd: 0.15,
        scalingStat: "ATK",
        damageType: "Kinetic",
        consumeOnDamage: true,
      }],
      skillUsed: [{
        handler: "consumeReinforcementOnChargedSkill",
        primedFlag: "gallozReinforcementPrimed",
        reinforcementStatusId: "gallozReinforcement",
        chargeStatusId: "gallozKineticCharge",
        skillKeys: ["reactorQuake"],
        consumeOnDamage: true,
      }],
    },
  },
  skills: [
    {
      key: "ironcladImpact", name: "Ironclad Impact", cost: 20, cooldown: 1,
      tags: ["Kinetic", "frontline"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 1.25, scalingStat: "ATK" },
        { type: "shieldSelf", percentMaxHP: 8, turns: 2 },
      ],
      message: "Galloz drives his reinforced arm into {target} for {damage} Kinetic damage and gains an 8% Max HP shield for 2 turns.",
    },
    {
      key: "tyrantsGuard", name: "Tyrant's Guard", cost: 30, cooldown: 3,
      tags: ["defensive", "team-support"], targeting: "none",
      effects: [
        { type: "shieldSelf", percentMaxHP: 18, turns: 2 },
        { type: "statusSelf", id: "tyrantsGuardRes", stat: "RES", amount: 10, turns: 2 },
        { type: "statusSelf", id: "tyrantsGuardTaunt", taunt: true, turns: 2 },
        { type: "statusAllies", id: "tyrantsGuardDamageReduction", damageTakenPercent: -12, turns: 2 },
      ],
      message: "TYRANT'S GUARD! Galloz gains an 18% Max HP shield, RES +10%, and Taunt; all active allies gain 12% damage reduction for 2 turns.",
    },
    {
      key: "reactorQuake", name: "Reactor Quake", cost: 40, cooldown: 4,
      tags: ["Kinetic", "area"], targeting: "none",
      effects: [
        {
          type: "masteryDamageAllOpponents", element: "Kinetic", power: 0.9, scalingStat: "ATK",
          ignoreNextSkillDamageModifier: true,
          ignoreNextSkillPowerModifier: true,
          powerModifiers: [{ when: { flag: "gallozReinforcementPrimed", equals: true }, setPower: 1.2, bonusText: " (Reinforcement payoff)" }],
        },
        { type: "statusSelf", id: "reactorQuakeDef", stat: "DEF", amount: 10, turns: 2 },
      ],
      message: "REACTOR QUAKE! Galloz releases a Kinetic shockwave against all enemies and gains DEF +10% for 2 turns. At 2 Reinforcement stacks, the attack increases from 90% to 120% ATK and consumes both stacks.",
    },
    {
      key: "ultimate", name: "Catalyst Overlord", category: "Ultimate", cost: 65, cooldown: 6,
      tags: ["Kinetic", "area", "defensive"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Kinetic", power: 1.9, scalingStat: "ATK" },
        { type: "healSelf", percentMaxHP: 10 },
        { type: "statusSelf", id: "catalystOverlordDamageReduction", damageTakenPercent: -20, turns: 2 },
        { type: "statusSelf", id: "catalystOverlordNextStrike", nextSkillPowerAdd: 0.2, scalingStat: "ATK", damageType: "Kinetic", turns: 2 },
      ],
      message: "CATALYST OVERLORD! Galloz deals 190% ATK Kinetic damage to all enemies, restores 10% Max HP, and gains 20% damage reduction for 2 turns. His next damaging Kinetic skill within that time gains an additional 20% damage.",
    },
  ],
};
