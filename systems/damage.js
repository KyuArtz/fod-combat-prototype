function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function markMultiplier(target) {
  const mark = target.statuses.tacticalMark;
  return mark ? 1 + mark.amount / 100 : 1;
}

function calculatePhysicalDamage(
  attacker,
  target,
  effectiveStat,
  power = 1,
  canCrit = true,
  random = Math.random,
) {
  let raw = effectiveStat(attacker, "ATK") * power;
  const crit =
    canCrit && random() * 100 < (attacker.stats.CritRate || 0);
  if (crit) raw *= 1.5;
  raw *= 100 / (100 + effectiveStat(target, "DEF"));
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
    (1 + (attacker.stats.masteryBonus?.[type] || 0) / 100);
  const crit =
    canCrit && random() * 100 < (attacker.stats.CritRate || 0);
  if (crit) raw *= 1.5;
  raw *= 100 / (100 + effectiveStat(target, "RES"));
  raw *=
    1 -
    clamp(target.stats.masteryResistance?.[type] || 0, 0, 100) / 100;
  raw *= markMultiplier(target);
  return { damage: Math.max(1, Math.floor(raw)), crit };
}

module.exports = { calculatePhysicalDamage, calculateMasteryDamage };