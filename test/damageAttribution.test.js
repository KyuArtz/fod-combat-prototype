const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../core/eventBus");
const { playHeadless } = require("../tools/lib/headless");
const { summarizeBattle } = require("../tools/simulate");

test("DamageApplied events preserve source attribution and the simulator aggregates damage contribution", async () => {
  const seed = 20261122;
  const events = createEventBus({ record: true });
  const battle = await playHeadless({ seed, policy: "random", policySeed: seed ^ 0x9e3779b9, events });
  const damageEvents = events.history.filter((event) => event.type === "DamageApplied");

  assert.ok(damageEvents.length > 0);
  assert.ok(damageEvents.some((event) => event.sourceSide === "ally"));
  assert.ok(damageEvents.some((event) => event.sourceSide === "enemy"));
  for (const event of damageEvents) {
    assert.ok(Object.hasOwn(event, "sourceId"));
    assert.ok(["ally", "enemy", null].includes(event.sourceSide));
    assert.ok(["direct", "reflected", "dot"].includes(event.kind));
  }

  const row = summarizeBattle({ ...battle, events }, 1, seed);
  assert.ok(row.damageDealtByAllies > 0);
  assert.ok(row.damageDealtByEnemies > 0);
  assert.ok(Object.keys(row.perActorDealt).length > 0);
  assert.ok(Object.values(row.perActorDealt).some((actor) => actor.damageDealt > 0));
});

test("Toxic Stalker damage-over-time ticks retain the source actor attribution", async () => {
  const events = createEventBus({ record: true });
  let selected = false;
  const enemy = {
    chooseAction(view) {
      if (view.actor.id === "toxic-stalker" && !selected) {
        const action = view.actions.find((candidate) => candidate.type === "enemySkill" && candidate.key === "venomStrike" && candidate.usable);
        if (action?.targets.length) {
          selected = true;
          return { type: "enemySkill", skillKey: "venomStrike", targetId: action.targets[0] };
        }
      }
      const basic = view.actions.find((candidate) => candidate.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  await playHeadless({ seed: 20261129, events, controllers: { enemy } });
  assert.equal(selected, true);
  assert.ok(events.history.some((event) => event.type === "DamageApplied" && event.kind === "dot" && event.sourceId === "toxic-stalker"));
});
