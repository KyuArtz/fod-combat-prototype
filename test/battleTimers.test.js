const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isBattleTimerActive,
  processBattleTimerTurnStart,
  tickBattleTimers,
} = require("../systems/battleTimers");

test("battle-timer reactions are declarative, side-scoped and exclude configured summons", () => {
  const state = {
    battleTimers: {
      singularity: {
        turns: 2,
        turnStart: [{ handler: "healPercentMaxHP", percentMaxHP: 5, side: "ally", excludeSummons: true }],
      },
      expired: {
        turns: 0,
        turnStart: [{ handler: "healPercentMaxHP", percentMaxHP: 50, side: "ally" }],
      },
    },
  };
  const heals = [];
  const heal = (actor, amount) => heals.push([actor.id, amount]);
  const ally = { id: "ally", side: "ally", alive: true, hp: 50, stats: { HP: 101 } };
  const enemy = { id: "enemy", side: "enemy", alive: true, hp: 50, stats: { HP: 101 } };
  const summon = { id: "summon", side: "ally", summon: true, alive: true, hp: 50, stats: { HP: 101 } };

  assert.equal(isBattleTimerActive(state, "singularity"), true);
  assert.equal(isBattleTimerActive(state, "expired"), false);
  processBattleTimerTurnStart(ally, state, { heal });
  processBattleTimerTurnStart(enemy, state, { heal });
  processBattleTimerTurnStart(summon, state, { heal });

  assert.deepEqual(heals, [["ally", 5]], "5% of Max HP is floored and only a living non-summon ally receives it");
});

test("battle timers decrement once when a round completes and preserve their reaction contract", () => {
  const state = {
    battleTimers: {
      singularity: {
        turns: 1,
        turnStart: [{ handler: "healPercentMaxHP", percentMaxHP: 5, side: "ally", excludeSummons: true }],
      },
    },
  };
  tickBattleTimers(state);
  assert.equal(state.battleTimers.singularity.turns, 0);
  assert.equal(isBattleTimerActive(state, "singularity"), false);
  assert.deepEqual(state.battleTimers.singularity.turnStart, [
    { handler: "healPercentMaxHP", percentMaxHP: 5, side: "ally", excludeSummons: true },
  ]);
});
