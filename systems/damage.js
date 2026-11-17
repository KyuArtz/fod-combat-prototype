function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function markMultiplier(target) {
  return Object.values(target.statuses || {}).reduce(
    (multiplier, status) =>
      multiplier * (1 + (status.damageTakenPercent || 0) / 100),
    1,
  );
}

function damageDealtMultiplier(attacker) {
  return Object.values(attacker.statuses || {}).reduce(
    (multiplier, status) =>
      multiplier * (1 + (status.damageDealtPercent || 0) / 100),
    1,
  );
}

// Adaptive Barrier: resistance to the one damage type the shield last absorbed.
function resistanceMultiplier(target, damageType) {
  const resistance = target.statuses.adaptiveResistance;
  return resistance && resistance.damageType === damageType
    ? 1 - resistance.amount / 100
    : 1;
}

// bonusMultiplier: extra damage from effects outside the target's own statuses,
// for example Meo-9's scan (computed by the action resolver).
function calculatePhysicalDamage(
  attacker,
  target,
  effectiveStat,
  power = 1,
  canCrit = true,
  random = Math.random,
  bonusMultiplier = 1,
) {
  let raw =
    effectiveStat(attacker, "ATK") * power * damageDealtMultiplier(attacker);
  const crit =
    canCrit &&
    random() * 100 <
      effectiveStat(attacker, "CritRate") +
        (target.statuses?.tacticalMark
          ? attacker.statuses?.fullSpectrumCrit?.critVsMarked || 0
          : 0);
  if (crit) raw *= 1.5;
  raw *= 100 / (100 + effectiveStat(target, "DEF"));
  raw *= resistanceMultiplier(target, "Physical");
  raw *= markMultiplier(target);
  raw *= bonusMultiplier;
  return { damage: Math.max(1, Math.floor(raw)), crit };
}

function calculateMasteryDamage(
  attacker,
  target,
  type,
  effectiveStat,
  power = 1,
  canCrit = true,
  random = Math.random,
  bonusMultiplier = 1,
) {
  let raw =
    effectiveStat(attacker, "MPow") *
    power *
    damageDealtMultiplier(attacker) *
    (1 + (attacker.stats.masteryBonus?.[type] || 0) / 100);
  const crit =
    canCrit &&
    random() * 100 <
      effectiveStat(attacker, "CritRate") +
        (target.statuses?.tacticalMark
          ? attacker.statuses?.fullSpectrumCrit?.critVsMarked || 0
          : 0);
  if (crit) raw *= 1.5;
  raw *= 100 / (100 + effectiveStat(target, "RES"));
  raw *= 1 - clamp(target.stats.masteryResistance?.[type] || 0, 0, 100) / 100;
  raw *= resistanceMultiplier(target, type);
  raw *= markMultiplier(target);
  raw *= bonusMultiplier;
  return { damage: Math.max(1, Math.floor(raw)), crit };
}

module.exports = { calculatePhysicalDamage, calculateMasteryDamage };
