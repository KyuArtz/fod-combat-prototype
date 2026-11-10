const test = require("node:test");
const assert = require("node:assert/strict");
const { createBattle } = require("../core/battle");
const { createEventBus } = require("../core/eventBus");
const {
  createBasicAttackController,
  createDecisionRecorder,
  createRandomController,
  createScriptedController,
} = require("../core/controllers");
const { playHeadless, DEFAULT_PARTY_ORDER } = require("../tools/lib/headless");
const { playTranscript } = require("../tools/lib/transcript");

// Menu-only messages the terminal controller prints (and, as before, records in
// state.log). They are not battle events, so replays never contain them.
const UI_ONLY_LINES = new Set(["No valid target selected.", "Invalid formation slot."]);
const engineLog = (state) => state.log.filter((line) => !UI_ONLY_LINES.has(line));

// Everything about every unit that a replay must reproduce.
function unitSnapshot(state) {
  const units = new Map();
  for (const party of [state.party, state.enemyParty]) {
    for (const unit of [...party.active, ...party.reserve]) units.set(unit, true);
  }
  for (const unit of state.actors) units.set(unit, true);
  return [...units.keys()].map((unit) => ({
    id: unit.id, alive: unit.alive, hp: unit.hp, mp: unit.mp, cr: unit.cr,
    cooldowns: unit.cooldowns, shield: unit.shield, statuses: unit.statuses,
  }));
}

const collect = (events, type) => {
  const seen = [];
  events.on(type, (event) => seen.push(event));
  return seen;
};

test("a fully headless battle needs no terminal: controllers + partyOrder never touch stdin", async () => {
  const stdin = new Proxy({}, { get() { throw new Error("stdin was touched"); } });
  const battle = createBattle({
    input: stdin,
    output: { log() {} },
    seed: 11,
    partyOrder: DEFAULT_PARTY_ORDER,
    controllers: { player: createBasicAttackController() },
  });
  const result = await battle.run();
  battle.close();
  assert.ok(result === "VICTORY" || result === "DEFEAT");
});

test("events: FormationSelected once, ActionChosen per accepted action, payloads are plain data", async () => {
  const events = createEventBus();
  const formation = collect(events, "FormationSelected");
  const chosen = collect(events, "ActionChosen");
  const rejected = collect(events, "DecisionRejected");
  const { picks } = await playHeadless({ seed: 5, events });
  assert.equal(formation.length, 1);
  assert.deepEqual(formation[0].ids, DEFAULT_PARTY_ORDER);
  assert.equal(rejected.length, 0);
  // Every scheduler pick is one turn, and every turn is exactly one accepted action.
  assert.equal(chosen.length, picks.length);
  assert.ok(chosen.every((event) => structuredClone(event.decision) && ["player", "enemy", "summon"].includes(event.kind)));
  assert.ok(chosen.some((event) => event.kind === "enemy"));
  assert.ok(chosen.some((event) => event.kind === "player" && event.decision.type === "basic"));
});

test("views handed to controllers are plain data with consistent targets", async () => {
  const views = [];
  const random = createRandomController({ seed: 3, allowSwitch: true });
  // Elishia deploys Meo-9 whenever she can, so summon turns are guaranteed to occur.
  const inner = {
    chooseAction(view, context) {
      const meo = view.actions.find((action) => action.type === "skill" && action.key === "meo" && action.usable);
      return meo ? { type: "skill", skillKey: "meo" } : random.chooseAction(view, context);
    },
  };
  const spy = (controller) => ({
    chooseAction(view, context) {
      views.push(view);
      return controller.chooseAction(view, context);
    },
  });
  for (const seed of [1, 2, 3]) {
    await playHeadless({ seed, maxActive: 3, controllers: { player: spy(inner), enemy: spy(createRandomController({ seed: seed + 50 })), summon: spy({ chooseAction: () => ({ type: "summonAuto" }) }) } });
  }
  assert.ok(views.length > 100);
  assert.ok(views.some((view) => view.kind === "summon"), "a Meo-9 turn should appear");
  assert.ok(views.some((view) => view.actions.some((action) => action.type === "enemySkill")));
  for (const view of views) {
    assert.deepEqual(structuredClone(view), view);
    const ids = new Set([...view.allies, ...view.enemies].map((unit) => unit.id));
    assert.equal(ids.size, view.allies.length + view.enemies.length, "target ids are unique");
    for (const action of view.actions) {
      const lists = [action.targets, ...(action.modes || []).map((mode) => mode.targets)].filter(Boolean);
      for (const targets of lists) for (const id of targets) assert.ok(ids.has(id), `${id} not in view`);
    }
  }
});

