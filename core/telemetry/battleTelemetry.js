const TELEMETRY_VERSION = 2;

function safeActorSnapshot(actor) {
  if (!actor) return null;
  const maxHp = Number(actor.stats?.HP ?? actor.maxHp ?? 0);
  const maxMp = Number(actor.stats?.MP ?? actor.maxMp ?? 0);
  return {
    id: actor.id,
    name: actor.name,
    faction: actor.faction || null,
    side: actor.side || null,
    alive: Boolean(actor.alive),
    hp: Number(actor.hp ?? 0),
    maxHp,
    hpPercent: maxHp > 0 ? Math.round((Number(actor.hp ?? 0) / maxHp) * 10000) / 100 : null,
    mp: Number(actor.mp ?? 0),
    maxMp,
    shields: (actor.shields || []).map((shield) => ({ value: Number(shield.value || 0), turns: Number(shield.turns || 0) })),
    shieldTotal: (actor.shields || []).reduce((sum, shield) => sum + Number(shield.value || 0), 0),
    statuses: Object.entries(actor.statuses || {}).map(([statusId, status]) => ({ statusId, turns: status?.turns ?? null, stacks: status?.stacks ?? null })),
  };
}


function createBattleTelemetry(events, state, { includeTimeline = false, maxTimelineEvents = 10000 } = {}) {
  if (!events || typeof events.onAny !== "function") throw new TypeError("Telemetry requires an event bus with onAny().");
  if (!state || typeof state !== "object") throw new TypeError("Telemetry requires battle state.");
  const timeline = [];
  const actorMetrics = {};
  const koTimeline = [];
  const statusTracker = new Map();
  const completedStatusUptime = [];
  const reserves = {};
  const lastDamageByTarget = {};
  const factionMetrics = {};
  let turnIndex = 0;
  let totalEventsObserved = 0;
  let currentTurn = null;
  let currentRound = Number(state.round || 1);
  let disposed = false;

  const actorById = (id) => state.actors.find((actor) => actor.id === id) ||
    state.party?.roster?.find((actor) => actor.id === id) || state.enemyParty?.roster?.find((actor) => actor.id === id);
  const metricsFor = (id) => actorMetrics[id] ||= {
    actorId: id, faction: null, side: null, turnsTaken: 0, damageDealt: 0, hpDamageDealt: 0,
    shieldDamageDealt: 0, damageReceived: 0, hpDamageReceived: 0, shieldAbsorbed: 0,
    healingRequested: 0, healingReceived: 0, overhealing: 0, shieldsGenerated: 0,
    shieldsAbsorbed: 0, shieldExpiredUnused: 0, statusesApplied: 0, statusTurns: 0,
    cleanses: 0, kOs: 0, reserveTurnsActive: 0, reserveDamageDealt: 0, healingGiven: 0, shieldGiven: 0, statusAppliedByActor: 0,
    reserveHealing: 0, reserveShielding: 0, reserveKOsAssisted: 0,
    decisionCount: 0, decisionRejects: 0, finishOpportunities: 0, missedFinishOpportunities: 0,
    targetSwitches: 0, targetCounts: {}, firstKoRound: null,
  };
  const summonOwnerById = new Map();
  const factionFor = (actor, seen = new Set()) => {
    if (!actor) return "unknown";
    if (actor.faction) return actor.faction;
    if (seen.has(actor.id)) return actor.side || "unknown";
    seen.add(actor.id);
    const ownerId = summonOwnerById.get(actor.id) || actor.ownerId;
    const owner = ownerId ? actorById(ownerId) : null;
    if (owner) {
      const inheritedFaction = factionFor(owner, seen);
      if (inheritedFaction && inheritedFaction !== "unknown" && inheritedFaction !== owner.side) return inheritedFaction;
      if (owner.faction) return owner.faction;
    }
    return actor.side || "unknown";
  };
  const faction = (key) => factionMetrics[key] ||= {
    faction: key, damageDealt: 0, hpDamageDealt: 0, shieldDamageDealt: 0,
    damageReceived: 0, healingReceived: 0, overhealing: 0, shieldsGenerated: 0, shieldsAbsorbed: 0,
    shieldsAbsorbed: 0, kOs: 0, statusApplications: 0, statusTurns: 0,
    decisions: 0, missedFinishOpportunities: 0, reserveDeployments: 0, summonKOs: 0, operativeKOs: 0,
  };
  const snapshotAll = () => state.actors.map(safeActorSnapshot);
  const unsubscribe = events.onAny((event) => {
    if (disposed) return;
    totalEventsObserved++;
    if (event.type === "RoundStarted") currentRound = event.round;
    if (event.type === "TurnStarted") {
      turnIndex++;
      currentTurn = { actorId: event.actorId, side: event.side, round: event.round, turnIndex };
      const actor = actorById(event.actorId);
      const m = metricsFor(event.actorId);
      m.faction ||= actor ? factionFor(actor) : null; m.side ||= actor?.side || event.side;
      m.turnsTaken++;
      if (reserves[event.actorId]?.deployed) { reserves[event.actorId].turnsActive++; m.reserveTurnsActive++; }
      for (const [statusId, entry] of statusTracker) {
        if (entry.actorId === event.actorId && actor?.statuses?.[entry.statusId]) entry.turnsActive++;
      }
    }
    const actor = actorById(event.actorId || event.sourceId || event.targetId || event.incomingId);
    const eventContext = {
      round: event.round ?? currentRound,
      turnIndex,
      actorId: event.actorId || event.sourceId || event.targetId || event.incomingId || null,
      actorFaction: actor ? factionFor(actor) : null,
      actorSide: actor?.side || null,
      snapshots: includeTimeline ? snapshotAll() : undefined,
    };
    if (includeTimeline && timeline.length < maxTimelineEvents) timeline.push({ ...event, telemetry: eventContext });

    if (event.type === "ActionChosen") {
      const actorM = metricsFor(event.actorId); actorM.faction ||= actor ? factionFor(actor) : null; actorM.side ||= actor?.side || null; actorM.decisionCount++;
      faction(factionFor(actor)).decisions++;
      const targetId = event.decision?.targetId;
      if (targetId) {
        actorM.targetCounts[targetId] = (actorM.targetCounts[targetId] || 0) + 1;
        if (actorM.lastTargetId && actorM.lastTargetId !== targetId) actorM.targetSwitches++;
        actorM.lastTargetId = targetId;
        const target = actorById(targetId);
        if (target?.alive && target.hp <= Math.max(1, Math.ceil(Number(target.stats?.HP || 0) * 0.2))) actorM.finishOpportunities++;
        const opposingSide = actor?.side === "ally" ? "enemy" : actor?.side === "enemy" ? "ally" : null;
        const lowHpOpponent = state.actors.find((unit) => unit.alive && unit.side === opposingSide && unit.hp <= Math.max(1, Math.ceil(Number(unit.stats?.HP || 0) * 0.2)));
        if (lowHpOpponent && targetId !== lowHpOpponent.id) {
          actorM.missedFinishOpportunities++;
          faction(factionFor(actor)).missedFinishOpportunities++;
        }
      }
    }
    if (event.type === "DecisionRejected") metricsFor(event.actorId).decisionRejects++;
    if (event.type === "DamageApplied") {
      const sourceM = event.sourceId ? metricsFor(event.sourceId) : null;
      const targetM = metricsFor(event.targetId);
      const sourceActor = actorById(event.sourceId); const targetActor = actorById(event.targetId);
      const dealt = Math.max(0, Number(event.hpLoss || 0) + Number(event.absorbedAmount || 0));
      if (sourceM) {
        sourceM.faction ||= sourceActor ? factionFor(sourceActor) : null; sourceM.side ||= sourceActor?.side || null;
        sourceM.damageDealt += dealt; sourceM.hpDamageDealt += Number(event.hpLoss || 0); sourceM.shieldDamageDealt += Number(event.absorbedAmount || 0);
        if (reserves[event.sourceId]?.deployed) sourceM.reserveDamageDealt += dealt;
      }
      targetM.faction ||= targetActor ? factionFor(targetActor) : null; targetM.side ||= targetActor?.side || null;
      targetM.damageReceived += dealt; targetM.hpDamageReceived += Number(event.hpLoss || 0); targetM.shieldAbsorbed += Number(event.absorbedAmount || 0); targetM.shieldsAbsorbed += Number(event.absorbedAmount || 0);
      if (sourceActor) { const fm = faction(factionFor(sourceActor)); fm.damageDealt += dealt; fm.hpDamageDealt += Number(event.hpLoss || 0); fm.shieldDamageDealt += Number(event.absorbedAmount || 0); }
      if (targetActor) { const fm = faction(factionFor(targetActor)); fm.damageReceived += dealt; fm.shieldsAbsorbed += Number(event.absorbedAmount || 0); }
      lastDamageByTarget[event.targetId] = event.sourceId || null;
    }
    if (event.type === "Healed") {
      const targetActor = actorById(event.targetId); const m = metricsFor(event.targetId); const requested = Number(event.requestedAmount || 0); const actual = Number(event.healed || 0); const over = Math.max(0, requested - actual);
      m.faction ||= targetActor ? factionFor(targetActor) : null; m.side ||= targetActor?.side || null; m.healingRequested += requested; m.healingReceived += actual; m.overhealing += over;
      if (targetActor) { const fm = faction(factionFor(targetActor)); fm.healingReceived += actual; fm.overhealing += over; }
      if (currentTurn?.actorId) { const sourceM = metricsFor(currentTurn.actorId); sourceM.healingGiven += actual; if (reserves[currentTurn.actorId]?.deployed) sourceM.reserveHealing += actual; }
    }
    if (event.type === "ShieldGained") {
      const targetActor = actorById(event.targetId); const m = metricsFor(event.targetId); m.shieldsGenerated += Number(event.amount || 0); m.faction ||= targetActor ? factionFor(targetActor) : null; m.side ||= targetActor?.side || null;
      if (targetActor) faction(factionFor(targetActor)).shieldsGenerated += Number(event.amount || 0);
      if (currentTurn?.actorId) { const sourceM = metricsFor(currentTurn.actorId); sourceM.shieldGiven += Number(event.amount || 0); if (reserves[currentTurn.actorId]?.deployed) sourceM.reserveShielding += Number(event.amount || 0); }
    }
    if (event.type === "ShieldExpired") metricsFor(event.actorId).shieldExpiredUnused += Number(event.count || 0);
    if (event.type === "StatusApplied") {
      const targetActor = actorById(event.targetId); const m = metricsFor(event.targetId); m.statusesApplied++; m.faction ||= targetActor ? factionFor(targetActor) : null;
      const key = `${event.targetId}:${event.statusId}`;
      const previous = statusTracker.get(key);
      if (previous) {
        // A refresh/reapplication closes the prior tracked interval rather than erasing it.
        m.statusTurns += previous.turnsActive;
        if (targetActor) faction(factionFor(targetActor)).statusTurns += previous.turnsActive;
        completedStatusUptime.push({ ...previous, endRound: currentRound, endTurnIndex: turnIndex, termination: "refreshed" });
      }
      statusTracker.set(key, { actorId: event.targetId, statusId: event.statusId, turnsActive: 0, applicationRound: currentRound, applicationTurn: turnIndex });
      if (targetActor) faction(factionFor(targetActor)).statusApplications++;
      if (currentTurn?.actorId) metricsFor(currentTurn.actorId).statusAppliedByActor++;
    }
    if (event.type === "StatusExpired" || event.type === "StatusCleansed") {
      for (const statusId of event.statusIds || []) {
        const actorId = event.type === "StatusExpired" ? event.actorId : event.targetId;
        const key = `${actorId}:${statusId}`; const entry = statusTracker.get(key);
        if (entry) {
          const targetActor = actorById(actorId); const m = metricsFor(actorId); m.statusTurns += entry.turnsActive;
          if (targetActor) faction(factionFor(targetActor)).statusTurns += entry.turnsActive;
          completedStatusUptime.push({ ...entry, endRound: currentRound, endTurnIndex: turnIndex, termination: event.type === "StatusExpired" ? "expired" : "cleansed" });
          statusTracker.delete(key);
        }
      }
      if (event.type === "StatusCleansed") metricsFor(event.actorId).cleanses += (event.statusIds || []).length;
    }
    if (event.type === "ActorDied") {
      const dead = actorById(event.actorId); const m = metricsFor(event.actorId); m.kOs++; m.firstKoRound ??= event.round;
      if (dead) {
        const deadFaction = faction(factionFor(dead));
        deadFaction.kOs++;
        if (dead.summon) deadFaction.summonKOs++;
        else deadFaction.operativeKOs++;
        koTimeline.push({ actorId: event.actorId, name: dead.name, faction: factionFor(dead), side: event.side, round: event.round, turnIndex, lastDamageSourceId: lastDamageByTarget[event.actorId] || null, isSummon: Boolean(dead.summon) });
      }
      const koSourceId = lastDamageByTarget[event.actorId];
      if (koSourceId && reserves[koSourceId]?.deployed && dead?.side !== reserves[koSourceId].side) metricsFor(koSourceId).reserveKOsAssisted++;
    }
    if (event.type === "ActorSummoned") {
      if (event.ownerId && event.ownerId !== "unknown") summonOwnerById.set(event.actorId, event.ownerId);
    }
    if (event.type === "ReserveDeployed") {
      const incoming = actorById(event.incomingId); reserves[event.incomingId] = { deployed: true, deploymentRound: event.round, deploymentTurn: turnIndex, defeatedId: event.defeatedId, side: event.side, turnsActive: 0 };
      const m = metricsFor(event.incomingId); m.faction ||= incoming ? factionFor(incoming) : null; m.side ||= incoming?.side || event.side;
      faction(factionFor(incoming)).reserveDeployments++;
    }
  });
  function summary() {
    const actorMetricsSnapshot = structuredClone(actorMetrics);
    const factionMetricsSnapshot = structuredClone(factionMetrics);
    const activeStatusUptime = [...statusTracker.values()].map((entry) => {
      const actor = actorById(entry.actorId);
      const turnsActive = entry.turnsActive + (actor?.statuses?.[entry.statusId] ? 1 : 0);
      if (actorMetricsSnapshot[entry.actorId]) actorMetricsSnapshot[entry.actorId].statusTurns += turnsActive;
      if (actor) { const key = factionFor(actor); if (factionMetricsSnapshot[key]) factionMetricsSnapshot[key].statusTurns += turnsActive; }
      return { ...entry, turnsActive };
    });
    return {
      version: TELEMETRY_VERSION,
      eventCount: timeline.length,
      totalEventCount: totalEventsObserved,
      timelineTruncated: includeTimeline && timeline.length >= maxTimelineEvents,
      turnCount: turnIndex,
      koTimeline: structuredClone(koTimeline),
      timeline: structuredClone(timeline),
      actorMetrics: actorMetricsSnapshot,
      factionMetrics: factionMetricsSnapshot,
      reserveMetrics: structuredClone(reserves),
      statusUptime: [...structuredClone(completedStatusUptime), ...activeStatusUptime],
    };
  }
  return { summary, dispose() { disposed = true; unsubscribe(); } };
}

module.exports = { TELEMETRY_VERSION, safeActorSnapshot, createBattleTelemetry };
