const fs = require('node:fs');
const path = require('node:path');
const { playFactionDuel, FACTIONS } = require('../lib/factionDuel');
const { createSerpentTacticsController } = require('../../ai/serpentTactics');
const { getStatusCleansePriority } = require('../../systems/statusEffects');
const ratio = u => u && u.maxHp > 0 ? u.hp / u.maxHp : 1;
function reserveCandidates(view) {
  const sw = view.actions.find(a => a.type === 'switch');
  if (!sw) return { active: [], reserves: [], eligiblePairs: [] };
  const active = sw.active.filter(u => u.alive), reserves = sw.reserves.filter(u => u.alive);
  const thresholds = { standard: .20, verra: .16, poison: .32 };
  const outgoing = active.filter(u => ratio(u) <= (u.id === 'verra' ? thresholds.verra : thresholds.standard));
  const poisonedOutgoing = active.filter(u => Object.values(u.statuses||{}).some(st=>st?.damageType==='Toxic'&&st?.turnStart&&Number(st?.dotDamage)>0) && ratio(u)<=thresholds.poison);
  const possibleOutgoing = [...new Map([...outgoing,...poisonedOutgoing].map(u=>[u.id,u])).values()];
  const incomingByOutgoing = possibleOutgoing.map(out => ({ outgoing: out.id, outgoingHpPercent: ratio(out)*100, reserveCandidates: reserves.filter(r => ratio(r) >= Math.max(.65, ratio(out)+.25)).map(r=>({id:r.id,hpPercent:ratio(r)*100})) }));
  return { active: active.map(u=>({id:u.id,hpPercent:ratio(u)*100})), reserves: reserves.map(u=>({id:u.id,hpPercent:ratio(u)*100})), eligiblePairs: incomingByOutgoing };
}
function captureTreatments(view, actor) {
 const out=[];
 for (const a of view.actions.filter(a=>a.usable && ['unstableRemedy','causticInjection'].includes(a.key))) for (const m of a.modes||[]) if(['remedy','treat'].includes(m.id)) {
   for(const id of m.targets||[]) { const t=view.friendlies.find(u=>u.id===id); if(!t) continue;
    const multiplier=a.key==='unstableRemedy' ? (ratio(t)<.5?2.0:1.6) : 1.3;
    const requestedEstimate=(actor.stats?.MPow||actor.stats?.Mpow||0)*multiplier;
    const expectedHeal=Math.min(Math.max(0,t.maxHp-t.hp),requestedEstimate);
    const cleanseable=Object.entries(t.statuses||{}).filter(([sid,s])=>getStatusCleansePriority(s)>0).map(([sid])=>sid);
    out.push({skill:a.key,mode:m.id,target:id,targetHpPercent:ratio(t)*100,missingHp:t.maxHp-t.hp,estimatedHeal:expectedHeal,cleanseableStatusIds:cleanseable,usable:true});
   }
 }
 return out;
}
async function main(){
 const pairs=Number(process.argv[2]||10), seedStart=Number(process.argv[3]||20261633);
 const all=[];
 for(let i=0;i<pairs;i++) for(const seat of ['player','opponent']) {
  const serpentSeat=seat, playerFaction=seat==='player'?'serpent':'phantom', opponentFaction=seat==='player'?'phantom':'serpent';
  const captured=[]; const serpentController=createSerpentTacticsController();
  const wrapper={chooseAction(view,ctx){ if(view.actor.id==='verra') captured.push({seed:seedStart+i,seat,round:view.round,actorHPPercent:ratio(view.actor)*100,actorMP:view.actor.mp,actorStats:{MPow:ctx.actor.stats?.MPow,Mpow:ctx.actor.stats?.Mpow},allySnapshots:view.friendlies.filter(u=>!u.summon).map(u=>({id:u.id,hpPercent:ratio(u)*100,hp:u.hp,maxHp:u.maxHp,statuses:u.statuses})),reserveData:reserveCandidates(view),treatmentOptions:captureTreatments(view,ctx.actor)}); return serpentController.chooseAction(view,ctx); }};
  const battle=await playFactionDuel({seed:seedStart+i,playerFaction,opponentFaction,maxActive:3,openingInitiative:'speed',telemetryOptions:{includeTimeline:false},controllerOverrides:{serpent:wrapper}});
  const actionEvents=battle.events.history.filter(e=>e.type==='ActionChosen'&&e.actorId==='verra');
  captured.forEach((r,idx)=>{r.decision=actionEvents[idx]?.decision||null;r.actionIndex=idx;});
  let turnActor=null; const verraEffectEvents=[]; for(const ev of battle.events.history){if(ev.type==='TurnStarted')turnActor=ev.actorId; if(turnActor==='verra'&&(ev.type==='Healed'||ev.type==='StatusCleansed'))verraEffectEvents.push({seq:ev.seq,type:ev.type,targetId:ev.targetId,requestedAmount:ev.requestedAmount,healed:ev.healed,statusIds:ev.statusIds||[]});}
  all.push({seed:seedStart+i,seat,result:battle.result,rounds:battle.rounds,verraDecisions:captured,verraEffectEvents});
 }
 const report={protocol:{matchup:'Serpent vs Phantom',pairs,battles:pairs*2,seedStart,seatAlternation:true,capture:'Controller-view capture: active/reserve health, threshold rotation candidates, legal treatment targets, estimated heal value and cleanse candidates.'},results:all};
 const outfile=path.join('reports/experiments','p1-2-4-reserve-treatment-capture.json');fs.writeFileSync(outfile,JSON.stringify(report,null,2)+'\n');
 const decisions=all.flatMap(b=>b.verraDecisions), selfTreat=decisions.filter(d=>['treat','remedy'].includes(d.decision?.mode)&&d.decision.targetId==='verra');
 const lowSelf=selfTreat.filter(d=>d.actorHPPercent<=30), safeReserve=decisions.filter(d=>d.actorHPPercent<=30&&d.reserveData.eligiblePairs.some(p=>p.reserveCandidates.length));
 const treatments=decisions.filter(d=>['treat','remedy'].includes(d.decision?.mode)); const lowHpTreatment= treatments.filter(d=>d.actorHPPercent<=30); const actualHealEvents=all.flatMap(b=>b.verraEffectEvents).filter(e=>e.type==='Healed'); const totalActualHealing=actualHealEvents.reduce((sum,e)=>sum+Number(e.healed||0),0); const totalRequestedHealing=actualHealEvents.reduce((sum,e)=>sum+Number(e.requestedAmount||0),0); const expectedHealing= treatments.map(d=>d.treatmentOptions.find(t=>t.target===d.decision.targetId&&t.skill===d.decision.skillKey)).filter(Boolean);
 const summary={battles:all.length,decisions:decisions.length,criticalDecisions:decisions.filter(d=>d.actorHPPercent<=30).length,criticalDecisionsWithHealthyReserve:safeReserve.length,selfTreatments:selfTreat.length,lowHpSelfTreatments:lowSelf.length,treatmentDecisions:treatments.length,lowHpTreatmentDecisions:lowHpTreatment.length,actualHealEventCount:actualHealEvents.length,totalActualHealing,totalRequestedHealing,estimatedSelectedTreatmentHeal:expectedHealing.reduce((s,t)=>s+Number(t.estimatedHeal||0),0),treatmentTargetCounts:treatments.reduce((m,d)=>(m[d.decision.targetId]=(m[d.decision.targetId]||0)+1,m),{}),reserveAtCriticalHp:decisions.filter(d=>d.actorHPPercent<=30).map(d=>({seed:d.seed,seat:d.seat,round:d.round,actorHp:d.actorHPPercent,reserves:d.reserveData.reserves,eligiblePairs:d.reserveData.eligiblePairs})),lowHpTreatmentDecisionsDetail:lowHpTreatment.map(d=>({seed:d.seed,seat:d.seat,round:d.round,actorHp:d.actorHPPercent,selected:d.decision,estimatedHeal:d.treatmentOptions.find(t=>t.target===d.decision.targetId&&t.skill===d.decision.skillKey)?.estimatedHeal,reserves:d.reserveData.reserves,eligiblePairs:d.reserveData.eligiblePairs})),treatmentEstimates:expectedHealing.map(t=>({target:t.target,skill:t.skill,estimatedHeal:t.estimatedHeal}))};
 report.summary=summary;
 console.log(JSON.stringify({output:outfile,...summary,criticalSelfTreatExamples:lowSelf.slice(0,8).map(d=>({seed:d.seed,seat:d.seat,round:d.round,hp:d.actorHPPercent,selected:d.decision,eligible:d.reserveData.eligiblePairs}))},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
