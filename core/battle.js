const readline = require("node:readline");
const { createEnemyAI } = require("../ai/enemyAI");
const { createTrainingEnemies } = require("../characters/enemies");
const { createFalconParty } = require("../characters/falcon");
const { createSkills } = require("../characters/skills");
const { makeActor } = require("../characters/actorFactory");
const { createActionResolver } = require("./actionResolver");
const { createBattleState } = require("./battleState");
const { createEventBus } = require("./eventBus");
const { emitCombatEvent } = require("./combatEvents");
const { nextFloat } = require("./rng");
const { applyOpeningInitiative } = require("../systems/openingInitiative");
const { createTurnEngine } = require("./turnEngine");
const { createTurnRunner } = require("./turnRunner");
const cooldowns = require("../systems/cooldowns");
const formation = require("../systems/formation");
const { addShield, tickShields } = require("../systems/shields");
const { applyDamage, heal } = require("../systems/damageApplication");
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
  if (
    unique.size !== ids.length ||
    ids.length !== roster.length ||
    !ids.every((id) => byId.has(id))
  ) {
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
      throw new TypeError(
        `Unknown controller "${key}". Use "player", "enemy" or "summon".`,
      );
    }
  }
  if (
    partyOrder !== undefined &&
    !(
      Array.isArray(partyOrder) &&
      partyOrder.every((id) => typeof id === "string")
    )
  ) {
    throw new TypeError("partyOrder must be an array of actor id strings.");
  }
  const state = createBattleState({ seed });
  const random = () => nextFloat(state.rng);
  // The readline interface is created on first use, so fully headless battles
  // (scripted controllers plus partyOrder) never touch stdin.
  let prompts = null;
  const ask = (question) =>
    new Promise((resolve) => {
      if (!prompts)
        prompts = readline.createInterface({ input, output: promptOutput });
      prompts.question(question, resolve);
    });
  const { say } = createBattleLog(state, output, events);
  const deploymentSelector = createDeploymentSelector({ ask, output });
  const effectiveStat = (actor, stat) => getEffectiveStat(state, actor, stat);
  // Late-bound: assigned once the skills (which define summon behaviour) exist.
  let summonDestroyed = () => {};
  let passiveHooks = {};
  const applyTargetDamage = (target, amount, damageType) => {
    const beforeHp = target.hp;
    let absorbedAmount = 0;
    const shieldBefore = target.shields.reduce(
      (sum, shield) => sum + shield.value,
      0,
    );
    const hpLoss = applyDamage(
      target,
      amount,
      say,
      (downedActor, defeatStatuses, damageMeta) => {
        absorbedAmount = damageMeta?.absorbedAmount || 0;
        emitCombatEvent(events, "ActorDied", {
          actorId: downedActor.id,
          side: downedActor.side,
          round: state.round,
        });
        if (passiveHooks.onUnitDefeated)
          passiveHooks.onUnitDefeated(downedActor, defeatStatuses);
        const replacement = formation.deployFirstReserve(
          state,
          downedActor.side,
          downedActor,
        );
        if (replacement) {
          say(
            `${replacement.incoming.name} deploys to ${downedActor.side} formation slot ${replacement.slot + 1}!`,
          );
          emitCombatEvent(events, "ReserveDeployed", {
            incomingId: replacement.incoming.id,
            defeatedId: downedActor.id,
            side: downedActor.side,
            slot: replacement.slot,
            round: state.round,
          });
        }
        if (downedActor.summon) summonDestroyed(downedActor);
      },
      damageType,
    );
    if (target.alive) {
      const afterShield = target.shields.reduce(
        (sum, shield) => sum + shield.value,
        0,
      );
      // A living target retains its shields, so their value delta is exact.
      absorbedAmount = Math.max(
        0,
        Math.min(amount, shieldBefore - afterShield),
      );
    }
    const actualHpLoss = Math.max(0, beforeHp - target.hp);
    emitCombatEvent(events, "DamageApplied", {
      targetId: target.id,
      requestedAmount: amount,
      hpLoss: actualHpLoss,
      absorbedAmount,
      damageType: damageType || "Unspecified",
    });
    if (passiveHooks.onDamageTaken)
      passiveHooks.onDamageTaken(target, amount, damageType, hpLoss);
    return hpLoss;
  };
  const trackedHeal = (target, amount) => {
    const healed = heal(target, amount);
    emitCombatEvent(events, "Healed", {
      targetId: target.id,
      requestedAmount: amount,
      healed,
    });
    return healed;
  };
  const trackedAddShield = (target, amount, turns, adaptive) => {
    addShield(target, amount, turns, adaptive);
    emitCombatEvent(events, "ShieldGained", {
      targetId: target.id,
      amount,
      turns: turns ?? 2,
    });
  };
  const trackedAddStatus = (target, statusId, data) => {
    const applied = addStatus(target, statusId, data);
    if (applied)
      emitCombatEvent(events, "StatusApplied", {
        targetId: target.id,
        statusId,
        turns: Number.isFinite(data.turns) ? data.turns : null,
      });
    return applied;
  };
  const trackedTickStatuses = (actor) => {
    const before = new Set(Object.keys(actor.statuses));
    tickStatuses(actor);
    const expired = [...before].filter(
      (id) => !Object.hasOwn(actor.statuses, id),
    );
    if (expired.length)
      emitCombatEvent(events, "StatusExpired", {
        actorId: actor.id,
        statusIds: expired,
      });
  };
  const trackedTickShields = (actor) => {
    const before = actor.shields.length;
    tickShields(actor);
    const count = Math.max(0, before - actor.shields.length);
    if (count)
      emitCombatEvent(events, "ShieldExpired", { actorId: actor.id, count });
  };
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
    addShield: trackedAddShield,
    addStatus: trackedAddStatus,
    applyDamage: applyTargetDamage,
    basicAttack: actionResolver.basicAttack,
    calculateMastery: actionResolver.calculateMastery,
    calculatePhysical: actionResolver.calculatePhysical,
    effectiveStat,
    heal: trackedHeal,
    hitMastery: actionResolver.hitMastery,
    hitPhysical: actionResolver.hitPhysical,
    makeActor,
    pay: cooldowns.pay,
    ready: cooldowns.ready,
    tickCooldowns: cooldowns.tickCooldowns,
    tickShields: trackedTickShields,
    tickStatuses: trackedTickStatuses,
    adjustCR: readinessScheduler.adjustCR,
  };
  const skillSet = createSkills(context);
  const { skills, summonTurn } = skillSet;
  summonDestroyed = skillSet.summonDestroyed;
  passiveHooks = skillSet;
  const battleMenu = createBattleMenu(context);
  const enemyAI = createEnemyAI(context);
  const turnRunner = createTurnRunner({
    state,
    events,
    skills,
    enemyAI,
    summonTurn,
    basicAttack: actionResolver.basicAttack,
    alive: formation.alive,
    ready: cooldowns.ready,
    say,
    formation,
    onEnemySkillTargeted: skillSet.onEnemySkillTargeted,
    controllers: {
      player: battleMenu,
      enemy: enemyAI.controller,
      summon: { chooseAction: () => ({ type: "summonAuto" }) },
      ...controllers,
    },
  });
  const turnEngine = createTurnEngine({
    ...context,
    onTurnStart: skillSet.onTurnStart,
    onTurnEnd: skillSet.onTurnEnd,
    onRoundStart: skillSet.onRoundStart,
    combatReadiness: readinessScheduler,
    getResult: () => formation.result(state),
    takeTurn: turnRunner.runTurn,
    meoTurn: summonTurn, // legacy parameter name, used only when no takeTurn is given
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
      : await deploymentSelector.selectFormation(
          allyRoster,
          state.party.maxActive,
        );
    emitCombatEvent(events, "FormationSelected", {
      ids: selectedParty.map((actor) => actor.id),
    });
    formation.setupParty(state, selectedParty);
    const actorsBeforeBattleStart = new Set(state.actors);
    skillSet.onBattleStart(allyRoster);
    const initialSummons = state.actors.filter(
      (unit) => !actorsBeforeBattleStart.has(unit) && unit.summon,
    );
    const enemyRoster = createTrainingEnemies();
    formation.setupEnemyParty(state, enemyRoster);
    emitCombatEvent(events, "BattleStarted", { seed: state.rng.seed });
    for (const unit of initialSummons) {
      emitCombatEvent(events, "ActorSummoned", {
        actorId: unit.id,
        ownerId: unit.ownerId || "unknown",
        side: unit.side,
        round: state.round,
      });
    }
    showParty(state.enemyParty, output, "ENEMY FORMATION");
    battleMenu.showParty();

    if (openingInitiative === "player-first") {
      const opening = applyOpeningInitiative(state, effectiveStat, {
        firstSide: "ally",
      });
      if (opening.applied) {
        say("The Falcon team seizes the initiative!");
        emitCombatEvent(events, "OpeningInitiative", opening);
      }
    }

    await turnEngine.runRounds();
    emitCombatEvent(events, "BattleEnded", {
      result: formation.result(state),
      round: state.round,
    });
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
    // Engine damage entry point (typed damage, shields, incapacitation handling).
    // For tests and dev tools; the game itself deals damage through skills and AI.
    dealDamage: applyTargetDamage,
  };
}

module.exports = { createBattle };
