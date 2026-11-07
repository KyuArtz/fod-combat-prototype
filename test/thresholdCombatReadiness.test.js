const test = require("node:test");
const assert = require("node:assert/strict");
const legacyReadiness = require("../systems/combatReadiness");
const {
  createThresholdScheduler,
} = require("../systems/thresholdCombatReadiness");
const { createBattleState } = require("../core/battleState");
const { createTurnEngine, removeInactiveSummons } = require("../core/turnEngine");
const {
  deployFirstReserve,
  switchPartyMember,
} = require("../systems/formation");

function actor(name, speed, options = {}) {
  return {
    id: options.id || name.toLowerCase(),
    name,
    side: options.side || "ally",
    alive: options.alive === undefined ? true : options.alive,
    summon: options.summon || false,
    summonTurns: options.summonTurns || 0,
    stats: { SPD: speed, MP: 0, HP: 100 },
    statuses: {},
    cr: options.cr || 0,
  };
}

function effectiveStat(unit, stat) {
  let value = unit.stats[stat] || 0;
  for (const effect of Object.values(unit.statuses || {})) {
    if (effect.stat === stat) value *= 1 + effect.amount / 100;
  }
  return Math.floor(Math.max(0, value));
}

function scheduleOrder(units, count) {
  const state = createBattleState();
  state.actors = units;
  const scheduler = createThresholdScheduler();
  const order = [];
  for (let index = 0; index < count; index++) {
    const next = scheduler.nextActor(state, effectiveStat);
    order.push(next.name);
    scheduler.resetCR(next);
  }
  return { order, state };
}

test("Zenki reaches readiness first and other actors retain fractional CR", () => {
  const zenki = actor("Zenki", 110);
  const elishia = actor("Elishia", 95);
  const jazen = actor("Jazen", 70);
  const state = createBattleState();
  state.actors = [zenki, elishia, jazen];
  const scheduler = createThresholdScheduler();

  assert.equal(scheduler.nextActor(state, effectiveStat), zenki);
  assert.ok(Math.abs(elishia.cr - 86.3636363636) < 1e-8);
  assert.ok(Math.abs(jazen.cr - 63.6363636364) < 1e-8);
  scheduler.resetCR(zenki);
  assert.equal(scheduler.nextActor(state, effectiveStat), elishia);
  scheduler.resetCR(elishia);
  assert.equal(scheduler.nextActor(state, effectiveStat), jazen);
});

test("simultaneous equal-SPD actors tie-break deterministically, not by formation order", () => {
  const firstFormation = scheduleOrder(
    [actor("Alpha", 100), actor("Bravo", 100), actor("Charlie", 100)],
    6,
  );
  const reversedFormation = scheduleOrder(
    [actor("Charlie", 100), actor("Bravo", 100), actor("Alpha", 100)],
    6,
  );
  assert.deepEqual(firstFormation.order, reversedFormation.order);
  assert.deepEqual(firstFormation.order.slice(0, 3), [
    "Alpha",
    "Bravo",
    "Charlie",
  ]);
  assert.deepEqual(firstFormation.order.slice(3), [
    "Bravo",
    "Charlie",
    "Alpha",
  ]);
});

test("faster actor can receive legitimate consecutive turns", () => {
  const { order } = scheduleOrder(
    [actor("Quick", 200), actor("Slow", 50)],
    5,
  );
  assert.deepEqual(order, [
    "Quick",
    "Quick",
    "Quick",
    "Quick",
    "Slow",
  ]);
});

test("other actors' partial CR is preserved when a turn resets", () => {
  const fast = actor("Fast", 200);
  const slow = actor("Slow", 100);
  const state = createBattleState();
  state.actors = [fast, slow];
  const scheduler = createThresholdScheduler();

  assert.equal(scheduler.nextActor(state, effectiveStat), fast);
  assert.equal(slow.cr, 50);
  scheduler.resetCR(fast);
  assert.equal(fast.cr, 0);
  assert.equal(slow.cr, 50);
});

test("SPD buffs and debuffs affect subsequent continuous advancement", () => {
  for (const [amount, expectedTime] of [
    [50, 0.4],
    [-50, 1.2],
  ]) {
    const unit = actor("StatusTarget", 100, { cr: 40 });
    unit.statuses.speed = { stat: "SPD", amount };
    const state = createBattleState();
    state.actors = [unit];
    let advanced;
    const scheduler = createThresholdScheduler({
      onDiagnostic(event) {
        if (event.type === "advance") advanced = event.timeAdvanced;
      },
    });

    assert.equal(scheduler.nextActor(state, effectiveStat), unit);
    assert.ok(Math.abs(advanced - expectedTime) < 1e-8);
  }
});

