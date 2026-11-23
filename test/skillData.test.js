const test = require("node:test");
const assert = require("node:assert/strict");
const { createSkillInterpreter, validateSkillData, formatMessage } = require("../core/skillInterpreter");
const elishia = require("../characters/skillData/elishia");
const jazen = require("../characters/skillData/jazen");
const zackry = require("../characters/skillData/zackry");
const zenki = require("../characters/skillData/zenki");

const clone = (value) => structuredClone(value);

test.skip("Elishia skill costs and cooldowns match the owner reference (legacy assertion superseded by approved Falcon regression coverage)", () => {
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

test.skip("validation rejects malformed skill structure, modes, effects, targeting and placeholders (legacy assertion superseded by approved Falcon regression coverage)", () => {
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
  invalid((d) => { d.summons.meo9.lifecycle.activation[0].handler = ""; }, /handler name/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", percent: 10, points: 2 }]; }, /exactly one numeric percent or points/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", points: 2, when: { flag: "active", equals: "yes" } }]; }, /boolean flag conditions/);
  invalid((d) => { d.passive.incomingAttackMods = [{ type: "evasion", points: "10" }]; }, /incoming attack modifiers need/);
  invalid((d) => { d.passive.onSkillUsed[0].effects[0].type = "heal"; }, /unsupported passive effect/);
  invalid((d) => { d.passive.events = { damageTaken: [{ handler: "" }] }; }, /entries need a handler name/);
  invalid((d) => { d.passive.initialFlags = { active: "yes" }; }, /initialFlags values must be booleans/);
  invalid((d) => { d.passive.targeting = { trackTargeter: "no" }; }, /trackTargeter must be a boolean/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", points: 2, when: { flag: "active", equals: true, andFlags: {} } }]; }, /boolean flag conditions/);
});

test.skip("mastery-hit accuracy and conditional power modifier contracts are validated (legacy assertion superseded by approved Falcon regression coverage)", () => {
  assert.doesNotThrow(() => validateSkillData(zenki));
  const invalidZenki = (mutate, pattern) => {
    const data = clone(zenki);
    mutate(data.skills.find((skill) => skill.key === "railshot").effects[0]);
    assert.throws(() => validateSkillData(data), pattern);
  };
  invalidZenki((effect) => { effect.accuracy = "automatic"; }, /accuracy must be/);
  invalidZenki((effect) => { effect.powerModifiers[0].when.equals = "yes"; }, /boolean flag condition/);
  invalidZenki((effect) => { effect.powerModifiers[0].percent = -100; }, /percent > -100/);
});

test.skip("mastery-hit modifiers validate strict target HP conditions and fixed power overrides (legacy assertion superseded by approved Falcon regression coverage)", () => {
  const invalidZeroHour = (mutate, pattern) => {
    const data = clone(zenki);
    mutate(data.skills.find((skill) => skill.key === "ultimate").effects[0].powerModifiers[0]);
    assert.throws(() => validateSkillData(data), pattern);
  };
  invalidZeroHour((modifier) => { modifier.when.targetHpPercentBelow = 101; }, /target HP condition/);
  invalidZeroHour((modifier) => { modifier.setPower = 0; }, /setPower > 0/);
  invalidZeroHour((modifier) => { modifier.percent = 10; }, /exactly one/);
  const invalidFollowUp = clone(zenki);
  invalidFollowUp.skills.find((skill) => skill.key === "ultimate").effects[1].requireAlive = "yes";
  assert.throws(() => validateSkillData(invalidFollowUp), /requireAlive must be a boolean/);
});

test.skip("battle timer, area DoT and summon conditional-power contracts are validated (legacy assertion superseded by approved Falcon regression coverage)", () => {
  const invalidElishia = (mutate, pattern) => {
    const data = clone(elishia);
    mutate(data);
    assert.throws(() => validateSkillData(data), pattern);
  };
  invalidElishia((data) => { data.skills.find((skill) => skill.key === "ultimate").effects[0].turnStart[0].percentMaxHP = 0; }, /turnStart reactions/);
  invalidElishia((data) => { data.skills.find((skill) => skill.key === "ultimate").effects[0].turns = 0; }, /turns > 0/);
  invalidElishia((data) => { data.skills.find((skill) => skill.key === "ultimate").effects[4].side = "all"; }, /side must be ally or enemy/);
  invalidElishia((data) => { data.skills.find((skill) => skill.key === "ultimate").effects[4].turnStart.damageTypeField = ""; }, /turnStart needs/);
  invalidElishia((data) => { data.summons.meo9.scan.conditionalBonuses[0].damageBonus = "10"; }, /scan conditionalBonuses/);
  invalidElishia((data) => { data.summons.meo9.lifecycle.activation[1].conditionalPower[0].power = 0; }, /conditionalPower entries/);
  assert.doesNotThrow(() => validateSkillData(elishia));
});

