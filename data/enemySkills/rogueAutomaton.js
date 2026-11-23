module.exports = {
  characterId: "rogueAutomaton",
  skills: [
    {
      key: "overload", name: "Overload", cost: 22, cooldown: 4, tags: ["SelfBuff"], targeting: "none",
      effects: [{ type: "statusSelf", id: "automatonOverload", stat: "ATK", amount: 20, turns: 2 }],
      message: "{actor} activates OVERLOAD! ATK +20% (2 turns).",
    },
    {
      key: "scan", name: "Armor Scan", cost: 18, cooldown: 3, tags: ["Debuff"], targeting: "ally",
      effects: [{ type: "status", id: "automatonDefDown", stat: "DEF", amount: -15, turns: 2, debuff: true }],
      message: "{actor} scans {target}! DEF -15% (2 turns).",
    },
    {
      key: "heavyStrike", name: "Heavy Strike", cost: 28, cooldown: 3, tags: ["Melee"], targeting: "ally",
      effects: [{ type: "physicalHit", power: 1.55 }],
      message: "{actor} unleashes HEAVY STRIKE on {target} for {damage} damage!",
    },
    {
      key: "crusherProtocol", name: "Crusher Protocol", category: "Ultimate", cost: 52, cooldown: 6, tags: ["Kinetic", "Ultimate"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 1.65 },
        { type: "status", id: "crusherDefDown", stat: "DEF", amount: -10, turns: 2, debuff: true },
      ],
      message: "{actor} executes CRUSHER PROTOCOL on {target}: {damage} Kinetic damage and DEF -10% (2 turns).",
    },
  ],
};
