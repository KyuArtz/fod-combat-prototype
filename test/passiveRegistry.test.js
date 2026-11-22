const test = require('node:test');
const assert = require('node:assert/strict');
const { createPassiveRegistry } = require('../systems/passives/registry');

test('passive events dispatch through declarative subscriptions, not character IDs', () => {
  const state = { actors: [] };
  const registry = createPassiveRegistry({ state, addStatus: (actor, id, data) => { actor.statuses[id] = data; } });
  const actor = {
    alive: true, stats: { HP: 100 }, statuses: { customRecoil: { stacks: 1 } },
    passive: { maxStacks: 2, damageThresholdPercent: 10, attackBonusPercent: 10, duration: 2, statusId: 'customRecoil',
      events: { damageTaken: [{ handler: 'recoilDampeners' }] } },
  };
  registry.dispatch(actor, 'damageTaken', { hpLoss: 11 });
  assert.deepEqual(actor.statuses.customRecoil, { stat: 'ATK', amount: 20, stacks: 2, turns: 2 });
});

test('passive registry supports extension handlers without editing runtime dispatch', () => {
  const registry = createPassiveRegistry({ state: { actors: [] } });
  let called = false;
  registry.register('designerHook', (actor, payload) => { called = payload.value === 42; });
  registry.dispatch({ passive: { events: { custom: [{ handler: 'designerHook' }] } } }, 'custom', { value: 42 });
  assert.equal(called, true);
});


test('timed passive modifiers use declared timer keys rather than character-specific fields', () => {
  const registry = createPassiveRegistry({ state: { actors: [] } });
  const actor = { passive: { events: {
    battleStart: [{ handler: 'startTimedPassive', timerKey: 'custom', turns: 2 }],
    turnEnd: [{ handler: 'tickTimedPassive', timerKey: 'custom' }],
  } } };
  registry.dispatch(actor, 'battleStart');
  assert.equal(actor.passiveTimers.custom, 2);
  registry.dispatch(actor, 'turnEnd');
  assert.equal(actor.passiveTimers.custom, 1);
});


test('summon owner reactions are dispatched from summon owner-event data', () => {
  const events = [];
  const registry = createPassiveRegistry({ state: { actors: [] } });
  const owner = { passive: { events: { summonDestroyed: [{ handler: 'ownerReaction' }] } } };
  registry.register('ownerReaction', (actor, payload) => events.push([actor, payload.summon.id]));
  registry.dispatch(owner, 'summonDestroyed', { summon: { id: 'wing' } });
  assert.deepEqual(events, [[owner, 'wing']]);
});

test('runtime routes summon destruction through declared owner events and keeps generic burst independent', () => {
  const { createRuntime } = require('../systems/passives/runtime');
  const owner = { id: 'owner', alive: true, passive: { events: { summonDestroyed: [{ handler: 'ownerReaction' }] } } };
  const state = { actors: [owner] };
  const logs = [];
  const runtime = createRuntime({
    state, say: (line) => logs.push(line), alive: (s, side) => s.actors.filter((unit) => unit.alive && unit.side === side),
    addStatus() {}, addShield() {}, applyDamage() {}, heal() {}, hitMastery() {}, hitPhysical() {}, makeActor() {},
  });
  let reacted = false;
  runtime.passiveRegistry.register('ownerReaction', (actor, payload) => { reacted = actor === owner && payload.summon.id === 'drone'; });
  runtime.summonDestroyed({ id: 'drone', name: 'Drone', side: 'ally', ownerId: 'owner',
    ownerEvents: { destroyed: [{ event: 'summonDestroyed' }] } });
  assert.equal(reacted, true);
  assert.deepEqual(logs, []);
});
