const { createPoisonEffect } = require("./effects/poison");

const poison = () => createPoisonEffect({ power: 0.25 });
const toxicResistance = (amount = 10) => ({
  type: "status", to: "target", id: "verraToxicResistance", resistanceType: "Toxic",
  resistancePercent: amount, turns: 2, debuff: false,
});

module.exports = {
  characterId: "verra",
  passive: {
    id: "toxicologyProdigy",
    name: "Toxicology Prodigy",
    description: "Verra's Poison deals 25% of her Mpow as Toxic damage at the start of the afflicted enemy's turn for 2 turns. Poison does not stack; reapplication refreshes its duration. Whenever Verra heals an ally, that ally gains Toxic Resistance +10% for 2 turns.",
    events: {
      skillUsed: [{ handler: "grantResistanceToHealedAllies", statusId: "verraToxicResistance", resistanceType: "Toxic", resistancePercent: 10, duration: 2 }],
    },
  },
  skills: [
    {
      key: "causticInjection", name: "Caustic Injection", cost: 20, cooldown: 1,
      tags: ["Toxic", "healing"], targeting: "mode",
      modes: [
        {
          id: "attack", label: "Caustic Shot", targeting: "enemy",
          effects: [
            { type: "masteryHit", element: "Toxic", power: 1.1 },
            poison(),
          ],
          message: "Verra fires Caustic Injection at {target} for {damage} Toxic damage and applies Poison for 2 turns.",
        },
        {
          id: "treat", label: "Catalyst Treatment", targeting: "ally",
          effects: [
            { type: "healPower", scalingStat: "MPow", multiplier: 1.3 },
            { type: "cleanseTarget" },
            toxicResistance(10),
            { type: "status", to: "target", id: "verraCausticHot", hotPercentMaxHP: 5, turns: 3 },
          ],
          message: "Verra administers Caustic Injection to {target}, restoring {healed} HP, cleansing 1 debuff, granting Toxic Resistance +10% for 2 turns, and applying a 5% Max HP HoT for 3 turns.",
        },
      ],
    },
    {
      key: "chemicalCatastrophe", name: "Chemical Catastrophe", cost: 35, cooldown: 3,
      tags: ["Toxic", "area"], targeting: "none",
      effects: [
        {
          type: "masteryDamageAllOpponents", element: "Toxic", power: 0.85,
          powerModifiers: [{ when: { targetStatus: "poison" }, addPower: 0.2, bonusText: " (Poison reaction)" }],
        },
        { ...poison(), side: "opponent" },
      ],
      message: "Verra launches Chemical Catastrophe across the enemy formation, dealing Toxic damage and applying Poison for 2 turns. Already-poisoned enemies suffer an additional 20% Mpow impact.",
    },
    {
      key: "unstableRemedy", name: "Unstable Remedy", cost: 30, cooldown: 2,
      tags: ["Toxic", "healing"], targeting: "mode",
      modes: [
        {
          id: "remedy", label: "Unstable Remedy", targeting: "ally",
          effects: [
            { type: "healPower", scalingStat: "MPow", multiplier: 1.6, multiplierBelowHpPercent: 50, conditionalMultiplier: 2.0 },
            { type: "cleanseTarget" },
            toxicResistance(10),
            { type: "status", to: "target", id: "verraRemedyHot", hotPercentMaxHP: 5, turns: 3 },
          ],
          message: "Verra applies Unstable Remedy to {target}, restoring {healed} HP, cleansing 1 debuff, granting Toxic Resistance +10% for 2 turns, and applying a 5% Max HP HoT for 3 turns.",
        },
        {
          id: "corrosive", label: "Corrosive Flask", targeting: "enemy",
          effects: [
            { type: "masteryHit", element: "Toxic", power: 1.0 },
            poison(),
          ],
          message: "Verra hurls a corrosive vial at {target} for {damage} Toxic damage and applies Poison for 2 turns.",
        },
      ],
    },
    {
      key: "ultimate", name: "Pandemic Protocol", category: "Ultimate", cost: 60, cooldown: 6,
      tags: ["Toxic", "area", "healing"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Toxic", power: 1.45 },
        { ...poison(), side: "opponent" },
        { type: "healPowerAllies", scalingStat: "MPow", multiplier: 1.0 },
        { type: "statusAllies", id: "verraPandemicResistance", resistanceType: "Toxic", resistancePercent: 15, turns: 2 },
      ],
      message: "PANDEMIC PROTOCOL! Verra unleashes a toxic barrage, Poisoning all enemies for 2 turns. Allies recover HP equal to 100% of Verra's Mpow and gain Toxic Resistance +15% for 2 turns.",
    },
  ],
};
