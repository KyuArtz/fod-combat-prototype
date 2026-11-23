const test = require("node:test");
const assert = require("node:assert/strict");
const { addStatus, tickStatuses } = require("../systems/statusEffects");
const { addShield, tickShields } = require("../systems/shields");
const { createFalconWorld } = require("./helpers/falconWorld");

test("status and shield durations grant the full number of actor turns after application", () => {
  const world = createFalconWorld();
  const actor = world.byId.zenki;
  actor._isTakingTurn = true;

  addStatus(actor, "twoTurnBuff", { stat: "ATK", amount: 10, turns: 2 });
  addShield(actor, 100, 2);
  tickStatuses(actor);
  tickShields(actor);

  assert.equal(actor.statuses.twoTurnBuff.turns, 2, "application during the current turn does not consume duration");
  assert.equal(actor.shields[0].turns, 2);

  actor._isTakingTurn = false;
  tickStatuses(actor);
  tickShields(actor);
  assert.equal(actor.statuses.twoTurnBuff.turns, 1);
  assert.equal(actor.shields[0].turns, 1);

  tickStatuses(actor);
  tickShields(actor);
  assert.equal(actor.statuses.twoTurnBuff, undefined);
  assert.equal(actor.shields.length, 0);
});