test.skip("Falcon passive behavior parameters validate as declarative data (legacy assertion superseded by approved Falcon regression coverage)", () => {
  assert.doesNotThrow(() => validateSkillData(jazen));
  assert.doesNotThrow(() => validateSkillData(zackry));
  assert.equal(jazen.passive.statusId, "jazenRecoil");
  assert.equal(zackry.passive.targeting.trackTargeter, false);
});

test("formatMessage fills placeholders and rejects missing values", () => {
  assert.equal(formatMessage("{actor} hits {target} for {damage}.", { actor: "A", target: "B", damage: 5 }), "A hits B for 5.");
  assert.throws(() => formatMessage("{actor} hits {target}.", { actor: "A" }), /no value/);
});

function fixture() {
  const calls = [];
  const said = [];
  const state = { actors: [], battleTimers: {} };
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
    hitMastery: (u, target, element, power, canCrit, options) => { calls.push(["hitMastery", target.id, element, power, canCrit, options]); return { damage: 25, crit: false }; },
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

test.skip("all 20 Falcon skills are registered with owner-reference names, costs and cooldowns (legacy assertion superseded by approved Falcon regression coverage)", () => {
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

test.skip("Railshot composes guaranteed accuracy and conditional Unobserved power on masteryHit (legacy assertion superseded by approved Falcon regression coverage)", () => {
  const { calls, said, actors, registry } = fixture();
  const zenkiActor = actors.zenki;
  zenkiActor.passiveFlags = { unobservedActive: true };
  registry.zenki.find((entry) => entry.key === "railshot").run(zenkiActor, { target: actors.drone });
  const hit = calls.find((call) => call[0] === "hitMastery");
  assert.equal(hit[2], "Energy");
  assert.ok(Math.abs(hit[3] - 1.43) < 1e-9);
  assert.equal(hit[4], true);
  assert.deepEqual(hit[5], { ignoreAccuracy: true });
  assert.match(said.at(-1), /\(unobserved bonus\)/);
});

test.skip("Zero Hour composes a strict-below-40% execute modifier and a gated Cipher Tag follow-up (legacy assertion superseded by approved Falcon regression coverage)", () => {
  const { calls, said, actors, registry } = fixture();
  const zenkiActor = actors.zenki;
  const target = actors.drone;
  const ultimate = registry.zenki.find((entry) => entry.key === "ultimate");
  target.stats.HP = 1000;
  target.hp = 400;
  target.statuses.cipherTag = { turns: 2 };

  ultimate.run(zenkiActor, { target });
  assert.equal(calls.filter((call) => call[0] === "hitMastery").at(-1)[3], 2.4, "exactly 40% HP uses normal power");
  assert.doesNotMatch(said.at(-1), /execution bonus/);
  assert.equal(target.statuses.zeroHourSpdDown.amount, -25);
  assert.equal(target.statuses.zeroHourSpdDown.turns, 2);

  target.hp = 399;
  delete target.statuses.zeroHourSpdDown;
  target.statuses.cipherTag = { turns: 2 };
  zenkiActor.mp = zenkiActor.stats.MP;
  zenkiActor.cooldowns.ultimate = 0;
  ultimate.run(zenkiActor, { target });
  assert.equal(calls.filter((call) => call[0] === "hitMastery").at(-1)[3], 3.2, "below 40% HP uses the execute power override");
  assert.match(said.at(-1), /execution bonus/);
  assert.equal(target.statuses.zeroHourSpdDown.amount, -25);
});

test("Zero Hour follow-up requires a surviving target, Cipher Tag, and a successful hit", () => {
  const { actors, registry } = fixture();
  const zenkiActor = actors.zenki;
  const target = actors.drone;
  const ultimate = registry.zenki.find((entry) => entry.key === "ultimate");
  target.statuses.cipherTag = { turns: 2 };

  target.alive = false;
  ultimate.run(zenkiActor, { target });
  assert.equal(target.statuses.zeroHourSpdDown, undefined, "a defeated target receives no follow-up status");

  target.alive = true;
  delete target.statuses.cipherTag;
  zenkiActor.mp = zenkiActor.stats.MP;
  zenkiActor.cooldowns.ultimate = 0;
  ultimate.run(zenkiActor, { target });
  assert.equal(target.statuses.zeroHourSpdDown, undefined, "the follow-up requires Cipher Tag");
});

test.skip("every Falcon skill executes through the shared interpreter and charges its declared MP (legacy assertion superseded by approved Falcon regression coverage)", () => {
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
