const WINDOW_ROUNDS = 3;

function createIncomingPressureTelemetry() {
  return { events: [] };
}


function recordIncomingDamage(telemetry, event) {
  if (!telemetry || !Array.isArray(telemetry.events) || !event) return;
  const { round, targetId, sourceId, hpDamage } = event;
  if (!Number.isInteger(round) || typeof targetId !== "string" || !targetId ||
      typeof sourceId !== "string" || !sourceId || !Number.isFinite(hpDamage) || hpDamage <= 0) return;
  telemetry.events.push({ round, targetId, sourceId, hpDamage });
  pruneIncomingPressure(telemetry, round);
}


function pruneIncomingPressure(telemetry, currentRound) {
  if (!telemetry || !Array.isArray(telemetry.events) || !Number.isInteger(currentRound)) return;
  const earliestRound = currentRound - (WINDOW_ROUNDS - 1);
  telemetry.events = telemetry.events.filter((event) => event.round >= earliestRound && event.round <= currentRound);
}


function getIncomingPressure(telemetry, targetId, currentRound) {
  if (!telemetry || !Array.isArray(telemetry.events) || typeof targetId !== "string" || !Number.isInteger(currentRound)) {
    return { recentDamage: 0, recentHits: 0, window: WINDOW_ROUNDS, damageBySource: {}, lastHitRound: null };
  }
  pruneIncomingPressure(telemetry, currentRound);
  const events = telemetry.events.filter((event) => event.targetId === targetId);
  const damageBySource = {};
  let recentDamage = 0;
  for (const event of events) {
    recentDamage += event.hpDamage;
    damageBySource[event.sourceId] = (damageBySource[event.sourceId] || 0) + event.hpDamage;
  }
  return {
    recentDamage,
    recentHits: events.length,
    window: WINDOW_ROUNDS,
    damageBySource,
    lastHitRound: events.length ? Math.max(...events.map((event) => event.round)) : null,
  };
}


module.exports = {
  WINDOW_ROUNDS,
  createIncomingPressureTelemetry,
  recordIncomingDamage,
  pruneIncomingPressure,
  getIncomingPressure,
};
