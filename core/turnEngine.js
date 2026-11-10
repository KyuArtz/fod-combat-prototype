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
  } = context;

  function turnStart(actor) {
    actor.mp = Math.min(
      actor.stats.MP,
      actor.mp + Math.ceil(actor.stats.MP * 0.05),
    );
    tickCooldowns(actor);
    tickStatuses(actor);
    tickShields(actor);
    if (state.singularityTurns > 0 && actor.side === "ally") {
      heal(actor, Math.floor((actor.stats.HP * 5) / 100));
    }
  }

  function getNextActor() {
    return combatReadiness.nextActor(state, context.effectiveStat);
  }

  function completeRoundIfReady(actedThisRound) {
    const deployed = state.actors.filter((actor) => actor.alive);
    if (
      !deployed.length ||
      !deployed.every((actor) => actedThisRound.has(actor))
    ) {
      return false;
    }
    if (state.singularityTurns > 0) state.singularityTurns--;
    state.round++;
    actedThisRound.clear();
    showStatus(state, output);
    return true;
  }

  async function runRounds() {
    const actedThisRound = new Set();
    output.log(`\n========== ROUND ${state.round} ==================================================================\n`);
    while (true) {
      removeInactiveSummons(state);
      if (getResult()) break;
      const actor = getNextActor();
      if (!actor) break;

      turnStart(actor);
      if (takeTurn) {
        // Controller-driven turn: view -> decision -> validate -> execute.
        await takeTurn(actor);
      } else if (actor.side === "ally" && !actor.summon) {
        await playerTurn(actor);
      } else if (actor.side === "enemy") {
        await enemyTurn(actor);
      } else if (actor.summon) {
        meoTurn(actor);
      }

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