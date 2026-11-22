// Passive, summon, and actor-lifecycle behavior for declarative skill data.
const { formatMessage } = require("../../core/skillMessages");
const { emitCombatEvent } = require("../../core/combatEvents");
const { createSummonRegistry } = require("../summons/registry");
const { createPassiveRegistry } = require("./registry");
const { processTurnStartStatuses, processTurnStartStatusRefreshes, processUnitDefeatedStatusReactions, expireTurnStartStatuses } = require("../statusEffects");
const { processBattleTimerTurnStart, tickBattleTimers } = require("../battleTimers");

const pct = (value, percent) => Math.floor((value * percent) / 100);

function createRuntime(context) {
  const { addShield, addStatus, alive, applyDamage, heal, hitMastery, hitPhysical, makeActor, say, state, events } = context;
  const passiveRegistry = createPassiveRegistry(context);
  const summonRegistry = createSummonRegistry(context);

  function onBattleStart(actors) {
    for (const actor of actors) {
      passiveRegistry.dispatch(actor, "battleStart");
    }
  }

  function onTurnStart(actor) {
    expireTurnStartStatuses(actor);
    processTurnStartStatuses(actor, { applyDamage, say, state });
    if (!actor?.alive) return false;
    // DOT resolves before all healing-over-time and battle-timer recovery.
    for (const status of Object.values(actor.statuses || {})) {
      if (status.hotPercentMaxHP) heal(actor, pct(actor.stats.HP, status.hotPercentMaxHP));
    }
    processBattleTimerTurnStart(actor, state, { heal });
    passiveRegistry.dispatch(actor, "turnStart");
    processTurnStartStatusRefreshes(actor);
    return actor.alive;
  }

  function advanceOwnedSummons(owner) {
    for (const summon of state.actors.filter((unit) =>
      unit.alive && unit.summon && unit.ownerId === owner.id && unit.ownerTurnLifecycle)) {
      const lifecycle = summon.ownerTurnLifecycle;
      if (summon.skipNextOwnerTurnEnd) {
        summon.skipNextOwnerTurnEnd = false;
        continue;
      }
      summonRegistry.dispatch(summon, lifecycle.activation || []);
      summon.summonTurns--;
      if (summon.summonTurns <= 0) {
        summon.alive = false;
        say(formatMessage(lifecycle.expireMessage || "{actor}'s deployment expires.", { actor: summon.name }));
        emitCombatEvent(events, "ActorSummonExpired", {
          actorId: summon.id, ownerId: owner.id, side: summon.side, round: state.round,
        });
        for (const subscription of lifecycle.onExpire || []) summonRegistry.dispatch(summon, [subscription]);
      }
    }
  }

  function onTurnEnd(actor) {
    passiveRegistry.dispatch(actor, "turnEnd");
    advanceOwnedSummons(actor);
    tickBattleTimers(state, actor.id);
  }

  function onDamageTaken(target, amount, damageType, hpLoss = amount, metadata = {}) {
    target.damageTakenSinceLastTurn = true;
    passiveRegistry.dispatch(target, "damageTaken", { amount, damageType, hpLoss, ...metadata });
  }

  function onDamageDealt(actor, target, amount, damageType, metadata = {}) {
    if (!actor || !target) return;
    passiveRegistry.dispatch(actor, "damageDealt", { target, amount, damageType, ...metadata });
  }

  function onEvade(actor, attacker) {
    if (!actor) return;
    passiveRegistry.dispatch(actor, "evade", { attacker });
  }

  function onEnemySkillTargeted(attacker, target) {
    if (!target || !attacker || target.side === attacker.side) return;
    target.targetedByEnemySinceLastTurn = true;
    target.enemySkillTargetedThisRound = true;
  }

  function onRoundStart() {
    for (const actor of state.actors) {
      actor.enemySkillTargetedThisRound = false;
      actor.targetedByAllyId = null;
    }
  }

  function onUnitDefeated(unit, statuses = {}) {
    processUnitDefeatedStatusReactions(unit, statuses, { alive, state });
    // Owner-linked summons cannot remain as orphaned active units after their
    // owner is incapacitated. This is dismissal, not summon destruction: no
    // onDestroyed burst or owner-destroyed reaction is dispatched.
    for (const summon of state.actors.filter((candidate) =>
      candidate.alive && candidate.summon && candidate.ownerId === unit.id)) {
      summon.alive = false;
      summon.summonTurns = 0;
      say(`${summon.name} is dismissed because ${unit.name} is incapacitated.`);
      emitCombatEvent(events, "ActorSummonExpired", {
        actorId: summon.id, ownerId: unit.id, side: summon.side, round: state.round,
        reason: "owner-defeated",
      });
    }
  }

  // Summon behavior is described by each summon template and dispatched through
  // a reusable handler registry; the runtime owns only turn and lifecycle timing.
  function summonTurn(summon) {
    if (!summon.alive || summon.summonTurns <= 0) return;
    const lifecycle = summon.lifecycle || {};
    summonRegistry.dispatch(summon, lifecycle.activation || []);
    summon.summonTurns--;
    if (summon.summonTurns <= 0) {
      summon.alive = false;
      const expireMessage = lifecycle.expireMessage || "{actor}'s deployment expires.";
      say(formatMessage(expireMessage, { actor: summon.name }));
      summonRegistry.dispatch(summon, lifecycle.onExpire || []);
    }
  }

  function summonDestroyed(summon) {
    const owner = summon.ownerId
      ? state.actors.find((unit) => unit.id === summon.ownerId && unit.alive)
      : null;
    if (owner && summon.ownerEvents?.destroyed?.length) {
      for (const subscription of summon.ownerEvents.destroyed) {
        if (subscription.event) passiveRegistry.dispatch(owner, subscription.event, { summon });
      }
    }
    const burst = summon.onDestroyed;
    if (!burst) return;
    say(formatMessage(burst.message, { actor: summon.name }));
    const opposing = summon.side === "ally" ? "enemy" : "ally";
    for (const foe of alive(state, opposing)) {
      hitMastery(summon, foe, burst.element, burst.power, false);
      if (foe.alive) addStatus(foe, burst.status.id, { stat: burst.status.stat, amount: burst.status.amount, turns: burst.status.turns });
    }
  }

  return { onBattleStart, onTurnStart, onTurnEnd, onDamageTaken, onDamageDealt, onEvade, onEnemySkillTargeted, onRoundStart, onUnitDefeated, summonTurn, summonDestroyed, passiveRegistry, summonRegistry };
}

module.exports = { createRuntime };
