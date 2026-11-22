// Skill mechanics are implemented here; the compact owner-facing copy reference is references/characterTerraData.js.
module.exports = {
  characterId: "jazen",
  passive: { id: "recoilDampeners", name: "Recoil Dampeners", damageThresholdPercent: 10, attackBonusPercent: 10, maxStacks: 2, duration: 2, statusId: "jazenRecoil", immunities: ["staggered", "actionDelay"], events: { damageTaken: [{ handler: "recoilDampeners" }] } },
  skills: [
    { key: "impactGrenade", name: "Impact Grenade", cost: 20, cooldown: 2, tags: [], targeting: "none",
      effects: [{ type: "masteryDamageAllEnemies", element: "Kinetic", power: 0.8, statusChance: 20, status: { id: "staggered", turns: 1, debuff: true, delayCR: 20 } }],
      message: "{actor} launches Impact Grenade at all enemies: 0.8x Kinetic mastery damage; each hit has a 20% chance to Stagger (1 turn)." },
    { key: "breachCharge", name: "Breach Charge", cost: 30, cooldown: 3, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 1.2 },
        { type: "status", to: "target", id: "breachDefDown", stat: "DEF", amount: -20, turns: 2, debuff: true },
        { type: "status", to: "target", id: "staggered", turns: 1, debuff: true, delayCR: 20 },
      ], message: "{actor} detonates Breach Charge on {target}: {damage} Kinetic damage, DEF -20% and Stagger (2/1 turns)." },
    { key: "reinforcedPlating", name: "Reinforced Plating", cost: 25, cooldown: 3, tags: [], targeting: "none",
      effects: [
        { type: "shieldSelf", percentMaxHP: 25, turns: 3 },
        { type: "statusSelf", id: "reinforcedDef", stat: "DEF", amount: 20, turns: 3 },
        { type: "statusSelf", id: "taunt", turns: 2 },
      ], message: "{actor} activates Reinforced Plating ({shield} shield, DEF +20% for 3 turns, Taunt for 2 turns)." },
    { key: "cataclysmicPayload", name: "Cataclysmic Payload", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Kinetic", power: 1.5, statusChance: 25, status: { id: "staggered", turns: 1, debuff: true, delayCR: 20 } },
        { type: "statusEnemies", id: "cataclysmDefDown", stat: "DEF", amount: -15, turns: 2, debuff: true },
      ], message: "CATACLYSMIC PAYLOAD! All enemies take 1.5x Kinetic mastery damage, DEF -15% (2 turns), and have a 25% chance to be Staggered (1 turn)." },
  ],
};
