const test = require("node:test");
const assert = require("node:assert/strict");
const { playFactionDuel } = require("../tools/lib/factionDuel");

const FALCON_IDS = ["elishia", "evalete", "zackry", "jazen", "zenki"];

function basicOrPass(view, targetId) {
  const basic = view.actions.find((action) => action.type === "basic");
  if (!basic?.targets?.length) return { type: "pass" };
  return { type: "basic", targetId: targetId && basic.targets.includes(targetId) ? targetId : basic.targets[0] };
}

// Galloz casts Tyrant's Guard whenever it is ready; everyone else basic-attacks.
function guardController(onGallozTurn = () => {}) {
  return {
    chooseAction(view, context) {
      if (view.actor.id === "galloz") {
        onGallozTurn(context.actor);
        const guard = view.actions.find((action) => action.type === "skill" && action.key === "tyrantsGuard" && action.usable);
        if (guard) return { type: "skill", skillKey: "tyrantsGuard" };
      }
      return basicOrPass(view);
    },
  };
}

function tauntWindows(history) {
  const windows = [];
  for (const applied of history.filter((e) => e.type === "StatusApplied" && e.targetId === "galloz" && e.statusId === "tyrantsGuardTaunt")) {
    const expired = history.find((e) => e.type === "StatusExpired" && e.seq > applied.seq && e.actorId === "galloz" && e.statusIds.includes("tyrantsGuardTaunt"));
    windows.push({ from: applied.seq, to: expired ? expired.seq : Infinity });
  }
  return windows;
}

test("full battle: Tyrant's Guard gives Galloz Taunt for two of his turns and every ally damage reduction", async () => {
  const battle = await playFactionDuel({
    seed: 7, playerFaction: "serpent", opponentFaction: "falcon", maxActive: 3,
    controllerOverrides: { serpent: guardController() },
  });
  const history = battle.events.history;
  assert.equal(history.filter((e) => e.type === "DecisionRejected").length, 0);
  const applied = history.filter((e) => e.type === "StatusApplied" && e.targetId === "galloz" && e.statusId === "tyrantsGuardTaunt");
  assert.ok(applied.length >= 2, "Guard is recast after its cooldown");
  assert.ok(applied.every((e) => e.turns === 2));
  const firstSeq = applied[0].seq;
  const reductionTargets = history
    .filter((e) => e.type === "StatusApplied" && e.statusId === "tyrantsGuardDamageReduction" && e.seq > firstSeq && e.seq < firstSeq + 5)
    .map((e) => e.targetId);
  assert.ok(reductionTargets.includes("verra") && reductionTargets.includes("kane"), "active allies receive damage reduction");
  for (const window of tauntWindows(history).filter((w) => w.to !== Infinity)) {
    const gallozTurnEnds = history.filter((e) => e.type === "TurnEnded" && e.actorId === "galloz" && e.seq > window.from && e.seq <= window.to);
    assert.equal(gallozTurnEnds.length, 2, "Taunt lasts two of Galloz's own turns after the cast turn");
  }
});

// Smoke check only: in full duels enemy skill hits keep refreshing the charge, so the
// stale-flag bug rarely occurs naturally. The targeted regression tests live in
// test/reinforcementPrimedExpiry.test.js.
test("full battle: Galloz's primed Reinforcement flag always has a live charge behind it", async () => {
  const checked = [];
  const battle = await playFactionDuel({
    seed: 12, playerFaction: "serpent", opponentFaction: "falcon", maxActive: 3,
    controllerOverrides: {
      serpent: {
        chooseAction(view, context) {
          if (view.actor.id === "galloz") {
            const actor = context.actor;
            checked.push({ primed: Boolean(actor.passiveFlags?.gallozReinforcementPrimed), charge: Boolean(actor.statuses?.gallozKineticCharge) });
            const quake = view.actions.find((action) => action.type === "skill" && action.key === "reactorQuake" && action.usable);
            if (quake) return { type: "skill", skillKey: "reactorQuake" };
          }
          return basicOrPass(view);
        },
      },
    },
  });
  assert.equal(battle.events.history.filter((e) => e.type === "DecisionRejected").length, 0);
  assert.ok(checked.length > 3, "Galloz acted several times");
  for (const entry of checked) assert.ok(!entry.primed || entry.charge, "primed flag requires a live charge");
});

// Taunt currently applies only through the default PvE enemy AI (ai/targeting.js).
// Controller-driven sides now receive Taunt-filtered legal target lists.
test("full battle: enemy basic attacks during Galloz's Taunt target him through legal-target enforcement", async () => {
  const falcon = {
    chooseAction(view) {
      const galloz = view.opponents.find((unit) => unit.id === "galloz");
      const taunting = Object.values(galloz?.statuses || {}).some((status) => status.taunt);
      const basic = view.actions.find((action) => action.type === "basic");
      if (!basic?.targets?.length) return { type: "pass" };
      // During Taunt, the view exposes only Galloz as a legal hostile target.
      return { type: "basic", targetId: basic.targets[0] };
    },
  };
  const battle = await playFactionDuel({
    seed: 7, playerFaction: "serpent", opponentFaction: "falcon", maxActive: 3,
    controllerOverrides: { serpent: guardController(), falcon },
  });
  const history = battle.events.history;
  const windows = tauntWindows(history);
  const underTaunt = history.filter((e) => e.type === "BasicAttackUsed" && FALCON_IDS.includes(e.actorId) &&
    windows.some((w) => e.seq > w.from && e.seq < w.to));
  assert.ok(underTaunt.length > 0, "Falcon attacked during Taunt");
  assert.ok(underTaunt.every((e) => e.targetId === "galloz"), "every attack during Taunt lands on the taunter");
});
