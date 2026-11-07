const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough, Writable } = require("node:stream");
const legacy = require("../systems/combatReadiness");
const threshold = require("../systems/thresholdCombatReadiness");
const { createBattle } = require("../core/battle");
const { createBattleState } = require("../core/battleState");
const { createFalconParty } = require("../characters/falcon");
const { createTrainingEnemies } = require("../characters/enemies");
const { effectiveStat } = require("../systems/statusEffects");
const { applyOpeningInitiative, DEFAULT_MARGIN } = require("../systems/openingInitiative");

// The real 5v5 development roster: fastest enemy (Recon Drone, 115) beats the
// fastest ally (Zenki, 110).
function realState() {
  const state = createBattleState({ seed: 1 });
  state.actors = [...createFalconParty(), ...createTrainingEnemies()];
  return state;
}
const statFor = (state) => (actor, stat) => effectiveStat(state, actor, stat);
const byName = (state, name) => state.actors.find((actor) => actor.name === name);

function pickOrder(scheduler, state, count) {
  const es = statFor(state);
  const names = [];
  for (let index = 0; index < count; index++) {
    const actor = scheduler.nextActor(state, es);
    names.push(actor.name);
    scheduler.resetCR(actor, state);
  }
  return names;
}

test("problem statement: with pure SPD order the enemy Recon Drone opens the real 5v5 battle", () => {
  const order = pickOrder(threshold, realState(), 3);
  assert.deepEqual(order, ["Recon Drone", "Zenki", "Elishia"]);
});

test("player-first opening: Zenki acts first, then Recon Drone, rest of the opening cycle unchanged", () => {
  const state = realState();
  const result = applyOpeningInitiative(state, statFor(state));
  assert.equal(result.applied, true);
  assert.equal(result.opener, "Zenki");
  assert.equal(result.side, "ally");
  const order = pickOrder(threshold, state, 10);
  assert.deepEqual(order, [
    "Zenki", "Recon Drone", "Elishia", "Zackry", "Toxic Stalker",
    "Evalete", "Jazen", "Training Drone", "Rogue Automaton", "Recon Drone",
  ]);
});

test("head start equals the readiness gap (plus margin), scaled by each ally's own SPD; enemies untouched", () => {
  const state = realState();
  const es = statFor(state);
  const gap = 100 / 115 - 100 / 110; // Recon ready time minus Zenki ready time (negative: Recon earlier)
  const result = applyOpeningInitiative(state, es);
  const expectedDelta = -gap + DEFAULT_MARGIN;
  assert.ok(Math.abs(result.deltaTime - expectedDelta) < 1e-12);
  for (const actor of state.actors) {
    if (actor.side === "ally") {
      assert.ok(Math.abs(actor.cr - actor.stats.SPD * expectedDelta) < 1e-9, actor.name);
      assert.ok(actor.cr < 100, `${actor.name} must not start ready`);
    } else {
      assert.equal(actor.cr, 0, actor.name);
    }
  }
});

test("only a head start in time: long-run turn counts stay SPD-proportional and in (shifted) time order", () => {
  const state = realState();
  const es = statFor(state);
  const { deltaTime } = applyOpeningInitiative(state, es);
  const spd = Object.fromEntries(state.actors.map((actor) => [actor.name, actor.stats.SPD]));
  const isAlly = Object.fromEntries(state.actors.map((actor) => [actor.name, actor.side === "ally"]));
  const turns = 800;
  const order = pickOrder(threshold, state, turns);

  // The k-th turn of an actor is due at k*100/SPD, minus the head start for allies.
  const taken = {};
  let previous = -Infinity;
  let inversions = 0;
  for (const name of order) {
    taken[name] = (taken[name] || 0) + 1;
    const due = (taken[name] * 100) / spd[name] - (isAlly[name] ? deltaTime : 0);
    if (due < previous - 1e-9) inversions++;
    previous = Math.max(previous, due);
  }
  assert.equal(inversions, 0);

  const totalSpeed = Object.values(spd).reduce((sum, value) => sum + value, 0);
  for (const name of Object.keys(spd)) {
    const expected = (turns * spd[name]) / totalSpeed;
    assert.ok(Math.abs(taken[name] - expected) <= 1.5, `${name}: ${taken[name]} vs ${expected.toFixed(1)}`);
  }
});

test("no-op when the player's side is already faster", () => {
  const state = realState();
  byName(state, "Zenki").stats.SPD = 140;
  const result = applyOpeningInitiative(state, statFor(state));
  assert.equal(result.applied, false);
  assert.equal(result.deltaTime, 0);
  assert.ok(state.actors.every((actor) => actor.cr === 0));
  assert.equal(pickOrder(threshold, state, 1)[0], "Zenki");
});

