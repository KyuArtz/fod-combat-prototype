const { createBattle } = require("../../core/battle");
const { createEventBus } = require("../../core/eventBus");
const { createFalconParty } = require("../../characters/falcon");
const { createPhantomParty, MEMBERS: PHANTOM_MEMBERS } = require("../../characters/phantom");
const { createCoordinatedFalconController } = require("../../ai/falconTacticsV2");
const { createPhantomTacticsController } = require("../../ai/phantomTactics");

const PHANTOM_IDS = PHANTOM_MEMBERS.map((member) => member.id);
const BASELINE_ORDER = ["elishia", "evalete", "zackry", "jazen", "zenki"];
const HYBRID_ACTIVE_ORDER = ["elishia", "__SUBSTITUTE__", "zackry", "jazen", "zenki"];
const PHANTOM_ORDER = ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"];

function createHybridFalconParty({ side = "ally", substituteId } = {}) {
  if (!PHANTOM_IDS.includes(substituteId)) {
    throw new TypeError(`Unknown Phantom substitute "${substituteId}".`);
  }
  const falcons = createFalconParty({ side }).filter((actor) => actor.id !== "evalete");
  const substitute = createPhantomParty({ side }).find((actor) => actor.id === substituteId);
  substitute.id = `phantom_trial_${substituteId}`;
  // The trial unit is temporarily assigned to Falcon's side for faction-aware
  // effects. Its original skillSet, passive, role, stats and mastery are preserved.
  substitute.faction = "falcon";
  if (substituteId === "elishia_p") substitute.name = "Unknown";
  const actors = [...falcons, substitute];
  const order = HYBRID_ACTIVE_ORDER.map((id) => id === "__SUBSTITUTE__" ? substitute.id : id);
  const byId = new Map(actors.map((actor) => [actor.id, actor]));
  return order.map((id) => byId.get(id));
}

function createMixedTacticalController() {
  const falcon = createCoordinatedFalconController();
  const phantom = createPhantomTacticsController();
  return {
    chooseAction(view, context) {
      const skillSet = view.actor.skillSet || view.actor.id;
      return PHANTOM_IDS.includes(skillSet)
        ? phantom.chooseAction(view, context)
        : falcon.chooseAction(view, context);
    },
  };
}

function sideRoster(battle, side) {
  const party = side === "ally" ? battle.state.party : battle.state.enemyParty;
  return party.roster;
}

function buildActorSideMap(battle) {
  const map = new Map();
  for (const actor of [...battle.state.party.roster, ...battle.state.enemyParty.roster, ...battle.state.actors]) {
    map.set(actor.id, actor.side);
  }
  return map;
}

