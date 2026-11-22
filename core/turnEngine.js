const { emitCombatEvent } = require("./combatEvents");
const { createEventBus } = require("./eventBus");
const { tickBattleTimers } = require("../systems/battleTimers");
function removeInactiveSummons(state) {
  const activeActors = state.actors.filter(
    (actor) =>
      !actor.summon ||
      (actor.alive && Number.isFinite(actor.summonTurns) && actor.summonTurns > 0),
  );
  const removedCount = state.actors.length - activeActors.length;
  state.actors = activeActors;
  return removedCount;
}

function createTurnEngine(context) {
  const {
    getResult,
    heal,
    output,
    takeTurn,
    playerTurn,
    enemyTurn,
    meoTurn,
    showStatus,
    state,
    tickCooldowns,
    tickShields,
    tickStatuses,
    combatReadiness,
    onTurnStart = () => {},
    onTurnEnd = () => {},
    onRoundStart = () => {},
    say = () => {},
    events = createEventBus(),
  } = context;

  function turnStart(actor) {
    actor._isTakingTurn = true;
    const staggered = Boolean(actor.statuses.staggered);
    const actionDelayed = Boolean(actor.statuses.actionDelay);
    if (staggered) {
      delete actor.statuses.staggered;
      say(`${actor.name}'s next action was delayed by Stagger.`);
    }
    if (actionDelayed) delete actor.statuses.actionDelay;
    emitCombatEvent(events, "TurnStarted", { actorId: actor.id, side: actor.side, round: state.round, staggered });
    actor.mp = Math.min(
      actor.stats.MP,
      actor.mp + Math.ceil(actor.stats.MP * 0.05),
    );
    tickCooldowns(actor);
    const survivedStartEffects = onTurnStart(actor);
    return actionDelayed || survivedStartEffects === false || !actor.alive;
  }

  function getNextActor() {
    return combatReadiness.nextActor(state, context.effectiveStat);
  }

  function completeRoundIfReady(actedThisRound) {
    const deployed = state.actors.filter((actor) => actor.alive && !actor.passiveSummon);
    if (
      !deployed.length ||
      !deployed.every((actor) => actedThisRound.has(actor))
    ) {
      return false;
    }
    tickBattleTimers(state);
    emitCombatEvent(events, "RoundEnded", { round: state.round });
    state.round++;
    emitCombatEvent(events, "RoundStarted", { round: state.round });
    onRoundStart();
    actedThisRound.clear();
    showStatus(state, output);
    return true;
  }

  async function runRounds() {
    const actedThisRound = new Set();
    output.log(`\n========== ROUND ${state.round} ==================================================================\n`);
    emitCombatEvent(events, "RoundStarted", { round: state.round });
    onRoundStart();
    while (true) {
      removeInactiveSummons(state);
      if (getResult()) break;
      const actor = getNextActor();
      if (!actor) break;

      const actionSkipped = turnStart(actor);
      if (!actor.alive) {
        say(`${actor.name} is incapacitated by an ongoing effect before acting.`);
      } else if (actionSkipped) say(`${actor.name} is action-delayed and loses this action!`);
      else {
        // Controller-driven turn: view -> decision -> validate -> execute.
        if (takeTurn) await takeTurn(actor);
        else if (actor.side === "ally" && !actor.summon) await playerTurn(actor);
        else if (actor.side === "enemy") await enemyTurn(actor);
        else if (actor.summon) meoTurn(actor);
      }

      // Statuses and shields expire after the affected actor has completed their
      // turn, so a duration of N grants N full actor turns after application.
      tickStatuses(actor);
      tickShields(actor);
      actor._isTakingTurn = false;
      if (actor.alive) onTurnEnd(actor);
      emitCombatEvent(events, "TurnEnded", { actorId: actor.id, side: actor.side, round: state.round });
      combatReadiness.resetCR(actor);
      actedThisRound.add(actor);
      removeInactiveSummons(state);
      if (completeRoundIfReady(actedThisRound)) {
        if (!getResult()) {
          output.log(
            `\n========== ROUND ${state.round} ==================================================================`,
          );
        }
      }
    }
  }

  return { getNextActor, runRounds, turnStart };
}

module.exports = { createTurnEngine, removeInactiveSummons };