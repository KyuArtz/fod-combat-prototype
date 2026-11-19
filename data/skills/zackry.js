// Skill mechanics are implemented here; the compact owner-facing copy reference is references/characterTerraData.js.
module.exports = {
  characterId: "zackry",
  passive: { id: "overwatchProtocol", name: "Overwatch Protocol", nextAttackAccuracy: 10, markEvasionPenalty: 10 },
  skills: [
    { key: "mark", name: "Tactical Mark", cost: 20, cooldown: 2, tags: [], targeting: "enemy",
      effects: [{ type: "tacticalMark", turns: 3, damageTakenPercent: 15, evasionPenalty: 10 }],
      message: "{actor} designates {target} with Tactical Mark: incoming damage +15%, Evasion -10 (3 turns)." },
    { key: "uplink", name: "Command Uplink", cost: 30, cooldown: 3, tags: [], targeting: "none",
      effects: [{ type: "commandUplink", turns: 3, amount: 15, conditionalAmount: 5, hpThresholdPercent: 50 }],
      message: "COMMAND UPLINK! Active allies gain ATK +15%; allies above 50% HP gain an additional +5% (3 turns)." },
    { key: "emp", name: "EMP Burst", cost: 35, cooldown: 4, tags: [], targeting: "enemy",
      effects: [
        { type: "masteryHit", element: "Electromagnetic", power: 0.8 },
        { type: "conditionalStatus", to: "target", id: "empSpdDown", stat: "SPD", amount: -20, conditionalAmount: -35, conditionStatus: "tacticalMark", turns: 2, debuff: true },
      ], message: "{actor} fires EMP Burst at {target}: {damage} Electromagnetic damage; SPD reduced for 2 turns." },
    { key: "ultimate", name: "Full Spectrum Assault", category: "Ultimate", cost: 60, cooldown: 6, tags: [], targeting: "none",
      effects: [
        { type: "statusEnemies", id: "tacticalMark", amount: 15, turns: 3, damageTakenPercent: 15, evasionPenalty: 10, debuff: true },
        { type: "statusAllies", id: "fullSpectrumATK", stat: "ATK", amount: 20, turns: 3 },
        { type: "statusAllies", id: "fullSpectrumMPow", stat: "MPow", amount: 15, turns: 3 },
        { type: "statusAllies", id: "fullSpectrumSPD", stat: "SPD", amount: 10, turns: 3 },
        { type: "statusAllies", id: "fullSpectrumCrit", critVsMarked: 10, turns: 3 },
      ], message: "FULL SPECTRUM ASSAULT! Enemies are Tactical Marked; allies gain ATK +20%, MPow +15%, SPD +10% and +10% Critical Rate against marked targets (3 turns)." },
  ],
};
