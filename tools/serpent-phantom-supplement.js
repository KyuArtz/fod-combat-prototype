const fs = require('node:fs');
const input = process.argv[2] || 'reports/serpent-phantom-forensic-paired-40.json';
const out = process.argv[3] || 'reports/serpent-phantom-forensic-40-supplement.json';
const data = JSON.parse(fs.readFileSync(input,'utf8'));
const targetIds = ['galloz','verra','tekushiki','claude','kane'];
const seatTargets = {};
for (const seat of ['player','opponent']) {
  const actions = data.results.filter(r=>r.serpentSeat===seat).flatMap(r=>r.actions).filter(a=>a.actorFaction==='phantom'&&targetIds.includes(a.decision?.targetId));
  const counts = {};
  for (const action of actions) counts[action.decision.targetId]=(counts[action.decision.targetId]||0)+1;
  seatTargets[seat]={totalTargetDecisions:actions.length,counts,percentages:Object.fromEntries(Object.entries(counts).map(([id,n])=>[id,Number((n/actions.length*100).toFixed(1))]))};
}
const verraActions=data.results.flatMap(r=>r.verraAudit);
const treatment=verraActions.filter(a=>['treat','remedy'].includes(a.decision?.mode));
const selfTreatment=treatment.filter(a=>a.decision.targetId==='verra');
const highHP=selfTreatment.filter(a=>a.verraHPPercent>=80);
const highHPStatuses={};
for(const audit of highHP){const actor=audit.allyState.find(u=>u.id==='verra'); for(const s of actor?.statuses||[]){highHPStatuses[s.statusId]=(highHPStatuses[s.statusId]||0)+1;}}
const hpPressure={};
for(const threshold of [50,40,30,20]){
 const otherCritical=verraActions.filter(a=>a.allyState.some(u=>u.id!=='verra'&&u.hpPercent<=threshold));
 const selfTreatDuring=treatment.filter(a=>a.decision.targetId==='verra'&&a.allyState.some(u=>u.id!=='verra'&&u.hpPercent<=threshold));
 hpPressure[threshold]={verraActionsWithOtherAllyAtOrBelowThreshold:otherCritical.length,selfTreatmentDuring:selfTreatDuring.length};
}
const reserveStats={serpent:{deployments:0,zeroTurns:0,totalReserveTurns:0,reserveDamage:0,reserveHealing:0,reserveShielding:0,assistedKOs:0,deploymentRounds:[],perActor:{}},phantom:{deployments:0,zeroTurns:0,totalReserveTurns:0,reserveDamage:0,reserveHealing:0,reserveShielding:0,assistedKOs:0,deploymentRounds:[],perActor:{}}};
for(const battle of data.results){for(const [id,m] of Object.entries(battle.reserveMetrics||{})){const faction=battle.actorMetrics[id]?.faction;if(!reserveStats[faction])continue;const s=reserveStats[faction];const a=battle.actorMetrics[id]||{};s.deployments++;s.zeroTurns+=m.turnsActive===0?1:0;s.totalReserveTurns+=m.turnsActive||0;s.deploymentRounds.push(m.deploymentRound);s.reserveDamage+=a.reserveDamageDealt||0;s.reserveHealing+=a.reserveHealing||0;s.reserveShielding+=a.reserveShielding||0;s.assistedKOs+=a.reserveKOsAssisted||0;const per=s.perActor[id]||(s.perActor[id]={deployments:0,zeroTurns:0,totalTurns:0,damage:0,healing:0,shielding:0,assistedKOs:0});per.deployments++;per.zeroTurns+=m.turnsActive===0?1:0;per.totalTurns+=m.turnsActive||0;per.damage+=a.reserveDamageDealt||0;per.healing+=a.reserveHealing||0;per.shielding+=a.reserveShielding||0;per.assistedKOs+=a.reserveKOsAssisted||0;}}
for(const s of Object.values(reserveStats)){s.zeroTurnPercent=Number((s.zeroTurns/s.deployments*100).toFixed(1));s.averageTurnsPerDeployment=Number((s.totalReserveTurns/s.deployments).toFixed(2));s.averageDeploymentRound=Number((s.deploymentRounds.reduce((a,b)=>a+b,0)/s.deployments).toFixed(2));delete s.deploymentRounds;for(const per of Object.values(s.perActor)){per.zeroTurnPercent=Number((per.zeroTurns/per.deployments*100).toFixed(1));per.averageTurnsPerDeployment=Number((per.totalTurns/per.deployments).toFixed(2));}}
const firstKOBySeat={player:{},opponent:{}};
for(const r of data.results){const first=[...r.serpentKOs].sort((a,b)=>a.round-b.round)[0];if(first)firstKOBySeat[r.serpentSeat][first.actorId]=(firstKOBySeat[r.serpentSeat][first.actorId]||0)+1;}
const koCounts={};const finishCounts={};
for(const r of data.results){for(const k of r.serpentKOs){koCounts[k.actorId]=(koCounts[k.actorId]||0)+1;finishCounts[k.lastDamageSourceId]=(finishCounts[k.lastDamageSourceId]||0)+1;}}
const output={seatTargets,verra:{treatmentActions:treatment.length,selfTreatments:selfTreatment.length,selfTreatmentsAtHP80Plus:highHP.length,highHPSelfTreatmentStatusCounts:highHPStatuses,hpPressure},reserveStats,firstKOBySeat,koCounts,finalBlowCounts:finishCounts};
fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
