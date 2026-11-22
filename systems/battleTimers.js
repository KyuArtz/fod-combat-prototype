// Generic battle-scoped timers and declarative actor turn-start reactions.
function timerTurns(timer) {
  if (typeof timer === "number") return timer;
  return Number.isFinite(timer?.turns) ? timer.turns : 0;
}

function isBattleTimerActive(state, key) {
  return timerTurns(state?.battleTimers?.[key]) > 0;
}

const TURN_START_HANDLERS = Object.freeze({
  healPercentMaxHP(actor, effect, { heal, ownerSide }) {
    const requiredSide = effect.side === "owner" ? ownerSide : effect.side;
    if (requiredSide && actor.side !== requiredSide) return;
    if (effect.excludeSummons && actor.summon) return;
    heal(actor, Math.floor((actor.stats.HP * effect.percentMaxHP) / 100));
  },
});

function processBattleTimerTurnStart(actor, state, context = {}) {
  if (!actor?.alive) return;
  for (const timer of Object.values(state.battleTimers || {})) {
    if (timerTurns(timer) <= 0) continue;
    for (const effect of timer?.turnStart || []) {
      const handler = TURN_START_HANDLERS[effect.handler];
      if (!handler) throw new Error(`Unknown battle-timer turnStart handler: ${effect.handler}`);
      handler(actor, effect, { ...context, ownerSide: timer.ownerSide });
    }
  }
}

function tickBattleTimers(state, ownerActorId) {
  state.battleTimers ||= {};
  for (const [key, timer] of Object.entries(state.battleTimers)) {
    const ownerScoped = Boolean(timer && typeof timer === "object" && timer.ownerId);
    // Unowned timers use global battle rounds; owner-scoped timers use the
    // owning actor's completed turns. They must never tick on both clocks.
    if (ownerActorId === undefined ? ownerScoped : (!ownerScoped || timer.ownerId !== ownerActorId)) continue;
    if (ownerScoped && timer.skipNextOwnerTurnEnd) {
      state.battleTimers[key] = { ...timer, skipNextOwnerTurnEnd: false };
      continue;
    }
    if (typeof timer === "number") {
      state.battleTimers[key] = Math.max(0, timer - 1);
    } else if (timer && Number.isFinite(timer.turns)) {
      state.battleTimers[key] = { ...timer, turns: Math.max(0, timer.turns - 1) };
    }
  }
}

module.exports = { timerTurns, isBattleTimerActive, processBattleTimerTurnStart, tickBattleTimers };
