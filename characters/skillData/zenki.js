// Zenki's stealth and multi-hit attacks use reusable flags, statuses and mastery effects.
module.exports = {
  characterId: "zenki",
  passive: {
    id: "unobserved",
    name: "Unobserved",
    initialFlags: { unobservedEvasionActive: false },
    statMods: [{ stat: "Evasion", points: 12, when: { flag: "unobservedEvasionActive", equals: true } }],
    events: {
      turnStart: [{ handler: "setFlagFromHistory", flag: "unobservedEvasionActive", historyField: "damageTakenSinceLastTurn" }],
      damageTaken: [{ handler: "clearPassiveFlag", flag: "unobservedEvasionActive" }],
    },
  },
  skills: [
    {
      key: "railshot", name: "Railshot", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [{ type: "masteryHit", element: "Energy", power: 1.1, accuracy: "guaranteed" }],
      message: "{actor} fires Railshot at {target} for {damage} Energy damage.",
    },
    {
      key: "cipher", name: "Cipher Tag", cost: 25, cooldown: 3, tags: [], targeting: "enemy",
      effects: [{ type: "statusGroup", group: "zenkiCipherTag", replaceOn: "enemy", statuses: [
        { id: "cipherTag", data: { stat: "RES", amount: -15, turns: 3, debuff: true } },
      ] }],
      message: "{actor} applies Cipher Tag to {target}, reducing RES by 15% for 3 turns.",
    },
    {
      key: "ghost", name: "Ghost Protocol", cost: 35, cooldown: 4, tags: [], targeting: "none",
      effects: [
        { type: "statusSelf", id: "ghostUntargetable", untargetable: true, expireAtTurnStart: true, turns: 1 },
        { type: "statusSelf", id: "ghostAttackBoost", nextAttackDamagePercent: 30, turns: 1 },
      ],
      message: "{actor} activates Ghost Protocol, becoming Untargetable until the start of his next turn. His next attack deals 30% additional damage.",
    },
    {
      key: "ultimate", name: "Zero Hour Execution", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "enemy",
      effects: [{
        type: "masteryMultiHit",
        element: "Energy",
        hits: [0.9, 0.9, 0.9],
        accuracy: "standard",
        lastHitModifier: { targetHpPercentBelow: 40, setPower: 1.6 },
      }],
      message: "{actor} executes Zero Hour on {target} with {hitsLanded} rail shots for {damage} total Energy damage{bonusText}.",
    },
  ],
};
