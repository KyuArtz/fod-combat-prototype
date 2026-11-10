// Ready-made controllers for headless play, tests and replays. Each follows the
// controller contract: chooseAction(view, { actor, rejection }) -> decision.

const { createRngState, nextFloat } = require("./rng");

// Plays back a recorded list of decisions. Entries may be bare decisions or
// { actorId, decision } (as produced by createDecisionRecorder). If an entry names
// an actor, it must be that actor's turn, otherwise the replay has drifted and an
// error says where.
function createScriptedController(entries) {
  const queue = [...entries];
  let consumed = 0;
  return {
    chooseAction(view) {
      if (!queue.length) {
        throw new Error(`Scripted controller ran out of decisions at ${view.actor.name}'s turn (used ${consumed}).`);
      }
      const entry = queue.shift();
      consumed++;
      if (entry && entry.decision && entry.actorId !== undefined && entry.actorId !== view.actor.id) {
        throw new Error(
          `Replay desync at decision ${consumed}: expected ${entry.actorId}'s turn but it is ${view.actor.id}'s.`,
        );
      }
      return entry && entry.decision ? entry.decision : entry;
    },
    remaining: () => queue.length,
  };
}

// Always a basic attack on the first living target. The simplest "player".
function createBasicAttackController() {
  return {
    chooseAction(view) {
      const basic = view.actions.find((action) => action.type === "basic");
      return { type: "basic", targetId: basic.targets[0] };
    },
  };
}

// Picks uniformly among legal actions using its OWN seeded generator, so it never
// disturbs the battle's random sequence. Switching party members is off by default.
function createRandomController({ seed = 1, allowSwitch = false } = {}) {
  const rng = createRngState(seed);
  const pick = (items) => items[Math.floor(nextFloat(rng) * items.length)];
  return {
    chooseAction(view) {
      const options = [];
      for (const action of view.actions) {
        if (action.type === "basic" && action.targets.length) {
          options.push(() => ({ type: "basic", targetId: pick(action.targets) }));
        } else if ((action.type === "skill" || action.type === "enemySkill") && action.usable) {
          if (action.targeting === "mode") {
            for (const mode of action.modes) {
              if (mode.targeting === "none" || mode.targets.length) {
                options.push(() => ({
                  type: action.type,
                  skillKey: action.key,
                  mode: mode.id,
                  ...(mode.targeting === "none" ? {} : { targetId: pick(mode.targets) }),
                }));
              }
            }
          } else if (action.targeting === "none") {
            options.push(() => ({ type: action.type, skillKey: action.key }));
          } else if (action.targets.length) {
            options.push(() => ({ type: action.type, skillKey: action.key, targetId: pick(action.targets) }));
          }
        } else if (action.type === "switch" && allowSwitch) {
          const reserves = action.reserves.filter((member) => member.alive);
          if (reserves.length && action.active.length) {
            options.push(() => ({ type: "switch", reserveId: pick(reserves).id, activeId: pick(action.active).id }));
          }
        } else if (action.type === "summonAuto" || action.type === "pass") {
          options.push(() => ({ type: action.type }));
        }
      }
      return pick(options)();
    },
  };
}

// Records what is needed to replay a battle exactly: the seed (from the battle),
// the chosen formation, and every accepted player decision.
function createDecisionRecorder(events) {
  const recording = { formation: null, decisions: [], all: [] };
  events.on("FormationSelected", (event) => {
    recording.formation = [...event.ids];
  });
  events.on("ActionChosen", (event) => {
    const entry = { actorId: event.actorId, decision: structuredClone(event.decision) };
    recording.all.push({ ...entry, kind: event.kind });
    if (event.kind === "player") recording.decisions.push(entry);
  });
  return recording;
}

module.exports = {
  createBasicAttackController,
  createDecisionRecorder,
  createRandomController,
  createScriptedController,
};
