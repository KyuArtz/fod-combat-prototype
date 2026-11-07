const {
  calculateMasteryDamage,
  calculatePhysicalDamage,
} = require("../systems/damage");

function createActionResolver({ state, effectiveStat, applyDamage, say }) {
  const calculatePhysical = (attacker, target, power = 1, canCrit = true) =>
    calculatePhysicalDamage(
      attacker,
      target,
      (actor, stat) => effectiveStat(actor, stat),
      power,
      canCrit,
    );

  const calculateMastery = (
    attacker,
    target,
    type,
    power = 1,
    canCrit = true,
  ) =>
    calculateMasteryDamage(
      attacker,
      target,
      type,
      (actor, stat) => effectiveStat(actor, stat),
      power,
      canCrit,
    );

  function hitPhysical(attacker, target, power = 1, canCrit = true) {
    const outcome = calculatePhysical(attacker, target, power, canCrit);
    applyDamage(target, outcome.damage);
    return outcome;
  }

  function hitMastery(attacker, target, type, power = 1, canCrit = true) {
    const outcome = calculateMastery(
      attacker,
      target,
      type,
      power,
      canCrit,
    );
    applyDamage(target, outcome.damage);
    say(
      `  ${target.name} takes ${outcome.damage} ${type} damage${outcome.crit ? " (CRIT)" : ""}.`,
    );
    return outcome;
  }

  function basicAttack(actor, target) {
    const outcome = hitPhysical(actor, target);
    say(
      `${actor.name} attacks ${target.name} for ${outcome.damage} Physical damage${outcome.crit ? " (CRIT)" : ""}.`,
    );
  }

  return {
    calculatePhysical,
    calculateMastery,
    hitPhysical,
    hitMastery,
    basicAttack,
  };
}

module.exports = { createActionResolver };