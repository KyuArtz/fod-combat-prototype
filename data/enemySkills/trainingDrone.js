// Declarative enemy skill data. Values preserve the original prototype behavior.
module.exports = {
  characterId: "trainingDrone",
  skills: [
    {
      key: "pulseShot", name: "Pulse Shot", cost: 0, cooldown: 3, tags: ["Ranged"],
      targeting: "ally", effects: [{ type: "physicalHit", power: 1.35, canCrit: false }],
      message: "{actor} fires PULSE SHOT at {target} for {damage} damage!",
    },
  ],
};
