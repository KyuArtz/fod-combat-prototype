const { createBattle } = require("../../core/battle");
const { createEventBus } = require("../../core/eventBus");
const { createFalconParty } = require("../../characters/falcon");
const { createPhantomParty } = require("../../characters/phantom");
const { createSerpentParty } = require("../../characters/serpent");
const { createCoordinatedFalconController } = require("../../ai/falconTacticsV2");
const { createPhantomTacticsController } = require("../../ai/phantomTactics");
const { createSerpentTacticsController } = require("../../ai/serpentTactics");
const { createBattleTelemetry } = require("../../core/telemetry/battleTelemetry");

const FACTIONS = Object.freeze({
  falcon: { factory: createFalconParty, ids: ["elishia", "evalete", "zackry", "jazen", "zenki"] },
  phantom: { factory: createPhantomParty, ids: ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"] },
  serpent: { factory: createSerpentParty, ids: ["verra", "kane", "galloz", "claude", "tekushiki"] },
});

function opponentOf(faction, requestedOpponent) {
  if (!FACTIONS[faction]) throw new TypeError(`Unknown faction "${faction}". Choose falcon, phantom, or serpent.`);
  if (requestedOpponent !== undefined) {
    if (!FACTIONS[requestedOpponent]) throw new TypeError(`Unknown opponent faction "${requestedOpponent}". Choose falcon, phantom, or serpent.`);
    if (requestedOpponent === faction) throw new TypeError("A faction cannot duel itself in the faction matchup runner.");
    return requestedOpponent;
  }
  return faction === "falcon" ? "phantom" : "falcon";
}

function controllerFor(faction) {
  if (faction === "falcon") return createCoordinatedFalconController();
  if (faction === "phantom") return createPhantomTacticsController();
  if (faction === "serpent") return createSerpentTacticsController();
  throw new TypeError(`No tactical controller registered for "${faction}".`);
}

async function playFactionDuel({
  seed = 1,
  playerFaction = "falcon",
  opponentFaction: requestedOpponentFaction,
  maxActive = 3,
  openingInitiative = "speed",
  events = createEventBus({ record: true }),
  telemetryOptions = {},
  controllerOverrides = {},
} = {}) {
  const player = FACTIONS[playerFaction];
  if (!player) throw new TypeError(`Unknown playerFaction "${playerFaction}". Use falcon or phantom.`);
  const opponentFaction = opponentOf(playerFaction, requestedOpponentFaction);
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
      player: controllerOverrides[playerFaction] || controllerFor(playerFaction),
      enemy: controllerOverrides[opponentFaction] || controllerFor(opponentFaction),
    },
  });

  const initialSeed = battle.state.rng.seed;
  const telemetry = createBattleTelemetry(battle.events, battle.state, telemetryOptions);
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
      telemetry: telemetry.summary(),
    };
  } finally {
    telemetry.dispose();
    battle.close();
  }
}

function summarizeFactionDuel(battle) {
  const rows = battle.events.history || [];
  const damageByActor = {};
  const damageByFaction = Object.fromEntries(Object.keys(FACTIONS).map((faction) => [faction, 0]));
  const skillsByActor = {};
  const switchesByFaction = Object.fromEntries(Object.keys(FACTIONS).map((faction) => [faction, 0]));
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
    telemetry: battle.telemetry || null,
  };
}

module.exports = { FACTIONS, playFactionDuel, summarizeFactionDuel };
