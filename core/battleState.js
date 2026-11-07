function createBattleState() {
  return {
    actors: [],
    round: 1,
    schedulerTicks: 0,
    singularityTurns: 0,
    log: [],
    party: {
      roster: [],
      active: [],
      reserve: [],
      maxActive: 3,
    },
    enemyParty: {
      roster: [],
      active: [],
      reserve: [],
      maxActive: 3,
    },
  };
}

module.exports = { createBattleState };