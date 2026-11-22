module.exports = {
  characterId: "reconDrone",
  skills: [
    {
      key: "spotterMark", name: "Spotter Mark", cost: 18, cooldown: 3, tags: ["Recon", "Debuff"], targeting: "ally",
      effects: [{ type: "status", id: "reconSpotterMark", damageTakenPercent: 12, turns: 2, debuff: true }],
      message: "{actor} designates {target} with SPOTTER MARK: incoming damage +12% (2 turns).",
    },
    {
      key: "precisionBurst", name: "Precision Burst", cost: 22, cooldown: 2, tags: ["Ranged"], targeting: "ally",
      effects: [{ type: "physicalHit", power: 1.5 }],
      message: "{actor} fires a PRECISION BURST at {target} for {damage} damage!",
    },
    {
      key: "spoofingManeuver", name: "Spoofing Maneuver", cost: 20, cooldown: 4, tags: ["Mobility"], targeting: "none",
      effects: [{ type: "statusSelf", id: "reconSpoofing", stat: "Evasion", amount: 20, turns: 2 }],
      message: "{actor} activates SPOOFING MANEUVER (+20 Evasion for 2 turns).",
    },
    {
      key: "targetingCascade", name: "Targeting Cascade", category: "Ultimate", cost: 50, cooldown: 6, tags: ["Recon", "Ultimate"], targeting: "ally",
      effects: [
        { type: "masteryHit", element: "Kinetic", power: 1.45 },
        { type: "status", id: "reconCascadeMark", damageTakenPercent: 18, turns: 2, debuff: true },
      ],
      message: "{actor} executes TARGETING CASCADE on {target}: {damage} Kinetic damage and incoming damage +18% (2 turns).",
    },
  ],
};
