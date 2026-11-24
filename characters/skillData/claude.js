const { createPoisonEffect } = require("./effects/poison");
const poison = () => createPoisonEffect({ power: 0.2 });

module.exports = {
  characterId: "claude",
  passive: {
    id: "unstableFormulation",
    name: "Unstable Formulation",
    description: "Whenever Claude uses an active skill that hits an enemy, the primary enemy hit is inflicted with Fracture, reducing DEF by 8% for 2 turns. Fracture does not stack; reapplication refreshes its duration.",
    events: {
      skillUsed: [{ handler: "applyFractureToPrimaryHit", statusId: "fracture", stat: "DEF", amount: -8, duration: 2 }],
    },
  },
  skills: [
    {
      key: "rallyingCatalyst", name: "Rallying Catalyst", cost: 20, cooldown: 2,
      tags: ["support"], targeting: "ally",
      effects: [
        { type: "status", to: "target", id: "rallyingCatalystAtk", stat: "ATK", amount: 20, turns: 2 },
        { type: "status", to: "target", id: "rallyingCatalystSpd", stat: "SPD", amount: 10, turns: 2 },
      ],
      message: "Claude tosses a supportive vial to {target}, granting ATK +20% and SPD +10% for 2 turns.",
    },
    {
      key: "ruptureFlask", name: "Rupture Flask", cost: 25, cooldown: 2,
      tags: ["Toxic", "debuff"], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Toxic", power: 1.3 },
        poison(),
        { type: "status", to: "target", id: "ruptureDefDown", stat: "DEF", amount: -15, turns: 2, debuff: true },
      ],
      message: "Claude detonates Rupture Flask on {target} for {damage} Toxic damage, inflicting Poison and DEF -15% for 2 turns.",
    },
    {
      key: "sabotageCocktail", name: "Sabotage Cocktail", cost: 35, cooldown: 3,
      tags: ["Toxic", "area", "debuff"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Toxic", power: 0.75 },
        { ...poison(), side: "opponent" },
        { type: "statusEnemies", id: "sabotageAtkDown", stat: "ATK", amount: -15, turns: 2, debuff: true, onlyHitTargets: true },
      ],
      message: "Claude's Sabotage Cocktail explodes across all enemies, dealing Toxic damage, applying Poison, and reducing ATK by 15% for 2 turns.",
    },
    {
      key: "ultimate", name: "Masterpiece in Mayhem", category: "Ultimate", cost: 65, cooldown: 6,
      tags: ["Toxic", "area", "team-support"], targeting: "none",
      effects: [
        { type: "masteryDamageAllOpponents", element: "Toxic", power: 1.5 },
        { ...poison(), side: "opponent" },
        { type: "statusAllies", id: "masterpieceAtk", stat: "ATK", amount: 15, turns: 2 },
        { type: "statusAllies", id: "masterpieceSpd", stat: "SPD", amount: 10, turns: 2 },
        { type: "statusEnemies", id: "masterpieceDefDown", stat: "DEF", amount: -20, turns: 2, debuff: true, onlyHitTargets: true },
      ],
      message: "MASTERPIECE IN MAYHEM! Claude's volatile concoctions deal Toxic damage and Poison all hit enemies. Allies gain ATK +15% and SPD +10% while hit enemies suffer DEF -20% for 2 turns.",
    },
  ],
};
