const test = require("node:test");
const assert = require("node:assert/strict");
const { enemyTarget } = require("../ai/targeting");

test("enemy targeting respects Taunt stored under a skill-specific status ID", () => {
  const galloz = { id: "galloz", role: "juggernaut", hp: 900, stats: { HP: 1800 }, statuses: { tyrantsGuardTaunt: { taunt: true, turns: 2 } } };
  const verra = { id: "verra", role: "field-medic", hp: 100, stats: { HP: 1200 }, statuses: {} };
  const enemies = [{ id: "enemy", targetSelection: "weakest" }];
  const alive = (_state, side) => side === "ally" ? [verra, galloz] : enemies;
  assert.equal(enemyTarget({ actors: [galloz, verra, ...enemies] }, enemies[0], alive), galloz,
    "Taunt must override weakest-target selection even when the medic is critically wounded");
});

test("enemy targeting ignores expired/non-taunt statuses and respects untargetable status", () => {
  const galloz = { id: "galloz", hp: 900, stats: { HP: 1800 }, statuses: { tyrantsGuardTaunt: { taunt: false, turns: 0 } } };
  const verra = { id: "verra", hp: 100, stats: { HP: 1200 }, statuses: {} };
  const actor = { targetSelection: "weakest" };
  const alive = (_state, side) => side === "ally" ? [galloz, verra] : [];
  assert.equal(enemyTarget({}, actor, alive), verra);
  galloz.statuses.tyrantsGuardTaunt.taunt = true;
  galloz.statuses.untargetable = { untargetable: true, turns: 1 };
  assert.equal(enemyTarget({}, actor, alive), verra, "untargetable Taunter should not be selected");
});

test("enemy targeting ignores a lingering Taunt payload whose duration has run out", () => {
  const galloz = { id: "galloz", hp: 900, stats: { HP: 1800 }, statuses: { tyrantsGuardTaunt: { taunt: true, turns: 0 } } };
  const verra = { id: "verra", hp: 100, stats: { HP: 1200 }, statuses: {} };
  const alive = (_state, side) => side === "ally" ? [galloz, verra] : [];
  assert.equal(enemyTarget({}, { targetSelection: "weakest" }, alive), verra);
});

test("with several taunters the longest remaining Taunt wins, and ties keep formation order", () => {
  const lucaz = { id: "lucaz", hp: 900, stats: { HP: 1800 }, statuses: { taunt: { taunt: true, turns: 1 } } };
  const galloz = { id: "galloz", hp: 900, stats: { HP: 1800 }, statuses: { tyrantsGuardTaunt: { taunt: true, turns: 2 } } };
  const verra = { id: "verra", hp: 100, stats: { HP: 1200 }, statuses: {} };
  const actor = { targetSelection: "weakest" };
  assert.equal(enemyTarget({}, actor, () => [lucaz, galloz, verra]), galloz);
  assert.equal(enemyTarget({}, actor, () => [galloz, lucaz, verra]), galloz, "order must not decide when durations differ");
  lucaz.statuses.taunt.turns = 2;
  assert.equal(enemyTarget({}, actor, () => [lucaz, galloz, verra]), lucaz, "ties keep formation order");
});

test("hasActiveTaunt recognises Taunt under any status ID and ignores expired ones", () => {
  const { hasActiveTaunt } = require("../ai/targeting");
  assert.equal(hasActiveTaunt({ statuses: { tyrantsGuardTaunt: { taunt: true, turns: 2 } } }), true);
  assert.equal(hasActiveTaunt({ statuses: { taunt: { taunt: true } } }), true, "no duration means it lasts");
  assert.equal(hasActiveTaunt({ statuses: { tyrantsGuardTaunt: { taunt: true, turns: 0 } } }), false);
  assert.equal(hasActiveTaunt({ statuses: { bastionDef: { stat: "DEF", amount: 25, turns: 2 } } }), false);
  assert.equal(hasActiveTaunt({}), false);
});

test("Phantom Lucaz does not recast Bastion while any Taunt is already active on him", () => {
  const { choosePhantomAction } = require("../ai/phantomTactics");
  const makeView = (statuses) => ({
    kind: "player",
    actor: { id: "lucaz", skillSet: "lucaz", hp: 500, maxHp: 1000, statuses },
    friendlies: [{ id: "lucaz", hp: 500, maxHp: 1000, statuses }],
    opponents: [{ id: "enemy-1", role: "stalker", hp: 1000, maxHp: 1000, statuses: {} }],
    actions: [
      { type: "basic", targets: ["enemy-1"] },
      { type: "skill", key: "bastion", usable: true, targets: [] },
    ],
  });
  assert.equal(choosePhantomAction(makeView({}))?.skillKey, "bastion", "wounded Lucaz without Taunt braces");
  assert.notEqual(choosePhantomAction(makeView({ customTaunt: { taunt: true, turns: 2 } }))?.skillKey, "bastion");
});
