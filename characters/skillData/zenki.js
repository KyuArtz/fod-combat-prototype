// Skill mechanics are implemented here; the compact owner-facing copy reference is references/characterTerraData.js.
module.exports = {
  characterId: "zenki",
  passive: {
    id: "unobserved", name: "Unobserved", initialFlags: { unobservedActive: true, unobservedEvasionActive: true },
    statMods: [{ stat: "Evasion", points: 12, when: { flag: "unobservedEvasionActive", equals: true, andFlags: [{ flag: "enemySkillTargetedThisRound", equals: false }] } }],
    incomingAttackMods: [{ type: "evasion", points: 10 }],
    events: {
      turnStart: [
        { handler: "setFlagFromHistory", flag: "unobservedActive", historyField: "targetedByEnemySinceLastTurn" },
        { handler: "setPassiveFlag", flag: "unobservedEvasionActive" },
      ],
      damageTaken: [{ handler: "clearPassiveFlag", flag: "unobservedEvasionActive" }],
    },
  },
  skills: [
    { key: "railshot", name: "Railshot", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [{
        type: "masteryHit", element: "Energy", power: 1.1, accuracy: "guaranteed",
        powerModifiers: [{
          when: { flag: "unobservedActive", equals: true }, percent: 30,
          bonusText: " (unobserved bonus)",
        }],
      }],
      message: "{actor} fires Railshot at {target} for {damage} Energy damage{bonusText}." },
    { key: "cipher", name: "Cipher Tag", cost: 25, cooldown: 3, tags: [], targeting: "enemy",
      effects: [{ type: "statusGroup", group: "zenkiCipherTag", replaceOn: "enemy", statuses: [
        { id: "cipherTag", data: { damageTakenPercent: 12, turns: 3, debuff: true } },
        { id: "cipherResDown", data: { stat: "RES", amount: -15, turns: 3, debuff: true } },
      ] }],
      message: "{actor} applies Cipher Tag to {target}: incoming damage +12%, RES -15% (3 turns)." },
    { key: "ghost", name: "Ghost Protocol", cost: 35, cooldown: 4, tags: [], targeting: "none",
      effects: [
        { type: "statusSelf", id: "ghostEvasion", stat: "Evasion", amount: 25, turns: 3 },
        { type: "statusSelf", id: "ghostSPD", stat: "SPD", amount: 20, turns: 3 },
        { type: "statusSelf", id: "ghostDamage", damageDealtPercent: 25, turns: 3 },
      ], message: "{actor} activates Ghost Protocol: Evasion +25, SPD +20% and damage dealt +25% (3 turns)." },
    { key: "ultimate", name: "Zero Hour Execution", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Energy", power: 2.4, powerModifiers: [
          { when: { targetHpPercentBelow: 40 }, setPower: 3.2, bonusText: " (execution bonus)" },
        ] },
        { type: "conditionalStatus", to: "target", id: "zeroHourSpdDown", stat: "SPD", amount: -25,
          turns: 2, debuff: true, requiresStatus: "cipherTag", requireAlive: true },
      ],
      message: "{actor} executes Zero Hour on {target} for {damage} Energy damage{bonusText}." },
  ],
};