test("zero or invalid SPD fails explicitly instead of looping", () => {
  const state = createBattleState();
  state.actors = [actor("Zero", 0), actor("Invalid", Number.NaN)];
  const scheduler = createThresholdScheduler();
  assert.throws(
    () =>
      scheduler.nextActor(state, (unit, stat) =>
        unit.name === "Invalid" ? Number.NaN : effectiveStat(unit, stat),
      ),
    /zero or invalid SPD/,
  );
});

test("no living deployed actors returns null", () => {
  const state = createBattleState();
  state.actors = [actor("Down", 100, { alive: false })];
  assert.equal(
    createThresholdScheduler().nextActor(state, effectiveStat),
    null,
  );
});

test("newly deployed reserve starts at zero CR and incapacitated actors are skipped", () => {
  const downed = actor("Downed", 200, { alive: false, cr: 87 });
  const incoming = actor("Reserve", 80, { cr: 93 });
  const state = createBattleState();
  state.actors = [downed];
  state.party.active = [downed];
  state.party.reserve = [incoming];
  assert.equal(deployFirstReserve(state, "ally", downed).incoming, incoming);
  assert.equal(incoming.cr, 0);

  const scheduler = createThresholdScheduler();
  assert.equal(scheduler.nextActor(state, effectiveStat), incoming);
  assert.equal(downed.cr, 87);

  const incapacitated = actor("Incapacitated", 200, { alive: false });
  const living = actor("Living", 50);
  const separateState = createBattleState();
  separateState.actors = [incapacitated, living];
  assert.equal(scheduler.nextActor(separateState, effectiveStat), living);
});

test("summons are schedulable and expired summons are removed by existing cleanup", () => {
  const summon = actor("Meo-9", 100, {
    summon: true,
    summonTurns: 1,
  });
  const state = createBattleState();
  state.actors = [summon];
  assert.equal(createThresholdScheduler().nextActor(state, effectiveStat), summon);
  summon.alive = false;
  summon.summonTurns = 0;
  assert.equal(removeInactiveSummons(state), 1);
  assert.deepEqual(state.actors, []);
});

test("manual formation switching resets both actors' CR", () => {
  const active = actor("Active", 100, { cr: 78 });
  const reserve = actor("Reserve", 100, { cr: 54 });
  const state = createBattleState();
  state.party.active = [active];
  state.party.reserve = [reserve];
  state.actors = [active];

  const result = switchPartyMember(state, 0, 0);
  assert.equal(result.changed, true);
  assert.equal(active.cr, 0);
  assert.equal(reserve.cr, 0);
  assert.deepEqual(state.actors, [reserve]);
});

test("round completion and actor-turn effects remain tied to actual turns", async () => {
  const first = actor("First", 100);
  const second = actor("Second", 100);
  first.stats.MP = 100;
  second.stats.MP = 100;
  first.mp = 0;
  second.mp = 0;
  const state = createBattleState();
  state.actors = [first, second];
  state.singularityTurns = 1;
  let turnStarts = 0;
  let statusTicks = 0;
  let shieldTicks = 0;
  let healingTicks = 0;
  let statusDisplays = 0;
  const engine = createTurnEngine({
    state,
    combatReadiness: createThresholdScheduler(),
    effectiveStat,
    getResult: () => (state.round > 1 ? "DONE" : null),
    heal() {
      healingTicks++;
    },
    output: { log() {} },
    playerTurn: async () => {},
    enemyTurn: async () => {},
    meoTurn() {},
    showStatus() {
      statusDisplays++;
    },
    tickCooldowns() {
      turnStarts++;
    },
    tickStatuses() {
      statusTicks++;
    },
    tickShields() {
      shieldTicks++;
    },
  });

  await engine.runRounds();
  assert.equal(state.round, 2);
  assert.equal(state.singularityTurns, 0);
  assert.equal(turnStarts, 2);
  assert.equal(statusTicks, 2);
  assert.equal(shieldTicks, 2);
  assert.equal(healingTicks, 2);
  assert.equal(first.mp, 5);
  assert.equal(second.mp, 5);
  assert.equal(statusDisplays, 1);
});

test("legacy scheduler remains available with its fixed-tick behavior", () => {
  assert.equal(typeof legacyReadiness.nextActor, "function");
  assert.equal(typeof legacyReadiness.advanceCR, "function");
  const quick = actor("Quick", 110);
  const slow = actor("Slow", 95);
  const state = createBattleState();
  state.actors = [quick, slow];

  assert.deepEqual(legacyReadiness.advanceCR(state, effectiveStat), [quick]);
  assert.equal(quick.cr, 100);
  assert.equal(slow.cr, 95);
});
