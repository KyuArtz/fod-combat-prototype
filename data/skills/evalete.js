// Skill mechanics are implemented here; the compact owner-facing copy reference is references/characterTerraData.js.
module.exports = {
  characterId: "evalete",
  passive: {
    id: "catalystProtocol",
    name: "Catalyst Protocol",
    wingTurns: 12,
    pulseEvery: 2,
    healPercent: 8,
    shieldPercent: 10,
    shieldTurns: 2,
    // The reference does not specify Catalyst Wing HP or a destruction trigger.
    destructionShieldPercent: 15,
    destructionShieldTurns: 4,
    // Added implementation values: durable but not a full extra combatant.
    wingHpPercent: 25,
    wingDefPercent: 50,
    wingResPercent: 50,
  },
  skills: [
    { key: "pulse", name: "Sentinel Pulse", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Energy", power: 0.75 },
        { type: "status", to: "target", id: "sentinelDefDown", stat: "DEF", amount: -15, turns: 2, debuff: true },
      ], message: "{actor} fires Sentinel Pulse at {target}: {damage} Energy damage; DEF -15% (2 turns)." },
    { key: "triage", name: "Triage Infusion", cost: 25, cooldown: 3, tags: [], targeting: "ally",
      effects: [{ type: "heal", percentMaxHP: 22 }], message: "{actor} uses Triage Infusion on {target}, restoring {healed} HP." },
    { key: "guardian", name: "Guardian Field", cost: 40, cooldown: 4, tags: [], targeting: "none",
      effects: [
        { type: "healAllies", percentMaxHP: 12 },
        { type: "statusAllies", id: "guardianDef", stat: "DEF", amount: 15, turns: 2 },
      ], message: "GUARDIAN FIELD! Active allies recover 12% Max HP and gain DEF +15% (2 turns)." },
    { key: "catalyst", name: "Catalyst Overdrive", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "none",
      effects: [
        { type: "cleanseAllies" },
        { type: "healAllies", percentMaxHP: 18 },
        { type: "statusAllies", id: "catalystDef", stat: "DEF", amount: 25, turns: 3 },
        { type: "statusAllies", id: "retaliation", amount: 25, turns: 3 },
        { type: "hotAllies", id: "catalystHot", percentMaxHP: 10, turns: 3 },
      ], message: "CATALYST OVERDRIVE! Allies are cleansed, recover 18% Max HP, gain DEF +25%, 25% Retaliation and 10% Max HP healing each turn (3 turns)." },
  ],
};
