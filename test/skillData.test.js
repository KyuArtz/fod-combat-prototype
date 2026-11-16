const test = require("node:test");
const assert = require("node:assert/strict");
const { createSkillInterpreter, validateSkillData, formatMessage } = require("../core/skillInterpreter");
const elishia = require("../data/skills/elishia");

const clone = (value) => structuredClone(value);

test("Elishia skill costs and cooldowns match the owner reference", () => {
  assert.deepEqual(Object.fromEntries(elishia.skills.map((s) => [s.key, [s.cost, s.cooldown]])), {
    nano: [20, 2], barrier: [25, 3], meo: [35, 4], ultimate: [60, 6],
  });
  assert.ok(elishia.skills.every((skill) => skill.tags.includes("Nanotech")));
});

function invalid(mutate, pattern) {
  const data = clone(elishia);
  mutate(data);
  assert.throws(() => validateSkillData(data), pattern);
}

test("validation rejects malformed skill structure, modes, effects, targeting and placeholders", () => {
  invalid((d) => { d.skills[1].key = "nano"; }, /duplicate skill key/);
  invalid((d) => { d.skills[0].cost = -5; }, /cost must be/);
  invalid((d) => { d.skills[0].tags = "Nanotech"; }, /tags must be an array/);
  invalid((d) => { d.skills[0].modes = [d.skills[0].modes[0]]; }, /at least 2 modes/);
  invalid((d) => { d.skills[0].modes[1].id = "Repair"; }, /duplicate mode/);
  invalid((d) => { d.skills[1].effects = [{ type: "explode" }]; }, /unknown effect type/);
  invalid((d) => { d.skills[1].effects[0].percentMaxHP = 0; }, /shield needs percentMaxHP/);
  invalid((d) => { d.skills[1].targeting = "none"; }, /acts on a target/);
  invalid((d) => { d.skills[1].message = "{target} gains {healed} HP."; }, /uses \{healed\}/);
  invalid((d) => { d.skills[2].effects[0].template = "ghost"; }, /unknown summon template/);
  invalid((d) => { d.summons.meo9.turns = 0; }, /turns >= 1/);
  invalid((d) => { d.summons.meo9.behavior.type = "teleport"; }, /unknown behavior/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", percent: 10, points: 2 }]; }, /exactly one numeric percent or points/);
  invalid((d) => { d.passive.onSkillUsed[0].effects[0].type = "heal"; }, /unsupported passive effect/);
});

test("formatMessage fills placeholders and rejects missing values", () => {
  assert.equal(formatMessage("{actor} hits {target} for {damage}.", { actor: "A", target: "B", damage: 5 }), "A hits B for 5.");
  assert.throws(() => formatMessage("{actor} hits {target}.", { actor: "A" }), /no value/);
});

function fixture() {
  const calls = [];
  const said = [];
  const state = { actors: [], singularityTurns: 0 };
  const unit = (id, side) => ({
    id, name: id, side, alive: true, hp: 500, mp: 200,
    stats: { HP: 1000, MP: 200, Evasion: 0 }, cooldowns: {}, statuses: {}, shields: [],
  });
  const context = {
    state,
    alive: (s, side) => s.actors.filter((u) => u.alive && u.side === side),
    ready: (u, key, cost) => u.alive && u.mp >= cost && !(u.cooldowns[key] > 0),
    pay: (u, cost) => { calls.push(["pay", u.id, cost]); u.mp -= cost; },
    say: (line) => said.push(line),
    addStatus: (u, id, values) => { u.statuses[id] = values; calls.push(["status", u.id, id, values]); },
    addShield: (u, amount, turns, adaptive) => { u.shields.push({ value: amount, turns, adaptive }); calls.push(["shield", u.id, amount, turns]); },
    calculateMastery: (u, target, element, power) => ({ damage: 25, crit: false }),
    applyDamage: (target, amount, element) => { target.hp -= amount; calls.push(["damage", target.id, amount, element]); },
    hitMastery: (u, target, element, power) => { calls.push(["hitMastery", target.id, element, power]); return { damage: 25, crit: false }; },
    hitPhysical: () => ({ damage: 17, crit: false }),
    heal: (target, amount) => { const actual = Math.min(amount, target.stats.HP - target.hp); target.hp += actual; calls.push(["heal", target.id, actual]); return actual; },
    makeActor: (data) => ({ ...data, alive: true, hp: data.stats.HP, mp: 0, cooldowns: {}, statuses: {}, shields: [] }),
    random: () => 0.99,
  };
  const registry = require("../characters/skills").createSkills(context).skills;
  const actors = { elishia: unit("elishia", "ally"), evalete: unit("evalete", "ally"), zackry: unit("zackry", "ally"), jazen: unit("jazen", "ally"), zenki: unit("zenki", "ally"), drone: unit("drone", "enemy") };
  state.actors = Object.values(actors);
  return { calls, said, state, actors, registry };
}

test("all 20 Falcon skills are registered with owner-reference names, costs and cooldowns", () => {
  const { registry } = fixture();
  const expected = {
    elishia: [["nano", 20, 2], ["barrier", 25, 3], ["meo", 35, 4], ["ultimate", 60, 6]],
    evalete: [["pulse", 20, 2], ["triage", 25, 3], ["guardian", 40, 4], ["catalyst", 60, 6]],
    zackry: [["mark", 20, 2], ["uplink", 30, 3], ["emp", 35, 4], ["ultimate", 60, 6]],
    jazen: [["impactGrenade", 20, 2], ["breachCharge", 30, 3], ["reinforcedPlating", 25, 3], ["cataclysmicPayload", 60, 6]],
    zenki: [["railshot", 20, 2], ["cipher", 25, 3], ["ghost", 35, 4], ["ultimate", 60, 6]],
  };
  for (const [id, rows] of Object.entries(expected)) {
    assert.deepEqual(registry[id].map(({ key, cost, cooldown }) => [key, cost, cooldown]), rows);
  }
});

test("every Falcon skill executes through the shared interpreter and charges its declared MP", () => {
  const { calls, actors, registry } = fixture();
  for (const [id, skills] of Object.entries(registry)) {
    for (const skill of skills) {
      const actor = { ...actors[id], mp: 200, cooldowns: {}, statuses: {}, shields: [], mpDiscount: 0 };
      const mode = skill.targeting === "mode" ? "Repair" : undefined;
      const target = skill.targeting === "ally" ? actors.evalete : skill.targeting === "enemy" ? actors.drone : undefined;
      assert.equal(skill.run(actor, { target, mode }), true, `${id}/${skill.key}`);
      assert.equal(actor.mp, 200 - skill.cost, `${id}/${skill.key} MP`);
      assert.equal(actor.cooldowns[skill.key], skill.cooldown, `${id}/${skill.key} cooldown`);
    }
  }
  assert.ok(calls.some((call) => call[0] === "hitMastery"));
});

test("Biotech Overdrive discounts the next skill by a flat 8 MP", () => {
  const { actors, registry } = fixture();
  const elishiaActor = actors.elishia;
  elishiaActor.passive = clone(elishia.passive);
  registry.elishia[0].run(elishiaActor, { mode: "Decoy" });
  assert.equal(elishiaActor.mpDiscount, 8);
});