test("an exact speed tie goes to the player, regardless of array order or tie rotation", () => {
  const build = (enemiesFirst) => {
    const state = createBattleState({ seed: 1 });
    const allies = createFalconParty();
    const enemies = createTrainingEnemies();
    byName({ actors: enemies }, "Recon Drone").stats.SPD = 110; // tie with Zenki
    state.actors = enemiesFirst ? [...enemies, ...allies] : [...allies, ...enemies];
    return state;
  };
  for (const enemiesFirst of [false, true]) {
    const state = build(enemiesFirst);
    const result = applyOpeningInitiative(state, statFor(state));
    assert.equal(result.applied, true);
    assert.ok(Math.abs(result.deltaTime - DEFAULT_MARGIN) < 1e-12);
    assert.equal(pickOrder(threshold, state, 2)[0], "Zenki");
  }
});

test("the legacy scheduler also opens with the player after the rule is applied", () => {
  const state = realState();
  applyOpeningInitiative(state, statFor(state));
  assert.equal(pickOrder(legacy, state, 1)[0], "Zenki");
});

test("summons and downed units are ignored when finding the fastest unit", () => {
  const state = realState();
  const reconDrone = byName(state, "Recon Drone");
  reconDrone.alive = false;
  state.actors.push({ name: "Fast Summon", side: "ally", summon: true, alive: true, cr: 0, stats: { SPD: 500 }, statuses: {} });
  const result = applyOpeningInitiative(state, statFor(state));
  // Without Recon, Toxic Stalker (82) is the fastest enemy and Zenki (110) already leads.
  assert.equal(result.applied, false);
  assert.equal(result.opener, "Zenki");
});

test("firstSide can be flipped for future ambush encounters; invalid sides throw", () => {
  const state = realState();
  const result = applyOpeningInitiative(state, statFor(state), { firstSide: "enemy" });
  assert.equal(result.applied, false); // enemies are already faster
  assert.equal(result.opener, "Recon Drone");
  assert.throws(() => applyOpeningInitiative(state, statFor(state), { firstSide: "neutral" }), TypeError);
});

// --- Full battle integration -------------------------------------------------

async function playFirstActor({ seed, openingInitiative }) {
  const picks = [];
  const recording = {
    ...threshold,
    nextActor(state, es) {
      const actor = threshold.nextActor(state, es);
      if (actor) picks.push(actor);
      return actor;
    },
  };
  const setup = ["5", "1", "3", "1", "1", "1"];
  const input = new PassThrough();
  let answered = 0;
  const prompts = new Writable({
    write(chunk, encoding, done) {
      const answer = answered < setup.length ? setup[answered] : "1";
      answered++;
      setImmediate(() => input.write(`${answer}\n`));
      done();
    },
  });
  const lines = [];
  const events = [];
  const battle = createBattle({
    input,
    promptOutput: prompts,
    output: { log: (...args) => lines.push(args.join(" ")) },
    readinessScheduler: recording,
    seed,
    ...(openingInitiative ? { openingInitiative } : {}),
  });
  battle.events.on("OpeningInitiative", (event) => events.push(event));
  try {
    await battle.run();
    return { first: picks[0], second: picks[1], lines, events };
  } finally {
    battle.close();
  }
}

test("full battles: the player acts first by default, across seeds, and the log says so once", async () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const { first, second, lines, events } = await playFirstActor({ seed });
    assert.equal(first.side, "ally", `seed ${seed}`);
    assert.equal(first.name, "Zenki", `seed ${seed}`);
    assert.equal(second.name, "Recon Drone", `seed ${seed}`);
    assert.equal(lines.filter((line) => line === "The Falcon team seizes the initiative!").length, 1);
    assert.equal(events.length, 1);
    assert.deepEqual(structuredClone(events[0]), events[0], "event payload is plain data");
    assert.equal(events[0].opener, "Zenki");
  }
});

test('openingInitiative: "speed" keeps pure SPD order (Recon Drone opens) and logs nothing extra', async () => {
  const { first, lines, events } = await playFirstActor({ seed: 7, openingInitiative: "speed" });
  assert.equal(first.name, "Recon Drone");
  assert.ok(!lines.includes("The Falcon team seizes the initiative!"));
  assert.equal(events.length, 0);
});

test("unknown openingInitiative values are rejected before anything starts", () => {
  assert.throws(() => createBattle({ openingInitiative: "enemy-first" }), /openingInitiative/);
});
