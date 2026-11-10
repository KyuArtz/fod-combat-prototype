const { validateDecision } = require("./decisions");
const { buildTurnView, controllerKindOf, findByViewId } = require("./turnView");

// Runs one actor's turn: build a view, ask that actor's controller for a
// decision, validate it, then execute it. Controllers only decide; everything that
// changes the battle happens here, so a GUI, a simulator, a replay and the
// terminal menu are interchangeable.
//
// A controller is { chooseAction(view, { actor, rejection }) } (or just that
// function), returning a decision or a promise of one. Built-in controllers may use
// the engine-owned `actor`; UI controllers should rely on `view` alone.

const MAX_ATTEMPTS = 10;

function normalizeController(kind, controller) {
  if (typeof controller === "function") return { chooseAction: controller };
  if (controller && typeof controller.chooseAction === "function") return controller;
  throw new TypeError(`The ${kind} controller must be a function or have a chooseAction(view) method.`);
}

function createTurnRunner({
  state,
  events,
  controllers,
  skills,
  enemyAI,
  meoTurn,
  basicAttack,
  alive,
  ready,
  say,
  formation,
}) {
  const resolved = {
    player: normalizeController("player", controllers.player),
    enemy: normalizeController("enemy", controllers.enemy),
    summon: normalizeController("summon", controllers.summon),
  };

  function execute(actor, decision) {
    switch (decision.type) {
      case "basic": {
        const target = findByViewId(state, decision.targetId);
        if (!target) return false;
        if (actor.side === "enemy") return enemyAI.basicAttack(actor, target);
        basicAttack(actor, target);
        return true;
      }

      case "skill": {
        const skill = (skills[actor.id] || []).find((candidate) => candidate.key === decision.skillKey);
        if (!skill) return false;
        const target = decision.targetId === undefined ? undefined : findByViewId(state, decision.targetId);
        return skill.run(actor, { mode: decision.mode, target }) !== false;
      }

      case "enemySkill": {
        const target = decision.targetId === undefined ? undefined : findByViewId(state, decision.targetId);
        return enemyAI.useSkill(actor, decision.skillKey, target) !== false;
      }

      case "switch": {
        formation.removeIncapacitatedReserves(state.party);
        const reserveIndex = state.party.reserve.findIndex((member) => member.id === decision.reserveId);
        const activeIndex = state.party.active.findIndex((member) => member.id === decision.activeId);
        const switched = formation.switchPartyMember(state, reserveIndex, activeIndex);
        if (!switched.changed) return false;
        say(`${switched.incoming.name} joins the active formation!`);
        say(`${switched.outgoing.name} moves to reserve.`);
        return true;
      }

      case "summonAuto":
        meoTurn(actor);
        return true;

      case "pass":
        return true;

      default:
        return false;
    }
  }

  async function runTurn(actor) {
    const kind = controllerKindOf(actor);
    if (!kind) return;
    const controller = resolved[kind];
    // Reserves are never attacked, so this is normally a no-op; it keeps the party
    // lists tidy before the player sees or chooses from them.
    if (kind === "player") formation.removeIncapacitatedReserves(state.party);

    let rejection = null;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const view = buildTurnView({
        state,
        actor,
        skills,
        describeEnemySkills: enemyAI.describeSkills,
        ready,
        alive,
      });
      const decision = await controller.chooseAction(view, { actor, rejection });

      const check = validateDecision(view, decision);
      if (!check.ok) {
        rejection = { reason: check.reason };
        events.emit("DecisionRejected", { actorId: view.actor.id, kind, reason: check.reason, decision });
        continue;
      }

      events.emit("ActionChosen", { actorId: view.actor.id, kind, round: state.round, decision });
      if ((await execute(actor, decision)) === false) {
        rejection = { reason: "action-failed" };
        events.emit("DecisionRejected", { actorId: view.actor.id, kind, reason: "action-failed", decision });
        continue;
      }
      return;
    }
    throw new Error(
      `The ${kind} controller for ${actor.name} did not produce a valid action after ${MAX_ATTEMPTS} attempts (last problem: ${rejection && rejection.reason}).`,
    );
  }

  return { runTurn, execute };
}

module.exports = { createTurnRunner, normalizeController };
