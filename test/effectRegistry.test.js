const test = require("node:test");
const assert = require("node:assert/strict");
const { createEffectRegistry, createDefaultEffectRegistry } = require("../systems/effects");
const { createSkillInterpreter } = require("../core/skillInterpreter");

test("effect registry registers handlers once and dispatches declarative effect records", () => {
  const registry = createEffectRegistry();
  let calls = 0;
  registry.register("testEffect", {
    execute(effect, run) { calls++; run.results.value = effect.value; },
    validate(effect) { return Number.isFinite(effect.value) ? null : "value must be numeric"; },
    resultKeys: ["value"],
  });
  assert.equal(registry.has("testEffect"), true);
  assert.throws(() => registry.register("testEffect", () => {}), /already registered/);
  const run = { results: {} };
  registry.dispatch({ type: "testEffect", value: 42 }, run);
  assert.equal(calls, 1);
  assert.equal(run.results.value, 42);
  assert.equal(registry.validate({ type: "testEffect", value: "bad" }), "value must be numeric");
});

test("a new skill effect can be added through registry registration without changing core resolution", () => {
  const registry = createDefaultEffectRegistry({});
  registry.register("designerEffect", {
    execute(effect, run) { run.target.hp -= effect.amount; run.results.damage = effect.amount; },
    validate(effect) { return Number.isFinite(effect.amount) && effect.amount > 0 ? null : "amount must be positive"; },
    targeting: ["enemy"],
    resultKeys: ["damage"],
  });
  const messages = [];
  const context = {
    effectRegistry: registry,
    state: { actors: [] },
    ready: () => true,
    pay: () => {},
    say: (line) => messages.push(line),
  };
  const interpreter = createSkillInterpreter(context);
  const data = {
    characterId: "designer",
    skills: [{
      key: "custom", name: "Custom Strike", cost: 0, cooldown: 0, tags: [], targeting: "enemy",
      effects: [{ type: "designerEffect", amount: 37 }],
      message: "Custom strike deals {damage} damage.",
    }],
  };
  const [skill] = interpreter.buildSkills(data);
  const actor = { name: "Designer", mp: 10, cooldowns: {} };
  const target = { name: "Target", hp: 100 };
  assert.equal(skill.run(actor, { target }), true);
  assert.equal(target.hp, 63);
  assert.match(messages.at(-1), /37 damage/);
});

test("default effect implementations are owned by systems/effects, not the core interpreter", () => {
  const registry = createDefaultEffectRegistry({});
  for (const type of ["physicalHit", "damage", "masteryHit", "heal", "shield", "buff", "debuff", "damageOverTime", "status", "lifecycle", "setBattleTimer", "announceSummonPowerModifier"]) {
    assert.equal(registry.has(type), true, `${type} should be registered`);
  }
  assert.equal(registry.has("tacticalMark"), false, "Tactical Mark should compose the generic status handler");
  assert.equal(registry.has("railshot"), false, "Railshot should compose the generic masteryHit handler");
  assert.equal(registry.has("zeroHour"), false, "Zero Hour should compose generic masteryHit and conditionalStatus handlers");
  assert.equal(registry.has("singularity"), false, "Nanotech Singularity should compose generic timer, status, DoT and summon-modifier handlers");
});
