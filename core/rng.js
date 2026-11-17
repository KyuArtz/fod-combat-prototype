const { randomInt } = require("node:crypto");

// Seeded random numbers (mulberry32).
//
// The generator state is a plain object, { seed, state }, stored on the battle
// state as `state.rng`. Because it is plain data (no functions or closures),
// structuredClone(state) copies it, so previews, saves and replays continue the
// exact same sequence. Every roll consumes exactly one number, so a battle is
// fully reproducible from its seed plus the sequence of player choices.

function normalizeSeed(seed) {
  const value = typeof seed === "string" && seed.trim() !== "" ? Number(seed) : seed;
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new TypeError(`Seed must be an integer, received ${String(seed)}.`);
  }
  return value >>> 0;
}

function randomSeed() {
  return randomInt(0, 2 ** 32);
}

function createRngState(seed = randomSeed()) {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, state: normalized };
}

// Returns a float in [0, 1).
function nextFloat(rng) {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// True with the given percent chance (0-100). 0 never succeeds, 100 always does.
function rollPercent(rng, percent) {
  return nextFloat(rng) * 100 < percent;
}

module.exports = { createRngState, nextFloat, normalizeSeed, randomSeed, rollPercent };