function summarizeSwapBattle(battle, substituteId, hybridSide) {
  const events = battle.events.history || [];
  const sideById = buildActorSideMap(battle);
  const metrics = {
    hybrid: { damageDealt: 0, damageTakenHp: 0, shieldAbsorbed: 0, healingReceived: 0, shieldGranted: 0, deaths: 0, skillUses: 0, switches: 0, reserveDeployments: 0 },
    phantom: { damageDealt: 0, damageTakenHp: 0, shieldAbsorbed: 0, healingReceived: 0, shieldGranted: 0, deaths: 0, skillUses: 0, switches: 0, reserveDeployments: 0 },
  };
  const teamForSide = (side) => side === hybridSide ? "hybrid" : "phantom";
  const damageByActor = {};
  const skillsByActor = {};
  let rejects = 0;
  let dotTicks = 0;
  for (const event of events) {
    if (event.type === "DamageApplied") {
      const dealt = teamForSide(event.sourceSide);
      if (event.sourceSide && (event.hpLoss || event.absorbedAmount)) {
        metrics[dealt].damageDealt += (Number(event.hpLoss) || 0) + (Number(event.absorbedAmount) || 0);
        if (event.sourceId) damageByActor[event.sourceId] = (damageByActor[event.sourceId] || 0) + (Number(event.hpLoss) || 0) + (Number(event.absorbedAmount) || 0);
      }
      const targetSide = sideById.get(event.targetId);
      if (targetSide) {
        const received = teamForSide(targetSide);
        metrics[received].damageTakenHp += Number(event.hpLoss) || 0;
        metrics[received].shieldAbsorbed += Number(event.absorbedAmount) || 0;
      }
      if (event.kind === "dot") dotTicks++;
    }
    if (event.type === "Healed") {
      const targetSide = sideById.get(event.targetId);
      if (targetSide) metrics[teamForSide(targetSide)].healingReceived += Number(event.healed) || 0;
    }
    if (event.type === "ShieldGained") {
      const targetSide = sideById.get(event.targetId);
      if (targetSide) metrics[teamForSide(targetSide)].shieldGranted += Number(event.amount) || 0;
    }
    if (event.type === "ActorDied") {
      metrics[teamForSide(event.side)].deaths++;
    }
    if (event.type === "SkillUsed") {
      const actor = [...battle.state.party.roster, ...battle.state.enemyParty.roster].find((unit) => unit.id === event.actorId);
      if (actor?.side) metrics[teamForSide(actor.side)].skillUses++;
      skillsByActor[event.actorId] ||= {};
      skillsByActor[event.actorId][event.skillKey] = (skillsByActor[event.actorId][event.skillKey] || 0) + 1;
    }
    if (event.type === "PartySwitched") {
      const side = sideById.get(event.incomingId);
      if (side) metrics[teamForSide(side)].switches++;
    }
    if (event.type === "ReserveDeployed") {
      metrics[teamForSide(event.side)].reserveDeployments++;
    }
    if (event.type === "DecisionRejected") rejects++;
  }
  const result = battle.result;
  const hybridWon = (hybridSide === "ally" && result === "VICTORY") || (hybridSide === "enemy" && result === "DEFEAT");
  const phantomWon = (hybridSide === "ally" && result === "DEFEAT") || (hybridSide === "enemy" && result === "VICTORY");
  return {
    seed: battle.seed,
    substituteId,
    hybridSide,
    result,
    winner: hybridWon ? "hybrid" : phantomWon ? "phantom" : "draw",
    rounds: battle.rounds,
    metrics,
    damageByActor,
    skillsByActor,
    rejectedDecisions: rejects,
    dotTicks,
    finalRoster: {
      hybridActive: (hybridSide === "ally" ? battle.state.party : battle.state.enemyParty).active.map((unit) => unit.id),
      hybridReserves: (hybridSide === "ally" ? battle.state.party : battle.state.enemyParty).reserve.map((unit) => unit.id),
    },
  };
}

async function playFieldMedicSwap({ seed = 1, substituteId = "elishia_p", hybridSide = "ally", maxActive = 3, events = createEventBus({ record: true }) } = {}) {
  if (!PHANTOM_IDS.includes(substituteId)) throw new TypeError(`Unknown Phantom substitute "${substituteId}".`);
  if (!['ally', 'enemy'].includes(hybridSide)) throw new TypeError('hybridSide must be "ally" or "enemy".');
  const hybridFactory = ({ side }) => createHybridFalconParty({ side, substituteId });
  const phantomFactory = ({ side }) => createPhantomParty({ side });
  const hybridOrder = createHybridFalconParty({ side: hybridSide, substituteId }).map((actor) => actor.id);
  const phantomOrder = PHANTOM_ORDER;
  const hybridIsPlayer = hybridSide === "ally";
  const battle = createBattle({
    output: { log() {} },
    seed,
    openingInitiative: "speed",
    events,
    partyFactory: hybridIsPlayer ? hybridFactory : phantomFactory,
    partyOrder: hybridIsPlayer ? hybridOrder : phantomOrder,
    opponentFactory: hybridIsPlayer ? phantomFactory : hybridFactory,
    maxActive,
    enemyMaxActive: maxActive,
    symmetricEvasion: true,
    controllers: {
      player: createMixedTacticalController(),
      enemy: createMixedTacticalController(),
    },
  });
  const initialSeed = battle.state.rng.seed;
  try {
    const result = await battle.run();
    return {
      result,
      seed: initialSeed,
      rounds: battle.state.round,
      hybridSide,
      substituteId,
      state: battle.state,
      events: battle.events,
    };
  } finally {
    battle.close();
  }
}

module.exports = {
  PHANTOM_IDS,
  BASELINE_ORDER,
  PHANTOM_ORDER,
  createHybridFalconParty,
  createMixedTacticalController,
  playFieldMedicSwap,
  summarizeSwapBattle,
};
