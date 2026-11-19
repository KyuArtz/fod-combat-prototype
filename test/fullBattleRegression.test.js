const test = require("node:test");
const assert = require("node:assert/strict");
const { playHeadless, DEFAULT_PARTY_ORDER } = require("../tools/lib/headless");
const { createEventBus } = require("../core/eventBus");
const { createDecisionRecorder, createScriptedController } = require("../core/controllers");

const FALCON_SKILLS = [
  ["elishia", "nano"], ["elishia", "barrier"], ["elishia", "meo"], ["elishia", "ultimate"],
  ["evalete", "pulse"], ["evalete", "triage"], ["evalete", "guardian"], ["evalete", "catalyst"],
  ["zackry", "mark"], ["zackry", "uplink"], ["zackry", "emp"], ["zackry", "ultimate"],
  ["jazen", "impactGrenade"], ["jazen", "breachCharge"], ["jazen", "reinforcedPlating"], ["jazen", "cataclysmicPayload"],
  ["zenki", "railshot"], ["zenki", "cipher"], ["zenki", "ghost"], ["zenki", "ultimate"],
];

function decisionFor(action) {
  if (action.targeting === "none") return { type: "skill", skillKey: action.key };
  if (action.targeting === "mode") {
    const mode = action.modes.find((candidate) => candidate.targeting === "none") || action.modes.find((candidate) => candidate.targets.length);
    assert.ok(mode, `${action.key} has an executable mode`);
    return { type: "skill", skillKey: action.key, mode: mode.id, ...(mode.targeting === "none" ? {} : { targetId: mode.targets[0] }) };
  }
  assert.ok(action.targets.length, `${action.key} has a legal target`);
  return { type: "skill", skillKey: action.key, targetId: action.targets[0] };
}

for (const [actorId, skillKey] of FALCON_SKILLS) {
  test(`full battle executes ${actorId}.${skillKey} through turn selection, validation and resolution`, async () => {
    let executed = false;
    const player = {
      chooseAction(view) {
        if (view.actor.id === actorId && !executed) {
          const action = view.actions.find((item) => item.type === "skill" && item.key === skillKey && item.usable);
          if (action) {
            executed = true;
            return decisionFor(action);
          }
        }
        const basic = view.actions.find((item) => item.type === "basic");
        if (basic?.targets.length) return { type: "basic", targetId: basic.targets[0] };
        return { type: "pass" };
      },
    };
    const events = createEventBus();
    const chosen = [];
    const rejected = [];
    events.on("ActionChosen", (event) => chosen.push(event));
    events.on("DecisionRejected", (event) => rejected.push(event));
    const partyOrder = [actorId, ...DEFAULT_PARTY_ORDER.filter((id) => id !== actorId)];
    const battle = await playHeadless({ seed: 700 + FALCON_SKILLS.findIndex(([id, key]) => id === actorId && key === skillKey), partyOrder, events, controllers: { player, enemy: { chooseAction(view) { const basic = view.actions.find((item) => item.type === "basic"); const targetId = basic?.targets.find((id) => id !== actorId); return targetId ? { type: "basic", targetId } : { type: "basic", targetId: basic.targets[0] }; } } } });
    assert.equal(executed, true, `${actorId}.${skillKey} should have had a real battle turn`);
    assert.ok(chosen.some((event) => event.kind === "player" && event.actorId === actorId && event.decision.type === "skill" && event.decision.skillKey === skillKey));
    assert.equal(rejected.length, 0, `${actorId}.${skillKey} must be accepted without rejection`);
    assert.ok(["VICTORY", "DEFEAT"].includes(battle.result));
    assert.ok(battle.picks.length > 10, "battle should progress beyond a setup-only path");
  });
}

