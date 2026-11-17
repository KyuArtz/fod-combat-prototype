const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { ELISHIA_SCENARIOS, playElishiaScenario } = require("../tools/lib/elishiaScenarios");

// Elishia-dense golden scenarios: every skill and every Nano Swarm mode is used
// repeatedly. The recorded engine log, random-number state and final unit states
// must be reproduced exactly. If Elishia's behavior is changed ON PURPOSE,
// regenerate with: node tools/updateGolden.js

function readGolden(name) {
  const file = path.join(__dirname, "fixtures", "golden", `${name}.json.gz`);
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString("utf8"));
}

function firstLogDifference(expected, actual) {
  const length = Math.max(expected.length, actual.length);
  for (let index = 0; index < length; index++) {
    if (expected[index] !== actual[index]) {
      return `log line ${index + 1}\n  expected: ${expected[index]}\n  actual:   ${actual[index]}`;
    }
  }
  return null;
}

for (const scenario of ELISHIA_SCENARIOS) {
  test(`golden Elishia scenario: ${scenario.name} (seed ${scenario.seed}${scenario.maxActive ? `, ${scenario.maxActive} active` : ""})`, async () => {
    const expected = readGolden(scenario.name);
    // Compare through JSON so undefined fields behave like the stored file.
    const actual = JSON.parse(JSON.stringify(await playElishiaScenario(scenario)));
    const difference = firstLogDifference(expected.log, actual.log);
    assert.equal(difference, null, `diverged at ${difference}`);
    assert.equal(actual.result, expected.result);
    assert.equal(actual.rounds, expected.rounds);
    assert.deepEqual(actual.rng, expected.rng);
    assert.deepEqual(actual.units, expected.units);
  });
}
