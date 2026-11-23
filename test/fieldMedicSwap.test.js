const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../core/eventBus");
const { playFieldMedicSwap, summarizeSwapBattle, PHANTOM_IDS, createHybridFalconParty } = require("../tools/lib/fieldMedicSwap");

test("temporary Phantom replacement keeps five unique Falcon-side slots and the normal roster unchanged", () => {
  for (const substituteId of PHANTOM_IDS) {
    const party = createHybridFalconParty({ side: "ally", substituteId });
    assert.equal(party.length, 5);
    assert.equal(new Set(party.map((actor) => actor.id)).size, 5);
    assert.ok(party.every((actor) => actor.faction === "falcon"));
    const replacement = party.find((actor) => actor.skillSet === substituteId);
    assert.ok(replacement);
    assert.notEqual(replacement.id, substituteId);
    assert.equal(replacement.skillSet, substituteId);
  }
});

test("a temporary Phantom substitute can use its skill kit in a real side-balanced duel", async () => {
  const battle = await playFieldMedicSwap({ seed: 81024, substituteId: "elishia_p", hybridSide: "ally", maxActive: 3, events: createEventBus({ record: true }) });
  const summary = summarizeSwapBattle(battle, "elishia_p", "ally");
  assert.ok(["VICTORY", "DEFEAT", "DRAW"].includes(battle.result));
  assert.equal(summary.rejectedDecisions, 0);
  assert.ok(battle.events.history.some((event) => event.type === "SkillUsed" && event.actorId === "phantom_trial_elishia_p" && event.skillKey === "aegis"));
  assert.equal(battle.state.party.roster.some((actor) => actor.id === "evalete"), false);
  assert.equal(battle.state.party.maxActive, 3);
  assert.equal(battle.state.enemyParty.maxActive, 3);
});
