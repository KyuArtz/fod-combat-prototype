module.exports = {
  characterId: "trainingDrone",
  skills: [
    {
      key: "pulseShot", name: "Pulse Shot", cost: 18, cooldown: 2, tags: ["Ranged"], targeting: "ally",
      effects: [{ type: "physicalHit", power: 1.3, canCrit: false }],
      message: "{actor} fires PULSE SHOT at {target} for {damage} damage!",
    },
    {
      key: "kineticBurst", name: "Kinetic Burst", cost: 24, cooldown: 3, tags: ["Kinetic"], targeting: "ally",
      effects: [{ type: "masteryHit", element: "Kinetic", power: 0.95 }],
      message: "{actor} releases a KINETIC BURST at {target} for {damage} Kinetic damage!",
    },
    {
      key: "evasiveThrusters", name: "Evasive Thrusters", cost: 20, cooldown: 4, tags: ["Mobility"], targeting: "none",
      effects: [{ type: "statusSelf", id: "droneEvasiveThrusters", stat: "Evasion", amount: 18, turns: 2 }],
      message: "{actor} activates EVASIVE THRUSTERS (+18 Evasion for 2 turns).",
    },
    {
      key: "overclockedShot", name: "Overclocked Shot", category: "Ultimate", cost: 48, cooldown: 6, tags: ["Ranged", "Ultimate"], targeting: "ally",
      effects: [{ type: "physicalHit", power: 1.9, canCrit: false }],
      message: "{actor} unleashes an OVERCLOCKED SHOT at {target} for {damage} damage!",
    },
  ],
};
