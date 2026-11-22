const test = require("node:test");
const assert = require("node:assert/strict");
const skillData = {
  elishia: require("../characters/skillData/elishia"),
  evalete: require("../characters/skillData/evalete"),
  zackry: require("../characters/skillData/zackry"),
  jazen: require("../characters/skillData/jazen"),
  zenki: require("../characters/skillData/zenki"),
};
const { validateSkillData } = require("../core/skillInterpreter");
const { createFalconParty } = require("../characters/falcon");

test("all five Falcon skill definitions validate and identify their canonical passives", () => {
  for (const [id, data] of Object.entries(skillData)) {
    assert.equal(data.characterId, id);
    assert.equal(data.skills.length, 4);
    assert.ok(data.passive?.id, `${id} passive id`);
    assert.doesNotThrow(() => validateSkillData(data), id);
  }
});

test("the in-engine Falcon roster carries the matching owner-reference passive data", () => {
  const party = Object.fromEntries(createFalconParty().map((actor) => [actor.id, actor]));
  for (const [id, data] of Object.entries(skillData)) {
    assert.deepEqual(party[id].passive, data.passive, `${id} passive`);
  }
});

test("owner-specified active skill costs and cooldowns are not silently substituted", () => {
  const expected = {
    elishia: [[20, 2], [25, 3], [35, 4], [60, 6]],
    evalete: [[20, 2], [25, 3], [40, 4], [60, 6]],
    zackry: [[20, 2], [30, 3], [35, 4], [60, 6]],
    jazen: [[20, 2], [30, 3], [25, 3], [60, 6]],
    zenki: [[20, 2], [25, 3], [35, 4], [60, 6]],
  };
  for (const [id, rows] of Object.entries(expected)) {
    assert.deepEqual(skillData[id].skills.map((skill) => [skill.cost, skill.cooldown]), rows);
  }
});
