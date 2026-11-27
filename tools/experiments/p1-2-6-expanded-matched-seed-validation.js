const fs = require('node:fs');
const { playFactionDuel } = require('../lib/factionDuel');
const { createSerpentTacticsController } = require('../../ai/serpentTactics');
async function run(label, threshold, seeds) {
  const rows=[];
  for (const opponent of ['phantom','falcon']) for (const seed of seeds) for (const seat of ['player','opponent']) {
    const playerFaction=seat==='player'?'serpent':opponent, opponentFaction=seat==='player'?opponent:'serpent';
    const battle = await playFactionDuel({ seed, playerFaction, opponentFaction, maxActive: 3, openingInitiative: 'speed', telemetryOptions: { includeTimeline: false }, controllerOverrides: { serpent: createSerpentTacticsController({ verraThreshold: threshold }) } });
    const winner=battle.result==='VICTORY'?playerFaction:battle.result==='DEFEAT'?opponentFaction:'draw';
    const v=battle.telemetry.actorMetrics.verra||{}, s=battle.telemetry.factionMetrics.serpent||{};
    rows.push({label,opponent,seed,seat,winner,rounds:battle.rounds,verraKOs:Number(v.kOs||0),damage:Number(v.damageReceived||0),healing:Number(v.healingReceived||0),turns:Number(v.turnsTaken||0),switches:Number(v.targetSwitches||0),reserves:Number(s.reserveDeployments||0)});
  }
  return rows;
}
function summary(rows){const n=rows.length, sum=k=>rows.reduce((a,r)=>a+r[k],0),wins=rows.filter(r=>r.winner==='serpent').length,draws=rows.filter(r=>r.winner==='draw').length;return {battles:n,wins,opponentWins:n-wins-draws,draws,winRate:wins/n,verraKOs:sum('verraKOs'),averageRounds:sum('rounds')/n,damage:sum('damage'),healing:sum('healing'),turns:sum('turns'),switches:sum('switches'),reserveDeployments:sum('reserves')};}
(async()=>{
 const seeds=Array.from({length:100},(_,i)=>20261700+i);
 const baseline=await run('baseline',.16,seeds); const early=await run('early',.22,seeds);
 const data={protocol:{seeds,seats:['player','opponent'],matchups:['phantom','falcon'],battlesPerPolicy:400,thresholds:{baseline:.16,experimental:.22}},baseline,early};
 fs.writeFileSync('reports/experiments/p1-2-6-expanded-matched-seed-validation.json',JSON.stringify(data,null,2)+'\n');
 const pairedSummary={}; for(const opp of ['phantom','falcon']){let winB=0,winE=0,onlyB=0,onlyE=0,koBetter=0,koWorse=0,shorter=0,longer=0,total=0;for(const seed of seeds)for(const seat of ['player','opponent']){const b=baseline.find(r=>r.opponent===opp&&r.seed===seed&&r.seat===seat),e=early.find(r=>r.opponent===opp&&r.seed===seed&&r.seat===seat);total++;const bw=b.winner==='serpent',ew=e.winner==='serpent';winB+=bw;winE+=ew;onlyB+=bw&&!ew;onlyE+=!bw&&ew;koBetter+=b.verraKOs>0&&e.verraKOs===0;koWorse+=b.verraKOs===0&&e.verraKOs>0;shorter+=e.rounds<b.rounds;longer+=e.rounds>b.rounds;}pairedSummary[opp]={battles:total,baselineWins:winB,experimentalWins:winE,baselineOnlyWins:onlyB,experimentalOnlyWins:onlyE,verraKOImproved:koBetter,verraKOWorsened:koWorse,shorterBattles:shorter,longerBattles:longer};}
 console.log(JSON.stringify({baseline:summary(baseline),experimental:summary(early),byOpponent:Object.fromEntries(['phantom','falcon'].map(o=>[o,{baseline:summary(baseline.filter(r=>r.opponent===o)),experimental:summary(early.filter(r=>r.opponent===o))}])),paired:pairedSummary},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
