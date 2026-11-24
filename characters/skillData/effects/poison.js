// Shared Serpent Poison specification.
// Standard Poison is 0.20 x the applier's Mpow; Verra's passive strengthens it to 0.25.
function createPoisonEffect({ power = 0.2, turns = 2, message = "{actor} takes {damage} Toxic damage from Poison." } = {}) {
  return {
    type: "damageOverTime",
    id: "poison",
    element: "Toxic",
    power,
    scalingStat: "MPow",
    turns,
    onlyHitTargets: true,
    turnStart: {
      damageField: "dotDamage",
      damageTypeField: "damageType",
      message,
    },
  };
}

module.exports = { createPoisonEffect };
