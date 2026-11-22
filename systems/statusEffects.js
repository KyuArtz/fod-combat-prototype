function addStatus(target, key, data) {
  if ((target.passive?.immunities || []).includes(key)) return false;
  // Stagger delays readiness rather than deleting the actor's next action.
  // Reapplication refreshes the marker but never pushes CR back a second time.
  if (key === "staggered" && !target.statuses.staggered && Number.isFinite(data.delayCR) && data.delayCR > 0) {
    target.cr = (Number.isFinite(target.cr) ? target.cr : 0) - data.delayCR;
  }
  const existing = target.statuses[key];
  let next = { ...data };
  if (existing && !data.stackable) {
    // Global stacking rule: reapplying one effect refreshes its duration but
    // cannot silently change its strength. Explicitly stackable effects opt in.
    const strengthFields = [
      "amount", "stat", "damageTakenPercent", "damageDealtPercent", "damageReflectionPercent",
      "evasionPenalty", "hotPercentMaxHP", "dotDamage", "nextAttackDamagePercent", "shieldPercent",
    ];
    for (const field of strengthFields) {
      if (existing[field] !== undefined && next[field] !== undefined) next[field] = existing[field];
    }
    if (existing.stackable) next.stackable = true;
  }
  target.statuses[key] = {
    ...(existing || {}),
    ...next,
    ...(target._isTakingTurn ? { appliedDuringCurrentTurn: true } : {}),
  };
  return true;
}

function matchesModifierCondition(actor, condition = {}) {
  if (condition.flag && Boolean(actor.passiveFlags?.[condition.flag]) !== Boolean(condition.equals)) return false;
  for (const item of condition.andFlags || []) {
    if (Boolean(actor.passiveFlags?.[item.flag] ?? actor[item.flag]) !== Boolean(item.equals)) return false;
  }
  return true;
}

function effectiveStat(state, actor, stat) {
  const positive = [];
  const negative = [];
  const isPointsStat = stat === "Evasion";
  const addModifier = (amount) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    (amount > 0 ? positive : negative).push(amount);
  };

  for (const effect of Object.values(actor.statuses || {})) {
    if (effect.stat === stat) addModifier(effect.amount);
    // Evasion penalties are point reductions and share the same priority rule
    // as explicit Evasion buffs/debuffs.
    if (stat === "Evasion" && Number.isFinite(effect.evasionPenalty)) {
      addModifier(-Math.abs(effect.evasionPenalty));
    }
  }

  // Passive stat modifiers follow the same global priority rule as status modifiers.
  for (const mod of (actor.passive && actor.passive.statMods) || []) {
    if (mod.stat !== stat) continue;
    if (mod.timerKey && !(actor.passiveTimers?.[mod.timerKey] > 0)) continue;
    if (mod.when && !matchesModifierCondition(actor, mod.when)) continue;
    if (mod.points !== undefined) addModifier(mod.points);
    else if (mod.percent !== undefined) addModifier(mod.percent);
  }

  const strongestPositive = positive.length ? Math.max(...positive) : 0;
  const strongestNegative = negative.length ? Math.min(...negative) : 0;
  const netModifier = strongestPositive + strongestNegative;
  let value = actor.stats[stat] || 0;
  if (isPointsStat) value += netModifier;
  else value *= 1 + netModifier / 100;
  return Math.floor(Math.max(0, value));
}

function processTurnStartStatuses(actor, { applyDamage, say, state }) {
  if (!actor?.alive) return;
  for (const status of Object.values(actor.statuses || {})) {
    const tick = status.turnStart;
    if (!tick || typeof tick !== "object") continue;
    const amount = status[tick.damageField];
    const damageType = status[tick.damageTypeField];
    if (!Number.isFinite(amount) || amount <= 0 || typeof damageType !== "string") continue;
    const sourceActor = status.sourceId
      ? state?.actors?.find((unit) => unit.id === status.sourceId) || null
      : null;
    applyDamage(actor, amount, damageType, sourceActor, { kind: "dot" });
    if (tick.message) {
      say(tick.message
        .replaceAll("{actor}", actor.name)
        .replaceAll("{damage}", String(amount))
        .replaceAll("{damageType}", damageType));
    }
  }
}


function processTurnStartStatusRefreshes(actor) {
  if (!actor?.alive) return;
  for (const status of Object.values(actor.statuses || {})) {
    const refresh = status.turnStartRefresh;
    if (!refresh || typeof refresh !== "object") continue;
    const baseAmount = status[refresh.baseAmountField];
    const conditionalAmount = status[refresh.conditionalAmountField];
    const thresholdPercent = status[refresh.hpThresholdPercentField];
    if (!Number.isFinite(baseAmount) || !Number.isFinite(thresholdPercent)) continue;
    const bonus = Number.isFinite(conditionalAmount) ? conditionalAmount : 0;
    status[refresh.amountField] = baseAmount + (actor.hp / actor.stats.HP > thresholdPercent / 100 ? bonus : 0);
  }
}

const UNIT_DEFEATED_STATUS_REACTIONS = Object.freeze({
  restoreMpToLivingAllies(status, reaction, context) {
    const { alive, state } = context;
    if (typeof alive !== "function" || !state) throw new Error("restoreMpToLivingAllies requires alive() and state");
    for (const ally of alive(state, reaction.side || "ally").filter((member) => !reaction.excludeSummons || !member.summon)) {
      const amount = Math.floor((ally.stats.MP * reaction.percentMaxMP) / 100);
      ally.mp = Math.min(ally.stats.MP, ally.mp + amount);
    }
  },
});

function processUnitDefeatedStatusReactions(unit, statuses = {}, context = {}) {
  for (const status of Object.values(statuses)) {
    const reaction = status?.onUnitDefeated;
    if (!reaction || typeof reaction !== "object") continue;
    if (reaction.once && status.defeatReactionClaimed) continue;
    const handler = UNIT_DEFEATED_STATUS_REACTIONS[reaction.handler];
    if (!handler) throw new Error(`Unknown unit-defeated status reaction: ${reaction.handler}`);
    handler(status, reaction, context, unit);
    if (reaction.once) status.defeatReactionClaimed = true;
  }
}

function expireTurnStartStatuses(actor) {
  if (!actor?.alive) return;
  for (const [key, effect] of Object.entries(actor.statuses || {})) {
    if (effect.expireAtTurnStart) delete actor.statuses[key];
  }
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

function consumeNextAttackDamageModifier(actor) {
  const candidates = Object.entries(actor?.statuses || {})
    .filter(([, status]) => Number.isFinite(status.nextAttackDamagePercent) && status.nextAttackDamagePercent > 0)
    .sort((left, right) => right[1].nextAttackDamagePercent - left[1].nextAttackDamagePercent);
  if (!candidates.length) return 0;
  const [statusId, status] = candidates[0];
  delete actor.statuses[statusId];
  return status.nextAttackDamagePercent;
}

function incomingAttackModifier(target, type) {
  return (target.passive?.incomingAttackMods || []).reduce((total, mod) => total + (mod.type === type ? mod.points || 0 : 0), 0);
}

module.exports = { addStatus, matchesModifierCondition, effectiveStat, incomingAttackModifier, processTurnStartStatuses, processTurnStartStatusRefreshes, processUnitDefeatedStatusReactions, expireTurnStartStatuses, tickStatuses, consumeNextAttackDamageModifier };