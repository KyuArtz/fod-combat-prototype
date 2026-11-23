const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattle } = require("../core/battle");
const { createEventBus } = require("../core/eventBus");
const { createPhantomParty } = require("../characters/phantom");

const PARTY_ORDER = ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"];
const SKILL_PRIORITY = {
  mirazhel: ["veil", "ultimate", "wraithfang", "requiem"],
  elishia_p: ["aegis", "ultimate", "phalanx", "severance"],
  lucaz: ["bastion", "ultimate", "faultline", "ironwake"],
  clarke: ["aegisReversal", "ultimate", "thousandfold", "riftpiercer"],
  liezli: ["refraction", "silverpoint", "ultimate", "ghostlight"],
};

function createPhantomSmokeController() {
  return {
    chooseAction(view) {
      for (const key of SKILL_PRIORITY[view.actor.id] || []) {
        const action = view.actions.find((item) => item.type === "skill" && item.key === key && item.usable);
        if (!action) continue;
        if (action.targeting === "none") return { type: "skill", skillKey: key };
        if (action.targets?.length) return { type: "skill", skillKey: key, targetId: action.targets[0] };
      }
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length
        ? { type: "basic", targetId: basic.targets[0] }
        : { type: "pass" };
    },
  };
}

test("full battle: all five Phantom kits execute through the shared battle runtime", async () => {
  const events = createEventBus({ record: true });
  const battle = createBattle({
    output: { log() {} },
    seed: 1234,
    partyFactory: createPhantomParty,
    partyOrder: PARTY_ORDER,
    symmetricEvasion: true,
    events,
    controllers: { player: createPhantomSmokeController() },
  });

  try {
    const result = await battle.run();
    const history = events.history;
    const skillUsers = new Set(history.filter((event) => event.type === "SkillUsed").map((event) => event.actorId));
    const rejected = history.filter((event) => event.type === "DecisionRejected");

    for (const id of PARTY_ORDER) {
      assert.ok(skillUsers.has(id), `${id} should execute at least one skill in a real battle`);
    }
    assert.equal(rejected.length, 0, "Phantom controller should produce only accepted decisions");
    assert.ok(["VICTORY", "DEFEAT"].includes(result));
    assert.ok(battle.state.round > 1, "battle should progress beyond initial setup");

    const hiddenOperative = battle.state.actors.find((actor) => actor.id === "elishia_p");
    assert.equal(hiddenOperative.name, "Unknown", "the hidden operative remains neutral in battle-facing output");
    assert.ok(!battle.state.log.some((line) => /The Phantom Sovereign|Elishia Bluestein/i.test(line)));
  } finally {
    battle.close();
  }
});
