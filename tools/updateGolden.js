// Regenerates test/fixtures/golden/*.txt.gz from the CURRENT code.
//
//   node tools/updateGolden.js
//
// Only run this when battle output or interaction order is changed on purpose
// (new menu text, new prompts, rebalanced numbers). Review the resulting diff of
// behavior before committing: the golden files are what protects refactors.

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { playTranscript, SCENARIOS } = require("./lib/transcript");

async function main() {
  const directory = path.join(__dirname, "..", "test", "fixtures", "golden");
  fs.mkdirSync(directory, { recursive: true });
  for (const scenario of SCENARIOS) {
    const { transcript, result } = await playTranscript(scenario);
    const text = `${transcript.join("\n")}\n`;
    fs.writeFileSync(path.join(directory, `${scenario.name}.txt.gz`), zlib.gzipSync(text, { level: 9 }));
    console.log(`${scenario.name.padEnd(16)} ${result} (${transcript.length} lines)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
