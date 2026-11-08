const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createRngState,
  nextFloat,
  normalizeSeed,
  rollPercent,
} = require("../core/rng");

const sequence = (rng, count) => Array.from({ length: count }, () => nextFloat(rng));

test("same seed produces the same sequence; different seeds differ", () => {
  assert.deepEqual(sequence(createRngState(42), 50), sequence(createRngState(42), 50));
  assert.notDeepEqual(sequence(createRngState(42), 50), sequence(createRngState(43), 50));
});

test("golden values lock the algorithm so saved seeds keep replaying the same way", () => {
  const asInts = (seed) =>
    sequence(createRngState(seed), 4).map((value) => Math.round(value * 4294967296));
  assert.deepEqual(asInts(12345), [4207900869, 1317490944, 2079646450, 3513001552]);
  assert.deepEqual(asInts(0).slice(0, 3), [1144304738, 1416247, 958946056]);
});

test("values stay in [0, 1) and are roughly uniform", () => {
  const rng = createRngState(7);
  const values = sequence(rng, 20000);
  assert.ok(values.every((value) => value >= 0 && value < 1));
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  assert.ok(Math.abs(mean - 0.5) < 0.02, `mean ${mean}`);
});

test("rollPercent: 0 never succeeds, 100 always does, 25 is about a quarter", () => {
  const rng = createRngState(99);
  assert.ok(Array.from({ length: 2000 }, () => rollPercent(rng, 0)).every((hit) => !hit));
  assert.ok(Array.from({ length: 2000 }, () => rollPercent(rng, 100)).every(Boolean));
  const hits = Array.from({ length: 20000 }, () => rollPercent(rng, 25)).filter(Boolean).length;
  assert.ok(Math.abs(hits / 20000 - 0.25) < 0.02, `rate ${hits / 20000}`);
});

test("rng state is plain data: a structuredClone continues the identical sequence", () => {
  const rng = createRngState(2026);
  sequence(rng, 17);
  const copy = structuredClone(rng);
  assert.deepEqual(sequence(copy, 25), sequence(rng, 25));
});

test("seeds accept integers and numeric strings, and are normalised to 32 bits", () => {
  assert.equal(normalizeSeed("12345"), 12345);
  assert.equal(normalizeSeed(-1), 4294967295);
  assert.equal(normalizeSeed(2 ** 32 + 5), 5);
  assert.deepEqual(sequence(createRngState("77"), 5), sequence(createRngState(77), 5));
});

test("invalid seeds throw instead of silently producing NaN rolls", () => {
  for (const bad of ["abc", "", 1.5, NaN, Infinity, {}, null]) {
    assert.throws(() => createRngState(bad), TypeError, String(bad));
  }
});

test("omitted seed picks a random seed and records it so the battle can be replayed", () => {
  const rng = createRngState();
  assert.ok(Number.isInteger(rng.seed) && rng.seed >= 0 && rng.seed < 2 ** 32);
  assert.deepEqual(sequence(createRngState(rng.seed), 5), sequence(rng, 5));
});
