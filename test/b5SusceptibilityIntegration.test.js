const test = require('node:test');
const assert = require('node:assert/strict');
const { createDefaultEffectHandlers } = require('../systems/effects/defaultHandlers');
const { validateSkillData } = require('../core/skillDataValidation');

function makeHandlers({ target, enemies = [target], random = () => 0.25, damage = 30 } = {}) {
  const state = { actors: [], enemies };
  const added = [];
  const context = {
    state,
    random,
    alive: (_state, side) => side === 'enemy' ? enemies.filter((unit) => unit.alive !== false) : [],
    addStatus(unit, id, data) {
      unit.statuses ||= {};
      unit.statuses[id] = { ...data };
      added.push({ unit, id, data: { ...data } });
      return true;
    },
    hitMastery: (_actor, unit) => { unit.hp -= damage; return { damage, miss: false }; },
    calculateMastery: () => ({ damage }),
    applyDamage(unit, amount) { unit.hp -= amount; },
    effectiveStat: (_actor, stat) => stat === 'MPow' ? 100 : 100,
    consumeNextAttackDamageModifier: () => 0,
    consumeNextSkillDamageModifier: () => 0,
    consumeNextSkillPowerModifier: () => 0,
    heal: () => 0,
    addShield: () => {},
    makeActor: () => ({}),
    say: () => {},
  };
  return { handlers: createDefaultEffectHandlers(context), state, added };
}

test('B5 migrated Poison susceptibility can reject the status without undoing preceding direct damage', () => {
  const target = { id: 'mechanical-target', hp: 100, alive: true, capabilities: ['mechanical', 'electronic-systems'], statuses: {
    biologicalToxinResistance: { effectResistancePercent: 100, effectTags: ['biological-toxin'], turns: 2 },
  } };
  const { handlers } = makeHandlers({ target, damage: 35 });
  const run = { actor: { id: 'attacker', name: 'Attacker', side: 'ally', statuses: {} }, target, skill: { key: 'test' }, results: {}, after: [] };
  handlers.masteryHit({ type: 'masteryHit', element: 'Energy', power: 1, scalingStat: 'MPow' }, run);
  assert.equal(target.hp, 65, 'direct damage is retained');
  handlers.damageOverTime({ type: 'damageOverTime', id: 'poison', element: 'Toxic', power: 0.2, turns: 2, susceptibility: { effectTags: ['biological-toxin'] } }, run);
  assert.equal(target.statuses.poison, undefined, 'resisted Poison is not stored');
});

test('B5 migrated Poison applies when its matching effect resistance leaves a successful deterministic chance', () => {
  const target = { id: 'target', hp: 100, alive: true, statuses: {
    toxinResistance: { effectResistancePercent: 50, effectTags: ['biological-toxin'], turns: 2 },
  } };
  const { handlers, added } = makeHandlers({ target, random: () => 0.25 });
  handlers.damageOverTime({ type: 'damageOverTime', id: 'poison', element: 'Toxic', power: 0.2, turns: 2, susceptibility: { effectTags: ['biological-toxin'] } }, {
    actor: { id: 'source', side: 'ally', stats: { MPow: 100 } }, target, results: { missed: false },
  });
  assert.ok(target.statuses.poison);
  assert.deepEqual(target.statuses.poison.effectTags, ['biological-toxin']);
  assert.equal(target.statuses.poison.turns, 2);
  assert.equal(added.length, 1);
});

test('B5 migrated Stagger uses control resistance and duration reduction independently', () => {
  const target = { id: 'target', alive: true, statuses: {
    controlGuard: { controlResistancePercent: 50, controlDurationReduction: 1, effectTags: ['control:stagger'], turns: 2 },
  } };
  const { handlers } = makeHandlers({ target, enemies: [target], random: () => 0.2 });
  handlers.statusEnemies({ type: 'statusEnemies', id: 'staggered', turns: 2, delayCR: 20, debuff: true,
    susceptibility: { effectTags: ['control:stagger'] } }, {
    actor: { id: 'source', side: 'ally' }, target, results: { hitTargetIds: [target.id] },
  });
  assert.ok(target.statuses.staggered, 'the 40% final chance succeeds on injected roll 20');
  assert.equal(target.statuses.staggered.turns, 1, 'duration reduction is applied after proc succeeds');
  assert.deepEqual(target.statuses.staggered.effectTags, ['control:stagger']);
});

test('B5 susceptibility capability gates are enforced while untagged legacy statuses bypass the resolver', () => {
  const target = { id: 'neutral', alive: true, capabilities: [], statuses: { effectGuard: { effectResistancePercent: 100, turns: 2 } } };
  const { handlers } = makeHandlers({ target, enemies: [target], random: () => 0 });
  handlers.status({ type: 'status', id: 'gatedStatus', turns: 2, susceptibility: {
    effectTags: ['test:capability-gate'], requiredCapabilities: ['electronic-systems'],
  } }, { actor: {}, target, results: {} });
  assert.equal(target.statuses.gatedStatus, undefined, 'capability mismatch blocks opt-in effect');
  handlers.status({ type: 'status', id: 'legacyStatus', turns: 2 }, { actor: {}, target, results: {} });
  assert.ok(target.statuses.legacyStatus, 'legacy untagged status remains unaffected by effect resistance');
});

test('B5 skill validation rejects malformed susceptibility metadata', () => {
  const data = { characterId: 'test', skills: [{ key: 'bad', name: 'Bad', cost: 0, cooldown: 0, tags: [], targeting: 'enemy', effects: [
    { type: 'status', id: 'badStatus', turns: 1, susceptibility: { effectTags: 'not-an-array', chance: 150 } },
  ] }] };
  assert.throws(() => validateSkillData(data), /susceptibility metadata/);
});

test('B5 automatic 100% migrated applications do not consume the injected RNG stream', () => {
  let draws = 0;
  const target = { id: 'target', alive: true, capabilities: [], statuses: {} };
  const { handlers } = makeHandlers({ target, random: () => { draws++; return 0.5; } });
  handlers.status({ type: 'status', id: 'guaranteedTagged', turns: 2, susceptibility: {
    effectTags: ['test:guaranteed'], chance: 100,
  } }, { actor: {}, target, results: {} });
  assert.ok(target.statuses.guaranteedTagged);
  assert.equal(draws, 0);
});

test('B5 migration is limited to shared Poison and Lucaz Stagger data', () => {
  const { createPoisonEffect } = require('../characters/skillData/effects/poison');
  const lucaz = require('../characters/skillData/lucaz');
  assert.deepEqual(createPoisonEffect().susceptibility, { effectTags: ['biological-toxin'] });
  const staggerEffects = lucaz.skills.flatMap((skill) => skill.effects).filter((effect) => effect.id === 'staggered');
  assert.equal(staggerEffects.length, 2, 'both existing Lucaz Stagger applications are migrated');
  for (const effect of staggerEffects) assert.deepEqual(effect.susceptibility, { effectTags: ['control:stagger'] });
});
