#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { playFactionDuel } = require('./lib/factionDuel');

function parseArgs(argv) {
  const config = { pairs: 20, seed: 20261623, out: 'reports/serpent-phantom-forensic-paired-20.json' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--pairs') config.pairs = Number(argv[++i]);
    else if (argv[i] === '--seed') config.seed = Number(argv[++i]);
    else if (argv[i] === '--out') config.out = argv[++i];
    else if (argv[i] === '--help') config.help = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!Number.isInteger(config.pairs) || config.pairs < 1 || config.pairs > 100) throw new RangeError('--pairs must be 1–100');
  if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffffffff) throw new RangeError('--seed must be uint32');
  return config;
}
const hpPct = (unit) => unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
function snapshotFor(telemetry, seq) {
  return telemetry.timeline.find((event) => event.seq === seq)?.telemetry?.snapshots || [];
}
function actorSnapshot(snapshots, id) { return snapshots.find((unit) => unit.id === id); }
function aliveFaction(snapshots, faction, side) { return snapshots.filter((unit) => unit.faction === faction && unit.side === side && unit.alive && !unit.summon); }

async function runBattle(seed, serpentSeat) {
  const playerFaction = serpentSeat === 'player' ? 'serpent' : 'phantom';
  const opponentFaction = serpentSeat === 'player' ? 'phantom' : 'serpent';
  const battle = await playFactionDuel({ seed, playerFaction, opponentFaction, maxActive: 3, openingInitiative: 'speed', telemetryOptions: { includeTimeline: true, maxTimelineEvents: 25000 } });
  const events = battle.events.history;
  const telem = battle.telemetry;
  const serpentKOs = telem.koTimeline.filter((ko) => ko.faction === 'serpent' && !ko.isSummon);
  const phantomKOs = telem.koTimeline.filter((ko) => ko.faction === 'phantom' && !ko.isSummon);
  const actions = [];
  const verraAudit = [];
  const serpentSide = serpentSeat === 'player' ? 'ally' : 'enemy';
  const phantomSide = serpentSide === 'ally' ? 'enemy' : 'ally';
  const targetChoices = { phantom: {}, serpent: {} };
  const damageBySourceIntoSerpent = {};
  const shieldGainByTurnActor = {};
  const shieldsAbsorbedBySerpent = {};
  const healingEvents = [];
  const reserveDeployments = [];
  let turnActor = null;
  for (const event of events) {
    if (event.type === 'TurnStarted') turnActor = event.actorId;
    if (event.type === 'ActionChosen') {
      const actor = event.actorId;
      const sideFaction = actor ? (telem.actorMetrics[actor]?.faction || null) : null;
      const decision = event.decision || {};
      const targetId = decision.targetId;
      const targetActor = targetId ? telem.actorMetrics[targetId] : null;
      const factionKey = sideFaction === 'phantom' ? 'phantom' : sideFaction === 'serpent' ? 'serpent' : null;
      if (targetId && factionKey && targetActor?.faction === 'serpent') targetChoices[factionKey][targetId] = (targetChoices[factionKey][targetId] || 0) + 1;
      const entry = { round: event.round, actorId: actor, actorFaction: sideFaction, decision, seq: event.seq };
      actions.push(entry);
      if (actor === 'verra') {
        const snapshots = snapshotFor(telem, event.seq);
        const allies = snapshots.filter((unit) => unit.faction === 'serpent' && unit.side === serpentSide && !unit.summon);
        const living = allies.filter((unit) => unit.alive);
        const lowest = [...living].sort((a, b) => hpPct(a) - hpPct(b))[0] || null;
        const target = allies.find((unit) => unit.id === targetId) || null;
        const critical = living.filter((unit) => unit.hpPercent <= 30);
        verraAudit.push({
          seed, serpentSeat, round: event.round, turnIndex: event.seq, decision,
          verraHPPercent: actorSnapshot(snapshots, 'verra')?.hpPercent ?? null,
          verraMP: actorSnapshot(snapshots, 'verra')?.mp ?? null,
          lowestAlly: lowest ? { id: lowest.id, hpPercent: lowest.hpPercent } : null,
          targetAtDecision: target ? { id: target.id, hpPercent: target.hpPercent, statuses: target.statuses } : null,
          criticalAllies: critical.map((unit) => ({ id: unit.id, hpPercent: unit.hpPercent })),
          allyState: living.map((unit) => ({ id: unit.id, hpPercent: unit.hpPercent, hp: unit.hp, maxHp: unit.maxHp, statuses: unit.statuses })),
          enemyCount: aliveFaction(snapshots, 'phantom', phantomSide).length,
        });
      }
    }
    if (event.type === 'DamageApplied' && event.targetId) {
      const targetFaction = telem.actorMetrics[event.targetId]?.faction;
      const sourceFaction = telem.actorMetrics[event.sourceId]?.faction;
      if (targetFaction === 'serpent' && sourceFaction === 'phantom') {
        const source = event.sourceId || 'unknown';
        damageBySourceIntoSerpent[source] ||= { events: 0, hpDamage: 0, shieldDamage: 0, total: 0, targetCounts: {} };
        const row = damageBySourceIntoSerpent[source];
        row.events++; row.hpDamage += Number(event.hpLoss || 0); row.shieldDamage += Number(event.absorbedAmount || 0); row.total += Number(event.hpLoss || 0) + Number(event.absorbedAmount || 0);
        row.targetCounts[event.targetId] = (row.targetCounts[event.targetId] || 0) + 1;
      }
    }
    if (event.type === 'Healed') healingEvents.push({ seq: event.seq, round: event.round, healerTurnActor: turnActor, targetId: event.targetId, requested: event.requestedAmount, healed: event.healed, overheal: Math.max(0, Number(event.requestedAmount || 0) - Number(event.healed || 0)) });
    if (event.type === 'ShieldGained') shieldGainByTurnActor[turnActor] = (shieldGainByTurnActor[turnActor] || 0) + Number(event.amount || 0);
    if (event.type === 'ReserveDeployed') reserveDeployments.push({ seq: event.seq, round: event.round, actorId: event.actorId, incomingId: event.incomingId, outgoingId: event.outgoingId, reserveId: event.reserveId, activeId: event.activeId });
  }
  const resultSerpentWon = serpentSeat === 'player' ? battle.result === 'VICTORY' : battle.result === 'DEFEAT';
  return { seed, serpentSeat, battleResult: battle.result, serpentWon: resultSerpentWon, rounds: battle.rounds, eventCount: events.length,
    serpentKOs, phantomKOs, actorMetrics: Object.fromEntries(['verra','galloz','claude','kane','tekushiki','clarke','liezli','lucaz','mirazhel','elishia_p'].filter(id=>telem.actorMetrics[id]).map(id=>[id,telem.actorMetrics[id]])),
    targetChoices, damageBySourceIntoSerpent, shieldGainByTurnActor, shieldsAbsorbedBySerpent, healingEvents, reserveDeployments, reserveMetrics: telem.reserveMetrics, verraAudit, actions };
}
function aggregate(results) {
  const seats = Object.fromEntries(['player','opponent'].map(seat => {
    const list = results.filter(row=>row.serpentSeat===seat);
    return [seat,{ battles:list.length, serpentWins:list.filter(row=>row.serpentWon).length, serpentWinRate:list.filter(row=>row.serpentWon).length/list.length }];
  }));
  const avg = (selector) => results.reduce((sum,row)=>sum+selector(row),0)/results.length;
  const sum = (selector) => results.reduce((total,row)=>total+selector(row),0);
  const verra = { turns:sum(r=>r.actorMetrics.verra?.turnsTaken||0), actions:sum(r=>r.verraAudit.length),
    treatments:sum(r=>r.verraAudit.filter(a=>['treat','remedy'].includes(a.decision.mode)).length),
    offensiveModes:sum(r=>r.verraAudit.filter(a=>['attack','corrosive'].includes(a.decision.mode)).length),
    criticalAllyWhenVerraActs:sum(r=>r.verraAudit.filter(a=>a.criticalAllies.length>0).length),
    criticalAllyTreatmentSelected:sum(r=>r.verraAudit.filter(a=>a.criticalAllies.length>0&&['treat','remedy'].includes(a.decision.mode)).length),
    selfTreatments:sum(r=>r.verraAudit.filter(a=>['treat','remedy'].includes(a.decision.mode)&&a.decision.targetId==='verra').length),
    healsGiven:sum(r=>r.actorMetrics.verra?.healingGiven||0), actualHealingReceived:sum(r=>r.actorMetrics.verra?.healingReceived||0), requestedHealing:sum(r=>r.actorMetrics.verra?.healingRequested||0), overhealing:sum(r=>r.actorMetrics.verra?.overhealing||0),
    kOs:sum(r=>r.actorMetrics.verra?.kOs||0), damageReceived:sum(r=>r.actorMetrics.verra?.damageReceived||0)};
  const sources={}; for(const row of results) for(const [source,stats] of Object.entries(row.damageBySourceIntoSerpent)){sources[source] ||= {events:0,hpDamage:0,shieldDamage:0,total:0,targetCounts:{}}; for(const k of ['events','hpDamage','shieldDamage','total']) sources[source][k]+=stats[k]; for(const [t,c] of Object.entries(stats.targetCounts))sources[source].targetCounts[t]=(sources[source].targetCounts[t]||0)+c;}
  const phantomFinishes={}; for(const row of results)for(const ko of row.serpentKOs)phantomFinishes[ko.lastDamageSourceId||'unknown']=(phantomFinishes[ko.lastDamageSourceId||'unknown']||0)+1;
  const kOsByRound={}; for(const row of results)for(const ko of row.serpentKOs)kOsByRound[ko.round]=(kOsByRound[ko.round]||0)+1;
  return { battles:results.length, seedPairs:results.length/2, wins:results.filter(r=>r.serpentWon).length, losses:results.filter(r=>!r.serpentWon).length, winRate:results.filter(r=>r.serpentWon).length/results.length, averageRounds:avg(r=>r.rounds), averageSerpentOperativeKOs:avg(r=>r.serpentKOs.length), averagePhantomOperativeKOs:avg(r=>r.phantomKOs.length), seats, verra, phantomDamageIntoSerpent:sources, phantomFinalBlowsAgainstSerpent:phantomFinishes, serpentKOsByRound:kOsByRound };
}
(async()=>{
 const cfg=parseArgs(process.argv.slice(2)); if(cfg.help){console.log('Usage: node tools/serpentForensicReplay.js [--pairs 20] [--seed 20261623] [--out reports/file.json]');return;}
 const results=[];
 for(let i=0;i<cfg.pairs;i++){const seed=cfg.seed+i; for(const seat of ['player','opponent']) results.push(await runBattle(seed,seat)); console.error(`paired seed ${i+1}/${cfg.pairs}`);}
 const report={protocol:{matchup:'Serpent vs Phantom',seedPairs:cfg.pairs,seedStart:cfg.seed,seedEnd:cfg.seed+cfg.pairs-1,eachSeedBothSeats:true,forensicTimelineSnapshots:true,combatRulesOrAIChanged:false},summary:aggregate(results),results};
 const destination=path.resolve(cfg.out);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
