// Opening initiative: lets one side act first at the start of a battle.
//
// Why this exists: with continuous (threshold) readiness the fastest unit really
// does act first, and in the 5v5 roster that is an enemy (Recon Drone, SPD 115)
// ahead of Zenki (SPD 110). The legacy scheduler only "gave" the player the first
// move by accident (clamped ties resolved by array order). In PvE the player
// should start the fight, so this is an explicit, documented rule.
//
// Rule: if the other side's fastest unit would be ready first (or tied), every
// living unit on the first side receives the same head start in *time*,
// just enough that the first side's fastest unit is ready strictly before the
// other side's fastest. Each unit's head start is its own SPD * delta, so
// relative SPD ordering inside the side is unchanged, long-run turn share is
// unchanged, and nothing is cloned, queued or reset. If the first side is
// already faster, nothing changes (delta = 0).
//
// Applied once, after both parties are set up and before the first turn.

const MAX_CR = 100;
// Time units by which the first side must lead. Tiny, but strict, so ties never
// depend on actor array order or the scheduler's tie rotation.
const DEFAULT_MARGIN = 1e-6;

function livingSide(state, side) {
  return state.actors.filter((actor) => actor.alive && !actor.summon && actor.side === side);
}

function speedOf(actor, effectiveStat) {
  const speed = effectiveStat(actor, "SPD");
  return Number.isFinite(speed) && speed > 0 ? speed : 0;
}

function timeToReady(actor, effectiveStat) {
  const speed = speedOf(actor, effectiveStat);
  return speed > 0 ? Math.max(0, (MAX_CR - actor.cr) / speed) : Infinity;
}

function fastest(actors, effectiveStat) {
  let best = { actor: null, time: Infinity };
  for (const actor of actors) {
    const time = timeToReady(actor, effectiveStat);
    if (time < best.time) best = { actor, time };
  }
  return best;
}

function applyOpeningInitiative(
  state,
  effectiveStat,
  { firstSide = "ally", margin = DEFAULT_MARGIN } = {},
) {
  if (firstSide !== "ally" && firstSide !== "enemy") {
    throw new TypeError(`firstSide must be "ally" or "enemy", received ${String(firstSide)}.`);
  }
  const otherSide = firstSide === "ally" ? "enemy" : "ally";
  const first = fastest(livingSide(state, firstSide), effectiveStat);
  const other = fastest(livingSide(state, otherSide), effectiveStat);

  const none = { applied: false, side: firstSide, deltaTime: 0, opener: first.actor ? first.actor.name : null };
  if (!first.actor || !other.actor) return none;

  const deltaTime = first.time - other.time + margin;
  if (deltaTime <= 0) return none;

  for (const actor of livingSide(state, firstSide)) {
    const speed = speedOf(actor, effectiveStat);
    if (speed > 0) actor.cr += speed * deltaTime;
  }
  return { applied: true, side: firstSide, deltaTime, opener: first.actor.name };
}

module.exports = { applyOpeningInitiative, DEFAULT_MARGIN };
