// Plays a complete battle through the terminal UI with "chaos" answers (random
// digits from a seeded generator, including invalid ones) and returns the full
// transcript: every prompt, every answer and every console line, in order.
//
// The transcript is the safety net for refactors of the turn flow: two builds that
// behave identically produce byte-identical transcripts for the same scenario.

const { PassThrough, Writable } = require("node:stream");
const { createBattle } = require("../../core/battle");
const { createRngState, nextFloat } = require("../../core/rng");

function chaosAnswers(chaosSeed, count = 6000) {
  const rng = createRngState(chaosSeed);
  return Array.from({ length: count }, () => String(Math.floor(nextFloat(rng) * 10)));
}

async function playTranscript({ seed, chaosSeed, maxActive, battleOptions = {} }) {
  const answers = chaosAnswers(chaosSeed);
  const transcript = [];
  const input = new PassThrough();
  let answered = 0;
  const prompts = new Writable({
    write(chunk, encoding, done) {
      const answer = answered < answers.length ? answers[answered] : "1";
      answered++;
      transcript.push(`PROMPT ${JSON.stringify(chunk.toString())}`);
      transcript.push(`ANSWER ${answer}`);
      setImmediate(() => input.write(`${answer}\n`));
      done();
    },
  });
  const battle = createBattle({
    input,
    promptOutput: prompts,
    output: { log: (...args) => transcript.push(`OUT ${args.join(" ")}`) },
    seed,
    ...battleOptions,
  });
  if (maxActive) {
    battle.state.party.maxActive = maxActive;
  }
  try {
    const result = await battle.run();
    transcript.push(`RESULT ${result}`);
    return { transcript, result, state: battle.state, events: battle.events };
  } finally {
    battle.close();
  }
}

// Scenarios cover: full 5v5, and 3 active + 2 reserve (switching, auto-replacement).
const SCENARIOS = [
  { name: "five-v-five-a", seed: 101, chaosSeed: 1 },
  { name: "five-v-five-b", seed: 202, chaosSeed: 2 },
  { name: "reserve-a", seed: 303, chaosSeed: 3, maxActive: 3 },
  { name: "reserve-b", seed: 404, chaosSeed: 4, maxActive: 3 },
  { name: "reserve-c", seed: 505, chaosSeed: 5, maxActive: 3 },
];

module.exports = { playTranscript, chaosAnswers, SCENARIOS };
