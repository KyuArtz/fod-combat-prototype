const fs = require('node:fs');
const { playFactionDuel } = require('../lib/factionDuel');
const { createSerpentTacticsController } = require('../../ai/serpentTactics');
async function run(label, policy, seeds) {
  const rows = [];
  for (const opponent of ['phantom', 'falcon']) for (const seed of seeds) for (const seat of ['player', 'opponent']) {
    const playerFaction = seat === 'player' ? 'serpent' : opponent;
    const opponentFaction = seat === 'player' ? opponent : 'serpent';
    const battle = await playFactionDuel({ seed, playerFaction, opponentFaction, maxActive: 3, openingInitiative: 'speed', telemetryOptions: { includeTimeline: false }, controllerOverrides: { serpent: createSerpentTacticsController(policy) } });
    const winner = battle.result === 'VICTORY' ? playerFaction : battle.result === 'DEFEAT' ? opponentFaction : 'draw';
    const v = battle.telemetry.actorMetrics.verra || {};
    const s = battle.telemetry.factionMetrics.serpent || {};
    rows.push({ label, opponent, seed, seat, result: battle.result, winner, rounds: battle.rounds, verraKOs: Number(v.kOs || 0), verraDamageReceived: Number(v.damageReceived || 0), verraHealingReceived: Number(v.healingReceived || 0), verraTurns: Number(v.turnsTaken || 0), verraSwitches: Number(v.targetSwitches || 0), serpentReserveDeployments: Number(s.reserveDeployments || 0) });
  }
  return rows;
}
function summarize(rows) {
  const wins = rows.filter(r => r.winner === 'serpent').length, draws = rows.filter(r => r.winner === 'draw').length;
  return { battles: rows.length, serpentWins: wins, opponentWins: rows.length - wins - draws, draws, winRate: wins / rows.length, verraKOs: rows.reduce((a, r) => a + r.verraKOs, 0), averageRounds: rows.reduce((a, r) => a + r.rounds, 0) / rows.length, verraDamageReceived: rows.reduce((a, r) => a + r.verraDamageReceived, 0), verraHealingReceived: rows.reduce((a, r) => a + r.verraHealingReceived, 0), verraTurns: rows.reduce((a, r) => a + r.verraTurns, 0), verraSwitches: rows.reduce((a, r) => a + r.verraSwitches, 0), reserveDeployments: rows.reduce((a, r) => a + r.serpentReserveDeployments, 0) };
}
(async () => {
  const seeds = Array.from({ length: 10 }, (_, i) => 20261643 + i);
  const baseline = await run('baseline', { verraThreshold: 0.16 }, seeds);
  const early = await run('early', { verraThreshold: 0.22 }, seeds);
  const output = { protocol: { seeds, seats: ['player', 'opponent'], matchups: ['phantom', 'falcon'], battlesPerPolicy: 40, baselineVerraThreshold: 0.16, experimentalVerraThreshold: 0.22, otherPolicyThresholdsUnchanged: true }, baseline, early };
  fs.writeFileSync('reports/experiments/p1-2-5-rotation-threshold-policy-experiment.json', JSON.stringify(output, null, 2) + '\n');
  const perOpponent = Object.fromEntries(['phantom', 'falcon'].map(o => [o, { baseline: summarize(baseline.filter(r => r.opponent === o)), early: summarize(early.filter(r => r.opponent === o)) }]));
  console.log(JSON.stringify({ protocol: output.protocol, baseline: summarize(baseline), early: summarize(early), byOpponent: perOpponent }, null, 2));
})().catch(err => { console.error(err); process.exitCode = 1; });
