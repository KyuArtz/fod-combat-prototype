// Plays a complete battle with no terminal at all: controllers decide, the party
// order is given up front, and nothing is printed. Used by tests and dev tools.

const { createBattle } = require("../../core/battle");
const { createBasicAttackController, createRandomController } = require("../../core/controllers");
const { createTacticalFalconController } = require("../../ai/falconTactics");
const { createCoordinatedFalconController } = require("../../ai/falconTacticsV2");
const { createEventBus } = require("../../core/eventBus");
const threshold = require("../../systems/thresholdCombatReadiness");

// Matches the old scripted "1" policy's formation (Zenki, Elishia, Jazen, Evalete, Zackry).
const DEFAULT_PARTY_ORDER = ["zenki", "elishia", "jazen", "evalete", "zackry"];

async function playHeadless({
  seed,
  scheduler = threshold,
  openingInitiative,
  controllers = {},
  partyOrder = DEFAULT_PARTY_ORDER,
  maxActive,
  events,
  policy = "basic",
  policySeed = 1,
  encounter = "trainingGround",
  onEncounterComplete,
} = {}) {
  const picks = [];
  const recording = {
    ...scheduler,
    nextActor(state, stat) {
      const actor = scheduler.nextActor(state, stat);
      if (actor) picks.push(actor);
      return actor;
    },
  };
  const playerController = controllers.player || (
    policy === "basic"
      ? createBasicAttackController()
      : policy === "random"
        ? createRandomController({ seed: policySeed })
        : policy === "tactical"
          ? createTacticalFalconController()
          : policy === "coordinated"
            ? createCoordinatedFalconController()
            : null
  );
  if (!playerController) throw new TypeError(`Unknown headless policy "${policy}". Use "basic", "random", "tactical" or "coordinated".`);
  const eventBus = events || createEventBus({ record: true });
  const battle = createBattle({
    output: { log() {} },
    readinessScheduler: recording,
    seed,
    ...(openingInitiative ? { openingInitiative } : {}),
    events: eventBus,
    controllers: { player: playerController, ...controllers },
    partyOrder,
    encounter,
    ...(onEncounterComplete ? { onEncounterComplete } : {}),
  });
  if (maxActive !== undefined) {
    if (!Number.isInteger(maxActive) || maxActive < 1 || maxActive > 5) {
      battle.close();
      throw new RangeError("maxActive must be an integer from 1 to 5.");
    }
    // Formation setup occurs inside battle.run(); set the limit beforehand so
    // setupFormation creates a genuine active/reserve split.
    battle.state.party.maxActive = maxActive;
  }
  try {
    const result = await battle.run();
    return { result, picks, rounds: battle.state.round, state: battle.state, events: battle.events };
  } finally {
    battle.close();
  }
}

module.exports = { playHeadless, DEFAULT_PARTY_ORDER };