test("fuzz: random player AND random enemy controllers always finish with legal actions only", { timeout: 120000 }, async () => {
  for (let seed = 1; seed <= 60; seed++) {
    const events = createEventBus();
    const rejected = collect(events, "DecisionRejected");
    const { result, picks } = await playHeadless({
      seed,
      events,
      maxActive: seed % 2 ? 3 : undefined,
      controllers: {
        player: createRandomController({ seed: seed * 7, allowSwitch: true }),
        enemy: createRandomController({ seed: seed * 13 }),
      },
    });
    assert.ok(result === "VICTORY" || result === "DEFEAT", `seed ${seed}: ${result}`);
    assert.equal(rejected.length, 0, `seed ${seed}: ${JSON.stringify(rejected[0])}`);
    assert.ok(picks.length < 5000, `seed ${seed}: ran ${picks.length} turns`);
  }
});

test("the enemy controller is interchangeable: a custom enemy never uses the built-in AI skills", async () => {
  const targetLast = { chooseAction: (view) => ({ type: "basic", targetId: view.actions.find((a) => a.type === "basic").targets.at(-1) }) };
  let builtInSkillLines = 0;
  let customSkillLines = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const a = await playHeadless({ seed });
    builtInSkillLines += a.state.log.filter((line) => /PULSE SHOT|HEAVY STRIKE|OVERLOAD|scans/.test(line)).length;
    const b = await playHeadless({ seed, controllers: { enemy: targetLast } });
    customSkillLines += b.state.log.filter((line) => /PULSE SHOT|HEAVY STRIKE|OVERLOAD|scans/.test(line)).length;
  }
  assert.ok(builtInSkillLines > 0, "the built-in AI should use skills");
  assert.equal(customSkillLines, 0);
});

// --- Record and replay -------------------------------------------------------

async function recordTerminalBattle(scenario) {
  const events = createEventBus();
  const recording = createDecisionRecorder(events);
  const played = await playTranscript({ ...scenario, battleOptions: { events } });
  return { recording, played };
}

for (const scenario of [
  { name: "5v5", seed: 101, chaosSeed: 1 },
  { name: "3 active + 2 reserve with switching", seed: 404, chaosSeed: 4, maxActive: 3 },
]) {
  test(`replay: a terminal battle (${scenario.name}) is reproduced exactly by seed + formation + recorded decisions`, async () => {
    const { recording, played } = await recordTerminalBattle(scenario);
    assert.ok(recording.decisions.length > 20);
    assert.equal(recording.formation.length, 5);

    const replay = await playHeadless({
      seed: scenario.seed,
      partyOrder: recording.formation,
      maxActive: scenario.maxActive,
      controllers: { player: createScriptedController(recording.decisions) },
    });
    assert.equal(replay.result, played.result);
    assert.deepEqual(engineLog(replay.state), engineLog(played.state));
    assert.deepEqual(replay.state.rng, played.state.rng, "the replay consumed exactly the same random numbers");
    assert.equal(replay.state.round, played.state.round);
    assert.deepEqual(unitSnapshot(replay.state), unitSnapshot(played.state));
    assert.ok(played.state.log.length > engineLog(played.state).length, "the chaos run really did hit menu-only messages");
  });
}

