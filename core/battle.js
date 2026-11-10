const readline = require("node:readline");
const { createEnemyAI } = require("../ai/enemyAI");
const { createTrainingEnemies } = require("../characters/enemies");
const { createFalconParty } = require("../characters/falcon");
const { createSkills } = require("../characters/skills");
const { makeActor } = require("../characters/actorFactory");
const { createActionResolver } = require("./actionResolver");
const { createBattleState } = require("./battleState");
const { createEventBus } = require("./eventBus");
const { nextFloat } = require("./rng");
const { applyOpeningInitiative } = require("../systems/openingInitiative");
const { createTurnEngine } = require("./turnEngine");
const { createTurnRunner } = require("./turnRunner");
const cooldowns = require("../systems/cooldowns");
const formation = require("../systems/formation");
const { addShield, tickShields } = require("../systems/shields");
const { applyDamage, heal, } = require("../systems/damageApplication");
const { addStatus, effectiveStat: getEffectiveStat, tickStatuses, } = require("../systems/statusEffects");
const { createBattleLog } = require("../ui/battleLog");
const { createBattleMenu } = require("../ui/battleMenu");
const { createDeploymentSelector } = require("../ui/deploymentSelection");
const { showParty, showStatus } = require("../ui/statusDisplay");
const thresholdCombatReadiness = require("../systems/thresholdCombatReadiness");

// Returns the roster in the given id order; the ids must be exactly the roster's.
function orderRoster(roster, ids) {
  const byId = new Map(roster.map((actor) => [actor.id, actor]));
  const unique = new Set(ids);
  if (unique.size !== ids.length || ids.length !== roster.length || !ids.every((id) => byId.has(id))) {
    throw new Error(
      `partyOrder must list each roster member exactly once (${roster.map((actor) => actor.id).join(", ")}).`,
    );
  }
  return ids.map((id) => byId.get(id));
}

function createBattle({
  input = process.stdin,
  promptOutput = process.stdout,
  output = console,
  readinessScheduler = thresholdCombatReadiness,
  seed,
  events = createEventBus(),
  // "player-first": the player's side acts first (PvE default). "speed": pure SPD order.
  openingInitiative = "player-first",
  // Who decides each turn. Defaults: the terminal menu for the player's party, the
  // built-in AI for enemies, automatic behaviour for summons. Each is a function or
  // an object with chooseAction(view). See core/controllers.js for headless ones.
  controllers = {},
  // Optional party order by actor id (a permutation of the Falcon roster). When
  // given, the interactive formation prompts are skipped.
  partyOrder,
} = {}) {
  if (openingInitiative !== "player-first" && openingInitiative !== "speed") {
    throw new TypeError(
      `Unknown openingInitiative "${openingInitiative}". Use "player-first" or "speed".`,
    );
  }
  for (const key of Object.keys(controllers)) {
    if (key !== "player" && key !== "enemy" && key !== "summon") {
      throw new TypeError(`Unknown controller "${key}". Use "player", "enemy" or "summon".`);
    }
  }
  if (partyOrder !== undefined && !(Array.isArray(partyOrder) && partyOrder.every((id) => typeof id === "string"))) {
    throw new TypeError("partyOrder must be an array of actor id strings.");
  }
  const state = createBattleState({ seed });
  const random = () => nextFloat(state.rng);
  // The readline interface is created on first use, so fully headless battles
  // (scripted controllers plus partyOrder) never touch stdin.
  let prompts = null;
  const ask = (question) =>
    new Promise((resolve) => {
      if (!prompts) prompts = readline.createInterface({ input, output: promptOutput });
      prompts.question(question, resolve);
    });
  const { say } = createBattleLog(state, output, events);
  const deploymentSelector = createDeploymentSelector({ ask, output });
  const effectiveStat = (actor, stat) => getEffectiveStat(state, actor, stat);
  const applyTargetDamage = (target, amount) => applyDamage(target, amount, say, (downedActor) => {
      const replacement = formation.deployFirstReserve(
        state,
        downedActor.side,
        downedActor,
      );
      if (replacement) {
        say(
          `${replacement.incoming.name} deploys to ${downedActor.side} formation slot ${replacement.slot + 1}!`,
        );
      }
    });
  const actionResolver = createActionResolver({
    state,
    effectiveStat,
    applyDamage: applyTargetDamage,
    say,
    random,
  });

  const context = {
    state,
    ask,
    output,
    say,
    events,
    random,
    alive: formation.alive,
    addShield,
    addStatus,
    applyDamage: applyTargetDamage,
    basicAttack: actionResolver.basicAttack,
    calculateMastery: actionResolver.calculateMastery,
    calculatePhysical: actionResolver.calculatePhysical,
    effectiveStat,
    heal,
    hitMastery: actionResolver.hitMastery,
    hitPhysical: actionResolver.hitPhysical,
    makeActor,
    passive(actor) {
      actor.discount = true;
    },
    pay: cooldowns.pay,
    ready: cooldowns.ready,
    tickCooldowns: cooldowns.tickCooldowns,
    tickShields,
    tickStatuses,
    adjustCR: readinessScheduler.adjustCR,
  };
  const { skills, meoTurn } = createSkills(context);
  const battleMenu = createBattleMenu(context);
  const enemyAI = createEnemyAI(context);
  const turnRunner = createTurnRunner({
    state,
    events,
    skills,
    enemyAI,
    meoTurn,
    basicAttack: actionResolver.basicAttack,
    alive: formation.alive,
    ready: cooldowns.ready,
    say,
    formation,
    controllers: {
      player: battleMenu,
      enemy: enemyAI.controller,
      summon: { chooseAction: () => ({ type: "summonAuto" }) },
      ...controllers,
    },
  });
  const turnEngine = createTurnEngine({
    ...context,
    combatReadiness: readinessScheduler,
    getResult: () => formation.result(state),
    takeTurn: turnRunner.runTurn,
    meoTurn,
    showStatus,
  });

  async function run() {
    output.log(
      "=== F.O.D. COMBAT SIMULATOR: =======================================================",
    );
    output.log(`Seed: ${state.rng.seed}`);
    const allyRoster = createFalconParty();
    const selectedParty = partyOrder
      ? orderRoster(allyRoster, partyOrder)
      : await deploymentSelector.selectFormation(allyRoster, state.party.maxActive);
    events.emit("FormationSelected", { ids: selectedParty.map((actor) => actor.id) });
    formation.setupParty(state, selectedParty);
    const enemyRoster = createTrainingEnemies();
    formation.setupEnemyParty(state, enemyRoster);
    showParty(state.enemyParty, output, "ENEMY FORMATION");
    battleMenu.showParty();

    if (openingInitiative === "player-first") {
      const opening = applyOpeningInitiative(state, effectiveStat, { firstSide: "ally" });
      if (opening.applied) {
        say("The Falcon team seizes the initiative!");
        events.emit("OpeningInitiative", opening);
      }
    }

    await turnEngine.runRounds();
    output.log(
      `\n=== ${formation.result(state)} ===========================================================================`,
    );
    showStatus(state, output);
    return formation.result(state);
  }

  return {
    run,
    close: () => {
      if (prompts) prompts.close();
    },
    state,
    events,
  };
}

module.exports = { createBattle };