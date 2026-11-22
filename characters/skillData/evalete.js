// Evalete's Catalyst Wing and skills use shared passive, status, shield and damage handlers.
module.exports = {
  characterId: "evalete",
  passive: {
    id: "catalystProtocol",
    name: "Catalyst Protocol",
    description: "The Catalyst Wing lasts for 12 Evalete turns. At the start of every second turn, it heals all active allies for 8% Max HP and grants a shield equal to 10% Max HP for 2 turns. Destroying the Wing ends its support; it grants no fallback shield.",
    wingTurns: 12,
    summon: { name: "Catalyst Wing", mastery: "Energy", hpPercent: 25, defPercent: 50, resPercent: 50 },
    events: {
      battleStart: [{ handler: "initializeCatalystWing" }],
      turnStart: [{ handler: "tickCatalystProtocol" }],
      turnEnd: [{ handler: "expireCatalystProtocol" }],
    },
    pulseEvery: 2,
    healPercent: 8,
    shieldPercent: 10,
    shieldTurns: 2,
    shieldSource: "catalystWing",
  },
  skills: [
    {
      key: "pulse", name: "Sentinel Pulse", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Energy", power: 0.75 },
        { type: "status", to: "target", id: "sentinelDefDown", stat: "DEF", amount: -15, turns: 2, debuff: true },
      ],
      message: "{actor} fires Sentinel Pulse at {target}: {damage} Energy damage; DEF -15% (2 turns).",
    },
    {
      key: "triage", name: "Triage Infusion", cost: 25, cooldown: 3, tags: [], targeting: "ally",
      effects: [
        { type: "heal", percentMaxHP: 22 },
        { type: "status", to: "target", id: "triageHot", hotPercentMaxHP: 10, turns: 3 },
      ],
      message: "{actor} uses Triage Infusion on {target}, restoring {healed} HP and applying 10% Max HP healing each turn for 3 turns.",
    },
    {
      key: "guardian", name: "Guardian Field", cost: 40, cooldown: 4, tags: [], targeting: "none",
      effects: [
        { type: "healAllies", percentMaxHP: 12 },
        { type: "statusAllies", id: "guardianDef", stat: "DEF", amount: 15, turns: 2 },
      ],
      message: "GUARDIAN FIELD! Active allies recover 12% Max HP and gain DEF +15% (2 turns).",
    },
    {
      key: "catalyst", name: "Catalyst Overdrive", category: "Ultimate", cost: 65, cooldown: 6, tags: [], targeting: "none",
      effects: [
        { type: "cleanseAllies" },
        { type: "healAllies", percentMaxHP: 18 },
        { type: "statusAllies", id: "catalystDef", stat: "DEF", amount: 25, turns: 3 },
        { type: "statusAllies", id: "catalystReflection", damageReflectionPercent: 25, turns: 3 },
        { type: "hotAllies", id: "catalystHot", percentMaxHP: 10, turns: 3 },
      ],
      message: "CATALYST OVERDRIVE! Cleanses {cleansedCount} harmful effects, restores 18% Max HP, grants DEF +25%, reflects 25% of direct incoming damage, and restores 10% Max HP at the start of each turn (3 turns).",
    },
  ],
};
