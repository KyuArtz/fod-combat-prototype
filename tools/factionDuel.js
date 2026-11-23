#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { playFactionDuel, summarizeFactionDuel } = require("./lib/factionDuel");

function parseArgs(argv) {
  const result = { battles: 100, seed: 20261122, active: 3, out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--battles" || arg === "-n") result.battles = Number(argv[++i]);
    else if (arg === "--seed") result.seed = Number(argv[++i]);
    else if (arg === "--active") result.active = Number(argv[++i]);
    else if (arg === "--out") result.out = argv[++i];
    else if (arg === "--help" || arg === "-h") result.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isInteger(result.battles) || result.battles < 1 || result.battles > 10000) throw new RangeError("--battles must be 1–10000.");
  if (!Number.isInteger(result.seed) || result.seed < 0 || result.seed > 0xffffffff) throw new RangeError("--seed must be an unsigned 32-bit integer.");
  if (!Number.isInteger(result.active) || result.active < 1 || result.active > 5) throw new RangeError("--active must be 1–5.");
  return result;
}

function summarize(rows, config) {
  const wins = { falcon: 0, phantom: 0, draw: 0 };
  let totalRounds = 0;
  let totalRejects = 0;
  let totalReserves = 0;
  const damage = { falcon: 0, phantom: 0 };
  for (const row of rows) {
    const winner = row.result === "VICTORY" ? row.playerFaction : row.result === "DEFEAT" ? row.opponentFaction : "draw";
    wins[winner]++;
    totalRounds += row.rounds;
    totalRejects += row.rejectedDecisions;
    totalReserves += row.reserveDeployments;
    damage.falcon += row.damageByFaction.falcon;
    damage.phantom += row.damageByFaction.phantom;
  }
  const count = rows.length;
  return {
    config,
    summary: {
      battles: count,
      wins,
      winRate: { falcon: wins.falcon / count, phantom: wins.phantom / count },
      averageRounds: totalRounds / count,
      averageReserveDeployments: totalReserves / count,
      rejectedDecisions: totalRejects,
      averageDamageByFaction: { falcon: damage.falcon / count, phantom: damage.phantom / count },
    },
    battles: rows,
  };
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (config.help) {
    console.log("Usage: node tools/factionDuel.js [--battles 100] [--seed 20261122] [--active 3] [--out reports/faction-duel.json]");
    return;
  }
  const battles = [];
  for (let index = 0; index < config.battles; index++) {
    const playerFaction = index % 2 === 0 ? "falcon" : "phantom";
    const battle = await playFactionDuel({
      seed: (config.seed + index) >>> 0,
      playerFaction,
      maxActive: config.active,
      openingInitiative: "speed",
    });
    battles.push(summarizeFactionDuel(battle));
  }
  const report = summarize(battles, config);
  const s = report.summary;
  const output = [
    "F.O.D. FACTION DUEL PLAYTEST",
    `Battles: ${s.battles} | Seeds: ${config.seed}–${(config.seed + s.battles - 1) >>> 0}`,
    `Formation: ${config.active} active per side | Tactical AI vs Tactical AI | Opening: speed`,
    `Falcon wins: ${s.wins.falcon} (${(s.winRate.falcon * 100).toFixed(1)}%)`,
    `Phantom wins: ${s.wins.phantom} (${(s.winRate.phantom * 100).toFixed(1)}%)`,
    `Draws: ${s.wins.draw}`,
    `Average duration: ${s.averageRounds.toFixed(2)} rounds`,
    `Average reserve deployments: ${s.averageReserveDeployments.toFixed(2)}`,
    `Average damage: Falcon ${s.averageDamageByFaction.falcon.toFixed(1)} | Phantom ${s.averageDamageByFaction.phantom.toFixed(1)}`,
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
