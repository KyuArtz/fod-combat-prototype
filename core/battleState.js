function createBattleState() {
  return {
    actors: [],
    round: 1,
    schedulerTicks: 0,
    scheduler: null, // threshold scheduler bookkeeping, created lazily
    singularityTurns: 0,
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