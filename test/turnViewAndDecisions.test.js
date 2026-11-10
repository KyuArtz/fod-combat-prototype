const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDecision } = require("../core/decisions");
const { findByViewId, viewIdOf } = require("../core/turnView");
const { createSkills } = require("../characters/skills");
const { createBattleMenu } = require("../ui/battleMenu");

// A hand-built player view, shaped exactly like core/turnView.js produces.
function playerView() {
  return {
    kind: "player",
    round: 1,
    actor: { id: "elishia", name: "Elishia", side: "ally", summon: false, hp: 100, maxHp: 100, mp: 50, maxMp: 100, cr: 100 },
    allies: [{ id: "elishia" }, { id: "zenki" }],
    enemies: [{ id: "drone" }, { id: "turret" }],
    actions: [
      { type: "basic", targeting: "enemy", targets: ["drone", "turret"] },
      { type: "skill", key: "nano", name: "Nano Swarm", category: "Skill 1", cost: 20, cooldown: 0, usable: true, targeting: "mode",
        modes: [
          { id: "Repair", label: "Repair", targeting: "ally", targets: ["elishia", "zenki"] },
          { id: "Disrupt", label: "Disrupt", targeting: "enemy", targets: ["drone", "turret"] },
          { id: "Decoy", label: "Decoy", targeting: "none", targets: [] },
        ] },
      { type: "skill", key: "barrier", name: "Adaptive Barrier", category: "Skill 2", cost: 25, cooldown: 0, usable: true, targeting: "ally", targets: ["elishia", "zenki"] },
      { type: "skill", key: "meo", name: "Meo-9", category: "Skill 3", cost: 35, cooldown: 2, usable: false, targeting: "none", targets: [] },
      { type: "skill", key: "ultimate", name: "Nanotech Singularity", category: "Ultimate", cost: 65, cooldown: 0, usable: true, targeting: "none", targets: [] },
      { type: "switch", reserves: [{ id: "jazen", alive: true }, { id: "evalete", alive: false }], active: [{ id: "elishia" }, { id: "zenki" }] },
    ],
  };
}

const check = (decision, view = playerView()) => validateDecision(view, decision);
const reason = (decision, view) => check(decision, view).reason;

test("valid decisions of every shape are accepted", () => {
  assert.equal(check({ type: "basic", targetId: "drone" }).ok, true);
  assert.equal(check({ type: "skill", skillKey: "barrier", targetId: "zenki" }).ok, true);
  assert.equal(check({ type: "skill", skillKey: "ultimate" }).ok, true);
  assert.equal(check({ type: "skill", skillKey: "nano", mode: "Repair", targetId: "zenki" }).ok, true);
  assert.equal(check({ type: "skill", skillKey: "nano", mode: "Disrupt", targetId: "turret" }).ok, true);
  assert.equal(check({ type: "skill", skillKey: "nano", mode: "Decoy" }).ok, true);
  assert.equal(check({ type: "switch", reserveId: "jazen", activeId: "zenki" }).ok, true);
});

test("malformed or unknown decisions are rejected with a reason", () => {
  assert.equal(reason(undefined), "malformed-decision");
  assert.equal(reason(null), "malformed-decision");
  assert.equal(reason("basic"), "malformed-decision");
  assert.equal(reason({}), "malformed-decision");
  assert.equal(reason({ type: "teleport" }), "unknown-decision-type");
});

test("targets must be present and legal for the action", () => {
  assert.equal(reason({ type: "basic" }), "missing-target");
  assert.equal(reason({ type: "basic", targetId: "zenki" }), "invalid-target"); // an ally, not an enemy
  assert.equal(reason({ type: "basic", targetId: "nobody" }), "invalid-target");
  assert.equal(reason({ type: "skill", skillKey: "barrier", targetId: "drone" }), "invalid-target");
  assert.equal(reason({ type: "skill", skillKey: "barrier" }), "missing-target");
});

test("skills must exist and be usable; modes must be valid and match their target rules", () => {
  assert.equal(reason({ type: "skill", skillKey: "nope" }), "unknown-skill");
  assert.equal(reason({ type: "skill", skillKey: "meo" }), "skill-unavailable"); // on cooldown
  assert.equal(reason({ type: "skill", skillKey: "nano" }), "invalid-mode");
  assert.equal(reason({ type: "skill", skillKey: "nano", mode: "Explode" }), "invalid-mode");
  assert.equal(reason({ type: "skill", skillKey: "nano", mode: "Repair", targetId: "drone" }), "invalid-target");
  assert.equal(reason({ type: "skill", skillKey: "nano", mode: "Disrupt" }), "missing-target");
});

test("switch decisions need a living reserve and a real active slot", () => {
  assert.equal(reason({ type: "switch", reserveId: "evalete", activeId: "zenki" }), "invalid-reserve"); // incapacitated
  assert.equal(reason({ type: "switch", reserveId: "ghost", activeId: "zenki" }), "invalid-reserve");
  assert.equal(reason({ type: "switch", reserveId: "jazen", activeId: "ghost" }), "invalid-slot");
});

