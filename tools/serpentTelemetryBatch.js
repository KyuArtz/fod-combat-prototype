#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { playFactionDuel } = require('./lib/factionDuel');

function parseArgs(argv) {
  const out = { battles: 100, seed: 20261123, opponents: ['falcon', 'phantom'], output: 'reports/serpent-telemetry-batch.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--battles') out.battles = Number(argv[++i]);
    else if (argv[i] === '--seed') out.seed = Number(argv[++i]);
    else if (argv[i] === '--opponents') out.opponents = argv[++i].split(',');
    else if (argv[i] === '--out') out.output = argv[++i];
    else if (argv[i] === '--help') out.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!Number.isInteger(out.battles) || out.battles < 1 || out.battles > 5000) throw new RangeError('--battles must be 1–5000');
  if (!Number.isInteger(out.seed) || out.seed < 0 || out.seed > 0xffffffff) throw new RangeError('--seed must be uint32');
  if (out.opponents.some((f) => !['falcon', 'phantom'].includes(f))) throw new Error('--opponents accepts falcon and/or phantom');
  return out;
}

const ACTOR_FIELDS = {
  turnsTaken: 'turns', damageDealt: 'damage', hpDamageDealt: 'hpDamage', shieldDamageDealt: 'shieldDamage',
  damageReceived: 'damageReceived', hpDamageReceived: 'hpDamageReceived', shieldAbsorbed: 'shieldAbsorbed',
  healingGiven: 'healingGiven', healingReceived: 'healingReceived', healingRequested: 'healingRequested',
  overhealing: 'overhealing', shieldsGenerated: 'shieldsGenerated', shieldExpiredUnused: 'shieldExpiredUnused',
  statusesApplied: 'statusesApplied', statusTurns: 'statusTurns', cleanses: 'cleanses', kOs: 'kos',
  decisionCount: 'decisions', decisionRejects: 'decisionRejects', finishOpportunities: 'finishOpportunities',
  missedFinishOpportunities: 'missedFinishOpportunities', reserveTurnsActive: 'reserveTurnsActive',
  reserveDamageDealt: 'reserveDamage', reserveHealing: 'reserveHealing', reserveShielding: 'reserveShielding',
  reserveKOsAssisted: 'reserveKOsAssisted', targetSwitches: 'targetSwitches', statusAppliedByActor: 'statusAppliedByActor',
};
const FACTION_FIELDS = {
  damageDealt: 'damage', hpDamageDealt: 'hpDamage', shieldDamageDealt: 'shieldDamage', damageReceived: 'damageReceived',
  healingReceived: 'healingReceived', overhealing: 'overhealing', shieldsGenerated: 'shieldsGenerated',
  shieldsAbsorbed: 'shieldsAbsorbed', kOs: 'totalKOs', statusApplications: 'statusApplications', statusTurns: 'statusTurns',
  decisions: 'decisions', missedFinishOpportunities: 'missedFinishOpportunities', reserveDeployments: 'reserveDeployments', summonKOs: 'summonKOs', operativeKOs: 'operativeKOs',
};
function newRecord(fields) { return Object.fromEntries(Object.values(fields).map((key) => [key, 0])); }
async function runMatchup(opponent, count, seed) {
  const report = {
    opponent, battles: count, seedStart: seed, seedEnd: (seed + count - 1) >>> 0,
    serpentWins: 0, opponentWins: 0, draws: 0, roundsTotal: 0,
    seat: { player: { battles: 0, serpentWins: 0 }, opponent: { battles: 0, serpentWins: 0 } },
    actors: {}, factions: {}, koByRound: {}, koByFinalSource: {}, reserves: {}, statusUptime: { turns: 0, applications: 0, cleansed: 0, expired: 0, refreshed: 0, activeAtBattleEnd: 0 },
  };
  for (let i = 0; i < count; i++) {
    const serpentAsPlayer = i % 2 === 0;
    const playerFaction = serpentAsPlayer ? 'serpent' : opponent;
    const opponentFaction = serpentAsPlayer ? opponent : 'serpent';
    const battle = await playFactionDuel({ seed: (seed + i) >>> 0, playerFaction, opponentFaction, maxActive: 3, openingInitiative: 'speed', telemetryOptions: { includeTimeline: false } });
    const winner = battle.result === 'VICTORY' ? playerFaction : battle.result === 'DEFEAT' ? opponentFaction : 'draw';
    if (winner === 'serpent') report.serpentWins++;
    else if (winner === opponent) report.opponentWins++;
    else report.draws++;
    const seat = serpentAsPlayer ? 'player' : 'opponent';
    report.seat[seat].battles++;
    if (winner === 'serpent') report.seat[seat].serpentWins++;
    report.roundsTotal += battle.rounds;
    const telemetry = battle.telemetry;
    for (const [id, metrics] of Object.entries(telemetry.actorMetrics)) {
      const actor = report.actors[id] ||= { faction: metrics.faction, ...newRecord(ACTOR_FIELDS), targetCounts: {} };
      for (const [field, key] of Object.entries(ACTOR_FIELDS)) actor[key] += Number(metrics[field] || 0);
      for (const [target, count] of Object.entries(metrics.targetCounts || {})) actor.targetCounts[target] = (actor.targetCounts[target] || 0) + count;
    }
    for (const [id, metrics] of Object.entries(telemetry.factionMetrics)) {
      const faction = report.factions[id] ||= newRecord(FACTION_FIELDS);
      for (const [field, key] of Object.entries(FACTION_FIELDS)) faction[key] += Number(metrics[field] || 0);
    }
    for (const ko of telemetry.koTimeline) {
      report.koByRound[ko.round] = (report.koByRound[ko.round] || 0) + 1;
      if (ko.lastDamageSourceId) report.koByFinalSource[ko.lastDamageSourceId] = (report.koByFinalSource[ko.lastDamageSourceId] || 0) + 1;
    }
    for (const status of telemetry.statusUptime) {
      report.statusUptime.turns += Number(status.turnsActive || 0);
      report.statusUptime.applications++;
      if (status.termination === 'cleansed') report.statusUptime.cleansed++;
      else if (status.termination === 'expired') report.statusUptime.expired++;
      else if (status.termination === 'refreshed') report.statusUptime.refreshed++;
      else report.statusUptime.activeAtBattleEnd++;
    }
    for (const [id, metrics] of Object.entries(telemetry.reserveMetrics)) {
      const reserve = report.reserves[id] ||= { deployments: 0, turnsActive: 0 };
      reserve.deployments++;
      reserve.turnsActive += Number(metrics.turnsActive || 0);
    }
  }
  report.serpentWinRate = report.serpentWins / count;
  report.averageRounds = report.roundsTotal / count;
  for (const seat of Object.values(report.seat)) seat.serpentWinRate = seat.serpentWins / seat.battles;
  for (const metrics of Object.values(report.actors)) {
    for (const key of Object.values(ACTOR_FIELDS)) metrics[key] /= count;
    for (const target of Object.keys(metrics.targetCounts)) metrics.targetCounts[target] /= count;
  }
  for (const metrics of Object.values(report.factions)) for (const key of Object.values(FACTION_FIELDS)) metrics[key] /= count;
  return report;
}
(async () => {
  const config = parseArgs(process.argv.slice(2));
  if (config.help) { console.log('Usage: node tools/serpentTelemetryBatch.js [--battles 100] [--seed 20261123] [--opponents falcon,phantom] [--out reports/summary.json]'); return; }
  const output = { telemetryVersion: 2, configuration: config, matchups: {} };
  let seed = config.seed;
  for (const opponent of config.opponents) {
    console.log(`Running Serpent vs ${opponent} (${config.battles} battles)...`);
    output.matchups[opponent] = await runMatchup(opponent, config.battles, seed);
    seed = (seed + config.battles) >>> 0;
    console.log(`Serpent win rate vs ${opponent}: ${(output.matchups[opponent].serpentWinRate * 100).toFixed(1)}%`);
  }
  const destination = path.resolve(config.output);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Saved report: ${destination}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
