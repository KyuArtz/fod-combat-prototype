#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { createEventBus } = require("../core/eventBus");
const { createBattle } = require("../core/battle");
const { createFalconParty } = require("../characters/falcon");
const { createCoordinatedFalconController } = require("../ai/falconTacticsV2");
const {
  PHANTOM_IDS, BASELINE_ORDER, PHANTOM_ORDER,
  createHybridFalconParty, createMixedTacticalController,
  playFieldMedicSwap, summarizeSwapBattle,
} = require("./lib/fieldMedicSwap");

function parseArgs(argv) {
  const result = { battles: 200, seed: 20261122, active: 3, out: "reports/field-medic-substitution-200.json", candidates: [...PHANTOM_IDS] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--battles" || arg === "-n") result.battles = Number(argv[++i]);
    else if (arg === "--seed") result.seed = Number(argv[++i]);
    else if (arg === "--active") result.active = Number(argv[++i]);
    else if (arg === "--out") result.out = argv[++i];
    else if (arg === "--candidates") result.candidates = String(argv[++i]).split(",").filter(Boolean);
    else if (arg === "--help" || arg === "-h") result.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isInteger(result.battles) || result.battles < 1 || result.battles > 5000) throw new RangeError("--battles must be 1–5000.");
  if (!Number.isInteger(result.seed) || result.seed < 0 || result.seed > 0xffffffff) throw new RangeError("--seed must be an unsigned 32-bit integer.");
  if (!Number.isInteger(result.active) || result.active < 1 || result.active > 5) throw new RangeError("--active must be 1–5.");
  if (!result.candidates.length || result.candidates.some((id) => !PHANTOM_IDS.includes(id))) throw new TypeError(`--candidates must be comma-separated Phantom IDs: ${PHANTOM_IDS.join(", ")}`);
  return result;
}

async function playPureFalconVsPhantom({ seed, hybridSide, maxActive, events }) {
  const mixedController = createMixedTacticalController();
  const phantomFactory = ({ side }) => require("../characters/phantom").createPhantomParty({ side });
  const falconFactory = ({ side }) => createFalconParty({ side });
  const battle = createBattle({
    output: { log() {} }, seed, openingInitiative: "speed", events,
    partyFactory: hybridSide === "ally" ? falconFactory : phantomFactory,
    partyOrder: hybridSide === "ally" ? BASELINE_ORDER : PHANTOM_ORDER,
    opponentFactory: hybridSide === "ally" ? phantomFactory : falconFactory,
    maxActive, enemyMaxActive: maxActive, symmetricEvasion: true,
    controllers: { player: mixedController, enemy: mixedController },
  });
  const initialSeed = battle.state.rng.seed;
  try {
    const result = await battle.run();
    const wrapped = { result, seed: initialSeed, rounds: battle.state.round, hybridSide, state: battle.state, events: battle.events };
    return summarizeSwapBattle(wrapped, "evalete", hybridSide);
  } finally { battle.close(); }
}

function aggregate(rows) {
  const result = { battles: rows.length, wins: { hybrid: 0, phantom: 0, draw: 0 }, averageRounds: 0, rejectedDecisions: 0, averageMetrics: { hybrid: {}, phantom: {} }, averageDamageByActor: {}, skillUsesByActor: {} };
  for (const row of rows) {
    result.wins[row.winner]++;
    result.averageRounds += row.rounds;
    result.rejectedDecisions += row.rejectedDecisions;
    for (const team of ["hybrid", "phantom"]) for (const [key, value] of Object.entries(row.metrics[team])) result.averageMetrics[team][key] = (result.averageMetrics[team][key] || 0) + value;
    for (const [id, value] of Object.entries(row.damageByActor || {})) result.averageDamageByActor[id] = (result.averageDamageByActor[id] || 0) + value;
    for (const [id, skills] of Object.entries(row.skillsByActor || {})) {
      result.skillUsesByActor[id] ||= {};
      for (const [key, count] of Object.entries(skills)) result.skillUsesByActor[id][key] = (result.skillUsesByActor[id][key] || 0) + count;
    }
  }
  const n = rows.length;
  result.winRate = { hybrid: result.wins.hybrid / n, phantom: result.wins.phantom / n };
  result.averageRounds /= n;
  for (const team of ["hybrid", "phantom"]) for (const key of Object.keys(result.averageMetrics[team])) result.averageMetrics[team][key] /= n;
  for (const key of Object.keys(result.averageDamageByActor)) result.averageDamageByActor[key] /= n;
  for (const skills of Object.values(result.skillUsesByActor)) for (const key of Object.keys(skills)) skills[key] /= n;
  result.rejectedDecisionsPerBattle = result.rejectedDecisions / n;
  return result;
}

async function runVariant({ battles, seed, active, substituteId = "evalete" }) {
  const rows = [];
  for (let index = 0; index < battles; index++) {
    const hybridSide = index % 2 === 0 ? "ally" : "enemy";
    const battleSeed = (seed + index) >>> 0;
    if (substituteId === "evalete") {
      rows.push(await playPureFalconVsPhantom({ seed: battleSeed, hybridSide, maxActive: active, events: createEventBus({ record: true }) }));
    } else {
      const battle = await playFieldMedicSwap({ seed: battleSeed, substituteId, hybridSide, maxActive: active, events: createEventBus({ record: true }) });
      rows.push(summarizeSwapBattle(battle, substituteId, hybridSide));
    }
  }
  return { substituteId, summary: aggregate(rows), battles: rows };
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (config.help) {
    console.log(`Usage: node tools/fieldMedicSwap.js [--battles 200] [--seed 20261122] [--active 3] [--candidates ${PHANTOM_IDS.join(",")}] [--out reports/field-medic-substitution-200.json]`);
    return;
  }
  const results = [];
  const destination = path.resolve(config.out);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  for (const substituteId of ["evalete", ...config.candidates]) {
    console.log(`Running ${substituteId} baseline/substitution (${config.battles} battles)...`);
    const result = await runVariant({ ...config, substituteId });
    results.push(result);
    const report = { config, method: "alternating-side tactical AI vs tactical AI; matched seeds for all variants; 3 active + 2 reserves", variants: results };
    // Persist after every completed variant so an interrupted batch keeps its valid results.
    fs.writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
    const s = result.summary;
    console.log(`  Hybrid/Falcon side ${s.wins.hybrid}/${s.battles} (${(s.winRate.hybrid * 100).toFixed(1)}%), Phantom ${s.wins.phantom}/${s.battles}, avg rounds ${s.averageRounds.toFixed(1)}, heal ${s.averageMetrics.hybrid.healingReceived.toFixed(1)}, shields generated ${s.averageMetrics.hybrid.shieldGranted.toFixed(1)}, absorbed ${s.averageMetrics.hybrid.shieldAbsorbed.toFixed(1)}, HP damage taken ${s.averageMetrics.hybrid.damageTakenHp.toFixed(1)}`);
  }
  console.log(`\nSaved: ${destination}`);
}

if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
module.exports = { aggregate, parseArgs, runVariant };
