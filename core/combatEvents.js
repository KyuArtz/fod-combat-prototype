// Stable, versioned-by-contract combat event vocabulary. Events contain only
// serializable identifiers and scalar data; never leak live actor objects.
const EVENT_FIELDS = Object.freeze({
  Log: ["message", "round"],
  FormationSelected: ["ids"],
  OpeningInitiative: ["applied", "side", "deltaTime", "opener"],
  ActionChosen: ["actorId", "kind", "round", "decision"],
  DecisionRejected: ["actorId", "kind", "reason", "decision"],
  BattleStarted: ["seed"],
  RoundStarted: ["round"],
  TurnStarted: ["actorId", "side", "round", "staggered"],
  SkillUsed: ["actorId", "skillKey", "round", "mpBefore", "mpAfter"],
  BasicAttackUsed: ["actorId", "targetId", "round"],
  DamageApplied: ["targetId", "requestedAmount", "hpLoss", "absorbedAmount", "damageType"],
  Healed: ["targetId", "requestedAmount", "healed"],
  ShieldGained: ["targetId", "amount", "turns"],
  ShieldExpired: ["actorId", "count"],
  StatusApplied: ["targetId", "statusId", "turns"],
  StatusExpired: ["actorId", "statusIds"],
  ActorDied: ["actorId", "side", "round"],
  ActorSummoned: ["actorId", "ownerId", "side", "round"],
  PartySwitched: ["incomingId", "outgoingId", "round"],
  ReserveDeployed: ["incomingId", "defeatedId", "side", "slot", "round"],
  ActorSummonExpired: ["actorId", "ownerId", "round"],
  TurnEnded: ["actorId", "side", "round"],
  RoundEnded: ["round"],
  BattleEnded: ["result", "round"],
});

function emitCombatEvent(events, type, payload) {
  const required = EVENT_FIELDS[type];
  if (!required) throw new TypeError(`Unknown combat event type "${type}".`);
  for (const field of required) {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) {
      throw new TypeError(`${type} event is missing required field "${field}".`);
    }
  }
  let safePayload;
  try {
    // Dispatch an isolated copy: observers may inspect or even mutate their
    // event object without being able to mutate a live controller decision.
    safePayload = structuredClone(payload);
  } catch {
    throw new TypeError(`${type} event payload must contain structured-clone-safe data.`);
  }
  return events.emit(type, safePayload);
}

module.exports = { EVENT_FIELDS, emitCombatEvent };
