// Skill mechanics are implemented here; the compact owner-facing copy reference is references/characterTerraData.js.
module.exports = {
  characterId: "zenki",
  passive: { id: "unobserved", name: "Unobserved", evasionWhileUnobserved: 12, attackerAccuracyPenalty: 10 },
  skills: [
    { key: "railshot", name: "Railshot", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [{ type: "railshot", normalPower: 1.1, unobservedBonus: 30, element: "Energy" }],
      message: "{actor} fires Railshot at {target} for {damage} Energy damage{bonusText}." },
    { key: "cipher", name: "Cipher Tag", cost: 25, cooldown: 3, tags: [], targeting: "enemy",
      effects: [{ type: "cipherTag", turns: 3, damageTakenPercent: 12, resDown: -15 }],
      message: "{actor} applies Cipher Tag to {target}: incoming damage +12%, RES -15% (3 turns)." },
    { key: "ghost", name: "Ghost Protocol", cost: 35, cooldown: 4, tags: [], targeting: "none",
      effects: [
        { type: "statusSelf", id: "ghostEvasion", stat: "Evasion", amount: 25, turns: 3 },
        { type: "statusSelf", id: "ghostSPD", stat: "SPD", amount: 20, turns: 3 },
        { type: "statusSelf", id: "ghostDamage", damageDealtPercent: 25, turns: 3 },
      ], message: "{actor} activates Ghost Protocol: Evasion +25, SPD +20% and damage dealt +25% (3 turns)." },
    { key: "ultimate", name: "Zero Hour Execution", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "enemy",
      effects: [{ type: "zeroHour", normalPower: 2.4, executePower: 3.2, hpThresholdPercent: 40, element: "Energy", cipherStatus: "cipherTag", cipherSpdDown: -25, cipherTurns: 2 }],
      message: "{actor} executes Zero Hour on {target} for {damage} Energy damage{bonusText}." },
  ],
};
