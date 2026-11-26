const test = require("node:test");
const assert = require("node:assert/strict");
const { createSerpentWorld, serpentSkill } = require("./helpers/serpentWorld");
const { createPhantomWorld } = require("./helpers/phantomWorld");
const { tickStatuses } = require("../systems/statusEffects");

function hitTwice(world, actor, source) {
  world.damage(actor, 50, "Physical", source, { kind: "direct", actionType: "skill" });
  world.damage(actor, 50, "Physical", source, { kind: "direct", actionType: "skill" });
}

test("Galloz's primed flag clears when the unspent Kinetic charge expires", () => {
  const world = createSerpentWorld();
  const galloz = world.byId.galloz;
  hitTwice(world, galloz, world.enemies[0]);
  assert.equal(galloz.passiveFlags.gallozReinforcementPrimed, true);
  for (let i = 0; i < 3; i++) {
    tickStatuses(galloz);
    world.skillSet.onTurnEnd(galloz);
  }
  assert.equal(galloz.statuses.gallozKineticCharge, undefined);
  assert.equal(galloz.passiveFlags.gallozReinforcementPrimed, false);
});

test("an expired Galloz charge no longer upgrades Reactor Quake to the 120% payoff", () => {
  const primed = createSerpentWorld();
  const stale = createSerpentWorld();
  const run = (world, expire) => {
    const galloz = world.byId.galloz;
    hitTwice(world, galloz, world.enemies[0]);
    if (expire) {
      for (let i = 0; i < 3; i++) { tickStatuses(galloz); world.skillSet.onTurnEnd(galloz); }
    }
    galloz.mp = 250;
    const target = world.enemies[0];
    const before = target.hp;
    assert.equal(serpentSkill(world, "galloz", "reactorQuake").run(galloz), true);
    return before - target.hp;
  };
  assert.ok(run(primed, false) > run(stale, true), "primed Quake must out-damage a Quake after the charge expired");
});

test("turn start also drops a primed flag whose charge was removed", () => {
  const world = createSerpentWorld();
  const galloz = world.byId.galloz;
  hitTwice(world, galloz, world.enemies[0]);
  delete galloz.statuses.gallozKineticCharge;
  world.skillSet.onTurnStart(galloz);
  assert.equal(galloz.passiveFlags.gallozReinforcementPrimed, false);
});

test("Lucaz shares the same primed-flag expiry", () => {
  const world = createPhantomWorld();
  const lucaz = world.byId.lucaz;
  world.damage(lucaz, 35, "Physical", world.enemies[0], { kind: "direct" });
  world.damage(lucaz, 35, "Physical", world.enemies[0], { kind: "direct" });
  assert.equal(lucaz.passiveFlags.reinforcementPrimed, true);
  for (let i = 0; i < 2; i++) { tickStatuses(lucaz); world.skillSet.onTurnEnd(lucaz); }
  assert.equal(lucaz.statuses.reinforcementKineticCharge, undefined);
  assert.equal(lucaz.passiveFlags.reinforcementPrimed, false);
});
