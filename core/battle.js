const readline = require("node:readline");
const { createEnemyAI } = require("../ai/enemyAI");
const { createTrainingEnemies } = require("../characters/enemies");
const { createFalconParty } = require("../characters/falcon");
const { createSkills } = require("../characters/skills");
const { makeActor } = require("../characters/actorFactory");
const { createActionResolver } = require("./actionResolver");
const { createBattleState } = require("./battleState");
const { createTurnEngine } = require("./turnEngine");
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

function createBattle({
  input = process.stdin,
  promptOutput = process.stdout,
  output = console,
  readinessScheduler = thresholdCombatReadiness,
} = {}) {
  const state = createBattleState();
  const prompts = readline.createInterface({ input, output: promptOutput });
  const ask = (question) => new Promise((resolve) => prompts.question(question, resolve));
  const { say } = createBattleLog(state, output);
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
  });

  const context = {
    state,
    ask,
    output,
    say,
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
  const battleMenu = createBattleMenu({ ...context, skills });
  const enemyAI = createEnemyAI(context);
  const turnEngine = createTurnEngine({
    ...context,
    combatReadiness: readinessScheduler,
    getResult: () => formation.result(state),
    playerTurn: battleMenu.playerTurn,
    enemyTurn: enemyAI.enemyTurn,
    meoTurn,
    showStatus,
  });

  async function run() {
    output.log(
      "=== F.O.D. COMBAT SIMULATOR: =======================================================",
    );
    const allyRoster = createFalconParty();
    const selectedParty = await deploymentSelector.selectFormation(
      allyRoster,
      state.party.maxActive,
    );
    formation.setupParty(state, selectedParty);
    const enemyRoster = createTrainingEnemies();
    formation.setupEnemyParty(state, enemyRoster);
    showParty(state.enemyParty, output, "ENEMY FORMATION");
    battleMenu.showParty();

    await turnEngine.runRounds();
    output.log(
      `\n=== ${formation.result(state)} ===========================================================================`,
    );
    showStatus(state, output);
    return formation.result(state);
  }

  return {
    run,
    close: () => prompts.close(),
    state,
  };
}

module.exports = { createBattle };