test("full battle: all five Falcon agents participate and passive-triggering skills resolve in one encounter", async () => {
  const events = createEventBus();
  const actions = [];
  events.on("ActionChosen", (event) => actions.push(event));
  const policy = {
    chooseAction(view) {
      const preferred = {
        elishia: ["meo", "ultimate", "nano"],
        evalete: ["guardian", "catalyst", "triage"],
        zackry: ["mark", "uplink", "emp"],
        jazen: ["reinforcedPlating", "breachCharge", "impactGrenade"],
        zenki: ["ghost", "cipher", "railshot"],
      }[view.actor.id] || [];
      for (const key of preferred) {
        const action = view.actions.find((item) => item.type === "skill" && item.key === key && item.usable);
        if (action) return decisionFor(action);
      }
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  const result = await playHeadless({ seed: 32103, events, controllers: { player: policy } });
  for (const id of ["elishia", "evalete", "zackry", "jazen", "zenki"]) {
    assert.ok(actions.some((event) => event.kind === "player" && event.actorId === id), `${id} receives a turn`);
  }
  assert.ok(actions.some((event) => event.decision.type === "skill"), "skills are selected in the battle");
  assert.ok(["VICTORY", "DEFEAT"].includes(result.result));
});

test("full battle: 3-active formation can switch to reserves and preserve deterministic replay", async () => {
  const events = createEventBus();
  const partySwitches = [];
  events.on("PartySwitched", (event) => partySwitches.push(event));
  const recording = createDecisionRecorder(events);
  const player = {
    chooseAction(view) {
      const switchAction = view.actions.find((item) => item.type === "switch");
      if (switchAction?.reserves.some((member) => member.alive) && switchAction.active.length) {
        const reserve = switchAction.reserves.find((member) => member.alive);
        const active = switchAction.active[0];
        return { type: "switch", reserveId: reserve.id, activeId: active.id };
      }
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  const first = await playHeadless({ seed: 88031, maxActive: 3, events, controllers: { player } });
  assert.ok(recording.decisions.some((entry) => entry.decision.type === "switch"));
  assert.ok(partySwitches.length > 0, "manual switches emit PartySwitched");
  const replay = await playHeadless({ seed: 88031, maxActive: 3, partyOrder: recording.formation, controllers: { player: createScriptedController(recording.decisions) } });
  assert.equal(replay.result, first.result);
  assert.deepEqual(replay.state.log, first.state.log);
  assert.deepEqual(replay.state.rng, first.state.rng);
  assert.deepEqual(replay.state.party.active.map((actor) => actor.id), first.state.party.active.map((actor) => actor.id));
});

test("full battle: Jazen's Reinforced Plating redirects built-in enemy targeting through Taunt", async () => {
  const events = createEventBus();
  const enemyActions = [];
  events.on("ActionChosen", (event) => { if (event.kind === "enemy") enemyActions.push(event); });
  let tauntUsed = false;
  const player = {
    chooseAction(view) {
      if (view.actor.id === "jazen" && !tauntUsed) {
        const plating = view.actions.find((item) => item.type === "skill" && item.key === "reinforcedPlating" && item.usable);
        if (plating) { tauntUsed = true; return { type: "skill", skillKey: plating.key }; }
      }
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  const result = await playHeadless({ seed: 4519, events, controllers: { player } });
  assert.equal(tauntUsed, true);
  assert.ok(enemyActions.some((event) => event.decision.type === "basic" && event.decision.targetId === "jazen"), "enemy AI selects the taunting Jazen");
  assert.ok(["VICTORY", "DEFEAT"].includes(result.result));
});

test("full battle: Breach Charge Stagger delays readiness without deleting the enemy's next action", async () => {
  const events = createEventBus();
  let breachUsed = false;
  const player = {
    chooseAction(view) {
      if (view.actor.id === "jazen" && !breachUsed) {
        const breach = view.actions.find((item) => item.type === "skill" && item.key === "breachCharge" && item.usable);
        if (breach?.targets.length) { breachUsed = true; return { type: "skill", skillKey: breach.key, targetId: breach.targets[0] }; }
      }
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  const result = await playHeadless({ seed: 9914, events, controllers: { player } });
  assert.equal(breachUsed, true);
  assert.ok(result.state.log.some((line) => /next action was delayed by Stagger/.test(line)), "battle log records the readiness delay");
});

test("full battle: automatic reserve deployment replaces an incapacitated active Falcon", async () => {
  const events = createEventBus();
  const deployments = [];
  events.on("ReserveDeployed", (event) => deployments.push(event));
  events.on("ActionChosen", (event) => {
    if (event.kind === "enemy" && event.decision.type === "basic" && event.decision.targetId === "jazen") {
      const jazen = eventsState?.party.active.find((actor) => actor.id === "jazen");
      if (jazen) jazen.hp = 1;
    }
  });
  let eventsState;
  const enemy = {
    chooseAction(view) {
      const basic = view.actions.find((item) => item.type === "basic");
      const targetId = basic?.targets.includes("jazen") ? "jazen" : basic?.targets[0];
      return targetId ? { type: "basic", targetId } : { type: "pass" };
    },
  };
  const battle = require("../core/battle").createBattle({
    output: { log() {} }, seed: 6321, partyOrder: ["jazen", "zenki", "elishia", "evalete", "zackry"],
    controllers: { enemy, player: { chooseAction(view) { const basic = view.actions.find((item) => item.type === "basic"); return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" }; } } }, events,
  });
  battle.state.party.maxActive = 3;
  eventsState = battle.state;
  try {
    await battle.run();
    assert.ok(battle.state.log.some((line) => /deploys to ally formation slot/.test(line)), "reserve is automatically deployed into the vacated slot");
    assert.ok(battle.state.party.active.some((actor) => actor.id === "evalete" || actor.id === "zackry"));
    assert.ok(deployments.some((event) => event.defeatedId === "jazen" && event.side === "ally"));
  } finally { battle.close(); }
});

test("battle result checks victory and defeat against both deployed units and living reserves", () => {
  const { createBattleState } = require("../core/battleState");
  const formation = require("../systems/formation");
  const state = createBattleState();
  const ally = { id: "ally", side: "ally", alive: true, summon: false };
  const enemy = { id: "enemy", side: "enemy", alive: true, summon: false };
  state.actors = [ally, enemy];
  state.party.active = [ally]; state.party.reserve = [];
  state.enemyParty.active = [enemy]; state.enemyParty.reserve = [];
  assert.equal(formation.result(state), null);
  enemy.alive = false;
  assert.equal(formation.result(state), "VICTORY");
  enemy.alive = true; ally.alive = false;
  assert.equal(formation.result(state), "DEFEAT");
  ally.alive = true; enemy.alive = false;
  state.party.active = [{ ...ally, alive: false }];
  state.party.reserve = [{ ...ally, id: "reserve", alive: true }];
  assert.equal(formation.result(state), "VICTORY", "living reserve prevents premature defeat");
});

test("full battle: Jazen shield and skill cooldown expire on their actor-turn schedule", async () => {
  const observations = [];
  let used = false;
  const player = {
    chooseAction(view, { actor }) {
      if (view.actor.id === "jazen") {
        const plating = view.actions.find((item) => item.type === "skill" && item.key === "reinforcedPlating");
        observations.push({ cooldown: plating.cooldown, shieldTurns: actor.shields.filter((shield) => !shield.sourceId).reduce((max, shield) => Math.max(max, shield.turns), 0) });
        if (!used && plating.usable) { used = true; return { type: "skill", skillKey: plating.key }; }
      }
      const basic = view.actions.find((item) => item.type === "basic");
      return basic?.targets.length ? { type: "basic", targetId: basic.targets[0] } : { type: "pass" };
    },
  };
  await playHeadless({ seed: 7442, controllers: { player } });
  assert.equal(used, true);
  assert.ok(observations.some((entry) => entry.cooldown === 2 && entry.shieldTurns === 3), "first subsequent Jazen turn sees the full three-turn shield and a cooldown reduced to two");
  assert.ok(observations.some((entry) => entry.cooldown === 1 && entry.shieldTurns === 2), "second subsequent Jazen turn advances both durations");
  assert.ok(observations.some((entry) => entry.cooldown === 0 && entry.shieldTurns === 1), "cooldown expires before the final shield turn");
  assert.ok(observations.some((entry) => entry.cooldown === 0 && entry.shieldTurns === 0), "shield expires after its third full Jazen turn");
});

test("full battles emit the typed lifecycle and combat events without actor references", async () => {
  const { playHeadless } = require("../tools/lib/headless");
  const { createEventBus } = require("../core/eventBus");
  const events = createEventBus({ record: true });
  const battle = await playHeadless({ seed: 44021, events });
  const types = new Set(events.history.map((event) => event.type));
  for (const type of [
    "BattleStarted", "RoundStarted", "TurnStarted", "TurnEnded", "RoundEnded",
    "BasicAttackUsed", "DamageApplied", "ActorDied", "BattleEnded",
  ]) assert.ok(types.has(type), `expected ${type} in battle event stream`);
  assert.equal(events.history.at(-1).type, "BattleEnded");
  assert.ok(events.history.every((event) => !Object.hasOwn(event, "actor")));
  assert.doesNotThrow(() => structuredClone(events.history));
  assert.equal(events.history.at(-1).result, battle.result);
});

test("typed status, shield, heal, and skill events are emitted during a skill-heavy battle", async () => {
  const { playHeadless } = require("../tools/lib/headless");
  const { createEventBus } = require("../core/eventBus");
  const { createSkillCycler } = require("../tools/lib/elishiaScenarios");
  const events = createEventBus({ record: true });
  await playHeadless({ seed: 44022, events, controllers: { player: createSkillCycler() } });
  const types = new Set(events.history.map((event) => event.type));
  for (const type of ["SkillUsed", "Healed", "ShieldGained", "StatusApplied", "StatusExpired", "ShieldExpired", "ActorSummoned", "ActorSummonExpired"]) {
    assert.ok(types.has(type), `expected ${type} in skill event stream`);
  }
});
