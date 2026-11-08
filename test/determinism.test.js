const test = require("node:test");
const assert = require("node:assert/strict");
const { PassThrough, Writable } = require("node:stream");
const { createBattle } = require("../core/battle");
const { createBattleLog } = require("../ui/battleLog");
const { createBattleState } = require("../core/battleState");
const { createEventBus } = require("../core/eventBus");
const { nextFloat } = require("../core/rng");

// Plays a whole battle with a fixed list of menu answers (party pick, then "1"
// for everything else) and returns what was printed, the Log events and the result.
async function playScripted({ seed }) {
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
  const logEvents = [];
  const battle = createBattle({
    input,
    promptOutput: prompts,
    output: { log: (...args) => lines.push(args.join(" ")) },
    seed,
  });
  battle.events.on("Log", (event) => logEvents.push(event));
  try {
    const result = await battle.run();
    return { result, lines, logEvents, state: battle.state };
  } finally {
    battle.close();
  }
}

test("same seed and same choices replay the exact same battle", async () => {
  const first = await playScripted({ seed: 2026 });
  const second = await playScripted({ seed: 2026 });
  assert.equal(first.result, second.result);
  assert.deepEqual(first.lines, second.lines);
  assert.ok(first.lines.length > 100, "a full battle should have been played");
});

test("different seeds produce different battles (crits and enemy rolls vary)", async () => {
  const logs = new Set();
  for (const seed of [1, 2, 3, 4]) {
    logs.add((await playScripted({ seed })).lines.join("\n"));
  }
  assert.ok(logs.size > 1, "seeds should change the battle");
});

test("the seed is printed so a battle can be replayed, and kept on the state", async () => {
  const { lines, state } = await playScripted({ seed: 555 });
  assert.ok(lines.includes("Seed: 555"));
  assert.equal(state.rng.seed, 555);
});

test("terminal output, state.log and Log events all carry the same lines", async () => {
  const { lines, logEvents, state } = await playScripted({ seed: 31337 });
  assert.deepEqual(logEvents.map((event) => event.message), state.log);
  // Everything say() printed appears, in order, in the console output.
  let cursor = 0;
  for (const message of state.log) {
    const found = lines.indexOf(message, cursor);
    assert.notEqual(found, -1, `missing from console: ${message}`);
    cursor = found + 1;
  }
  assert.ok(logEvents.every((event, index) => event.seq === index + 1 && Number.isInteger(event.round)));
});

test("battle state with its RNG can be cloned and continues identically", () => {
  const state = createBattleState({ seed: 8080 });
  for (let index = 0; index < 11; index++) nextFloat(state.rng);
  const preview = structuredClone(state);
  const real = Array.from({ length: 20 }, () => nextFloat(state.rng));
  const previewed = Array.from({ length: 20 }, () => nextFloat(preview.rng));
  assert.deepEqual(previewed, real);
});

test("createBattleLog still works without a bus (backwards compatible)", () => {
  const state = createBattleState({ seed: 1 });
  const printed = [];
  const { say, events } = createBattleLog(state, { log: (line) => printed.push(line) });
  say("hello");
  assert.deepEqual(printed, ["hello"]);
  assert.deepEqual(state.log, ["hello"]);
  assert.equal(typeof events.on, "function");
});

test("a second subscriber on a shared bus sees log lines without touching console output", () => {
  const state = createBattleState({ seed: 1 });
  const events = createEventBus();
  const printed = [];
  const guiLines = [];
  const { say } = createBattleLog(state, { log: (line) => printed.push(line) }, events);
  events.on("Log", (event) => guiLines.push(event.message));
  say("one");
  say("two");
  assert.deepEqual(guiLines, ["one", "two"]);
  assert.deepEqual(printed, ["one", "two"]);
});
