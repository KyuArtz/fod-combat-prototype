const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveEffectApplication } = require('../systems/effectSusceptibility');

const alwaysFail = () => 0.999999;
const alwaysPass = () => 0;

function target(overrides = {}) {
  return { id: 'target', capabilities: [], passive: {}, statuses: {}, ...overrides };
}

test('undeclared capabilities are neutral unless a requirement is explicitly authored', () => {
  const result = resolveEffectApplication(target(), { id: 'slow', effectTags: ['debuff:slow'], chance: 100, turns: 2 }, alwaysFail);
  assert.equal(result.eligible, true);
  assert.equal(result.applied, true);
  assert.equal(result.reason, 'applied');
});

test('required capabilities use all-of matching', () => {
  const actor = target({ capabilities: ['mechanical'] });
  const blocked = resolveEffectApplication(actor, { requiredCapabilities: ['mechanical', 'electronic-systems'] });
  assert.equal(blocked.eligible, false);
  assert.equal(blocked.reason, 'missing-required-capability');
  const allowed = resolveEffectApplication(target({ capabilities: ['mechanical', 'electronic-systems'] }), { requiredCapabilities: ['mechanical', 'electronic-systems'] });
  assert.equal(allowed.eligible, true);
});

test('requiredAnyCapabilities uses any-of matching', () => {
  const result = resolveEffectApplication(target({ capabilities: ['organic'] }), { requiredAnyCapabilities: ['organic', 'synthetic'] });
  assert.equal(result.eligible, true);
  const blocked = resolveEffectApplication(target(), { requiredAnyCapabilities: ['organic', 'synthetic'] });
  assert.equal(blocked.reason, 'missing-any-required-capability');
});

test('excluded capabilities block explicitly incompatible actors', () => {
  const result = resolveEffectApplication(target({ capabilities: ['electronic-systems'] }), { excludedCapabilities: ['electronic-systems'] });
  assert.equal(result.eligible, false);
  assert.equal(result.reason, 'excluded-capability');
});

test('explicit immunity can match effect ID or effect tag', () => {
  assert.equal(resolveEffectApplication(target({ passive: { immunities: ['blind'] } }), { id: 'blind' }).reason, 'explicit-immunity');
  assert.equal(resolveEffectApplication(target({ passive: { effectImmunities: ['control:stun'] } }), { effectTags: ['control:stun'] }).reason, 'explicit-immunity');
});

test('effect resistance reduces proc chance but does not modify damage channels', () => {
  const actor = target({ statuses: { ward: { effectResistancePercent: 40, turns: 2 } } });
  const result = resolveEffectApplication(actor, { effectTags: ['debuff:slow'], chance: 80 }, alwaysFail);
  assert.equal(result.chance, 48);
  assert.equal(result.applied, false);
  assert.equal(result.reason, 'resisted');
});

test('tag-filtered effect resistance applies only to matching tags', () => {
  const actor = target({ statuses: { ward: { effectResistancePercent: 50, effectTags: ['control:stun'] } } });
  assert.equal(resolveEffectApplication(actor, { effectTags: ['control:stun'], chance: 100 }).chance, 50);
  assert.equal(resolveEffectApplication(actor, { effectTags: ['debuff:slow'], chance: 100 }).chance, 100);
});

test('control resistance is separate from generic effect resistance', () => {
  const actor = target({ statuses: { ward: { controlResistancePercent: 25 } } });
  assert.equal(resolveEffectApplication(actor, { effectTags: ['control:stun'], chance: 80 }).chance, 60);
  assert.equal(resolveEffectApplication(actor, { effectTags: ['debuff:slow'], chance: 80 }).chance, 80);
});

test('control duration reduction is separate from proc chance', () => {
  const actor = target({ statuses: { ward: { controlDurationReduction: 2 } } });
  const result = resolveEffectApplication(actor, { effectTags: ['control:immobilize'], chance: 100, turns: 4 }, alwaysPass);
  assert.equal(result.chance, 100);
  assert.equal(result.duration, 2);
  const short = resolveEffectApplication(actor, { effectTags: ['control:stun'], chance: 100, turns: 1 }, alwaysPass);
  assert.equal(short.duration, 1);
});

test('control duration reduction is tag-filtered and capped at zero reduction', () => {
  const actor = target({ statuses: { ward: { controlDurationReduction: 4, effectTags: ['control:stun'] } } });
  assert.equal(resolveEffectApplication(actor, { effectTags: ['control:stun'], turns: 3 }).duration, 1);
  assert.equal(resolveEffectApplication(actor, { effectTags: ['control:immobilize'], turns: 3 }).duration, 3);
});

test('zero chance never applies and 100 chance skips RNG', () => {
  let calls = 0;
  const random = () => { calls++; return 0; };
  assert.equal(resolveEffectApplication(target(), { chance: 0 }, random).applied, false);
  assert.equal(resolveEffectApplication(target(), { chance: 100 }, random).applied, true);
  assert.equal(calls, 0);
});

test('malformed capability/tag arrays throw TypeError', () => {
  assert.throws(() => resolveEffectApplication(target(), { requiredCapabilities: 'organic' }), TypeError);
  assert.throws(() => resolveEffectApplication(target(), { effectTags: [''] }), TypeError);
  assert.throws(() => resolveEffectApplication(target(), { excludedCapabilities: [4] }), TypeError);
});

test('chance resolution supports an injected deterministic RNG', () => {
  const result = resolveEffectApplication(target(), { chance: 35, effectTags: ['control:stagger'] }, () => 0.34);
  assert.equal(result.roll, 34);
  assert.equal(result.applied, true);
  const blocked = resolveEffectApplication(target(), { chance: 35, effectTags: ['control:stagger'] }, () => 0.35);
  assert.equal(blocked.applied, false);
});
