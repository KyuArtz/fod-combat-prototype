function addStatus(target, key, data) {
  if ((target.passive?.immunities || []).includes(key)) return false;
  // Stagger delays readiness rather than deleting the actor's next action.
  // Reapplication refreshes the marker but never pushes CR back a second time.
  if (key === "staggered" && !target.statuses.staggered && Number.isFinite(data.delayCR) && data.delayCR > 0) {
    target.cr = (Number.isFinite(target.cr) ? target.cr : 0) - data.delayCR;
  }
  target.statuses[key] = { ...data, ...(target._isTakingTurn ? { appliedDuringCurrentTurn: true } : {}) };
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
  let value = actor.stats[stat] || 0;
  for (const effect of Object.values(actor.statuses)) {
    if (effect.stat !== stat || !effect.amount) continue;
    if (stat === "Evasion") value += effect.amount;
    else value *= 1 + effect.amount / 100;
  }
  if (stat === "Evasion") {
    for (const effect of Object.values(actor.statuses)) value -= effect.evasionPenalty || 0;
  }
  // Passive stat modifiers can be permanent or gated by a generic passive timer.
  for (const mod of (actor.passive && actor.passive.statMods) || []) {
    if (mod.stat !== stat) continue;
    if (mod.timerKey && !(actor.passiveTimers?.[mod.timerKey] > 0)) continue;
    if (mod.when && !matchesModifierCondition(actor, mod.when)) continue;
    if (mod.points !== undefined) value += mod.points;
    else value *= 1 + mod.percent / 100;
  }
  return Math.floor(Math.max(0, value));
}

function processTurnStartStatuses(actor, { applyDamage, say }) {
  if (!actor?.alive) return;
  for (const status of Object.values(actor.statuses || {})) {
    const tick = status.turnStart;
    if (!tick || typeof tick !== "object") continue;
    const amount = status[tick.damageField];
    const damageType = status[tick.damageTypeField];
    if (!Number.isFinite(amount) || amount <= 0 || typeof damageType !== "string") continue;
    applyDamage(actor, amount, damageType);
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

function incomingAttackModifier(target, type) {
  return (target.passive?.incomingAttackMods || []).reduce((total, mod) => total + (mod.type === type ? mod.points || 0 : 0), 0);
}

module.exports = { addStatus, matchesModifierCondition, effectiveStat, incomingAttackModifier, processTurnStartStatuses, processTurnStartStatusRefreshes, processUnitDefeatedStatusReactions, tickStatuses };