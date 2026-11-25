#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { playFactionDuel, summarizeFactionDuel, FACTIONS } = require("./lib/factionDuel");

function parseArgs(argv) {
  const result = { battles: 100, seed: 20261122, active: 3, player: "falcon", opponent: "phantom", out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--battles" || arg === "-n") result.battles = Number(argv[++i]);
    else if (arg === "--seed") result.seed = Number(argv[++i]);
    else if (arg === "--active") result.active = Number(argv[++i]);
    else if (arg === "--player") result.player = argv[++i];
    else if (arg === "--opponent") result.opponent = argv[++i];
    else if (arg === "--out") result.out = argv[++i];
    else if (arg === "--help" || arg === "-h") result.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isInteger(result.battles) || result.battles < 1 || result.battles > 10000) throw new RangeError("--battles must be 1–10000.");
  if (!Number.isInteger(result.seed) || result.seed < 0 || result.seed > 0xffffffff) throw new RangeError("--seed must be an unsigned 32-bit integer.");
  if (!Number.isInteger(result.active) || result.active < 1 || result.active > 5) throw new RangeError("--active must be 1–5.");
  if (!FACTIONS[result.player]) throw new RangeError(`--player must be one of: ${Object.keys(FACTIONS).join(", ")}.`);
  if (!FACTIONS[result.opponent] || result.opponent === result.player) throw new RangeError(`--opponent must be a different faction from --player: ${Object.keys(FACTIONS).join(", ")}.`);
  return result;
}

function summarize(rows, config) {
  const factionIds = [...new Set(rows.flatMap((row) => [row.playerFaction, row.opponentFaction]).filter(Boolean))];
  const wins = Object.fromEntries(factionIds.map((faction) => [faction, 0]));
  wins.draw = 0;
  let totalRounds = 0;
  let totalRejects = 0;
  let totalReserves = 0;
  const damage = Object.fromEntries(factionIds.map((faction) => [faction, 0]));
  for (const row of rows) {
    const winner = row.result === "VICTORY" ? row.playerFaction : row.result === "DEFEAT" ? row.opponentFaction : "draw";
    wins[winner]++;
    totalRounds += row.rounds;
    totalRejects += row.rejectedDecisions;
    totalReserves += row.reserveDeployments;
    for (const faction of factionIds) damage[faction] += row.damageByFaction[faction] || 0;
  }
  const count = rows.length;
  const winRate = Object.fromEntries(factionIds.map((faction) => [faction, wins[faction] / count]));
  return {
    config,
    summary: {
      battles: count,
      wins,
      winRate,
      averageRounds: totalRounds / count,
      averageReserveDeployments: totalReserves / count,
      rejectedDecisions: totalRejects,
      averageDamageByFaction: Object.fromEntries(factionIds.map((faction) => [faction, damage[faction] / count])),
    },
    battles: rows,
  };
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (config.help) {
    console.log("Usage: node tools/factionDuel.js [--battles 100] [--seed 20261122] [--active 3] [--player falcon|phantom|serpent] [--opponent falcon|phantom|serpent] [--out reports/faction-duel.json]");
    return;
  }
  const battles = [];
  for (let index = 0; index < config.battles; index++) {
    const playerFaction = index % 2 === 0 ? config.player : config.opponent;
    const opponentFaction = index % 2 === 0 ? config.opponent : config.player;
    const battle = await playFactionDuel({
      seed: (config.seed + index) >>> 0,
      playerFaction,
      opponentFaction,
      maxActive: config.active,
      openingInitiative: "speed",
    });
    battles.push(summarizeFactionDuel(battle));
  }
  const report = summarize(battles, config);
  const s = report.summary;
  const factionLines = Object.keys(s.averageDamageByFaction).map((faction) =>
    `${faction}: ${s.wins[faction]} wins (${(s.winRate[faction] * 100).toFixed(1)}%) | average damage ${s.averageDamageByFaction[faction].toFixed(1)}`,
  );
  const output = [
    "F.O.D. FACTION DUEL PLAYTEST",
    `Matchup: ${config.player} vs ${config.opponent} (seat alternates)`,
    `Battles: ${s.battles} | Seeds: ${config.seed}–${(config.seed + s.battles - 1) >>> 0}`,
    `Formation: ${config.active} active per side | Tactical AI vs Tactical AI | Opening: speed`,
    ...factionLines,
    `Draws: ${s.wins.draw}`,
    `Average duration: ${s.averageRounds.toFixed(2)} rounds`,
    `Average reserve deployments: ${s.averageReserveDeployments.toFixed(2)}`,
    `Rejected decisions: ${s.rejectedDecisions}`,
  ].join("\n");
  console.log(output);
  if (config.out) {
    const destination = path.resolve(config.out);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`\nSaved: ${destination}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, summarize };
