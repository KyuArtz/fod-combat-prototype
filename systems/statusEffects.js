function addStatus(target, key, data) {
  target.statuses[key] = { ...data };
}

function effectiveStat(state, actor, stat) {
  let value = actor.stats[stat] || 0;
  for (const effect of Object.values(actor.statuses)) {
    if (effect.stat !== stat || !effect.amount) continue;
    if (stat === "Evasion") value += effect.amount;
    else value *= 1 + effect.amount / 100;
  }
  if (stat === "SPD" && state.singularityTurns > 0 && actor.side === "ally") {
    value *= 1.1;
  }
  return Math.floor(Math.max(0, value));
}

function tickStatuses(actor) {
  for (const key of Object.keys(actor.statuses)) {
    const effect = actor.statuses[key];
    if (!Number.isFinite(effect.turns)) continue;
    effect.turns--;
    if (effect.turns <= 0) delete actor.statuses[key];
  }
}

module.exports = { addStatus, effectiveStat, tickStatuses };