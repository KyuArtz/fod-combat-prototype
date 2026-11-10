const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { playTranscript, SCENARIOS } = require("../tools/lib/transcript");

// Golden transcripts: full battles played through the terminal UI with seeded
// "chaos" answers (valid and invalid), recorded from the pre-controller build.
// Any refactor of the turn flow must reproduce them byte for byte. If output is
// changed ON PURPOSE, regenerate with: node tools/updateGolden.js

function readGolden(name) {
  const file = path.join(__dirname, "fixtures", "golden", `${name}.txt.gz`);
  return zlib.gunzipSync(fs.readFileSync(file)).toString("utf8").replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
}

function firstDifference(expected, actual) {
  const length = Math.max(expected.length, actual.length);
  for (let index = 0; index < length; index++) {
    if (expected[index] !== actual[index]) {
      const around = (lines) => lines.slice(Math.max(0, index - 2), index + 3).join("\n    ");
      return `line ${index + 1}\n  expected:\n    ${around(expected)}\n  actual:\n    ${around(actual)}`;
    }
  }
  return null;
}

for (const scenario of SCENARIOS) {
  test(`golden transcript: ${scenario.name} (seed ${scenario.seed}, chaos ${scenario.chaosSeed}${scenario.maxActive ? `, ${scenario.maxActive} active` : ""})`, async () => {
    const expected = readGolden(scenario.name);
    const { transcript } = await playTranscript(scenario);
    // Some console entries contain embedded newlines; normalise to physical lines.
    const actual = transcript.join("\n").split("\n");
    const difference = firstDifference(expected, actual);
    assert.equal(difference, null, `transcript diverged at ${difference}`);
    assert.equal(actual.length, expected.length);
  });
}