test("replay: recorded decisions survive a JSON round trip", async () => {
  const { recording, played } = await recordTerminalBattle({ seed: 202, chaosSeed: 2 });
  const copy = JSON.parse(JSON.stringify(recording));
  const replay = await playHeadless({
    seed: 202,
    partyOrder: copy.formation,
    controllers: { player: createScriptedController(copy.decisions) },
  });
  assert.deepEqual(engineLog(replay.state), engineLog(played.state));
  assert.deepEqual(unitSnapshot(replay.state), unitSnapshot(played.state));
});

test("replay: a drifted script fails loudly, naming the decision, instead of silently diverging", async () => {
  const { recording } = await recordTerminalBattle({ seed: 101, chaosSeed: 1 });
  const wrongActor = recording.decisions.map((entry, index) => (index === 3 ? { ...entry, actorId: "someone-else" } : entry));
  await assert.rejects(
    playHeadless({ seed: 101, partyOrder: recording.formation, controllers: { player: createScriptedController(wrongActor) } }),
    /Replay desync at decision 4/,
  );
  await assert.rejects(
    playHeadless({ seed: 101, partyOrder: recording.formation, controllers: { player: createScriptedController(recording.decisions.slice(0, 5)) } }),
    /ran out of decisions/,
  );
});

// --- Invalid decisions --------------------------------------------------------

test("an invalid decision is rejected with a reason and the controller is asked again", async () => {
  const events = createEventBus();
  const rejected = collect(events, "DecisionRejected");
  const basic = createBasicAttackController();
  let calls = 0;
  const flaky = {
    chooseAction(view, context) {
      calls++;
      return calls === 1 ? { type: "basic", targetId: "nobody" } : basic.chooseAction(view, context);
    },
  };
  const { result } = await playHeadless({ seed: 8, events, controllers: { player: flaky } });
  assert.ok(result === "VICTORY" || result === "DEFEAT");
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason, "invalid-target");
  assert.equal(rejected[0].kind, "player");
  assert.deepEqual(rejected[0].decision, { type: "basic", targetId: "nobody" });
});

test("a controller that never produces a legal action stops the battle with a clear error", async () => {
  const events = createEventBus();
  const rejected = collect(events, "DecisionRejected");
  await assert.rejects(
    playHeadless({ seed: 9, events, controllers: { player: { chooseAction: () => ({ type: "teleport" }) } } }),
    /player controller for \w+ did not produce a valid action after 10 attempts \(last problem: unknown-decision-type\)/,
  );
  assert.equal(rejected.length, 10);
  const nothing = await playHeadless({ seed: 9, controllers: { player: () => undefined } }).catch((error) => error);
  assert.match(nothing.message, /malformed-decision/);
});

test("controllers may be plain functions, and may be async", async () => {
  const basic = createBasicAttackController();
  const { result } = await playHeadless({
    seed: 4,
    controllers: { player: async (view, context) => basic.chooseAction(view, context) },
  });
  assert.ok(result === "VICTORY" || result === "DEFEAT");
});

// --- Option validation ---------------------------------------------------------

test("option validation: unknown controller names, non-controllers and bad party orders are rejected", async () => {
  assert.throws(() => createBattle({ controllers: { boss: () => ({}) } }), /Unknown controller "boss"/);
  assert.throws(() => createBattle({ controllers: { player: 42 } }), TypeError);
  assert.throws(() => createBattle({ partyOrder: "zenki" }), /partyOrder must be an array/);
  await assert.rejects(playHeadless({ seed: 1, partyOrder: ["zenki", "elishia"] }), /partyOrder must list each roster member exactly once/);
  await assert.rejects(
    playHeadless({ seed: 1, partyOrder: ["zenki", "zenki", "jazen", "evalete", "zackry"] }),
    /partyOrder must list each roster member exactly once/,
  );
  await assert.rejects(
    playHeadless({ seed: 1, partyOrder: ["zenki", "elishia", "jazen", "evalete", "mystery"] }),
    /partyOrder must list each roster member exactly once/,
  );
});
