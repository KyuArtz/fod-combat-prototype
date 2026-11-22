const test = require("node:test");
const assert = require("node:assert/strict");
const { createActionResolver } = require("../core/actionResolver");
const { makeActor } = require("../characters/actorFactory");

function actor(id, side, overrides = {}) {
  return makeActor({
    id,
    name: id,
    side,
    stats: {
      HP: 500,
      MP: 0,
      ATK: 100,
      MPow: 50,
      DEF: 0,
      RES: 0,
      CritRate: 0,
      Evasion: 0,
      ...overrides,
    },
  });
}

function harness({ rolls = [0.99, 0.99], symmetricEvasion = false } = {}) {
  const state = { actors: [], battleTimers: {}, rng: {} };
  const damage = [];
  const messages = [];
  let rollIndex = 0;
  const resolver = createActionResolver({
    state,
    effectiveStat: (unit, stat) => unit.stats[stat] || 0,
    applyDamage: (target, amount, type) => damage.push({ target, amount, type }),
    say: (message) => messages.push(message),
    random: () => rolls[rollIndex++] ?? 0.99,
    symmetricEvasion,
  });
  return { resolver, state, damage, messages, rollsUsed: () => rollIndex };
}

test("shared basic attack preserves enemy evasion and consumes its roll before crit", () => {
  const h = harness({ rolls: [0.5] });
  const enemy = actor("drone", "enemy");
  const ally = actor("zenki", "ally", { Evasion: 75 });
  h.state.actors.push(enemy, ally);

  assert.equal(h.resolver.basicAttack(enemy, ally), true);
  assert.equal(ally.hp, 500);
  assert.equal(h.damage.length, 0);
  assert.equal(h.rollsUsed(), 1);
  assert.deepEqual(h.messages, ["drone attacks zenki, but zenki evades!"]);
});

test("shared basic attack preserves ally retaliation after a successful enemy hit", () => {
  const h = harness({ rolls: [0.99, 0.99] });
  const enemy = actor("drone", "enemy");
  const ally = actor("evalete", "ally");
  ally.statuses.retaliation = { amount: 25 };
  h.state.actors.push(enemy, ally);

  assert.equal(h.resolver.basicAttack(enemy, ally), true);
  assert.deepEqual(h.damage.map(({ target, amount, type }) => ({ id: target.id, amount, type })), [
    { id: "evalete", amount: 100, type: "Physical" },
    { id: "drone", amount: 25, type: "Physical" },
  ]);
  assert.match(h.messages[0], /drone attacks evalete for 100 Physical damage\./);
  assert.equal(h.messages[1], "evalete retaliates against drone for 25 damage!");
  assert.equal(h.rollsUsed(), 2);
});

test("player basic attacks retain their existing no-dodge/no-retaliation behavior", () => {
  const h = harness({ rolls: [0.99] });
  const player = actor("zenki", "ally");
  const enemy = actor("recon-drone", "enemy", { Evasion: 75 });
  enemy.statuses.retaliation = { amount: 100 };
  h.state.actors.push(player, enemy);

  assert.equal(h.resolver.basicAttack(player, enemy), true);
  assert.equal(h.damage.length, 1);
  assert.equal(h.damage[0].target, enemy);
  assert.equal(h.damage[0].amount, 100);
  assert.equal(h.rollsUsed(), 1, "only the physical critical-hit roll is consumed");
  assert.equal(h.messages.length, 1);
});

test("basicAttack rejects missing actors or targets without mutating combat state", () => {
  const h = harness();
  assert.equal(h.resolver.basicAttack(null, actor("target", "enemy")), false);
  assert.equal(h.resolver.basicAttack(actor("actor", "ally"), null), false);
  assert.equal(h.damage.length, 0);
  assert.equal(h.messages.length, 0);
});


test("faction-duel symmetric rules apply Evasion and Retaliation on either side", () => {
  const h = harness({ rolls: [0.99, 0.99], symmetricEvasion: true });
  const phantom = actor("phantom", "ally");
  const falcon = actor("falcon", "enemy");
  falcon.statuses.retaliation = { amount: 25 };
  h.state.actors.push(phantom, falcon);

  assert.equal(h.resolver.basicAttack(phantom, falcon), true);
  assert.deepEqual(h.damage.map(({ target, amount, type }) => ({ id: target.id, amount, type })), [
    { id: "falcon", amount: 100, type: "Physical" },
    { id: "phantom", amount: 25, type: "Physical" },
  ]);
  assert.equal(h.messages[1], "falcon retaliates against phantom for 25 damage!");
});
