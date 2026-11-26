#!/usr/bin/env node
const fs = require('node:fs');
const { playFactionDuel } = require('../lib/factionDuel');
const { chooseSerpentAction } = require('../../ai/serpentTactics');

const MATCHUPS = ['phantom', 'falcon'];
const SEEDS = Array.from({ length: 20 }, (_, i) => 20261110 + i);
const SEATS = ['player', 'opponent'];
const POLICY = { pressureThreshold: 0.20, elevatedRotationThreshold: 0.22, baseRotationThreshold: 0.16 };

function hasHealthyReserve(view) {
  const switchAction = (view.actions || []).find((action) => action.type === 'switch');
  const active = (switchAction?.active || []).filter((unit) => unit.alive);
  const reserves = (switchAction?.reserves || []).filter((unit) => unit.alive);
  const verra = view.actor;
  const outgoing = active.find((unit) => unit.id === verra.id);
  return Boolean(outgoing && reserves.some((unit) => unit.hp / Math.max(1, unit.maxHp) >= Math.max(0.65, verra.hp / Math.max(1, verra.maxHp) + 0.25)));
}
function pressurePolicy(view) {
  const actor = view.actor;
  const signal = actor?.incomingPressure;
  const threshold = actor?.maxHp > 0 ? POLICY.pressureThreshold * actor.maxHp : Infinity;
  return actor?.id === 'verra' && signal && signal.recentDamage >= threshold && hasHealthyReserve(view);
}
function makeController(policy) {
  return { chooseAction(view) {
    if (policy === 'pressure' && pressurePolicy(view)) {
      return chooseSerpentAction(view, { verraThreshold: POLICY.elevatedRotationThreshold });
    }
    return chooseSerpentAction(view, { verraThreshold: POLICY.baseRotationThreshold });
  }};
}
function actionLabel(action) {
  if (!action) return 'unknown';
  if (action.type === 'switch') return 'switch';
  if (['unstableRemedy', 'causticInjection'].includes(action.skillKey) && ['remedy', 'treat'].includes(action.mode)) return 'treatment';
  return action.type === 'skill' ? 'skill' : action.type;
}
async function runBattle(opponent, seed, seat, policy) {
  const serpentSeat = seat === 'player';
  const playerFaction = serpentSeat ? 'serpent' : opponent;
  const opponentFaction = serpentSeat ? opponent : 'serpent';
  const actions = { verra: { switch: 0, treatment: 0, skill: 0, basic: 0, pass: 0, pressureTriggers: 0 } };
  const controller = makeController(policy);
  const capture = { chooseAction(view) {
    const result = controller.chooseAction(view);
    if (view.actor?.id === 'verra') {
      const label = actionLabel(result);
      actions.verra[label] = (actions.verra[label] || 0) + 1;
      if (policy === 'pressure' && pressurePolicy(view)) actions.verra.pressureTriggers++;
    }
    return result;
  }};
  const battle = await playFactionDuel({ seed, playerFaction, opponentFaction, maxActive: 3, openingInitiative: 'speed', telemetryOptions: { includeTimeline: false }, controllerOverrides: { serpent: capture } });
  const actorMetrics = battle.telemetry.actorMetrics.verra || {};
  return { matchup: opponent, seed, seat, policy, result: battle.result, serpentWon: battle.result === (serpentSeat ? 'VICTORY' : 'DEFEAT'), rounds: battle.rounds,
    verraKO: (battle.telemetry.koTimeline || []).some((ko) => ko.actorId === 'verra'), actions: actions.verra,
    verraHPDamageReceived: actorMetrics.hpDamageReceived || 0, treatmentHealing: actorMetrics.healingGiven || 0, reserveTurnsActive: actorMetrics.reserveTurnsActive || 0 };
}
async function main() {
  const rows = [];
  for (const matchup of MATCHUPS) for (const seed of SEEDS) for (const seat of SEATS) for (const policy of ['baseline', 'pressure']) {
    rows.push(await runBattle(matchup, seed, seat, policy));
  }
  const summaries = {};
  for (const matchup of MATCHUPS) for (const policy of ['baseline', 'pressure']) {
    const subset = rows.filter((row) => row.matchup === matchup && row.policy === policy);
    summaries[matchup] ||= {};
    summaries[matchup][policy] = { battles: subset.length, serpentWins: subset.filter((row) => row.serpentWon).length,
      verraKOs: subset.filter((row) => row.verraKO).length, averageRounds: subset.reduce((sum, row) => sum + row.rounds, 0) / subset.length,
      verraHPDamage: subset.reduce((sum, row) => sum + row.verraHPDamageReceived, 0), treatmentHealing: subset.reduce((sum, row) => sum + row.treatmentHealing, 0),
      rotationActions: subset.reduce((sum, row) => sum + row.actions.switch, 0), pressureTriggers: subset.reduce((sum, row) => sum + row.actions.pressureTriggers, 0) };
  }
  const output = { protocol: { seeds: SEEDS, seats: SEATS, matchups: MATCHUPS, battles: rows.length, policy: POLICY,
    notes: 'Exploratory matched-seed comparison only. Baseline keeps Verra rotation at 16%. Pressure policy raises it to 22% only when recent HP damage in the 3-round window is at least 20% max HP and a healthy reserve is eligible. Critical teammate treatment deferral remains unchanged. No default policy changes.' }, summaries, battles: rows };
  const out = 'reports/experiments/p1-2-11-pressure-aware-rotation.json';
  fs.writeFileSync(out, JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(summaries, null, 2));
}
if (require.main === module) main().catch((err) => { console.error(err); process.exitCode = 1; });
module.exports = { pressurePolicy, POLICY, runBattle };
