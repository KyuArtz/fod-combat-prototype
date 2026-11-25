const { nextFloat } = require("./rng");
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
  onEvade = () => {},
  symmetricEvasion = false,
}) {

  const calculatePhysical = (attacker, target, power = 1, canCrit = true) =>
    calculatePhysicalDamage(
      attacker,
      target,
      (actor, stat) => effectiveStat(actor, stat),
      power,
      canCrit,
      random,
    );

  const calculateMastery = (
    attacker,
    target,
    type,
    power = 1,
    canCrit = true,
    scalingStat = "MPow",
    critRateBonus = 0,
  ) =>
    calculateMasteryDamage(
      attacker,
      target,
      type,
      (actor, stat) => effectiveStat(actor, stat),
      power,
      canCrit,
      random,
      scalingStat,
      critRateBonus,
    );

  function accuracyMiss(attacker, target, ignoreAccuracy = false) {
    const bonus = attacker.nextAttackAccuracy || 0;
    if (bonus <= 0) return false;
    attacker.nextAttackAccuracy = 0;
    if (ignoreAccuracy) return false;
    const baseEvasion = (target.side === "ally" || symmetricEvasion)
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
    applyDamage(target, outcome.damage, "Physical", attacker, {
      kind: options.kind || "direct",
      ...(options.actionType ? { actionType: options.actionType } : {}),
      ...(options.skillKey ? { skillKey: options.skillKey } : {}),
    });
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
      options.scalingStat || "MPow",
      options.critRateBonus || 0,
    );
    applyDamage(target, outcome.damage, type, attacker, {
      kind: options.kind || "direct",
      ...(options.actionType ? { actionType: options.actionType } : {}),
      ...(options.skillKey ? { skillKey: options.skillKey } : {}),
    });
    say(
      `  ${target.name} takes ${outcome.damage} ${type} damage${outcome.crit ? " (CRIT)" : ""}.`,
    );
    return outcome;
  }

  // PvE preserves its historical player-side defensive reactions. Faction-vs-
  // faction duels opt into symmetricEvasion so both sides use identical Evasion
  // checks and Retaliation behavior without changing ordinary PvE replay streams.
  function basicAttack(actor, target) {
    if (!actor || !target) return false;

    if (target.side === "ally" || symmetricEvasion || actor.nextAttackAccuracy > 0) {
      let dodge = effectiveStat(target, "Evasion");
      dodge -= actor.nextAttackAccuracy || 0;
      dodge += incomingAttackModifier(target, "evasion");
      dodge += Object.values(actor.statuses || {}).reduce((sum, status) => sum + (Number(status.accuracyPenalty) || 0), 0);
      dodge = Math.max(0, Math.min(75, dodge));
      // Preserve the historic enemy-vs-ally RNG draw. Symmetric evasion is an
      // opt-in for faction-vs-faction testing, so existing PvE replay streams
      // remain unchanged by default.
      const shouldRoll = target.side === "ally" || symmetricEvasion || dodge > 0;
      actor.nextAttackAccuracy = 0;
      if (shouldRoll && random() * 100 < dodge) {
        say(`${actor.name} attacks ${target.name}, but ${target.name} evades!`);
        onEvade(target, actor);
        return true;
      }
    }

    const retaliation = (target.side === "ally" || symmetricEvasion) && target.statuses.retaliation;
    const nextAttackBonus = consumeNextAttackDamageModifier(actor);
    const outcome = hitPhysical(actor, target, 1, true, { damageMultiplier: 1 + nextAttackBonus / 100, actionType: "basic" });
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