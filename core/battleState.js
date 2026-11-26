const { createRngState } = require("./rng");
const { createIncomingPressureTelemetry } = require("./incomingPressureTelemetry");

function createBattleState({ seed } = {}) {
  return {
    rng: createRngState(seed), // seeded RNG, plain data so it clones with the state
    actors: [],
    round: 1,
    schedulerTicks: 0,
    scheduler: null, // threshold scheduler bookkeeping, created lazily
    battleTimers: {},
    incomingPressureTelemetry: createIncomingPressureTelemetry(),
    lastAllyTargetedEnemyId: null,
    log: [],
    party: {
      roster: [],
      active: [],
      reserve: [],
      maxActive: 5,
    },
    enemyParty: {
      roster: [],
      active: [],
      reserve: [],
      maxActive: 5,
    },
  };
}

module.exports = { createBattleState };