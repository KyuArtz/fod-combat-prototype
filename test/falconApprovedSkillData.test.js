const test = require("node:test");
const assert = require("node:assert/strict");
const { validateSkillData, formatMessage } = require("../core/skillInterpreter");
const elishia = require("../characters/skillData/elishia");
const evalete = require("../characters/skillData/evalete");
const jazen = require("../characters/skillData/jazen");
const zackry = require("../characters/skillData/zackry");
const zenki = require("../characters/skillData/zenki");
const { createFalconWorld, skill } = require("./helpers/falconWorld");

const clone = (value) => structuredClone(value);

for (const data of [elishia, evalete, zackry, jazen, zenki]) {
  test(`${data.characterId} skill data validates against the shared interpreter schema`, () => {
    assert.doesNotThrow(() => validateSkillData(data));
  });
}

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
  invalid((d) => { d.summons.meo9.ownerTurnLifecycle.activation[0].handler = ""; }, /handler name/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", percent: 10, points: 2 }]; }, /exactly one numeric percent or points/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", points: 2, when: { flag: "active", equals: "yes" } }]; }, /boolean flag conditions/);
  invalid((d) => { d.passive.incomingAttackMods = [{ type: "evasion", points: "10" }]; }, /incoming attack modifiers need/);
  invalid((d) => { d.passive.onSkillUsed[0].effects[0].type = "heal"; }, /unsupported passive effect/);
  invalid((d) => { d.passive.events = { damageTaken: [{ handler: "" }] }; }, /entries need a handler name/);
  invalid((d) => { d.passive.initialFlags = { active: "yes" }; }, /initialFlags values must be booleans/);
  invalid((d) => { d.passive.targeting = { trackTargeter: "no" }; }, /trackTargeter must be a boolean/);
  invalid((d) => { d.passive.statMods = [{ stat: "SPD", points: 2, when: { flag: "active", equals: true, andFlags: {} } }]; }, /boolean flag conditions/);
});

test("multi-hit effect validates its hit list, accuracy and strict HP threshold", () => {
  assert.doesNotThrow(() => validateSkillData(zenki));
  const invalidZenki = (mutate, pattern) => {
    const data = clone(zenki);
    mutate(data.skills.find((entry) => entry.key === "ultimate").effects[0]);
    assert.throws(() => validateSkillData(data), pattern);
  };
  invalidZenki((effect) => { effect.hits = []; }, /hits array/);
  invalidZenki((effect) => { effect.accuracy = "automatic"; }, /accuracy must be/);
  invalidZenki((effect) => { effect.lastHitModifier.targetHpPercentBelow = 101; }, /lastHitModifier/);
  invalidZenki((effect) => { effect.lastHitModifier.setPower = 0; }, /lastHitModifier/);
});

test("passive, summon and reflection declarations validate their reusable parameters", () => {
  const invalidEvalete = (mutate, pattern) => {
    const data = clone(evalete);
    mutate(data.skills.find((entry) => entry.key === "catalyst").effects[2]);
    assert.throws(() => validateSkillData(data), pattern);
  };
  invalidEvalete((effect) => { effect.damageReflectionPercent = 101; }, /damageReflectionPercent/);
  const invalidSummon = clone(elishia);
  invalidSummon.summons.meo9.ownerTurnLifecycle.activation[0].thresholdPercent = 101;
  assert.throws(() => validateSkillData(invalidSummon), /thresholdPercent/);
  const invalidTimer = clone(elishia);
  invalidTimer.skills.find((entry) => entry.key === "ultimate").effects[0].ownerTurnClock = "yes";
  assert.throws(() => validateSkillData(invalidTimer), /ownerTurnClock/);
  const invalidJazen = clone(jazen);
  invalidJazen.passive.mpowBonusPercent = 0;
  assert.throws(() => validateSkillData(invalidJazen), /mpowBonusPercent/);
});

test("formatMessage fills placeholders and rejects missing values", () => {
  assert.equal(formatMessage("{actor} hits {target} for {damage}.", { actor: "A", target: "B", damage: 5 }), "A hits B for 5.");
  assert.throws(() => formatMessage("{actor} hits {target}.", { actor: "A" }), /no value/);
});

test("all 20 Falcon skills are registered with the approved names, costs and cooldowns", () => {
  const w = createFalconWorld();
  const expected = {
    elishia: [["nano", 20, 2], ["barrier", 25, 3], ["meo", 35, 4], ["ultimate", 65, 6]],
    evalete: [["pulse", 20, 2], ["triage", 25, 3], ["guardian", 40, 4], ["catalyst", 65, 6]],
    zackry: [["mark", 20, 2], ["uplink", 30, 3], ["emp", 35, 4], ["ultimate", 60, 6]],
    jazen: [["impactGrenade", 20, 2], ["breachCharge", 30, 3], ["reinforcedPlating", 25, 3], ["cataclysmicPayload", 65, 6]],
    zenki: [["railshot", 20, 2], ["cipher", 25, 3], ["ghost", 35, 4], ["ultimate", 60, 6]],
  };
  for (const [id, rows] of Object.entries(expected)) {
    assert.deepEqual(w.skillSet.skills[id].map(({ key, cost, cooldown }) => [key, cost, cooldown]), rows);
  }
});

test("every Falcon active skill can execute through the shared interpreter and charges its declared MP", () => {
  const w = createFalconWorld();
  for (const [id, skills] of Object.entries(w.skillSet.skills)) {
    const actor = w.byId[id];
    for (const entry of skills) {
      actor.mp = 200;
      actor.mpDiscount = 0;
      actor.cooldowns[entry.key] = 0;
      const mode = entry.targeting === "mode" ? "Repair" : undefined;
      const target = entry.targeting === "ally" || mode === "Repair" ? w.byId.evalete : entry.targeting === "enemy" ? w.enemies[0] : undefined;
      assert.equal(entry.run(actor, { target, mode }), true, `${id}/${entry.key}`);
      assert.equal(actor.mp, 200 - entry.cost, `${id}/${entry.key} MP`);
      assert.equal(actor.cooldowns[entry.key], entry.cooldown, `${id}/${entry.key} cooldown`);
    }
  }
});

test("Nano Swarm mode variants all execute through the shared interpreter", () => {
  const w = createFalconWorld();
  const nano = skill(w, "elishia", "nano");
  const actor = w.byId.elishia;
  for (const [mode, target] of [["Repair", w.byId.evalete], ["Disrupt", w.enemies[0]], ["Decoy", undefined]]) {
    actor.mp = 200;
    actor.cooldowns.nano = 0;
    assert.equal(nano.run(actor, { mode, target }), true, mode);
  }
});

test("Biotech Overdrive discounts the next skill by a flat 8 MP exactly once", () => {
  const w = createFalconWorld();
  const actor = w.byId.elishia;
  const nano = skill(w, "elishia", "nano");
  const barrier = skill(w, "elishia", "barrier");
  actor.mp = 100;
  nano.run(actor, { mode: "Decoy" });
  assert.equal(actor.mpDiscount, 8);
  actor.cooldowns.barrier = 0;
  barrier.run(actor, { target: w.byId.evalete });
  assert.equal(actor.mp, 100 - 20 - (25 - 8));
  assert.equal(actor.mpDiscount, 8, "using another Nanotech skill re-arms the next-skill discount");
});
