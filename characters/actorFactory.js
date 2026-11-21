function makeActor(data) {
  if (!data || !data.stats) {
    throw new Error("Invalid actor data: missing stats.");
  }

  return {
    ...data,
    stats: { ...data.stats },
    hp: data.stats.HP,
    mp: data.stats.MP,
    alive: true,
    shields: [],
    statuses: {},
    passiveTimers: {},
    cooldowns: {},
    summon: data.summon || false,
    summonTurns: data.summonTurns || 0,
    discount: false,
    mpDiscount: 0,
    nextAttackAccuracy: 0,
    _isTakingTurn: false,
    targetedByAllyId: null,
    targetedByEnemySinceLastTurn: false,
    enemySkillTargetedThisRound: false,
    passiveFlags: { ...(data.passive?.initialFlags || {}) },
    cr: 0,
  };
}

module.exports = { makeActor };
