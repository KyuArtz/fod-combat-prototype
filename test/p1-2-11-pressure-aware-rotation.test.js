const test = require('node:test');
const assert = require('node:assert/strict');
const { pressurePolicy, POLICY } = require('../tools/experiments/p1-2-11-pressure-aware-rotation');
function view({ pressure = 0, reserveHp = 1, actorHp = 0.3 } = {}) {
  const actor = { id: 'verra', hp: 300 * actorHp, maxHp: 300, incomingPressure: { recentDamage: pressure } };
  return { actor, actions: [{ type: 'switch', active: [{ id: 'verra', alive: true }], reserves: [{ id: 'reserve', alive: true, hp: reserveHp * 300, maxHp: 300 }] }] };
}
test('pressure policy requires Verra, threshold damage, and an eligible healthy reserve', () => {
  assert.equal(pressurePolicy(view({ pressure: 60 })), true);
  assert.equal(pressurePolicy(view({ pressure: 59 })), false);
  assert.equal(pressurePolicy(view({ pressure: 60, reserveHp: 0.64 })), false);
  const otherActor = view({ pressure: 90 }); otherActor.actor.id = 'kane';
  assert.equal(pressurePolicy(otherActor), false);
  assert.equal(POLICY.baseRotationThreshold, 0.16);
  assert.equal(POLICY.elevatedRotationThreshold, 0.22);
});
