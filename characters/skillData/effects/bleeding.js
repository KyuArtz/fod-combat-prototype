// Shared Phantom Bleeding specification.
// Initial balance value: 0.15 x the applier's ATK as Anomaly damage per tick.
// It resolves at the affected unit's turn start for two turns.
const BLEEDING_TICK_POWER = 0.15;

function createBleedingEffect(overrides = {}) {
  return {
    type: "damageOverTime",
    id: "bleeding",
    element: "Anomaly",
    power: BLEEDING_TICK_POWER,
    scalingStat: "ATK",
    turns: 2,
    onlyHitTargets: true,
    turnStart: {
      damageField: "dotDamage",
      damageTypeField: "damageType",
      message: "{actor} takes {damage} Anomaly damage from Bleeding.",
    },
    ...overrides,
  };
}

module.exports = { BLEEDING_TICK_POWER, createBleedingEffect };
