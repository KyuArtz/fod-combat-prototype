#!/usr/bin/env node
// Repeatable, headless balance simulator. No terminal prompts and no external deps.

const fs = require("node:fs");
const path = require("node:path");
const { playHeadless } = require("./lib/headless");
const { createEventBus } = require("../core/eventBus");
const legacy = require("../systems/combatReadiness");
const threshold = require("../systems/thresholdCombatReadiness");
const { encounters } = require("../characters/enemies");

function parseArgs(argv) {
  const options = { battles: 100, seed: 1, scheduler: "threshold", opening: "player-first", policy: "random", encounter: "trainingGround", format: "table", out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (["--battles", "-n"].includes(arg)) options.battles = Number(argv[++i]);
    else if (arg === "--seed") options.seed = Number(argv[++i]);
    else if (arg === "--scheduler") options.scheduler = argv[++i];
    else if (arg === "--opening") options.opening = argv[++i];
    else if (arg === "--policy") options.policy = argv[++i];
    else if (arg === "--encounter") options.encounter = argv[++i];
    else if (arg === "--format") options.format = argv[++i];
    else if (arg === "--out") options.out = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.battles) || options.battles < 1 || options.battles > 100000) throw new Error("--battles must be an integer from 1 to 100000.");
  if (!Number.isInteger(options.seed) || options.seed < 0 || options.seed > 0xffffffff) throw new Error("--seed must be an integer from 0 to 4294967295.");
  if (!["threshold", "legacy"].includes(options.scheduler)) throw new Error("--scheduler must be threshold or legacy.");
  if (!["player-first", "speed"].includes(options.opening)) throw new Error("--opening must be player-first or speed.");
  if (!["basic", "random"].includes(options.policy)) throw new Error("--policy must be basic or random.");
  if (!encounters[options.encounter]) throw new Error(`Unknown --encounter "${options.encounter}". Available: ${Object.keys(encounters).join(", ")}.`);
  if (!["table", "json", "csv"].includes(options.format)) throw new Error("--format must be table, json or csv.");
  return options;
}

function actorSide(state, id) {
  return state.actors.find((actor) => actor.id === id)?.side || "unknown";
}

function summarizeBattle(battle, index, seed) {
  const history = battle.events.history || [];
  const stats = {
    index,
    seed,
    result: battle.result,
    rounds: battle.rounds,
    turns: 0,
    skills: 0,
    basicAttacks: 0,
    hpDamageToAllies: 0,
    hpDamageToEnemies: 0,
    shieldAbsorbedByAllies: 0,
    shieldAbsorbedByEnemies: 0,
    healingToAllies: 0,
    healingToEnemies: 0,
    mpSpentByAllies: 0,
    mpSpentByEnemies: 0,
    rejectedDecisions: 0,
  };
  const perActor = {};
  for (const event of history) {
    if (event.type === "TurnStarted") stats.turns++;
    if (event.type === "SkillUsed") {
      stats.skills++;
      const side = actorSide(battle.state, event.actorId);
      const spent = Math.max(0, (event.mpBefore ?? 0) - (event.mpAfter ?? 0));
      if (side === "ally") stats.mpSpentByAllies += spent;
      else if (side === "enemy") stats.mpSpentByEnemies += spent;
    }
    if (event.type === "BasicAttackUsed") stats.basicAttacks++;
    if (event.type === "DecisionRejected") stats.rejectedDecisions++;
    if (event.type === "DamageApplied") {
      const side = actorSide(battle.state, event.targetId);
      const hpLoss = Number(event.hpLoss) || 0;
      const absorbed = Number(event.absorbedAmount) || 0;
      if (side === "ally") {
        stats.hpDamageToAllies += hpLoss;
        stats.shieldAbsorbedByAllies += absorbed;
      } else if (side === "enemy") {
        stats.hpDamageToEnemies += hpLoss;
        stats.shieldAbsorbedByEnemies += absorbed;
      }
      perActor[event.targetId] ||= { hpDamageReceived: 0, shieldAbsorbed: 0, healingReceived: 0 };
      perActor[event.targetId].hpDamageReceived += hpLoss;
      perActor[event.targetId].shieldAbsorbed += absorbed;
    }
    if (event.type === "Healed") {
      const side = actorSide(battle.state, event.targetId);
      const healed = Number(event.healed) || 0;
      if (side === "ally") stats.healingToAllies += healed;
      else if (side === "enemy") stats.healingToEnemies += healed;
      perActor[event.targetId] ||= { hpDamageReceived: 0, shieldAbsorbed: 0, healingReceived: 0 };
      perActor[event.targetId].healingReceived += healed;
    }
  }
  stats.perActorReceived = perActor;
  return stats;
}

