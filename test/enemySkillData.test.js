const test = require("node:test");
const assert = require("node:assert/strict");
const { playHeadless } = require("../tools/lib/headless");
const { createEventBus } = require("../core/eventBus");
const { validateSkillData } = require("../core/skillInterpreter");
const trainingDrone = require("../data/enemySkills/trainingDrone");
const rogueAutomaton = require("../data/enemySkills/rogueAutomaton");

const ENEMY_DATA = [trainingDrone, rogueAutomaton];

test("enemy skill definitions validate and expose the expected data-driven registry", () => {
  for (const data of ENEMY_DATA) validateSkillData(data);
  assert.deepEqual(trainingDrone.skills.map(({ key, cost, cooldown }) => [key, cost, cooldown]), [
    ["pulseShot", 0, 3],
  ]);
  assert.deepEqual(rogueAutomaton.skills.map(({ key, cost, cooldown }) => [key, cost, cooldown]), [
    ["overload", 0, 5], ["scan", 0, 4], ["heavyStrike", 0, 3],
  ]);
});

for (const [actorId, skillKey] of [
  ["training-drone", "pulseShot"],
  ["rogue-automaton", "overload"],
  ["rogue-automaton", "scan"],
  ["rogue-automaton", "heavyStrike"],
]) {
  test(`enemy skill ${actorId}.${skillKey} executes through battle validation and the shared interpreter`, async () => {
    const events = createEventBus();
    const used = [];
    const rejected = [];
    events.on("SkillUsed", (event) => used.push(event));
    events.on("DecisionRejected", (event) => rejected.push(event));
    let selected = false;
    const enemy = {
      chooseAction(view) {
        if (view.actor.id === actorId && !selected) {
          const action = view.actions.find((candidate) => candidate.type === "enemySkill" && candidate.key === skillKey && candidate.usable);
          if (action && (action.targeting === "none" || action.targets.length)) {
            selected = true;
            return { type: "enemySkill", skillKey, ...(action.targeting === "none" ? {} : { targetId: action.targets[0] }) };
          }
        }
        const basic = view.actions.find((candidate) => candidate.type === "basic");
        return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
      },
    };
    const battle = await playHeadless({ seed: 61000 + used.length, events, controllers: { enemy } });
    assert.equal(selected, true, `${skillKey} should be selected in a real battle`);
    assert.ok(used.some((event) => event.actorId === actorId && event.skillKey === skillKey));
    assert.equal(rejected.length, 0);
    assert.ok(["VICTORY", "DEFEAT"].includes(battle.result));
    if (skillKey === "overload") assert.ok(battle.state.log.some((line) => line.includes("activates OVERLOAD")));
    if (skillKey === "scan") assert.ok(battle.state.log.some((line) => line.includes("scans")));
    if (skillKey === "pulseShot") assert.ok(battle.state.log.some((line) => line.includes("fires PULSE SHOT")));
    if (skillKey === "heavyStrike") assert.ok(battle.state.log.some((line) => line.includes("HEAVY STRIKE")));
  });
}
