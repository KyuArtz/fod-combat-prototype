const { nextFloat } = require("./rng");
const { isBattleTimerActive } = require("../systems/battleTimers");
const {
  calculateMasteryDamage,
  calculatePhysicalDamage,
} = require("../systems/damage");
const { consumeNextAttackDamageModifier } = require("../systems/statusEffects");

function createActionResolver({
  state,
  effectiveStat,
  applyDamage,
  say,
  random = () => nextFloat(state.rng),
  incomingAttackModifier = () => 0,
}) {
  // Summon scan bonuses: while an owned summon is alive, the owner's damage
  // to enemies is increased (more during Singularity). Several summons do not stack.
  function damageBonus(attacker, target) {
    if (attacker.side === target.side) return 1;
    let best = 0;
    for (const unit of state.actors) {
      if (!unit.alive || !unit.summon || unit.ownerId !== attacker.id || !unit.scan) continue;
      const conditionalBonus = (unit.scan.conditionalBonuses || []).reduce((total, modifier) =>
        total + (isBattleTimerActive(state, modifier.battleTimer) ? modifier.damageBonus || 0 : 0), 0);
      const bonus = unit.scan.damageBonus + conditionalBonus;
      best = Math.max(best, bonus);
    }
    return 1 + best / 100;
  }

  const calculatePhysical = (attacker, target, power = 1, canCrit = true) =>
    calculatePhysicalDamage(
      attacker,
      target,
      (actor, stat) => effectiveStat(actor, stat),
      power,
      canCrit,
      random,
      damageBonus(attacker, target),
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
      random,
      damageBonus(attacker, target),
    );

  function accuracyMiss(attacker, target, ignoreAccuracy = false) {
    const bonus = attacker.nextAttackAccuracy || 0;
    if (bonus <= 0) return false;
    attacker.nextAttackAccuracy = 0;
    if (ignoreAccuracy) return false;
    const baseEvasion = target.side === "ally"
      ? effectiveStat(target, "Evasion")
      : (target.stats.Evasion || 0);
    const evasion = Math.max(0, Math.min(75, baseEvasion - bonus));
    if (evasion > 0 && random() * 100 < evasion) {
      say(`${attacker.name}'s attack misses ${target.name} (Accuracy bonus applied).`);
      return true;
    }
    return false;
  }

  function hitPhysical(attacker, target, power = 1, canCrit = true, options = {}) {
    if (accuracyMiss(attacker, target, options.ignoreAccuracy)) return { damage: 0, crit: false, miss: true };
    const outcome = calculatePhysical(attacker, target, power * (options.damageMultiplier || 1), canCrit);
    applyDamage(target, outcome.damage, "Physical", attacker, { kind: options.kind || "direct" });
    return outcome;
  }

  function hitMastery(attacker, target, type, power = 1, canCrit = true, options = {}) {
    if (accuracyMiss(attacker, target, options.ignoreAccuracy)) return { damage: 0, crit: false, miss: true };
    const outcome = calculateMastery(
      attacker,
      target,
      type,
      power,
      canCrit,
    );
    applyDamage(target, outcome.damage, type, attacker, { kind: options.kind || "direct" });
    say(
      `  ${target.name} takes ${outcome.damage} ${type} damage${outcome.crit ? " (CRIT)" : ""}.`,
    );
    return outcome;
  }

  // One execution path for every basic attack. Defensive reactions are currently
  // an ally-side rule: enemy attacks check the target's Evasion and can trigger
  // Retaliation. Player attacks retain their historical behavior (no enemy dodge
  // roll or retaliation proc), preserving balance and seeded replay sequences.
  function basicAttack(actor, target) {
    if (!actor || !target) return false;

    if (target.side === "ally" || actor.nextAttackAccuracy > 0) {
      let dodge = target.side === "ally" ? effectiveStat(target, "Evasion") : (target.stats.Evasion || 0);
      dodge -= actor.nextAttackAccuracy || 0;
      if (target.side === "ally") dodge += incomingAttackModifier(target, "evasion");
      dodge = Math.max(0, Math.min(75, dodge));
      // Preserve the historic enemy-vs-ally RNG draw. Accuracy bonuses also
      // consume their next-attack token when the target has no evasion to beat.
      const shouldRoll = target.side === "ally" || dodge > 0;
      actor.nextAttackAccuracy = 0;
      if (shouldRoll && random() * 100 < dodge) {
        say(`${actor.name} attacks ${target.name}, but ${target.name} evades!`);
        return true;
      }
    }

    const retaliation = target.side === "ally" && target.statuses.retaliation;
    const nextAttackBonus = consumeNextAttackDamageModifier(actor);
    const outcome = hitPhysical(actor, target, 1, true, { damageMultiplier: 1 + nextAttackBonus / 100 });
    say(
      `${actor.name} attacks ${target.name} for ${outcome.damage} Physical damage${outcome.crit ? " (CRIT)" : ""}.`,
    );

    if (retaliation && target.alive && actor.alive) {
      const counterDamage = Math.max(
        1,
        Math.floor((outcome.damage * retaliation.amount) / 100),
      );
      applyDamage(actor, counterDamage, "Physical", target, { kind: "counter", allowReflection: false });
      say(
        `${target.name} retaliates against ${actor.name} for ${counterDamage} damage!`,
      );
    }
    return true;
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