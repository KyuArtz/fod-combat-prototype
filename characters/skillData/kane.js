const { createPoisonEffect } = require("./effects/poison");
const poison = () => createPoisonEffect({ power: 0.2 });
const poisonDamageBonus = [{ when: { targetStatus: "poison" }, percent: 10, bonusText: " (Serpent's Instinct)" }];

module.exports = {
  characterId: "kane",
  passive: {
    id: "serpentsInstinct",
    name: "Serpent's Instinct",
    description: "Kane deals 10% increased Toxic damage to enemies already afflicted with Poison. This bonus does not stack.",
    conditionalDamageMods: [{ damageType: "Toxic", targetStatus: "poison", percent: 10 }],
  },
  skills: [
    {
      key: "twinFang", name: "Twin Fang", cost: 20, cooldown: 1,
      tags: ["Toxic", "multi-hit"], targeting: "enemy",
      effects: [
        { type: "masteryMultiHit", element: "Toxic", scalingStat: "MPow", hits: [0.6, 0.6], powerModifiers: poisonDamageBonus },
        poison(),
      ],
      message: "Kane strikes {target} twice with his Venom Crescents for {damage} total Toxic damage and applies Poison for 2 turns{bonusText}.",
    },
    {
      key: "venomousPursuit", name: "Venomous Pursuit", cost: 28, cooldown: 3,
      tags: ["Toxic", "mobility"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Toxic", power: 0.85, powerModifiers: poisonDamageBonus },
        poison(),
        { type: "statusSelf", id: "venomousPursuitSpeed", stat: "SPD", amount: 10, turns: 2 },
        { type: "statusSelf", id: "venomousPursuitEvasion", stat: "Evasion", amount: 8, turns: 2 },
      ],
      message: "Kane launches his Venom Crescents at {target} for {damage} Toxic damage, applies Poison, and gains SPD +10 and Evasion +8 for 2 turns{bonusText}.",
    },
    {
      key: "phantomOrbit", name: "Phantom Orbit", cost: 40, cooldown: 4,
      tags: ["Toxic", "multi-hit"], targeting: "enemy",
      effects: [
        {
          type: "masteryMultiHit", element: "Toxic", scalingStat: "MPow", hits: [0.5, 0.5, 0.5],
          powerModifiers: poisonDamageBonus,
          lastHitPowerModifiers: [{ when: { targetStatus: "poison" }, addPower: 0.3, bonusText: " (Poisoned final hit)" }],
        },
        poison(),
      ],
      message: "Kane's levitating blades strike {target} three times for {damage} total Toxic damage and apply Poison for 2 turns{bonusText}.",
    },
    {
      key: "ultimate", name: "Deadly Convergence", category: "Ultimate", cost: 65, cooldown: 6,
      tags: ["Toxic", "finisher"], targeting: "enemy",
      effects: [
        {
          type: "masteryHit", element: "Toxic", power: 2.5,
          powerModifiers: [
            ...poisonDamageBonus,
            { when: { targetStatus: "poison" }, addPower: 0.5, bonusText: " (Poison convergence)" },
          ],
        },
        poison(),
      ],
      message: "DEADLY CONVERGENCE! Kane converges both Venom Crescents on {target} for {damage} Toxic damage and applies Poison for 2 turns{bonusText}.",
    },
  ],
};
