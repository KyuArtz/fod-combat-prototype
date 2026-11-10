// Dev tool: compare the legacy and threshold readiness schedulers (and the
// player-first opening rule) without playing by hand.
//
//   node tools/compareSchedulers.js [battles]      (default 60 seeded battles per row)
//
// Part 1 runs the real 10-unit 5v5 roster through each scheduler on its own (no
// player choices involved). Part 2 plays full seeded 5v5 battles with a scripted
// player: a basic attack on the first living enemy every turn (the same policy as
// answering "1" to every menu). It is deliberately simple and identical for every row, so rows
// are comparable with each other, but absolute win rates and per-unit turn counts
// say little about real balance.

const { playHeadless } = require("./lib/headless");
const { createBattleState } = require("../core/battleState");
const { createFalconParty } = require("../characters/falcon");
const { createTrainingEnemies } = require("../characters/enemies");
const { effectiveStat } = require("../systems/statusEffects");
const legacy = require("../systems/combatReadiness");
const threshold = require("../systems/thresholdCombatReadiness");

const SCHEDULERS = { legacy, threshold };

function fixedRoster(scheduler, turns = 800) {
  const state = createBattleState({ seed: 1 });
  const allies = createFalconParty();
  state.actors = [...allies, ...createTrainingEnemies()];
  const speed = Object.fromEntries(state.actors.map((actor) => [actor.name, actor.stats.SPD]));
  const stat = (actor, name) => effectiveStat(state, actor, name);
  const order = [];
  for (let index = 0; index < turns; index++) {
    const actor = scheduler.nextActor(state, stat);
    order.push(actor.name);
    scheduler.resetCR(actor, state);
  }
  const taken = {};
  let previous = 0;
  let inversions = 0;
  for (const name of order) {
    taken[name] = (taken[name] || 0) + 1;
    const due = (taken[name] * 100) / speed[name];
    if (due < previous - 1e-9) inversions++;
    previous = Math.max(previous, due);
  }
  const totalSpeed = Object.values(speed).reduce((sum, value) => sum + value, 0);
  let worst = 0;
  for (const name of Object.keys(speed)) {
    worst = Math.max(worst, Math.abs((taken[name] || 0) - (turns * speed[name]) / totalSpeed));
  }
  const allyNames = new Set(allies.map((actor) => actor.name));
  const allyTurns = order.filter((name) => allyNames.has(name)).length;
  return {
    "time-order errors": inversions,
    "back-to-back": order.filter((name, i) => i && name === order[i - 1]).length,
    "worst count error": Number(worst.toFixed(1)),
    "ally turn share %": Number(((100 * allyTurns) / turns).toFixed(1)),
    "first 5": order.slice(0, 5).map((name) => name.split(" ")[0]).join(" > "),
  };
}

async function playBattle({ scheduler, seed, openingInitiative }) {
  const { picks, result, rounds } = await playHeadless({ scheduler, seed, openingInitiative });
  return { picks, result, rounds };
}

async function seededRow(schedulerName, openingInitiative, battles) {
  let turns = 0;
  let allyTurns = 0;
  let victories = 0;
  let rounds = 0;
  let allyFirst = 0;
  for (let seed = 1; seed <= battles; seed++) {
    const run = await playBattle({ scheduler: SCHEDULERS[schedulerName], seed, openingInitiative });
    turns += run.picks.length;
    rounds += run.rounds;
    if (run.result === "VICTORY") victories++;
    allyTurns += run.picks.filter((actor) => actor.side === "ally").length;
    if (run.picks[0].side === "ally") allyFirst++;
  }
  return {
    scheduler: schedulerName,
    opening: openingInitiative,
    "player acts first %": Math.round((100 * allyFirst) / battles),
    victories: `${victories}/${battles}`,
    "avg turns": Number((turns / battles).toFixed(1)),
    "avg rounds": Number((rounds / battles).toFixed(2)),
    "ally turn share %": Number(((100 * allyTurns) / turns).toFixed(1)),
  };
}

async function main() {
  const battles = Number(process.argv[2] || 60);
  if (!Number.isInteger(battles) || battles < 1) {
    throw new Error("Usage: node tools/compareSchedulers.js [battles]");
  }

  console.log("\nPart 1 - real 5v5 roster, scheduler only (800 turns)");
  console.table(
    Object.fromEntries(Object.entries(SCHEDULERS).map(([name, scheduler]) => [name, fixedRoster(scheduler)])),
  );

  console.log(`Part 2 - ${battles} seeded 5v5 battles per row, scripted player (basic attack on the first enemy every turn)`);
  const rows = [];
  for (const [name, opening] of [
    ["legacy", "speed"],
    ["legacy", "player-first"],
    ["threshold", "speed"],
    ["threshold", "player-first"],
  ]) {
    rows.push(await seededRow(name, opening, battles));
  }
  console.table(rows);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { fixedRoster, playBattle };
