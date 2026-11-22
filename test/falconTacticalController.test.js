const test = require("node:test");
const assert = require("node:assert/strict");
const { playHeadless } = require("../tools/lib/headless");
const { createEventBus } = require("../core/eventBus");
const { createTacticalFalconController } = require("../ai/falconTactics");

for (const encounter of ["trainingGround", "blightheartSanctum"]) {
  test(`tactical Falcon controller completes a legal-action battle in ${encounter}`, { timeout: 120000 }, async () => {
    const events = createEventBus({ record: true });
    const rejected = [];
    const skills = [];
    events.on("DecisionRejected", (event) => rejected.push(event));
    const falconIds = new Set(["elishia", "evalete", "zackry", "jazen", "zenki"]);
    events.on("SkillUsed", (event) => { if (falconIds.has(event.actorId)) skills.push(event); });
    const battle = await playHeadless({
      seed: encounter === "trainingGround" ? 88101 : 88102,
      encounter,
      events,
      controllers: { player: createTacticalFalconController() },
    });
    assert.ok(["VICTORY", "DEFEAT"].includes(battle.result));
    assert.equal(rejected.length, 0, JSON.stringify(rejected.slice(0, 3)));
    assert.ok(skills.length >= 5, "tactical controller should use Falcon skills rather than only basic attacks");
    if (encounter === "blightheartSanctum") {
      assert.ok(battle.state.actors.some((unit) => unit.id.includes("blightheart-overseer")));
      assert.ok(battle.events.history.some((event) => event.type === "EncounterWaveStarted" && event.waveId === "heart-chamber"));
    }
  });
}

test("tactical controller is deterministic for an identical seed and encounter", { timeout: 120000 }, async () => {
  const options = { seed: 88103, encounter: "blightheartSanctum", controllers: { player: createTacticalFalconController() } };
  const first = await playHeadless(options);
  const second = await playHeadless({ ...options, controllers: { player: createTacticalFalconController() } });
  assert.equal(first.result, second.result);
  assert.equal(first.rounds, second.rounds);
  assert.deepEqual(first.state.log, second.state.log);
  assert.deepEqual(first.state.rng, second.state.rng);
});
