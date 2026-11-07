const MAX_CR = 100;

function adjustCR(actor, amount) {
  if (!Number.isFinite(amount)) {
    throw new TypeError("CR adjustment must be a finite number.");
  }
  actor.cr = Math.max(0, Math.min(MAX_CR, actor.cr + amount));
  return actor.cr;
}

function advanceCR(state, effectiveStat) {
  const deployed = state.actors.filter((actor) => actor.alive);
  if (!deployed.length) return [];

  for (const actor of deployed) {
    const speed = effectiveStat(actor, "SPD");
    if (speed > 0) adjustCR(actor, speed);
  }
  state.schedulerTicks++;
  return deployed.filter((actor) => actor.cr >= MAX_CR);
}

function nextActor(state, effectiveStat) {
  while (true) {
    const deployed = state.actors.filter((actor) => actor.alive);
    if (!deployed.length) return null;

    const ready = deployed
      .filter((actor) => actor.cr >= MAX_CR)
      .sort((left, right) => right.cr - left.cr);
    if (ready.length) return ready[0];

    if (!deployed.some((actor) => effectiveStat(actor, "SPD") > 0)) {
      throw new Error("Cannot schedule a turn: all deployed units have zero SPD.");
    }
    advanceCR(state, effectiveStat);
  }
}

function resetCR(actor) {
  actor.cr = 0;
}

module.exports = { MAX_CR, adjustCR, advanceCR, nextActor, resetCR };
