const test = require("node:test");
const assert = require("node:assert/strict");
const { playHeadless } = require("../tools/lib/headless");
const { createEventBus } = require("../core/eventBus");
const { validateSkillData } = require("../core/skillInterpreter");
const { createEnemyAI } = require("../ai/enemyAI");

const ENEMY_DATA = [
  require("../data/enemySkills/trainingDrone"),
  require("../data/enemySkills/rogueAutomaton"),
  require("../data/enemySkills/siegeTurret"),
  require("../data/enemySkills/reconDrone"),
  require("../data/enemySkills/toxicStalker"),
  require("../data/enemySkills/blightheartOverseer"),
];

const ENEMY_SKILLS = [
  ["training-drone", "pulseShot"],
  ["training-drone", "kineticBurst"],
  ["training-drone", "evasiveThrusters"],
  ["training-drone", "overclockedShot"],
  ["rogue-automaton", "overload"],
  ["rogue-automaton", "scan"],
  ["rogue-automaton", "heavyStrike"],
  ["rogue-automaton", "crusherProtocol"],
  ["siege-turret", "ballisticShell"],
  ["siege-turret", "suppressionRound"],
  ["siege-turret", "fortify"],
  ["siege-turret", "siegeSalvo"],
  ["recon-drone", "spotterMark"],
  ["recon-drone", "precisionBurst"],
  ["recon-drone", "spoofingManeuver"],
  ["recon-drone", "targetingCascade"],
  ["toxic-stalker", "venomStrike"],
  ["toxic-stalker", "causticSpit"],
  ["toxic-stalker", "predatorInstinct"],
  ["toxic-stalker", "blightSurge"],
  ["blightheart-overseer", "sporeLance"],
  ["blightheart-overseer", "miasmaWave"],
  ["blightheart-overseer", "heartbark"],
  ["blightheart-overseer", "cataclysmicBloom"],
];

test("all enemy skill definitions validate and expose four data-driven abilities each", () => {
  for (const data of ENEMY_DATA) {
    validateSkillData(data);
    assert.equal(data.skills.length, 4, `${data.characterId} should have three active skills and one ultimate`);
    assert.ok(data.skills.every((skill) => skill.cost > 0 && skill.cooldown > 0));
  }
});

for (const [actorId, skillKey] of ENEMY_SKILLS) {
  test(`enemy skill ${actorId}.${skillKey} executes through battle validation and the shared interpreter`, async () => {
    const events = createEventBus();
    const used = [];
    const rejected = [];
    events.on("SkillUsed", (event) => used.push(event));
    events.on("DecisionRejected", (event) => rejected.push(event));
    let selected = false;
    const enemy = {
      chooseAction(view) {
        if ((view.actor.id === actorId || view.actor.id.startsWith(`${actorId}-`)) && !selected) {
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
    const encounter = actorId === "blightheart-overseer" ? "blightheartSanctum" : "trainingGround";
    const battle = await playHeadless({ seed: 71000 + ENEMY_SKILLS.findIndex(([id, key]) => id === actorId && key === skillKey), events, encounter, controllers: { enemy } });
    assert.equal(selected, true, `${skillKey} should be selected in a real battle`);
    assert.ok(used.some((event) => (event.actorId === actorId || event.actorId.startsWith(`${actorId}-`)) && event.skillKey === skillKey));
    assert.equal(rejected.length, 0);
    assert.ok(["VICTORY", "DEFEAT"].includes(battle.result));
  });
}

test("faction enemy skill descriptions expose MP cost and cooldown metadata to tactical controllers", () => {
  const skill = { key: "triage", name: "Triage Infusion", category: "Skill 2", cost: 25, cooldown: 3, targeting: "ally", run() {} };
  const actor = { id: "evalete", skillSet: "evalete", alive: true, mp: 40, cooldowns: { triage: 1 } };
  const ai = createEnemyAI({ skills: { evalete: [skill] }, ready: (unit, key, cost) => unit.alive && unit.mp >= cost && !(unit.cooldowns[key] > 0) });
  assert.deepEqual(ai.describeSkills(actor), [{ key: "triage", name: "Triage Infusion", targeting: "ally", category: "Skill 2", cost: 25, cooldown: 1, targetFaction: undefined, excludeSelf: undefined, usable: false }]);
});
