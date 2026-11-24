const readline = require("node:readline");
const { createEnemyAI } = require("../ai/enemyAI");
const { createEncounterWaveEnemies, createEncounterReinforcements, validateEncounterData, encounters } = require("../characters/enemies");
const { createFalconParty } = require("../characters/falcon");
const { PLAYABLE_FACTIONS, createPlayableRoster } = require("../characters/roster");
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
const { mitigateReflectedDamage } = require("../systems/damage");
const { addStatus, effectiveStat: getEffectiveStat, incomingAttackModifier, tickStatuses } = require("../systems/statusEffects");
const { createBattleLog } = require("../ui/battleLog");
const { createBattleMenu } = require("../ui/battleMenu");
const { createDeploymentSelector } = require("../ui/deploymentSelection");
const { showParty, showStatus } = require("../ui/statusDisplay");
const thresholdCombatReadiness = require("../systems/thresholdCombatReadiness");
const enemyPolicies = {
  trainingDrone: require("../data/enemyAI/trainingDrone"),
  rogueAutomaton: require("../data/enemyAI/rogueAutomaton"),
  siegeTurret: require("../data/enemyAI/siegeTurret"),
  reconDrone: require("../data/enemyAI/reconDrone"),
  toxicStalker: require("../data/enemyAI/toxicStalker"),
  blightheartOverseer: require("../data/enemyAI/blightheartOverseer"),
  basicOnly: require("../data/enemyAI/basicOnly"),
};

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
  // Optional party order by actor id (a permutation of the selected faction roster). When
  // given, the interactive formation prompts are skipped.
  partyOrder,
  partyFactory = createFalconParty,
  // Backwards-compatible single-faction picker.
  selectPartyFaction = false,
  // Unified mixed-faction roster selector for interactive play.
  selectPartyCharacters = false,
  // A faction-versus-faction match uses a complete opponent roster instead of PvE waves.
  opponentFactory = null,
  maxActive,
  enemyMaxActive,
  symmetricEvasion = false,
  encounter = "trainingGround",
  onEncounterComplete = () => {},
  // Optional additional effect handlers; registered once alongside the built-in systems handlers.
  effectHandlers = {},
  lifecycleHandlers = {},
} = {}) {
  if (!encounters[encounter]) throw new TypeError(`Unknown encounter "${encounter}".`);
  validateEncounterData(encounters[encounter]);
  if (typeof onEncounterComplete !== "function") throw new TypeError("onEncounterComplete must be a function.");
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
  if (typeof partyFactory !== "function") throw new TypeError("partyFactory must be a function returning a combat roster.");
  if (typeof selectPartyFaction !== "boolean") throw new TypeError("selectPartyFaction must be a boolean.");
  if (typeof selectPartyCharacters !== "boolean") throw new TypeError("selectPartyCharacters must be a boolean.");
  if (selectPartyFaction && selectPartyCharacters) throw new TypeError("selectPartyFaction and selectPartyCharacters cannot both be enabled.");
  if ((selectPartyFaction || selectPartyCharacters) && partyOrder !== undefined) throw new TypeError("Interactive party selection cannot be combined with partyOrder.");
  if (opponentFactory !== null && typeof opponentFactory !== "function") throw new TypeError("opponentFactory must be a function returning an opponent roster.");
  for (const [key, value] of [["maxActive", maxActive], ["enemyMaxActive", enemyMaxActive]]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1 || value > 5)) {
      throw new RangeError(`${key} must be an integer from 1 to 5.`);
    }
  }
  if (typeof symmetricEvasion !== "boolean") throw new TypeError("symmetricEvasion must be a boolean.");
  const state = createBattleState({ seed });
  if (maxActive !== undefined) state.party.maxActive = maxActive;
  if (enemyMaxActive !== undefined) state.enemyParty.maxActive = enemyMaxActive;
  else if (opponentFactory && maxActive !== undefined) state.enemyParty.maxActive = maxActive;
  const standaloneMatch = Boolean(opponentFactory);
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
  let encounterCompleted = false;

  function queueTriggeredReinforcements(downedActor) {
    const runtime = state.encounter;
    const definition = encounters[encounter];
    if (!runtime || runtime.standalone || downedActor.side !== "enemy" || downedActor.summon) return;
    runtime.enemyDefeatedCount++;
    for (const reinforcement of definition.reinforcements || []) {
      if (runtime.triggeredReinforcements.includes(reinforcement.id)) continue;
      if (reinforcement.trigger.type !== "enemyDefeatedCount" || runtime.enemyDefeatedCount < reinforcement.trigger.atLeast) continue;
      const incoming = createEncounterReinforcements(encounter, reinforcement.id);
      runtime.triggeredReinforcements.push(reinforcement.id);
      state.enemyParty.roster.push(...incoming);
      state.enemyParty.reserve.push(...incoming);
      emitCombatEvent(events, "ReinforcementsQueued", {
        encounterId: encounter,
        reinforcementId: reinforcement.id,
        count: incoming.length,
        triggeredByActorId: downedActor.id,
      });
      say(`${incoming.length} reinforcements are dispatched to the enemy reserve!`);
    }
  }

  function evaluateBattleResult() {
    const result = formation.result(state);
    if (result !== "VICTORY" || !state.encounter) return result;
    if (encounterCompleted) return result;
    if (standaloneMatch) {
      encounterCompleted = true;
      const rewards = {};
      emitCombatEvent(events, "EncounterCompleted", { encounterId: "factionDuel", result, round: state.round, rewards });
      onEncounterComplete({ encounterId: "factionDuel", result, round: state.round, rewards });
      return result;
    }
    const runtime = state.encounter;
    const definition = encounters[encounter];
    const waves = Array.isArray(definition.waves)
      ? definition.waves
      : [{ id: "main", name: definition.name || "Main Wave", enemies: definition.enemies }];
    const currentWave = waves[runtime.waveIndex];
    emitCombatEvent(events, "EncounterWaveCleared", {
      encounterId: encounter, waveIndex: runtime.waveIndex + 1, waveId: currentWave.id || `wave-${runtime.waveIndex + 1}`,
    });
    if (runtime.waveIndex + 1 < waves.length) {
      runtime.waveIndex++;
      const nextWave = waves[runtime.waveIndex];
      const roster = createEncounterWaveEnemies(encounter, runtime.waveIndex);
      state.enemyParty.roster = roster;
      state.enemyParty.active = roster.slice(0, state.enemyParty.maxActive);
      state.enemyParty.reserve = roster.slice(state.enemyParty.maxActive);
      state.actors = state.actors.filter((actor) => !(actor.side === "enemy" && actor.summon));
      state.actors.push(...state.enemyParty.active);
      for (const actor of state.enemyParty.active) actor.cr = 0;
      emitCombatEvent(events, "EncounterWaveStarted", {
        encounterId: encounter,
        waveIndex: runtime.waveIndex + 1,
        waveId: nextWave.id || `wave-${runtime.waveIndex + 1}`,
        name: nextWave.name || `Wave ${runtime.waveIndex + 1}`,
      });
      say(`Enemy reinforcements form the next wave: ${nextWave.name || `Wave ${runtime.waveIndex + 1}`}!`);
      return null;
    }
    if (!encounterCompleted) {
      encounterCompleted = true;
      const rewards = structuredClone(definition.rewards || {});
      emitCombatEvent(events, "EncounterCompleted", { encounterId: encounter, result, round: state.round, rewards });
      onEncounterComplete({ encounterId: encounter, result, round: state.round, rewards });
    }
    return result;
  }
  const deploymentSelector = createDeploymentSelector({ ask, output });
  const effectiveStat = (actor, stat) => getEffectiveStat(state, actor, stat);
  // Late-bound: assigned once the skills (which define summon behaviour) exist.
  let summonDestroyed = () => {};
  let passiveHooks = {};
  const applyTargetDamage = (target, amount, damageType, sourceActor = null, metadata = {}) => {
    const beforeHp = target.hp;
    let absorbedAmount = 0;
    const shieldBefore = target.shields.reduce((sum, shield) => sum + shield.value, 0);
    const reflectionPercent = metadata.kind === "direct" && metadata.allowReflection !== false &&
      sourceActor && sourceActor.side !== target.side
      ? Math.max(0, ...Object.values(target.statuses || {}).map((status) => status.damageReflectionPercent || 0))
      : 0;
    const hpLoss = applyDamage(
      target,
      amount,
      say,
      (downedActor, defeatStatuses, damageMeta) => {
        absorbedAmount = damageMeta?.absorbedAmount || 0;
        emitCombatEvent(events, "ActorDied", { actorId: downedActor.id, side: downedActor.side, round: state.round });
        queueTriggeredReinforcements(downedActor);
        if (passiveHooks.onUnitDefeated) passiveHooks.onUnitDefeated(downedActor, defeatStatuses);
        const replacement = formation.deployFirstReserve(state, downedActor.side, downedActor);
        if (replacement) {
          // A reserve passive becomes active only when its owner is deployed.
          skillSet.onBattleStart([replacement.incoming]);
          say(`${replacement.incoming.name} deploys to ${downedActor.side} formation slot ${replacement.slot + 1}!`);
          emitCombatEvent(events, "ReserveDeployed", {
            incomingId: replacement.incoming.id, defeatedId: downedActor.id,
            side: downedActor.side, slot: replacement.slot, round: state.round,
          });
        }
        if (downedActor.summon) summonDestroyed(downedActor);
      },
      damageType,
    );
    if (target.alive) {
      const afterShield = target.shields.reduce((sum, shield) => sum + shield.value, 0);
      absorbedAmount = Math.max(0, Math.min(amount, shieldBefore - afterShield));
    }
    const actualHpLoss = Math.max(0, beforeHp - target.hp);
    emitCombatEvent(events, "DamageApplied", {
      sourceId: sourceActor?.id || null,
      sourceSide: sourceActor?.side || null,
      kind: metadata.kind || "direct",
      targetId: target.id,
      requestedAmount: amount,
      hpLoss: actualHpLoss,
      absorbedAmount,
      damageType: damageType || "Unspecified",
    });
    if (passiveHooks.onDamageTaken) {
      passiveHooks.onDamageTaken(target, amount, damageType, hpLoss, {
        kind: metadata.kind || "direct", sourceId: sourceActor?.id || null,
        actionType: metadata.actionType || null, skillKey: metadata.skillKey || null,
      });
    }
    if (passiveHooks.onDamageDealt && sourceActor && (metadata.kind || "direct") === "direct") {
      passiveHooks.onDamageDealt(sourceActor, target, amount, damageType, {
        kind: "direct", actionType: metadata.actionType || null, skillKey: metadata.skillKey || null,
      });
    }

    // Reflection is based on post-mitigation damage before the recipient's shields.
    // Reflected damage is mitigated by the original attacker's defenses, and cannot reflect again.
    if (reflectionPercent > 0 && sourceActor?.alive && amount > 0) {
      const reflectedBase = Math.floor(amount * reflectionPercent / 100);
      if (reflectedBase <= 0) return hpLoss;
      const reflectedDamage = mitigateReflectedDamage(sourceActor, reflectedBase, damageType || "Physical", effectiveStat, target);
      say(`${target.name} reflects ${reflectedDamage} damage back to ${sourceActor.name}!`);
      applyTargetDamage(sourceActor, reflectedDamage, damageType || "Physical", target, {
        kind: "reflected", allowReflection: false,
      });
    }
    return hpLoss;
  };
  const trackedHeal = (target, amount) => {
    const healed = heal(target, amount);
    emitCombatEvent(events, "Healed", { targetId: target.id, requestedAmount: amount, healed });
    return healed;
  };
  const trackedAddShield = (target, amount, turns, adaptive) => {
    addShield(target, amount, turns, adaptive);
    emitCombatEvent(events, "ShieldGained", { targetId: target.id, amount, turns: turns ?? 2 });
  };
  const trackedAddStatus = (target, statusId, data) => {
    const applied = addStatus(target, statusId, data);
    if (applied) emitCombatEvent(events, "StatusApplied", { targetId: target.id, statusId, turns: Number.isFinite(data.turns) ? data.turns : null });
    return applied;
  };
  const trackedTickStatuses = (actor) => {
    const before = new Set(Object.keys(actor.statuses));
    tickStatuses(actor);
    const expired = [...before].filter((id) => !Object.hasOwn(actor.statuses, id));
    if (expired.length) emitCombatEvent(events, "StatusExpired", { actorId: actor.id, statusIds: expired });
  };
  const trackedTickShields = (actor) => {
    const before = actor.shields.length;
    tickShields(actor);
    const count = Math.max(0, before - actor.shields.length);
    if (count) emitCombatEvent(events, "ShieldExpired", { actorId: actor.id, count });
  };
  const actionResolver = createActionResolver({
    state,
    effectiveStat,
    applyDamage: applyTargetDamage,
    say,
    random,
    incomingAttackModifier,
    onEvade: (target, attacker) => passiveHooks.onEvade?.(target, attacker),
    symmetricEvasion,
  });

  const context = {
    state,
    effectHandlers,
    lifecycleHandlers,
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
  const { skills, enemySkills, summonTurn } = skillSet;
  summonDestroyed = skillSet.summonDestroyed;
  passiveHooks = skillSet;
  const battleMenu = createBattleMenu(context);
  const enemyAI = createEnemyAI({ ...context, skills: { ...skills, ...enemySkills }, policies: enemyPolicies, ready: cooldowns.ready });
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
    onPassiveDeploy: (actor) => skillSet.onBattleStart([actor]),
    onPassiveUndeploy: (actor) => {
      for (const summon of state.actors.filter((unit) => unit.summon && unit.ownerId === actor.id)) {
        summon.alive = false;
        summon.summonTurns = 0;
      }
    },
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
    getResult: evaluateBattleResult,
    takeTurn: turnRunner.runTurn,
    meoTurn: summonTurn, // legacy parameter name, used only when no takeTurn is given
    showStatus,
  });

  async function run() {
    output.log(
      "=== F.O.D. COMBAT SIMULATOR: =======================================================",
    );
    output.log(`Seed: ${state.rng.seed}`);
    let allyRoster;
    let selectedParty;
    if (selectPartyCharacters) {
      const availableRoster = createPlayableRoster({ side: "ally" });
      selectedParty = await deploymentSelector.selectMixedFormation(availableRoster, {
        activeCount: state.party.maxActive,
        maxPartySize: 5,
      });
      // Only selected members are initialized and receive battle-start passives.
      allyRoster = selectedParty;
      say(`Formation assembled from ${[...new Set(selectedParty.map((actor) => actor.faction))].join(" + ")}.`);
    } else {
      let selectedPartyFactory = partyFactory;
      if (selectPartyFaction) {
        const faction = await deploymentSelector.selectFaction(
          PLAYABLE_FACTIONS.map(({ id, label }) => ({ id, label })),
        );
        selectedPartyFactory = PLAYABLE_FACTIONS.find((entry) => entry.id === faction)?.factory;
        if (!selectedPartyFactory) throw new Error(`Selected faction "${faction}" is not registered.`);
        say(`Selected faction: ${PLAYABLE_FACTIONS.find((entry) => entry.id === faction).label}.`);
      }
      allyRoster = selectedPartyFactory({ side: "ally" });
      if (!Array.isArray(allyRoster) || allyRoster.length < state.party.maxActive) {
        throw new TypeError(`partyFactory must return at least ${state.party.maxActive} combatants.`);
      }
      selectedParty = partyOrder
        ? orderRoster(allyRoster, partyOrder)
        : await deploymentSelector.selectFormation(allyRoster, state.party.maxActive);
    }
    emitCombatEvent(events, "FormationSelected", { ids: selectedParty.map((actor) => actor.id) });
    formation.setupParty(state, selectedParty);
    const encounterDefinition = standaloneMatch ? null : encounters[encounter];
    if (!standaloneMatch && !encounterDefinition) throw new Error(`Unknown encounter "${encounter}".`);
    const enemyRoster = standaloneMatch
      ? opponentFactory({ side: "enemy" })
      : createEncounterWaveEnemies(encounter, 0);
    if (!Array.isArray(enemyRoster) || enemyRoster.length < state.enemyParty.maxActive) {
      throw new TypeError(`opponentFactory must return at least ${state.enemyParty.maxActive} combatants.`);
    }
    formation.setupEnemyParty(state, enemyRoster);
    const actorsBeforeBattleStart = new Set(state.actors);
    // Battle-start passives are global: both factions and all enemy archetypes receive them.
    // Only deployed combatants activate battle-start passives. Reserve members
    // activate their passives when they enter the field.
    skillSet.onBattleStart([...state.party.active, ...state.enemyParty.active]);
    const initialSummons = state.actors.filter((unit) => !actorsBeforeBattleStart.has(unit) && unit.summon);
    const waves = standaloneMatch
      ? [{ id: "faction-duel", name: "Faction Duel", enemies: [] }]
      : Array.isArray(encounterDefinition.waves)
        ? encounterDefinition.waves
        : [{ id: "main", name: encounterDefinition.name || "Main Wave", enemies: encounterDefinition.enemies }];
    const encounterId = standaloneMatch ? "factionDuel" : encounter;
    state.encounter = {
      id: encounterId, waveIndex: 0, enemyDefeatedCount: 0, triggeredReinforcements: [],
      ...(standaloneMatch ? { standalone: true } : {}),
    };
    emitCombatEvent(events, "BattleStarted", { seed: state.rng.seed });
    emitCombatEvent(events, "EncounterStarted", { encounterId, waveCount: waves.length });
    emitCombatEvent(events, "EncounterWaveStarted", {
      encounterId, waveIndex: 1, waveId: waves[0].id || "main", name: waves[0].name || "Main Wave",
    });
    for (const unit of initialSummons) {
      emitCombatEvent(events, "ActorSummoned", { actorId: unit.id, ownerId: unit.ownerId || "unknown", side: unit.side, round: state.round });
    }
    showParty(state.enemyParty, output, "ENEMY FORMATION");
    battleMenu.showParty();

    if (openingInitiative === "player-first") {
      const opening = applyOpeningInitiative(state, effectiveStat, { firstSide: "ally" });
      if (opening.applied) {
        const teamName = String(allyRoster[0]?.faction || "ally");
        say(`The ${teamName.charAt(0).toUpperCase()}${teamName.slice(1)} team seizes the initiative!`);
        emitCombatEvent(events, "OpeningInitiative", opening);
      }
    }

    await turnEngine.runRounds();
    const finalResult = evaluateBattleResult();
    emitCombatEvent(events, "BattleEnded", { result: finalResult, round: state.round });
    output.log(
      `\n=== ${finalResult} ===========================================================================`,
    );
    showStatus(state, output);
    return finalResult;
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