const test = require("node:test");
const assert = require("node:assert/strict");
const { playFactionDuel, summarizeFactionDuel, FACTIONS } = require("../tools/lib/factionDuel");
const { createDeploymentSelector } = require("../ui/deploymentSelection");
const { createFalconParty } = require("../characters/falcon");

const factions = ["falcon", "phantom"];

test("both factions expose five selectable combatants for a three-active, two-reserve formation", () => {
  for (const id of factions) {
    assert.equal(FACTIONS[id].ids.length, 5);
    assert.equal(new Set(FACTIONS[id].ids).size, 5);
  }
  assert.ok(createFalconParty({ side: "enemy" }).every((actor) => actor.skillSet === actor.id));
});

test("interactive faction selector returns Phantom Rebellion when selected", async () => {
  const lines = [];
  const selector = createDeploymentSelector({
    ask: async () => "2",
    output: { log: (line) => lines.push(line) },
  });
  const selected = await selector.selectFaction([
    { id: "falcon", label: "Falcon Company" },
    { id: "phantom", label: "Phantom Rebellion" },
  ]);
  assert.equal(selected, "phantom");
  assert.ok(lines.some((line) => line.includes("Phantom Rebellion")));
});

test("interactive formation selector lets the player choose Phantom members and reserves", async () => {
  const answers = ["2", "1", "2", "2", "1"];
  const lines = [];
  const selector = createDeploymentSelector({
    ask: async () => answers.shift(),
    output: { log: (line) => lines.push(line) },
  });
  const roster = [
    { id: "mirazhel", name: "Mirazhel" },
    { id: "elishia_p", name: "Unknown" },
    { id: "lucaz", name: "Lucaz" },
    { id: "clarke", name: "Clarke" },
    { id: "liezli", name: "Liezli" },
  ];
  const order = await selector.selectFormation(roster, 3);
  assert.deepEqual(order.map((actor) => actor.id), ["elishia_p", "mirazhel", "clarke", "liezli", "lucaz"]);
  assert.ok(lines.some((line) => line.includes("Active: Unknown, Mirazhel, Clarke")));
  assert.ok(lines.some((line) => line.includes("Reserve queue: Liezli, Lucaz")));
});

test("Falcon and Phantom both use their tactical skill controllers in a real faction duel", async () => {
  const battle = await playFactionDuel({ seed: 29001, playerFaction: "falcon", maxActive: 3 });
  const summary = summarizeFactionDuel(battle);
  const events = battle.events.history;
  assert.ok(["VICTORY", "DEFEAT", "DRAW"].includes(battle.result));
  assert.equal(summary.rejectedDecisions, 0);
  assert.ok(summary.rounds > 0);
  assert.ok(events.some((event) => event.type === "SkillUsed" && FACTIONS.falcon.ids.includes(event.actorId)));
  assert.ok(events.some((event) => event.type === "SkillUsed" && FACTIONS.phantom.ids.includes(event.actorId)));
  assert.ok(events.some((event) => event.type === "PartySwitched" && event.side === "enemy"), "enemy-side Phantom reserve switching must execute successfully");
  assert.equal(battle.state.party.maxActive, 3);
  assert.equal(battle.state.enemyParty.maxActive, 3);
});

test("Phantom can also be the player-side faction in a real tactical faction duel", async () => {
  const battle = await playFactionDuel({ seed: 29002, playerFaction: "phantom", maxActive: 3 });
  const summary = summarizeFactionDuel(battle);
  const events = battle.events.history;
  assert.ok(["VICTORY", "DEFEAT", "DRAW"].includes(battle.result));
  assert.equal(summary.rejectedDecisions, 0);
  assert.ok(events.some((event) => event.type === "SkillUsed" && FACTIONS.phantom.ids.includes(event.actorId)));
  assert.ok(events.some((event) => event.type === "SkillUsed" && FACTIONS.falcon.ids.includes(event.actorId)));
});
