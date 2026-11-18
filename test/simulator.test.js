const test = require("node:test");
const assert = require("node:assert/strict");
const { parseArgs, renderCsv, simulateBattles } = require("../tools/simulate");

test("simulator CLI parses supported options and rejects invalid values", () => {
  assert.deepEqual(parseArgs(["-n", "12", "--seed", "99", "--scheduler", "legacy", "--opening", "speed", "--policy", "basic", "--encounter", "droneCalibration", "--format", "json"]), {
    battles: 12, seed: 99, scheduler: "legacy", opening: "speed", policy: "basic", encounter: "droneCalibration", format: "json", out: null,
  });
  assert.throws(() => parseArgs(["--battles", "0"]), /--battles/);
  assert.throws(() => parseArgs(["--scheduler", "unknown"]), /--scheduler/);
  assert.throws(() => parseArgs(["--policy", "unknown"]), /--policy/);
  assert.throws(() => parseArgs(["--encounter", "unknown"]), /--encounter/);
  assert.throws(() => parseArgs(["--format", "xml"]), /--format/);
});

test("headless simulator returns complete aggregate and per-battle metrics", async () => {
  const report = await simulateBattles({ battles: 2, seed: 31, policy: "random" });
  assert.equal(report.summary.battles, 2);
  assert.equal(report.config.encounter, "trainingGround");
  assert.equal(report.battles.length, 2);
  assert.equal(report.battles[0].seed, 31);
  assert.equal(report.battles[1].seed, 32);
  assert.ok(["VICTORY", "DEFEAT"].includes(report.battles[0].result));
  assert.ok(report.summary.averageTurns > 0);
  assert.ok(report.summary.averageSkills >= 0);
  assert.ok(report.summary.averageBasicAttacks > 0);
  assert.equal(report.summary.wins + report.summary.defeats + report.summary.draws, 2);
  assert.equal(report.summary.winRate, report.summary.wins / 2);
  assert.ok(Object.keys(report.battles[0].perActorReceived).length > 0);
});

test("same seed range and policy produce byte-equivalent simulation data", async () => {
  const config = { battles: 3, seed: 101, policy: "random", scheduler: "threshold", opening: "player-first" };
  const first = await simulateBattles(config);
  const second = await simulateBattles(config);
  assert.deepEqual(second, first);
});

test("CSV output has stable columns and one row per battle", async () => {
  const report = await simulateBattles({ battles: 2, seed: 8, policy: "basic" });
  const lines = renderCsv(report).trim().split("\n");
  assert.equal(lines.length, 3);
  assert.match(lines[0], /^index,seed,result,rounds,turns,/);
  assert.match(lines[1], /^1,8,(VICTORY|DEFEAT),/);
  assert.match(lines[2], /^2,9,(VICTORY|DEFEAT),/);
});


test("simulator can run a data-defined alternate encounter", async () => {
  const report = await simulateBattles({ battles: 1, seed: 77, encounter: "droneCalibration" });
  assert.equal(report.config.encounter, "droneCalibration");
  assert.deepEqual(Object.keys(report.battles[0].perActorReceived).length > 0, true);
});
