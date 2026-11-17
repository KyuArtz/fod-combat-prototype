// Declarative enemy skill data. Values preserve the original prototype behavior.
module.exports = {
  characterId: "rogueAutomaton",
  skills: [
    {
      key: "overload", name: "Overload", cost: 0, cooldown: 5, tags: ["SelfBuff"],
      targeting: "none", effects: [{ type: "statusSelf", id: "overloadATK", stat: "ATK", amount: 25, turns: 2 }],
      message: "{actor} activates OVERLOAD! ATK +25% (2 turns).",
    },
    {
      key: "scan", name: "Scan", cost: 0, cooldown: 4, tags: ["Debuff"],
      targeting: "ally", effects: [{ type: "status", id: "defDown", stat: "DEF", amount: -15, turns: 2 }],
      message: "{actor} scans {target}! DEF -15% (2 turns).",
    },
    {
      key: "heavyStrike", name: "Heavy Strike", cost: 0, cooldown: 3, tags: ["Melee"],
      targeting: "ally", effects: [{ type: "physicalHit", power: 1.5 }],
      message: "{actor} unleashes HEAVY STRIKE on {target} for {damage} damage!",
    },
  ],
};
