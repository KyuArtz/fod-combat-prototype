// Zackry's tactics are composed from generic statuses and mastery-damage effects.
module.exports = {
  characterId: "zackry",
  passive: { id: "overwatchProtocol", name: "Overwatch Protocol",
    description: "Enemies affected by Tactical Mark lose 10 Evasion for the duration of the mark.", markEvasionPenalty: 10 },
  skills: [
    {
      key: "mark", name: "Tactical Mark", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [{ type: "status", to: "target", id: "tacticalMark", damageTakenPercent: 15, evasionPenalty: 10, turns: 3, debuff: true }],
      message: "{actor} designates {target} with Tactical Mark: incoming damage +15%, Evasion -10 (3 turns).",
    },
    {
      key: "uplink", name: "Command Uplink", cost: 30, cooldown: 3, tags: [], targeting: "none",
      effects: [{ type: "statusAllies", id: "commandUplink", stat: "MPow", amount: 15, turns: 3 }],
      message: "COMMAND UPLINK! Active allies gain MPow +15% (3 turns).",
    },
    {
      key: "emp", name: "EMP Burst", cost: 35, cooldown: 4, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Electromagnetic", power: 0.8 },
        { type: "status", to: "target", id: "empSpdDown", stat: "SPD", amount: -20, turns: 2, debuff: true },
      ],
      message: "{actor} fires EMP Burst at {target}: {damage} Electromagnetic damage; SPD -20% (2 turns).",
    },
    {
      key: "ultimate", name: "Full Spectrum Assault", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "none",
      effects: [
        { type: "statusEnemies", id: "tacticalMark", damageTakenPercent: 15, evasionPenalty: 10, turns: 3, debuff: true },
        { type: "statusAllies", id: "fullSpectrumMPow", stat: "MPow", amount: 20, turns: 3 },
        { type: "statusAllies", id: "fullSpectrumSPD", stat: "SPD", amount: 10, turns: 3 },
      ],
      message: "FULL SPECTRUM ASSAULT! All living enemies are Tactical Marked and active allies gain MPow +20% and SPD +10% (3 turns).",
    },
  ],
};
