function addStatus(target, key, data) {
  if ((target.passive?.immunities || []).includes(key)) return false;
  target.statuses[key] = {
    ...data,
    ...(target._isTakingTurn ? { appliedDuringCurrentTurn: true } : {}),
  };
  return true;
}

function effectiveStat(state, actor, stat) {
  let value = actor.stats[stat] || 0;
  for (const effect of Object.values(actor.statuses)) {
    if (effect.stat !== stat || !effect.amount) continue;
    if (stat === "Evasion") value += effect.amount;
    else value *= 1 + effect.amount / 100;
  }
  if (
    stat === "Evasion" &&
    actor.passive?.id === "unobserved" &&
    !actor.unobservedSuppressed &&
    !actor.enemySkillTargetedThisRound
  ) {
    value += actor.passive.evasionWhileUnobserved || 0;
  }
  if (stat === "Evasion") {
    for (const effect of Object.values(actor.statuses))
      value -= effect.evasionPenalty || 0;
  }
  // Elishia's Biotech Overdrive is a timed battle-start passive (three of her turns).
  if (
    actor.passive?.id === "biotechOverdrive" &&
    actor.biotechOverdriveTurns > 0
  ) {
    const modifier = actor.passive.battleStartBuffs?.find(
      (entry) => entry.stat === stat,
    );
    if (modifier) {
      if (stat === "Evasion") value += modifier.amount;
      else value *= 1 + modifier.amount / 100;
    }
  }
  // Generic passive stat modifiers remain available for future actors.
  for (const mod of (actor.passive && actor.passive.statMods) || []) {
    if (mod.stat !== stat) continue;
    if (mod.points !== undefined) value += mod.points;
    else value *= 1 + mod.percent / 100;
  }
  return Math.floor(Math.max(0, value));
}

function tickStatuses(actor) {
  for (const key of Object.keys(actor.statuses)) {
    const effect = actor.statuses[key];
    if (effect.appliedDuringCurrentTurn) {
      delete effect.appliedDuringCurrentTurn;
      continue;
    }
    if (!Number.isFinite(effect.turns)) continue;
    effect.turns--;
    if (effect.turns <= 0) delete actor.statuses[key];
  }
}

module.exports = { addStatus, effectiveStat, tickStatuses };
