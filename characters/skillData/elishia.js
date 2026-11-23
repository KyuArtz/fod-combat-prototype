// Elishia's abilities are declarative; shared effect and lifecycle registries execute them.
module.exports = {
  characterId: "elishia",
  passive: {
    id: "biotechOverdrive",
    name: "Biotech Overdrive",
    description: "At battle start, gains SPD +10% and Evasion +10 for 3 turns. After using a Nanotech skill, her next active skill costs 8 MP less. This passive does not increase damage.",
    events: {
      battleStart: [{ handler: "startTimedPassive", timerKey: "overdrive", turns: 3 }],
      turnEnd: [{ handler: "tickTimedPassive", timerKey: "overdrive" }],
    },
    statMods: [
      { stat: "SPD", percent: 10, timerKey: "overdrive" },
      { stat: "Evasion", points: 10, timerKey: "overdrive" },
    ],
    onSkillUsed: [{ tag: "Nanotech", effects: [{ type: "nextSkillDiscount", amount: 8 }] }],
  },
  summons: {
    meo9: {
      id: "meo-9",
      name: "Meo-9",
      mastery: "Nanotech",
      turns: 3,
      targetableByEnemy: true,
      ownerTurnLifecycle: {
        skipFirstTurnEnd: true,
        expireMessage: "{actor}'s deployment expires.",
        activation: [
          {
            handler: "emergencyField",
            thresholdPercent: 25,
            healPercent: 10,
            stopOnSuccess: true,
            message: "{actor}'s Emergency Field restores {target} for {healed} HP.",
          },
          {
            handler: "coverFire",
            power: 0.5,
            conditionalPower: [{ battleTimer: "singularity", power: 0.75 }],
            canCrit: false,
            message: "{actor} cover fire hits {target} for {damage} Physical damage.",
          },
        ],
      },
      stats: {
        HP: 350, MP: 0, ATK: 65, MPow: 80, DEF: 35, RES: 35, SPD: 100,
        CritRate: 0, Evasion: 0, masteryBonus: {}, masteryResistance: {},
      },
    },
  },
  skills: [
    {
      key: "nano", name: "Nano Swarm", cost: 20, cooldown: 2, tags: ["Nanotech"], targeting: "mode",
      description: "Choose one nanobot mode: Repair heals one ally for 15% Max HP; Disrupt deals 0.6x Nanotech damage and reduces one enemy's SPD by 10% for 2 turns; Decoy grants Elishia +15 Evasion for 2 turns.",
      modes: [
        {
          id: "Repair", label: "Repair", targeting: "ally",
          effects: [{ type: "heal", percentMaxHP: 15 }],
          message: "Nano Swarm repairs {target}, restoring {healed} HP.",
        },
        {
          id: "Disrupt", label: "Disrupt", targeting: "enemy",
          effects: [
            { type: "masteryHit", element: "Nanotech", power: 0.6 },
            { type: "status", to: "target", id: "nanoSpdDown", stat: "SPD", amount: -10, turns: 2, debuff: true },
          ],
          message: "Nano Swarm disrupts {target}: {damage} Nanotech damage; SPD -10% (2 turns).",
        },
        {
          id: "Decoy", label: "Decoy", targeting: "none",
          effects: [{ type: "statusSelf", id: "decoy", stat: "Evasion", amount: 15, turns: 2 }],
          message: "{actor} deploys a decoy (+15 Evasion for 2 turns).",
        },
      ],
    },
    {
      key: "barrier", name: "Adaptive Barrier", cost: 25, cooldown: 3, tags: ["Nanotech"], targeting: "ally",
      effects: [{ type: "shield", percentMaxHP: 25, turns: 2, adaptive: { resistance: 15 } }],
      message: "{target} gains Adaptive Barrier ({shield} shield, up to 2 turns).",
    },
    {
      key: "meo", name: "Meo-9", cost: 35, cooldown: 4, tags: ["Nanotech"], targeting: "none",
      effects: [{ type: "summon", template: "meo9" }],
      message: "{actor} deploys Meo-9 for 3 subsequent {actor} turns. It provides covering fire or emergency healing after each turn.",
    },
    {
      key: "ultimate", name: "Nanotech Singularity", category: "Ultimate", cost: 65, cooldown: 6, tags: ["Nanotech"], targeting: "none",
      effects: [
        {
          type: "setBattleTimer", key: "singularity", turns: 3, ownerTurnClock: true,
          turnStart: [{ handler: "healPercentMaxHP", percentMaxHP: 5, side: "owner", excludeSummons: true }],
        },
        { type: "statusAllies", id: "singularityAtk", stat: "ATK", amount: 15, turns: 3 },
        { type: "statusAllies", id: "singularitySpd", stat: "SPD", amount: 10, turns: 3 },
        { type: "statusEnemies", id: "singularitySpdDown", stat: "SPD", amount: -10, turns: 3, debuff: true },
        {
          type: "announceSummonPowerModifier", ruleHandler: "coverFire", battleTimer: "singularity",
          message: "{actor}'s covering fire is amplified to {power}% of its ATK.",
        },
      ],
      message: "NANOTECH SINGULARITY! Allies gain ATK +15% and SPD +10% and recover 5% Max HP at the start of their turns. Enemies suffer SPD -10% (3 turns). Meo-9's covering fire increases to 75% of its ATK while deployed.",
    },
  ],
};
