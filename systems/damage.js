function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function priorityPercentMultiplier(statuses, field) {
  const values = Object.values(statuses || {})
    .map((status) => status[field])
    .filter(Number.isFinite);
  const positive = values.filter((value) => value > 0);
  const negative = values.filter((value) => value < 0);
  const strongestPositive = positive.length ? Math.max(...positive) : 0;
  const strongestNegative = negative.length ? Math.min(...negative) : 0;
  return Math.max(0, 1 + (strongestPositive + strongestNegative) / 100);
}

function markMultiplier(target) {
  return priorityPercentMultiplier(target.statuses, "damageTakenPercent");
}

function damageDealtMultiplier(attacker) {
  return priorityPercentMultiplier(attacker.statuses, "damageDealtPercent");
}

function mitigateReflectedDamage(target, amount, damageType, effectiveStat) {
  const defenseStat = damageType === "Physical" ? "DEF" : "RES";
  let damage = amount * 100 / (100 + effectiveStat(target, defenseStat));
  if (damageType !== "Physical") {
    damage *= 1 - clamp(target.stats.masteryResistance?.[damageType] || 0, 0, 100) / 100;
  }
  damage *= resistanceMultiplier(target, damageType);
  damage *= markMultiplier(target);
  return Math.max(1, Math.floor(damage));
}

// Adaptive Barrier: resistance to the one damage type the shield last absorbed.
function resistanceMultiplier(target, damageType) {
  const resistance = target.statuses.adaptiveResistance;
  return resistance && resistance.damageType === damageType
    ? 1 - resistance.amount / 100
    : 1;
}

function calculatePhysicalDamage(
  attacker,
  target,
  effectiveStat,
  power = 1,
  canCrit = true,
  random = Math.random,
) {
  let raw = effectiveStat(attacker, "ATK") * power * damageDealtMultiplier(attacker);
  const crit =
    canCrit && random() * 100 < (effectiveStat(attacker, "CritRate") + (target.statuses?.tacticalMark ? (attacker.statuses?.fullSpectrumCrit?.critVsMarked || 0) : 0));
  if (crit) raw *= 1.5;
  raw *= 100 / (100 + effectiveStat(target, "DEF"));
  raw *= resistanceMultiplier(target, "Physical");
  raw *= markMultiplier(target);
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
) {
  let raw =
    effectiveStat(attacker, "MPow") *
    power *
    damageDealtMultiplier(attacker) *
    (1 + (attacker.stats.masteryBonus?.[type] || 0) / 100);
  const crit =
    canCrit && random() * 100 < (effectiveStat(attacker, "CritRate") + (target.statuses?.tacticalMark ? (attacker.statuses?.fullSpectrumCrit?.critVsMarked || 0) : 0));
  if (crit) raw *= 1.5;
  raw *= 100 / (100 + effectiveStat(target, "RES"));
  raw *=
    1 -
    clamp(target.stats.masteryResistance?.[type] || 0, 0, 100) / 100;
  raw *= resistanceMultiplier(target, type);
  raw *= markMultiplier(target);
  return { damage: Math.max(1, Math.floor(raw)), crit };
}

module.exports = { calculatePhysicalDamage, calculateMasteryDamage, mitigateReflectedDamage };