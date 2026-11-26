const fs = require('node:fs');
const { playFactionDuel } = require('../lib/factionDuel');
const { createSerpentTacticsController } = require('../../ai/serpentTactics');

const MATCHUPS = ['phantom', 'falcon'];
const SEEDS = Array.from({ length: 20 }, (_, i) => 20261800 + i);
const SEATS = ['player', 'opponent'];
const ROLE_BY_ID = {
  mirazhel: 'tactician', elishia_p: 'stalker', lucaz: 'juggernaut', clarke: 'vanguard', liezli: 'stalker',
  elishia: 'versatile', evalete: 'field-medic', zackry: 'tactician', jazen: 'juggernaut', zenki: 'stalker', 'meo-9': 'summon',
};
const HP = unit => unit && unit.maxHp > 0 ? unit.hp / unit.maxHp : null;


async function main() {
  const battles = [], decisions = [];
  for (const opponent of MATCHUPS) for (const seed of SEEDS) for (const seat of SEATS) {
    const playerFaction = seat === 'player' ? 'serpent' : opponent;
    const opponentFaction = seat === 'player' ? opponent : 'serpent';
    const serpentController = createSerpentTacticsController();
    const captureController = { chooseAction(view) {
      const decision = serpentController.chooseAction(view);
      if (view.actor?.skillSet === 'verra' || view.actor?.id === 'verra') {
        const switchAction = view.actions.find(a => a.type === 'switch') || {};
        decisions.push({ matchup: opponent, seed, seat, hpRatio: HP(view.actor), enemyCount: view.opponents.filter(u => u.hp > 0 && !u.untargetable).length,
          enemyRoles: view.opponents.filter(u => u.hp > 0 && !u.untargetable).map(u => u.role || 'unknown'),
          allyHpRatios: view.friendlies.filter(u => !u.summon && u.hp > 0).map(HP),
          reserveHpRatios: (switchAction.reserves || []).filter(u => u.alive).map(HP),
          activeHpRatios: (switchAction.active || []).filter(u => u.alive).map(HP),
          usableTreatmentModes: view.actions.flatMap(a => a.usable ? (a.modes || []).filter(m => ['treat','remedy'].includes(m.id)).map(m => ({skill:a.key,mode:m.id,targetCount:m.targets?.length||0})) : []),
          action: decision.type === 'switch' ? 'switch' : decision.mode === 'treat' || decision.mode === 'remedy' ? 'treat' : decision.mode === 'corrosive' || decision.mode === 'attack' ? 'offense' : decision.type });
      }
      return decision;
    }};
    const battle = await playFactionDuel({ seed, playerFaction, opponentFaction, maxActive: 3, openingInitiative: 'speed', telemetryOptions: { includeTimeline: false }, controllerOverrides: { serpent: captureController } });
    const actors = new Map(battle.state.actors.map(a => [a.id, a]));
    const serpentIds = new Set(['verra', 'kane', 'galloz', 'claude', 'tekushiki']);
    const enemyDamageBySource = {}, damageToVerraBySource = {}, damageToSerpentByTarget = {};
    for (const event of battle.events.history) if (event.type === 'DamageApplied' && serpentIds.has(event.targetId) && event.sourceSide !== 'ally') {
      const amount = (Number(event.hpLoss) || 0) + (Number(event.absorbedAmount) || 0);
      enemyDamageBySource[event.sourceId] = (enemyDamageBySource[event.sourceId] || 0) + amount;
      damageToSerpentByTarget[event.targetId] = (damageToSerpentByTarget[event.targetId] || 0) + amount;
      if (event.targetId === 'verra') damageToVerraBySource[event.sourceId] = (damageToVerraBySource[event.sourceId] || 0) + amount;
    }
    const sources = Object.entries(enemyDamageBySource).map(([id, damage]) => ({ id, role: actors.get(id)?.role || ROLE_BY_ID[id] || 'unknown', faction: actors.get(id)?.faction || 'unknown', damage }));
    const totalDamage = sources.reduce((sum, s) => sum + s.damage, 0);
    battles.push({ matchup: opponent, seed, seat, result: battle.result, rounds: battle.rounds, damageToSerpent: totalDamage, damageToVerra: Object.values(damageToVerraBySource).reduce((a,b)=>a+b,0), sourceDamage: sources, verraSourceDamage: damageToVerraBySource, targetDamage: damageToSerpentByTarget });
  }
  const aggregate = {};
  for (const matchup of MATCHUPS) {
    const rows = battles.filter(b => b.matchup === matchup);
    const byRole = {}, bySource = {};
    let totalDamage = 0, totalVerraDamage = 0;
    for (const b of rows) {
      totalDamage += b.damageToSerpent; totalVerraDamage += b.damageToVerra;
      for (const source of b.sourceDamage) {
        byRole[source.role] ||= { damage: 0, sources: new Set() };
        byRole[source.role].damage += source.damage;
        byRole[source.role].sources.add(source.id);
        bySource[source.id] = (bySource[source.id] || 0) + source.damage;
      }
    }
    aggregate[matchup] = { battleCount: rows.length, totalEnemyDamageToSerpent: totalDamage, totalDamageToVerra: totalVerraDamage, verraShareOfIncoming: totalDamage ? totalVerraDamage / totalDamage : 0, roleDamage: Object.fromEntries(Object.entries(byRole).map(([role, value]) => [role, { damage: value.damage, sourceCount: value.sources.size } ])), sourceDamage: bySource, avgDamagePerBattle: totalDamage / rows.length };
  }
  const decisionSummary = {};
  for (const matchup of MATCHUPS) {
    const subset = decisions.filter(d => d.matchup === matchup);
    const byHpBand = {}, byEnemyCount = {}, actionCounts = {};
    for (const d of subset) {
      const band = d.hpRatio <= .16 ? 'critical-<=16%' : d.hpRatio <= .22 ? '16-22%' : d.hpRatio <= .3 ? '22-30%' : d.hpRatio <= .5 ? '30-50%' : '>50%';
      byHpBand[band] ||= { decisions: 0, switches: 0, treatments: 0, other: 0, reserveEligible: 0 };
      byHpBand[band].decisions++;
      byHpBand[band][d.action === 'switch' ? 'switches' : d.action === 'treat' ? 'treatments' : 'other']++;
      if (d.reserveHpRatios.some(r => r >= Math.max(.65, d.hpRatio + .25))) byHpBand[band].reserveEligible++;
      const enemyCount = String(d.enemyCount);
      byEnemyCount[enemyCount] ||= { decisions: 0, switches: 0, treatments: 0, other: 0 };
      byEnemyCount[enemyCount].decisions++;
      byEnemyCount[enemyCount][d.action === 'switch' ? 'switches' : d.action === 'treat' ? 'treatments' : 'other']++;
      actionCounts[d.action] = (actionCounts[d.action] || 0) + 1;
    }
    decisionSummary[matchup] = { verraDecisionCount: subset.length, actions: actionCounts, byHpBand, byActiveEnemyCount: byEnemyCount };
  }
  const output = { protocol: { seeds: SEEDS, seats: SEATS, matchups: MATCHUPS, battles: battles.length, policyChanges: false, notes: 'Telemetry-only feasibility study; no policy or engine modifications.' }, aggregate, decisionSummary, decisions, battles };
  fs.writeFileSync('reports/experiments/p1-2-7-policy-feasibility.json', JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify({ aggregate, decisionSummary }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
