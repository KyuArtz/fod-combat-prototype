const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattle } = require("../core/battle");
const { createEventBus } = require("../core/eventBus");
const { createPhantomParty } = require("../characters/phantom");
const { makeActor } = require("../characters/actorFactory");

test("renamed actors resolve player skills through skillSet rather than display ID", async () => {
  const actor = createPhantomParty({ side: "ally" }).find((unit) => unit.id === "elishia_p");
  actor.id = "phantom_trial_unknown";
  actor.name = "Unknown";
  actor.faction = "falcon";
  const dummy = makeActor({
    id: "training_target",
    name: "Training Target",
    side: "enemy",
    faction: "test",
    stats: { HP: 50000, MP: 0, ATK: 1, MPow: 1, DEF: 1, RES: 1, SPD: 1, Evasion: 0, CritRate: 0 },
  });
  const events = createEventBus({ record: true });
  const battle = createBattle({
    output: { log() {} },
    seed: 81023,
    events,
    partyFactory: () => [actor],
    partyOrder: [actor.id],
    opponentFactory: () => [dummy],
    maxActive: 1,
    enemyMaxActive: 1,
    controllers: {
      player: { chooseAction(view) {
        const action = view.actions.find((item) => item.type === "skill" && item.key === "severance" && item.usable);
        if (action) return { type: "skill", skillKey: action.key, targetId: action.targets[0] };
        const basic = view.actions.find((item) => item.type === "basic");
        return { type: "basic", targetId: basic.targets[0] };
      } },
      enemy: { chooseAction(view) { return { type: "basic", targetId: view.actions.find((item) => item.type === "basic").targets[0] }; } },
    },
  });
  try {
    await battle.run();
    assert.ok(events.history.some((event) => event.type === "SkillUsed" && event.actorId === "phantom_trial_unknown" && event.skillKey === "severance"));
    assert.equal(events.history.filter((event) => event.type === "DecisionRejected").length, 0);
  } finally {
    battle.close();
  }
});
