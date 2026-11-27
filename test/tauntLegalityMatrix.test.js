const test = require("node:test");
const assert = require("node:assert/strict");
const { buildTurnView } = require("../core/turnView");

function unit(id, side, statuses = {}, faction = null, options = {}) {
  return {
    id, name: id, side, faction, role: "stalker", mastery: "Kinetic", skillSet: id,
    summon: Boolean(options.summon), targetableByEnemy: options.targetableByEnemy ?? true,
    hp: 100, alive: options.alive ?? true, mp: 40,
    stats: { HP: 100, MP: 50, ATK: 20, MPow: 10 }, cooldowns: {}, statuses,
    cr: 100, shields: [],
  };
}


function viewFor(actor, actors, skillDefinitions, describeEnemySkills = () => []) {
  const party = { active: actors.filter((u) => u.side === "ally"), reserve: [] };
  const enemyParty = { active: actors.filter((u) => u.side === "enemy"), reserve: [] };
  const state = { actors, round: 1, party, enemyParty, incomingPressureTelemetry: null };
  return buildTurnView({
    state, actor, skills: skillDefinitions, describeEnemySkills, ready: () => true,
    alive: (_state, side) => actors.filter((u) => u.side === side && u.alive),
  });
}


const taunt = (turns) => ({ taunt: true, turns });


 test("Taunt priority chooses the longest duration and ties retain candidate order", () => {
  const actor = unit("controller", "enemy", {}, "falcon");
  const first = unit("first", "ally", { taunt: taunt(3) }, "phantom");
  const second = unit("second", "ally", { taunt: taunt(3) }, "serpent");
  const longer = unit("longer", "ally", { taunt: taunt(4) }, "falcon");
  const view = viewFor(actor, [actor, first, second, longer], {}, () => []);
  assert.deepEqual(view.actions.find((a) => a.type === "basic").targets, ["longer"]);

  const tiedView = viewFor(actor, [actor, second, first], {}, () => []);
  assert.deepEqual(tiedView.actions.find((a) => a.type === "basic").targets, ["second"]);
});


 test("hostile target faction restrictions intersect with Taunt rather than bypassing it", () => {
  const actor = unit("controller", "enemy", {}, "falcon");
  const phantomTaunter = unit("phantomTaunter", "ally", { taunt: taunt(3) }, "phantom");
  const serpent = unit("serpent", "ally", {}, "serpent");
  const view = viewFor(actor, [actor, phantomTaunter, serpent], {}, () => [
    { key: "serpentOnly", name: "Serpent-only", targeting: "enemy", targetFaction: "serpent", usable: true },
    { key: "phantomOnly", name: "Phantom-only", targeting: "enemy", targetFaction: "phantom", usable: true },
  ]);
  assert.deepEqual(view.actions.find((a) => a.key === "serpentOnly").targets, []);
  assert.deepEqual(view.actions.find((a) => a.key === "phantomOnly").targets, ["phantomTaunter"]);
});


 test("Taunt does not affect ally support modes with excludeSelf and targetFaction", () => {
  const actor = unit("mirazhel", "enemy", {}, "phantom");
  const taunter = unit("allyTaunter", "enemy", { taunt: taunt(2) }, "serpent");
  const phantom = unit("phantomAlly", "enemy", {}, "phantom");
  const view = viewFor(actor, [actor, taunter, phantom], {}, () => [
    { key: "veil", name: "Veil", targeting: "ally", excludeSelf: true, targetFaction: "phantom", usable: true },
  ]);
  assert.deepEqual(view.actions.find((a) => a.key === "veil").targets, ["phantomAlly"]);
});


 test("player and faction-controller hostile modes expose Taunt targets while support modes remain unrestricted", () => {
  const player = unit("player", "ally");
  const galloz = unit("galloz", "enemy", { taunt: taunt(2) }, "serpent");
  const verra = unit("verra", "enemy", {}, "serpent");
  const playerView = viewFor(player, [player, galloz, verra], { player: [
    { key: "modes", name: "Modes", targeting: "mode", cost: 0, modes: [
      { id: "hostile", label: "Hostile", targeting: "enemy" },
      { id: "support", label: "Support", targeting: "ally" },
    ], run() {} },
  ] });
  const playerModes = playerView.actions.find((a) => a.key === "modes").modes;
  assert.deepEqual(playerModes.find((m) => m.id === "hostile").targets, ["galloz"]);
  assert.deepEqual(playerModes.find((m) => m.id === "support").targets, ["player"]);

  const controller = unit("falconController", "enemy", {}, "falcon");
  const playerTaunter = unit("galloz", "ally", { taunt: taunt(2) }, "serpent");
  const playerOther = unit("verra", "ally", {}, "serpent");
  const controllerView = viewFor(controller, [controller, playerTaunter, playerOther], {}, () => [
    { key: "modes", name: "Modes", targeting: "mode", usable: true, modes: [
      { id: "hostile", label: "Hostile", targeting: "enemy" },
      { id: "support", label: "Support", targeting: "ally" },
    ] },
  ]);
  const controllerModes = controllerView.actions.find((a) => a.key === "modes").modes;
  assert.deepEqual(controllerModes.find((m) => m.id === "hostile").targets, ["galloz"]);
  assert.deepEqual(controllerModes.find((m) => m.id === "support").targets, ["falconController"]);
});


 test("Taunt ignores untargetable or ineligible summon Taunters and can fall through to another Taunter", () => {
  const actor = unit("enemyController", "enemy", {}, "falcon");
  const hidden = unit("hiddenSummon", "ally", { taunt: taunt(5) }, "serpent", { summon: true, targetableByEnemy: false });
  const untargetable = unit("untargetable", "ally", { taunt: taunt(4), untargetable: { untargetable: true } }, "phantom");
  const eligible = unit("eligible", "ally", { taunt: taunt(2) }, "serpent");
  const view = viewFor(actor, [actor, hidden, untargetable, eligible], {}, () => []);
  assert.deepEqual(view.actions.find((a) => a.type === "basic").targets, ["eligible"]);
});


 test("Taunt leaves targetless all-enemy actions available and does not invent a selected target", () => {
  const actor = unit("player", "ally");
  const galloz = unit("galloz", "enemy", { taunt: taunt(3) }, "serpent");
  const verra = unit("verra", "enemy", {}, "serpent");
  const view = viewFor(actor, [actor, galloz, verra], { player: [
    { key: "ultimate", name: "All-enemy ultimate", targeting: "none", cost: 0, run() {} },
  ] });
  const ultimate = view.actions.find((a) => a.key === "ultimate");
  assert.equal(ultimate.targeting, "none");
  assert.deepEqual(ultimate.targets, []);
  assert.deepEqual(view.actions.find((a) => a.type === "basic").targets, ["galloz"]);
});
