const { createBattle } = require("../../core/battle");
const { createEventBus } = require("../../core/eventBus");
const { createFalconParty } = require("../../characters/falcon");
const { createPhantomParty } = require("../../characters/phantom");
const { createCoordinatedFalconController } = require("../../ai/falconTacticsV2");
const { createPhantomTacticsController } = require("../../ai/phantomTactics");

const FACTIONS = Object.freeze({
  falcon: { factory: createFalconParty, ids: ["elishia", "evalete", "zackry", "jazen", "zenki"] },
  phantom: { factory: createPhantomParty, ids: ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"] },
});

function opponentOf(faction) {
  if (!FACTIONS[faction]) throw new TypeError(`Unknown faction "${faction}". Use falcon or phantom.`);
  return faction === "falcon" ? "phantom" : "falcon";
}

function controllerFor(faction) {
  return faction === "falcon"
    ? createCoordinatedFalconController()
    : createPhantomTacticsController();
}

async function playFactionDuel({
  seed = 1,
  playerFaction = "falcon",
  maxActive = 3,
  openingInitiative = "speed",
  events = createEventBus({ record: true }),
} = {}) {
  const player = FACTIONS[playerFaction];
  if (!player) throw new TypeError(`Unknown playerFaction "${playerFaction}". Use falcon or phantom.`);
  const opponentFaction = opponentOf(playerFaction);
  const opponent = FACTIONS[opponentFaction];
  const battle = createBattle({
    output: { log() {} },
    seed,
    openingInitiative,
    events,
    partyFactory: () => player.factory({ side: "ally" }),
    partyOrder: player.ids,
    opponentFactory: () => opponent.factory({ side: "enemy" }),
    maxActive,
    enemyMaxActive: maxActive,
    // A faction duel must not inherit the PvE-only player-side no-dodge rule.
    // Both factions use identical Evasion checks and evade-triggered passives.
    symmetricEvasion: true,
    controllers: {
      player: controllerFor(playerFaction),
      enemy: controllerFor(opponentFaction),
    },
  });

  const initialSeed = battle.state.rng.seed;
  try {
    const result = await battle.run();
    return {
      result,
      seed: initialSeed,
      rounds: battle.state.round,
      playerFaction,
      opponentFaction,
      state: battle.state,
      events: battle.events,
    };
  } finally {
    battle.close();
  }
}

function summarizeFactionDuel(battle) {
  const rows = battle.events.history || [];
  const damageByActor = {};
  const damageByFaction = { falcon: 0, phantom: 0 };
  const skillsByActor = {};
  const switchesByFaction = { falcon: 0, phantom: 0 };
  let rejectedDecisions = 0;
  let reserveDeployments = 0;
  let bleedTicks = 0;
  for (const event of rows) {
    if (event.type === "DamageApplied") {
      const amount = (Number(event.hpLoss) || 0) + (Number(event.absorbedAmount) || 0);
      if (event.sourceId) {
        damageByActor[event.sourceId] = (damageByActor[event.sourceId] || 0) + amount;
      }
      const source = battle.state.actors.find((actor) => actor.id === event.sourceId);
      if (source?.faction) damageByFaction[source.faction] += amount;
    }
    if (event.type === "SkillUsed") {
      skillsByActor[event.actorId] ||= {};
      skillsByActor[event.actorId][event.skillKey] = (skillsByActor[event.actorId][event.skillKey] || 0) + 1;
    }
    if (event.type === "DecisionRejected") rejectedDecisions++;
    if (event.type === "ReserveDeployed") reserveDeployments++;
    if (event.type === "PartySwitched") {
      const switched = battle.state.actors.find((actor) => actor.id === event.incomingId);
      if (switched?.faction) switchesByFaction[switched.faction]++;
    }
    if (event.type === "DamageApplied" && event.kind === "dot") bleedTicks++;
  }
  return {
    seed: battle.seed,
    result: battle.result,
    rounds: battle.rounds,
    playerFaction: battle.playerFaction,
    opponentFaction: battle.opponentFaction,
    damageByFaction,
    damageByActor,
    skillsByActor,
    switchesByFaction,
    reserveDeployments,
    rejectedDecisions,
    dotTicks: bleedTicks,
  };
}

module.exports = { FACTIONS, playFactionDuel, summarizeFactionDuel };
