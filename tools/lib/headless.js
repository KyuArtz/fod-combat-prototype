// Plays a complete battle with no terminal at all: controllers decide, the party
// order is given up front, and nothing is printed. Used by tests and dev tools.

const { createBattle } = require("../../core/battle");
const { createBasicAttackController } = require("../../core/controllers");
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
  const battle = createBattle({
    output: { log() {} },
    readinessScheduler: recording,
    seed,
    ...(openingInitiative ? { openingInitiative } : {}),
    ...(events ? { events } : {}),
    controllers: { player: createBasicAttackController(), ...controllers },
    partyOrder,
  });
  if (maxActive) battle.state.party.maxActive = maxActive;
  try {
    const result = await battle.run();
    return { result, picks, rounds: battle.state.round, state: battle.state, events: battle.events };
  } finally {
    battle.close();
  }
}

module.exports = { playHeadless, DEFAULT_PARTY_ORDER };