test("actions the actor does not have are rejected (an enemy cannot switch, a player cannot pass)", () => {
  assert.equal(reason({ type: "pass" }), "action-not-available");
  assert.equal(reason({ type: "summonAuto" }), "action-not-available");
  const enemyView = { actions: [{ type: "basic", targeting: "ally", targets: ["zenki"] }] };
  assert.equal(reason({ type: "switch", reserveId: "jazen", activeId: "zenki" }, enemyView), "action-not-available");
  assert.equal(check({ type: "basic", targetId: "zenki" }, enemyView).ok, true);
  assert.equal(reason({ type: "enemySkill", skillKey: "pulseShot", targetId: "zenki" }, enemyView), "unknown-skill");
});

test("enemy skills follow the same usable/target rules", () => {
  const view = { actions: [
    { type: "enemySkill", key: "scan", targeting: "ally", usable: true, targets: ["zenki"] },
    { type: "enemySkill", key: "overload", targeting: "none", usable: true, targets: [] },
    { type: "enemySkill", key: "heavyStrike", targeting: "ally", usable: false, targets: ["zenki"] },
  ] };
  assert.equal(validateDecision(view, { type: "enemySkill", skillKey: "scan", targetId: "zenki" }).ok, true);
  assert.equal(validateDecision(view, { type: "enemySkill", skillKey: "overload" }).ok, true);
  assert.equal(validateDecision(view, { type: "enemySkill", skillKey: "heavyStrike", targetId: "zenki" }).reason, "skill-unavailable");
  assert.equal(validateDecision(view, { type: "enemySkill", skillKey: "scan", targetId: "x" }).reason, "invalid-target");
});

test("view ids: unique ids stay as they are; duplicates get #n and round-trip", () => {
  const meoA = { id: "meo-9", name: "Meo-9" };
  const meoB = { id: "meo-9", name: "Meo-9" };
  const zenki = { id: "zenki", name: "Zenki" };
  const state = { actors: [zenki, meoA, meoB], party: { active: [zenki], reserve: [] } };
  assert.equal(viewIdOf(state, zenki), "zenki");
  assert.equal(viewIdOf(state, meoA), "meo-9#1");
  assert.equal(viewIdOf(state, meoB), "meo-9#2");
  assert.equal(findByViewId(state, "meo-9#2"), meoB);
  assert.equal(findByViewId(state, "zenki"), zenki);
  assert.equal(findByViewId(state, "nobody"), null);
  assert.equal(findByViewId(state, undefined), null);
});

test("reserves can be found by id even though they are not deployed", () => {
  const jazen = { id: "jazen" };
  const state = { actors: [], party: { active: [], reserve: [jazen] } };
  assert.equal(findByViewId(state, "jazen"), jazen);
});

test("every skill in the registry is declarative: targeting, a run function, consistent modes", () => {
  const { skills } = createSkills({});
  const valid = new Set(["enemy", "ally", "none", "mode"]);
  for (const [character, list] of Object.entries(skills)) {
    assert.equal(new Set(list.map((skill) => skill.key)).size, list.length, `${character}: duplicate skill keys`);
    for (const skill of list) {
      const label = `${character}/${skill.key}`;
      assert.ok(valid.has(skill.targeting), `${label}: targeting ${skill.targeting}`);
      assert.equal(typeof skill.run, "function", `${label}: run`);
      assert.equal(typeof skill.cost, "number", `${label}: cost`);
      assert.equal(skill.use, undefined, `${label}: legacy use() must be gone`);
      if (skill.targeting === "mode") {
        assert.ok(skill.modes.length >= 2, label);
        for (const mode of skill.modes) assert.ok(["enemy", "ally", "none"].includes(mode.targeting), `${label}/${mode.id}`);
      } else {
        assert.equal(skill.modes, undefined, label);
      }
    }
  }
});

// --- The terminal controller returns decisions from prompts and never mutates the battle ---

function terminal(answers, view) {
  const lines = [];
  const queue = [...answers];
  const menu = createBattleMenu({
    ask: async () => queue.shift(),
    output: { log: (...args) => lines.push(args.join(" ")) },
    say: (message) => lines.push(message),
    state: {},
  });
  return { decision: menu.chooseAction(view), lines };
}

test("terminal controller: basic attack, then pick the second target", async () => {
  const { decision } = terminal(["1", "2"], playerView());
  assert.deepEqual(await decision, { type: "basic", targetId: "turret" });
});

test("terminal controller: Nano Swarm Repair on an ally and Decoy with no target", async () => {
  assert.deepEqual(await terminal(["2", "1", "2"], playerView()).decision, {
    type: "skill", skillKey: "nano", mode: "Repair", targetId: "zenki",
  });
  assert.deepEqual(await terminal(["2", "3"], playerView()).decision, {
    type: "skill", skillKey: "nano", mode: "Decoy",
  });
});

test("terminal controller: an unavailable skill prints a message and re-prompts; bad input is rejected politely", async () => {
  const { decision, lines } = terminal(["4", "9", "5"], playerView()); // Meo on cooldown, invalid, then ultimate
  assert.deepEqual(await decision, { type: "skill", skillKey: "ultimate" });
  assert.ok(lines.includes("Meo-9 is unavailable (not enough MP or on cooldown)."));
  assert.ok(lines.includes("Invalid choice. Try again."));
});

test("terminal controller: an out-of-range target for a skill says so and returns to the menu", async () => {
  const { decision, lines } = terminal(["3", "9", "1", "1"], playerView()); // barrier, bad target, then basic attack
  assert.deepEqual(await decision, { type: "basic", targetId: "drone" });
  assert.ok(lines.includes("No valid target selected."));
});