async function simulateBattles(options = {}) {
  const config = { battles: 100, seed: 1, scheduler: "threshold", opening: "player-first", policy: "random", encounter: "trainingGround", ...options };
  const scheduler = config.scheduler === "legacy" ? legacy : threshold;
  const results = [];
  for (let i = 0; i < config.battles; i++) {
    const seed = (config.seed + i) >>> 0;
    const events = createEventBus({ record: true });
    const battle = await playHeadless({
      seed,
      scheduler,
      openingInitiative: config.opening,
      policy: config.policy,
      policySeed: (seed ^ 0x9e3779b9) >>> 0,
      encounter: config.encounter,
      events,
    });
    results.push(summarizeBattle(battle, i + 1, seed));
  }
  const wins = results.filter((r) => r.result === "VICTORY").length;
  const defeats = results.filter((r) => r.result === "DEFEAT").length;
  const draws = results.length - wins - defeats;
  const sum = (key) => results.reduce((total, row) => total + row[key], 0);
  const average = (key) => sum(key) / results.length;
  return {
    config,
    summary: {
      battles: results.length,
      wins,
      defeats,
      draws,
      winRate: wins / results.length,
      averageRounds: average("rounds"),
      averageTurns: average("turns"),
      averageSkills: average("skills"),
      averageBasicAttacks: average("basicAttacks"),
      averageHpDamageToEnemies: average("hpDamageToEnemies"),
      averageHpDamageToAllies: average("hpDamageToAllies"),
      averageShieldAbsorbedByAllies: average("shieldAbsorbedByAllies"),
      averageHealingToAllies: average("healingToAllies"),
      averageMpSpentByAllies: average("mpSpentByAllies"),
      rejectedDecisions: sum("rejectedDecisions"),
    },
    battles: results,
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCsv(report) {
  const fields = ["index", "seed", "result", "rounds", "turns", "skills", "basicAttacks", "hpDamageToAllies", "hpDamageToEnemies", "shieldAbsorbedByAllies", "shieldAbsorbedByEnemies", "healingToAllies", "healingToEnemies", "mpSpentByAllies", "mpSpentByEnemies", "rejectedDecisions"];
  return [fields.join(","), ...report.battles.map((row) => fields.map((key) => csvEscape(row[key])).join(","))].join("\n") + "\n";
}

function renderTable(report) {
  const s = report.summary;
  const pct = (s.winRate * 100).toFixed(1);
  return [
    "F.O.D. HEADLESS SIMULATION",
    `Battles: ${s.battles} | Seed range: ${report.config.seed}–${(report.config.seed + s.battles - 1) >>> 0}`,
    `Scheduler: ${report.config.scheduler} | Opening: ${report.config.opening} | Player policy: ${report.config.policy} | Encounter: ${report.config.encounter}`,
    "",
    `Results: ${s.wins} victories (${pct}%) | ${s.defeats} defeats | ${s.draws} other`,
    `Average rounds: ${s.averageRounds.toFixed(2)} | Average actor turns: ${s.averageTurns.toFixed(1)}`,
    `Average actions: ${s.averageSkills.toFixed(1)} skills + ${s.averageBasicAttacks.toFixed(1)} basic attacks`,
    `Average HP damage: ${s.averageHpDamageToEnemies.toFixed(1)} to enemies | ${s.averageHpDamageToAllies.toFixed(1)} to allies`,
    `Average ally support: ${s.averageHealingToAllies.toFixed(1)} healing | ${s.averageShieldAbsorbedByAllies.toFixed(1)} shield absorption`,
    `Average ally MP spent: ${s.averageMpSpentByAllies.toFixed(1)} | Rejected decisions: ${s.rejectedDecisions}`,
    "",
    "Per-battle details: --format json for full report or --format csv for tabular rows.",
  ].join("\n");
}

function usage() {
  return `Usage: node tools/simulate.js [options]\n\nOptions:\n  -n, --battles N       Number of battles (default 100; max 100000)\n      --seed N          First battle seed (default 1)\n      --scheduler NAME  threshold or legacy (default threshold)\n      --opening NAME    player-first or speed (default player-first)\n      --policy NAME     random or basic player controller (default random)\n      --encounter NAME  trainingGround or droneCalibration (default trainingGround)\n      --format NAME     table, json or csv (default table)\n      --out FILE        Write output to a file instead of stdout\n  -h, --help            Show this help\n\nExamples:\n  node tools/simulate.js --battles 1000 --seed 42\n  node tools/simulate.js -n 250 --policy basic --format csv --out results.csv\n  node tools/simulate.js -n 100 --scheduler legacy --format json --out legacy.json`;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage());
    return null;
  }
  const report = await simulateBattles(options);
  const output = options.format === "json"
    ? JSON.stringify(report, null, 2) + "\n"
    : options.format === "csv"
      ? renderCsv(report)
      : renderTable(report) + "\n";
  if (options.out) {
    const target = path.resolve(options.out);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, output);
    if (options.format === "table") console.log(`Wrote simulation report to ${target}\n\n${output}`);
    else console.log(`Wrote ${options.format.toUpperCase()} simulation report to ${target}`);
  } else {
    process.stdout.write(output);
  }
  return report;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Simulation failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { main, parseArgs, renderCsv, renderTable, simulateBattles, summarizeBattle };
