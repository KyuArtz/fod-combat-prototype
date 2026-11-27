const test = require("node:test");
const assert = require("node:assert/strict");
const { buildTurnView } = require("../core/turnView");


function unit(id, side, statuses = {}, faction = null) {
  return {
    id, name: id, side, faction, role: "stalker", mastery: "Kinetic", skillSet: id,
    summon: false, targetableByEnemy: true, hp: 100, alive: true, mp: 40,
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


test("player TurnView restricts basic, hostile skills, and hostile modes to active Taunter", () => {
  const actor = unit("player", "ally");
  const galloz = unit("galloz", "enemy", { tyrantsGuardTaunt: { taunt: true, turns: 2 } }, "serpent");
  const lucaz = unit("lucaz", "enemy", { bastionTaunt: { taunt: true, turns: 1 } }, "phantom");
  const verra = unit("verra", "enemy");
  const view = viewFor(actor, [actor, lucaz, galloz, verra], { player: [
    { key: "single", name: "Single", cost: 1, targeting: "enemy", run() {} },
    { key: "modes", name: "Modes", cost: 1, targeting: "mode", modes: [
      { id: "hostile", label: "Hostile", targeting: "enemy" },
      { id: "support", label: "Support", targeting: "ally" },
    ], run() {} },
  ] });
  assert.deepEqual(view.actions.find((a) => a.type === "basic").targets, ["galloz"]);
  assert.deepEqual(view.actions.find((a) => a.key === "single").targets, ["galloz"]);
  const modes = view.actions.find((a) => a.key === "modes").modes;
  assert.deepEqual(modes.find((m) => m.id === "hostile").targets, ["galloz"]);
  assert.deepEqual(modes.find((m) => m.id === "support").targets, ["player"]);
});


test("enemy-side TurnView restricts hostile basic and skills but leaves friendly targeting untouched", () => {
  const actor = unit("falcon", "enemy", {}, "falcon");
  const galloz = unit("galloz", "ally", { tyrantsGuardTaunt: { taunt: true, turns: 2 } }, "serpent");
  const verra = unit("verra", "ally", {}, "serpent");
  const view = viewFor(actor, [actor, galloz, verra], {}, () => [
    { key: "hostile", name: "Hostile", cost: 0, targeting: "enemy", usable: true },
    { key: "friendly", name: "Friendly", cost: 0, targeting: "ally", usable: true },
  ]);
  assert.deepEqual(view.actions.find((a) => a.type === "basic").targets, ["galloz"]);
  assert.deepEqual(view.actions.find((a) => a.key === "hostile").targets, ["galloz"]);
  assert.deepEqual(view.actions.find((a) => a.key === "friendly").targets, ["falcon"]);
});


test("neutral enemy skill targeting player-side allies is Taunt-filtered", () => {
  const actor = unit("drone", "enemy");
  const galloz = unit("galloz", "ally", { bastionTaunt: { taunt: true, turns: 1 } });
  const verra = unit("verra", "ally");
  const view = viewFor(actor, [actor, galloz, verra], {}, () => [
    { key: "attack", name: "Attack", cost: 0, targeting: "ally", usable: true },
  ]);
  assert.deepEqual(view.actions.find((a) => a.key === "attack").targets, ["galloz"]);
});


test("expired Taunt and untargetable Taunters do not restrict hostile target lists", () => {
  const actor = unit("player", "ally");
  const galloz = unit("galloz", "enemy", { taunt: { taunt: true, turns: 0 } });
  const verra = unit("verra", "enemy");
  const view = viewFor(actor, [actor, galloz, verra], { player: [] });
  assert.deepEqual(view.actions.find((a) => a.type === "basic").targets, ["galloz", "verra"]);
  galloz.statuses.taunt.turns = 3;
  galloz.statuses.untargetable = { untargetable: true, turns: 1 };
  const untargetableView = viewFor(actor, [actor, galloz, verra], { player: [] });
  assert.deepEqual(untargetableView.actions.find((a) => a.type === "basic").targets, ["verra"]);
});
