const test = require("node:test");
const assert = require("node:assert/strict");
const { enemyTarget } = require("../ai/targeting");
const formation = require("../systems/formation");
const { addShield } = require("../systems/shields");
const { createFalconWorld, skill } = require("./helpers/falconWorld");

function ownerTurn(world, owner) {
  world.skillSet.onTurnStart(owner);
  world.skillSet.onTurnEnd(owner);
}

test("Catalyst Wing is a targetable passive summon and never receives its own scheduled turn", () => {
  const w = createFalconWorld();
  const evalete = w.byId.evalete;
  w.skillSet.onBattleStart(w.allies);
  const wing = w.state.actors.find((actor) => actor.id === evalete.catalystWingId);
  assert.ok(wing);
  assert.equal(wing.targetableByEnemy, true);
  assert.equal(wing.passiveSummon, true);
  assert.equal(wing.summon, true);
  assert.equal(wing.stats.HP, Math.floor(evalete.stats.HP * 0.25));
  // A summon is an eligible target, but enemy AI still prioritizes the weakest
  // living ally. Make the Wing the weakest to verify target selection can pick it.
  wing.hp = 1;
  assert.equal(enemyTarget(w.state, w.enemies[1], formation.alive), wing);
});

test("Catalyst Protocol pulses at the start of every even Evalete turn including turn 12", () => {
  const w = createFalconWorld();
  const evalete = w.byId.evalete;
  w.skillSet.onBattleStart(w.allies);
  const ally = w.byId.jazen;
  ally.hp -= 400;
  for (let turn = 1; turn <= 12; turn++) {
    const beforeHp = ally.hp;
    const beforeShields = ally.shields.length;
    w.skillSet.onTurnStart(evalete);
    if (turn % 2 === 0) {
      assert.equal(ally.hp, Math.min(ally.stats.HP, beforeHp + Math.floor(ally.stats.HP * 0.08)), `pulse on turn ${turn}`);
      assert.equal(ally.shields.length, beforeShields + 1, `new independent shield on turn ${turn}`);
      assert.equal(ally.shields.at(-1).value, Math.floor(ally.stats.HP * 0.10));
    } else {
      assert.equal(ally.hp, beforeHp, `no pulse on turn ${turn}`);
      assert.equal(ally.shields.length, beforeShields, `no shield on turn ${turn}`);
    }
    w.skillSet.onTurnEnd(evalete);
  }
  const wing = w.state.actors.find((actor) => actor.id === evalete.catalystWingId);
  assert.equal(wing.alive, false, "Wing expires after its 12th Evalete turn ends");
  assert.equal(evalete.catalystWingTurnCount, 12);
});

test("destroying Catalyst Wing disables future pulses and grants no fallback shield", () => {
  const w = createFalconWorld();
  const evalete = w.byId.evalete;
  w.skillSet.onBattleStart(w.allies);
  const wing = w.state.actors.find((actor) => actor.id === evalete.catalystWingId);
  wing.alive = false;
  w.skillSet.summonDestroyed(wing);
  assert.equal(evalete.shields.length, 0);
  const ally = w.byId.jazen;
  const before = ally.hp;
  ownerTurn(w, evalete);
  ownerTurn(w, evalete);
  assert.equal(ally.hp, before);
  assert.equal(evalete.catalystWingTurns, 0);
});

test("Recoil Dampeners uses post-mitigation damage before shield absorption, stacks to Mpow +20%, and refreshes at cap", () => {
  const w = createFalconWorld();
  const jazen = w.byId.jazen;
  addShield(jazen, 2000, 3);
  const thresholdHit = Math.floor(jazen.stats.HP * 0.11);
  w.damage(jazen, thresholdHit, "Physical", w.enemies[0]);
  assert.equal(jazen.hp, jazen.stats.HP, "shield absorbs all HP damage");
  assert.equal(jazen.statuses.jazenRecoil.amount, 10, "the incoming hit qualifies before shield absorption");
  assert.equal(jazen.statuses.jazenRecoil.stacks, 1);
  w.damage(jazen, thresholdHit, "Physical", w.enemies[0]);
  assert.equal(jazen.statuses.jazenRecoil.amount, 20);
  assert.equal(jazen.statuses.jazenRecoil.stacks, 2);
  w.damage(jazen, thresholdHit, "Physical", w.enemies[0]);
  assert.equal(jazen.statuses.jazenRecoil.amount, 20, "stack cap is not exceeded");
  assert.equal(jazen.statuses.jazenRecoil.stacks, 2);
});

test("small or non-direct damage does not trigger Recoil Dampeners", () => {
  const w = createFalconWorld();
  const jazen = w.byId.jazen;
  w.damage(jazen, Math.floor(jazen.stats.HP * 0.10), "Physical", w.enemies[0]);
  assert.equal(jazen.statuses.jazenRecoil, undefined, "threshold is strictly greater than 10%");
  w.damage(jazen, Math.floor(jazen.stats.HP * 0.20), "Toxic", w.enemies[0], { kind: "dot" });
  assert.equal(jazen.statuses.jazenRecoil, undefined, "DOT does not count as a direct hit");
});
