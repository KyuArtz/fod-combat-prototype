const test = require("node:test");
const assert = require("node:assert/strict");
const { makeActor } = require("../characters/actorFactory");
const { effectiveStat, incomingAttackModifier } = require("../systems/statusEffects");
const { createActionResolver } = require("../core/actionResolver");

test("conditional passive stat modifiers use generic actor flags", () => {
  const actor = makeActor({ id: "unit", side: "ally", stats: { HP: 100, MP: 0, Evasion: 5 },
    passive: { statMods: [{ stat: "Evasion", points: 12, when: { flag: "concealed", equals: true } }] },
  });
  assert.equal(effectiveStat({}, actor, "Evasion"), 5);
  actor.passiveFlags.concealed = true;
  assert.equal(effectiveStat({}, actor, "Evasion"), 17);
});

test("incoming attack modifiers remain independent from conditional stat modifiers", () => {
  const target = makeActor({ id: "unit", side: "ally", stats: { HP: 100, MP: 0, Evasion: 5 },
    passive: { incomingAttackMods: [{ type: "evasion", points: 10 }] },
  });
  const state = { actors: [], battleTimers: {}, rng: {} };
  let draws = 0;
  const resolver = createActionResolver({ state, effectiveStat: (unit, stat) => effectiveStat(state, unit, stat),
    incomingAttackModifier, applyDamage() {}, say() {}, random: () => { draws++; return 0.1; },
  });
  const attacker = makeActor({ id: "foe", side: "enemy", stats: { HP: 100, MP: 0, ATK: 10 } });
  assert.equal(incomingAttackModifier(target, "evasion"), 10);
  assert.equal(resolver.basicAttack(attacker, target), true);
  assert.equal(draws, 1);
  assert.equal(target.hp, 100);
});
