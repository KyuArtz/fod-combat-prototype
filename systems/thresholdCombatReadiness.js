const { MAX_CR, adjustCR, resetCR } = require("./combatReadiness");

const EPSILON = 1e-10;

function actorKey(actor) {
  if (actor.id) return `${actor.side || ""}:${actor.id}`;
  if (actor.name) return `${actor.side || ""}:${actor.name}`;
  return `${actor.side || ""}:${JSON.stringify(actor.stats || {})}`;
}

function compareActors(left, right) {
  const leftKey = actorKey(left);
  const rightKey = actorKey(right);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
}

function createThresholdScheduler({ onDiagnostic } = {}) {
  const schedulerStates = new WeakMap();

  function getSchedulerState(state) {
    let schedulerState = schedulerStates.get(state);
    if (!schedulerState) {
      schedulerState = { time: 0, tieCursor: 0, readyQueue: [] };
      schedulerStates.set(state, schedulerState);
    }
    return schedulerState;
  }

  function diagnose(event) {
    if (typeof onDiagnostic === "function") onDiagnostic(event);
  }

  function enqueueUntrackedReady(schedulerState, deployed) {
    const queued = new Set(schedulerState.readyQueue.map((entry) => entry.actor));
    const untracked = deployed.filter(
      (actor) => actor.cr >= MAX_CR && !queued.has(actor),
    );
    untracked.sort(compareActors);
    for (const actor of untracked) {
      schedulerState.readyQueue.push({
        actor,
        readyAt: schedulerState.time,
      });
    }
  }

  function advanceCR(state, effectiveStat) {
    const schedulerState = getSchedulerState(state);
    const deployed = state.actors.filter((actor) => actor.alive);
    if (!deployed.length) return [];

    const speeds = new Map(
      deployed.map((actor) => {
        if (!Number.isFinite(actor.cr)) {
          throw new TypeError("Actor CR must be a finite number.");
        }
        const speed = effectiveStat(actor, "SPD");
        return [actor, Number.isFinite(speed) && speed > 0 ? speed : 0];
      }),
    );
    const timeToReady = new Map();
    for (const actor of deployed) {
      if (actor.cr < MAX_CR && speeds.get(actor) > 0) {
        timeToReady.set(
          actor,
          (MAX_CR - actor.cr) / speeds.get(actor),
        );
      }
    }
    const timesToReady = [...timeToReady.values()];
    if (!timesToReady.length) return [];

    const elapsedTime = Math.min(...timesToReady);
    const tolerance = EPSILON * Math.max(1, elapsedTime);
    for (const actor of deployed) {
      const speed = speeds.get(actor);
      if (speed <= 0) continue;
      actor.cr += speed * elapsedTime;
      if (actor.cr >= MAX_CR - EPSILON) actor.cr = Math.max(actor.cr, MAX_CR);
    }

    schedulerState.time += elapsedTime;
    state.schedulerTicks = (state.schedulerTicks || 0) + 1;
    const crossingTogether = deployed.filter(
      (actor) =>
        timeToReady.has(actor) &&
        Math.abs(timeToReady.get(actor) - elapsedTime) <= tolerance,
    );

    crossingTogether.sort(compareActors);
    if (crossingTogether.length > 1) {
      const offset = schedulerState.tieCursor % crossingTogether.length;
      crossingTogether.push(...crossingTogether.splice(0, offset));
      schedulerState.tieCursor =
        (schedulerState.tieCursor + 1) % crossingTogether.length;
    }

    const queued = new Set(schedulerState.readyQueue.map((entry) => entry.actor));
    for (const actor of crossingTogether) {
      if (!queued.has(actor)) {
        schedulerState.readyQueue.push({
          actor,
          readyAt: schedulerState.time,
        });
      }
    }

    diagnose({
      type: "advance",
      timeAdvanced: elapsedTime,
      actors: deployed.map((actor) => ({
        actor: actor.name || actor.id || actorKey(actor),
        cr: actor.cr,
        effectiveSPD: speeds.get(actor),
      })),
      simultaneous: crossingTogether.length > 1,
    });
    return crossingTogether;
  }

  function nextActor(state, effectiveStat) {
    while (true) {
      const deployed = state.actors.filter((actor) => actor.alive);
      if (!deployed.length) return null;

      const deployedSet = new Set(deployed);
      const schedulerState = getSchedulerState(state);
      schedulerState.readyQueue = schedulerState.readyQueue.filter(
        ({ actor }) => deployedSet.has(actor) && actor.cr >= MAX_CR,
      );
      enqueueUntrackedReady(schedulerState, deployed);

      if (schedulerState.readyQueue.length) {
        const selected = schedulerState.readyQueue.shift();
        diagnose({
          type: "selection",
          actor: selected.actor.name || selected.actor.id || actorKey(selected.actor),
          simultaneous:
            schedulerState.readyQueue.some(
              (entry) => entry.readyAt === selected.readyAt,
            ),
          readyAt: selected.readyAt,
        });
        return selected.actor;
      }

      if (
        !deployed.some((actor) => {
          const speed = effectiveStat(actor, "SPD");
          return Number.isFinite(speed) && speed > 0;
        })
      ) {
        throw new Error(
          "Cannot schedule a turn: all deployed units have zero or invalid SPD.",
        );
      }
      advanceCR(state, effectiveStat);
    }
  }

  return { advanceCR, nextActor, adjustCR, resetCR };
}

const defaultScheduler = createThresholdScheduler();

module.exports = {
  MAX_CR,
  ...defaultScheduler,
  createThresholdScheduler,
};
