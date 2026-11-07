const { createFalconParty } = require("../characters/falcon");

function alive(state, side) {
  return state.actors.filter((actor) => actor.alive && actor.side === side);
}

function result(state) {
  const hasLivingCombatant = (side, party) =>
    alive(state, side).some((actor) => !actor.summon) ||
    party.reserve.some((actor) => actor.alive);
  if (!hasLivingCombatant("enemy", state.enemyParty)) return "VICTORY";
  if (!hasLivingCombatant("ally", state.party)) return "DEFEAT";
  return null;
}

function setupFormation(state, party, roster) {
  if (roster.length < party.maxActive) {
    throw new Error(
      `Formation requires at least ${party.maxActive} combatants.`,
    );
  }
  party.roster = [...roster];
  party.active = party.roster.slice(0, party.maxActive);
  party.reserve = party.roster.slice(party.maxActive);
  state.actors.push(...party.active);
}

function setupParty(state, roster = createFalconParty()) {
  setupFormation(state, state.party, roster);
}

function setupEnemyParty(state, roster) {
  setupFormation(state, state.enemyParty, roster);
}

function removeIncapacitatedReserves(party) {
  const originalCount = party.reserve.length;
  party.reserve = party.reserve.filter((actor) => actor.alive);
  return originalCount - party.reserve.length;
}

function deployFirstReserve(state, side, downedActor) {
  if (downedActor.summon) return null;
  const party = side === "ally" ? state.party : state.enemyParty;
  removeIncapacitatedReserves(party);
  const slot = party.active.indexOf(downedActor);
  if (slot < 0) return null;

  const incoming = party.reserve.shift();
  if (!incoming) return null;

  incoming.cr = 0;
  party.active[slot] = incoming;
  const actorIndex = state.actors.indexOf(downedActor);
  if (actorIndex >= 0) state.actors[actorIndex] = incoming;
  return { incoming, slot };
}

function switchPartyMember(state, reserveIndex, activeIndex) {
  const { active, reserve } = state.party;
  if (
    !Number.isInteger(reserveIndex) ||
    reserveIndex < 0 ||
    reserveIndex >= reserve.length ||
    !Number.isInteger(activeIndex) ||
    activeIndex < 0 ||
    activeIndex >= active.length
  ) {
    return { changed: false, reason: "invalid-slot" };
  }

  const incoming = reserve[reserveIndex];
  if (!incoming.alive) return { changed: false, reason: "incapacitated" };

  const outgoing = active[activeIndex];
  incoming.cr = 0;
  outgoing.cr = 0;
  active[activeIndex] = incoming;
  reserve[reserveIndex] = outgoing;
  state.actors = [
    ...active,
    ...state.actors.filter((actor) => actor.summon || actor.side === "enemy"),
  ];
  return { changed: true, incoming, outgoing };
}

module.exports = {
  alive,
  result,
  setupParty,
  setupEnemyParty,
  removeIncapacitatedReserves,
  deployFirstReserve,
  switchPartyMember,
};