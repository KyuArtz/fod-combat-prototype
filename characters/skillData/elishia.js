// Skill mechanics are implemented here; the compact owner-facing copy reference is references/characterTerraData.js.
// Final Protocol and Singularity DoT use conservative, explicit balance values.
module.exports = {
  characterId: "elishia",
  passive: {
    id: "biotechOverdrive",
    name: "Biotech Overdrive",
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
      id: "meo-9", name: "Meo-v9", mastery: "Nanotech", turns: 3,
      stats: {
        HP: 350, MP: 0, ATK: 65, MPow: 80, DEF: 35, RES: 35, SPD: 100,
        CritRate: 0, Evasion: 0, masteryBonus: {}, masteryResistance: {},
      },
      scan: { damageBonus: 10, conditionalBonuses: [{ battleTimer: "singularity", damageBonus: 10 }] },
      lifecycle: {
        expireMessage: "{actor}'s deployment expires.",
        activation: [
          { handler: "emergencyField", thresholdPercent: 25, healPercent: 10, stopOnSuccess: true,
            message: "{actor}'s Emergency Field restores {target} for {healed} HP." },
          { handler: "coverFire", power: 0.5, conditionalPower: [{ battleTimer: "singularity", power: 0.75 }], canCrit: false,
            message: "{actor} cover fire hits {target} for {damage} Physical damage." },
        ],
        onExpire: [{ handler: "finalProtocol", element: "Electromagnetic", power: 1.0,
          secondaryMultiplier: 0.5,
          status: { id: "meoFinalProtocolSpdDown", stat: "SPD", amount: -15, turns: 1, debuff: true },
          message: "{target} is struck by {actor}'s Final Protocol for {damage} {element} damage{priority}." }],
      },
    },
  },
  skills: [
    {
      key: "nano", name: "Nano Swarm", description: "Repair: restore 15% Max HP to all allies. Disrupt: deal 60% Nanotech damage to all enemies and reduce SPD by 10% for 2 turns. Decoy: grant Elishia +15 Evasion for 2 turns.",
      cost: 20, cooldown: 2, tags: ["Nanotech"], targeting: "mode",
      modes: [
        { id: "Repair", label: "Repair", targeting: "none", effects: [{ type: "healAllies", percentMaxHP: 15 }], message: "Nano Swarm repairs all active allies." },
        { id: "Disrupt", label: "Disrupt", targeting: "none", effects: [
          { type: "masteryDamageAllEnemies", element: "Nanotech", power: 0.6 },
          { type: "statusEnemies", id: "nanoSpdDown", stat: "SPD", amount: -10, turns: 2, debuff: true },
        ], message: "Nano Swarm disrupts all enemies: Nanotech damage; SPD -10% (2 turns)." },
        { id: "Decoy", label: "Decoy", targeting: "none", effects: [{ type: "statusSelf", id: "decoy", stat: "Evasion", amount: 15, turns: 2 }], message: "{actor} deploys a decoy (+15 Evasion for 2 turns)." },
      ],
    },
    {
      key: "barrier", name: "Adaptive Barrier", cost: 25, cooldown: 3, tags: ["Nanotech"], targeting: "ally",
      effects: [{ type: "shield", percentMaxHP: 25, turns: 2, adaptive: { resistance: 15 } }],
      message: "{target} gains Adaptive Barrier ({shield} shield, 2 turns).",
    },
    {
      key: "meo", name: "Meo-v9", cost: 35, cooldown: 4, tags: ["Nanotech"], targeting: "none",
      effects: [{ type: "summon", template: "meo9" }],
      message: "{actor} deploys Meo-v9 for 3 turns; Final Protocol targets the current priority enemy when it expires.",
    },
    {
      key: "ultimate", name: "Nanotech Singularity", category: "Ultimate", cost: 60, cooldown: 6, tags: ["Nanotech"], targeting: "none",
      effects: [
        { type: "setBattleTimer", key: "singularity", turns: 3,
          turnStart: [{ handler: "healPercentMaxHP", percentMaxHP: 5, side: "ally", excludeSummons: true }] },
        { type: "statusAllies", id: "singularityAtk", stat: "ATK", amount: 15, turns: 3 },
        { type: "statusAllies", id: "singularitySpd", stat: "SPD", amount: 10, turns: 3 },
        { type: "statusEnemies", id: "singularitySpdDown", stat: "SPD", amount: -10, turns: 3, debuff: true },
        { type: "damageOverTime", side: "enemy", id: "singularityDot", element: "Nanotech", power: 0.2, turns: 3,
          turnStart: {
            damageField: "dotDamage", damageTypeField: "damageType",
            message: "{actor} takes {damage} Nanotech damage from Nanotech Singularity.",
          },
        },
        { type: "announceSummonPowerModifier", ruleHandler: "coverFire", battleTimer: "singularity",
          message: "{actor}'s covering fire is amplified to {power}% of its ATK." },
      ],
      message: "NANOTECH SINGULARITY! Allies gain ATK +15%, SPD +10% and 5% Max HP healing each turn; enemies suffer SPD -10% (3 turns).",
    },
  ],
};
