// Jazen's reactive passive and skills use shared mastery, status and shield handlers.
module.exports = {
  characterId: "jazen",
  passive: {
    id: "recoilDampeners",
    name: "Recoil Dampeners",
    damageThresholdPercent: 10,
    mpowBonusPercent: 10,
    maxStacks: 2,
    duration: 2,
    statusId: "jazenRecoil",
    events: { damageTaken: [{ handler: "recoilDampeners" }] },
  },
  skills: [
    {
      key: "impactGrenade", name: "Impact Grenade", cost: 20, cooldown: 2, tags: [], targeting: "none",
      effects: [{ type: "masteryDamageAllEnemies", element: "Kinetic", power: 0.8 }],
      message: "{actor} launches Impact Grenade at all enemies for 0.8x Kinetic mastery damage.",
    },
    {
      key: "breachCharge", name: "Breach Charge", cost: 30, cooldown: 3, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 1.2 },
        { type: "status", to: "target", id: "breachDefDown", stat: "DEF", amount: -20, turns: 2, debuff: true },
      ],
      message: "{actor} detonates Breach Charge on {target}: {damage} Kinetic damage, DEF -20% (2 turns).",
    },
    {
      key: "reinforcedPlating", name: "Reinforced Plating", cost: 25, cooldown: 3, tags: [], targeting: "none",
      effects: [
        { type: "shieldSelf", percentMaxHP: 25, turns: 3 },
        { type: "statusSelf", id: "reinforcedDef", stat: "DEF", amount: 20, turns: 3 },
      ],
      message: "{actor} activates Reinforced Plating ({shield} shield and DEF +20% for 3 turns).",
    },
    {
      key: "cataclysmicPayload", name: "Cataclysmic Payload", category: "Ultimate", cost: 65, cooldown: 6, tags: [], targeting: "none",
      effects: [
        { type: "masteryDamageAllEnemies", element: "Kinetic", power: 1.5 },
        { type: "statusEnemies", id: "cataclysmDefDown", stat: "DEF", amount: -15, turns: 2, debuff: true },
      ],
      message: "CATACLYSMIC PAYLOAD! All enemies take 1.5x Kinetic mastery damage and suffer DEF -15% (2 turns).",
    },
  ],
};
