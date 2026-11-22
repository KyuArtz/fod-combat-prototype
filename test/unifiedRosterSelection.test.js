const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlayableRoster, PLAYABLE_FACTIONS, getCharacterPreview } = require("../characters/roster");
const { createDeploymentSelector } = require("../ui/deploymentSelection");

function makeSelector(answers) {
  const lines = [];
  const selector = createDeploymentSelector({
    ask: async (prompt) => {
      const answer = answers.shift();
      if (answer === undefined) throw new Error(`Unexpected prompt: ${prompt}`);
      return answer;
    },
    output: { log: (line) => lines.push(String(line)) },
  });
  return { selector, lines };
}

test("unified roster registry exposes all current playable factions and unique combatants", () => {
  assert.deepEqual(PLAYABLE_FACTIONS.map(({ id }) => id), ["falcon", "phantom"]);
  const roster = createPlayableRoster();
  assert.equal(roster.length, 10);
  assert.equal(new Set(roster.map((actor) => actor.id)).size, 10);
  assert.equal(roster.filter((actor) => actor.faction === "falcon").length, 5);
  assert.equal(roster.filter((actor) => actor.faction === "phantom").length, 5);
  assert.ok(roster.every((actor) => actor.side === "ally" && actor.skillSet === actor.id));
});

test("unified selector filters by faction and search, previews characters, and builds active/reserve order", async () => {
  const answers = [
    "filter faction phantom",
    "info 2",
    "1", // Mirazhel
    "2", // Unknown
    "all",
    "search evalete",
    "1", // Evalete
    "search jazen",
    "1", // Jazen
    "search zenki",
    "1", // Zenki
    "done",
    "1", // active: Mirazhel
    "2", // active: Evalete
    "2", // active: Jazen
    "2", // reserve: Zenki
    "1", // reserve: Unknown
  ];
  const { selector, lines } = makeSelector(answers);
  const selected = await selector.selectMixedFormation(createPlayableRoster(), {
    activeCount: 3,
    maxPartySize: 5,
  });

  assert.deepEqual(selected.map((actor) => actor.id), [
    "mirazhel", "evalete", "jazen", "zenki", "elishia_p",
  ]);
  assert.equal(new Set(selected.map((actor) => actor.id)).size, 5);
  assert.ok(lines.some((line) => line.includes("OPERATIVE PROFILE: UNKNOWN")));
  assert.ok(lines.some((line) => line.includes("Aegis of the Scarlet Veil")));
  assert.ok(lines.some((line) => line.includes("Faction: Phantom Rebellion")));
  assert.ok(lines.some((line) => line.includes("Active (3): Mirazhel, Evalete, Jazen")));
  assert.ok(lines.some((line) => line.includes("Reserve (2): Zenki, Unknown")));
});

test("unified roster search does not expose the hidden operative's internal ID", async () => {
  const answers = [
    "search elishia_p",
    "search unknown",
    "1",
    "search mirazhel",
    "1",
    "search lucaz",
    "1",
    "done",
    "1", "1", "1", // active order
  ];
  const { selector, lines } = makeSelector(answers);
  const selected = await selector.selectMixedFormation(createPlayableRoster(), { activeCount: 3, maxPartySize: 5 });
  assert.deepEqual(selected.map((actor) => actor.name), ["Unknown", "Mirazhel", "Lucaz"]);
  assert.ok(!lines.some((line) => line.includes("elishia_p")));
});

test("roster selector enforces minimum active count and five-member maximum", async () => {
  const answers = [
    "done", // too few
    "1", "2", "3", "4", "5", // reach cap
    "6", // over cap / invalid
    "done",
    "1", "1", "1", "1", "1", // all five into ordered formation
  ];
  const { selector, lines } = makeSelector(answers);
  const selected = await selector.selectMixedFormation(createPlayableRoster(), { activeCount: 3, maxPartySize: 5 });
  assert.equal(selected.length, 5);
  assert.equal(new Set(selected.map((actor) => actor.id)).size, 5);
  assert.ok(lines.some((line) => line.includes("Choose at least 3 operatives")));
  assert.ok(lines.some((line) => line.includes("Your formation is full (5)")));
});

test("character preview exposes combat profile and skills without internal roster identifiers", () => {
  const unknown = createPlayableRoster().find((actor) => actor.id === "elishia_p");
  const preview = getCharacterPreview(unknown);
  assert.equal(preview.name, "Unknown");
  assert.equal(preview.factionLabel, "Phantom Rebellion");
  assert.equal(preview.role, "stalker");
  assert.equal(preview.mastery, "Anomaly");
  assert.equal(preview.skills.length, 4);
  assert.ok(preview.passive.name);
  assert.equal(Object.hasOwn(preview, "id"), false);
  assert.ok(preview.skills.every((skill) => !/Elishia Bluestein|Phantom Queen|Sovereign identity/i.test(skill.description)));
});

test("interactive createBattle deploys a mixed-faction three-active/two-reserve formation", async () => {
  const { PassThrough, Writable } = require("node:stream");
  const { createBattle } = require("../core/battle");
  const { createBasicAttackController } = require("../core/controllers");
  const { createEventBus } = require("../core/eventBus");

  const input = new PassThrough();
  const answers = ["1", "6", "8", "9", "10", "done", "1", "2", "1", "2", "1"];
  const promptOutput = new Writable({
    write(_chunk, _encoding, callback) {
      setImmediate(() => {
        const answer = answers.shift();
        if (answer === undefined) input.end();
        else input.write(`${answer}\n`);
      });
      callback();
    },
  });
  const events = createEventBus({ record: true });
  const battle = createBattle({
    input,
    promptOutput,
    output: { log() {} },
    events,
    seed: 880012,
    selectPartyCharacters: true,
    maxActive: 3,
    controllers: {
      player: createBasicAttackController(),
      enemy: createBasicAttackController(),
    },
  });

  try {
    const result = await battle.run();
    assert.ok(["VICTORY", "DEFEAT", "DRAW"].includes(result));
    const selected = events.history.find((event) => event.type === "FormationSelected");
    assert.ok(selected);
    assert.equal(selected.ids.length, 5);
    assert.equal(new Set(selected.ids).size, 5);
    assert.ok(selected.ids.some((id) => ["elishia", "evalete", "zackry", "jazen", "zenki"].includes(id)));
    assert.ok(selected.ids.some((id) => ["mirazhel", "elishia_p", "lucaz", "clarke", "liezli"].includes(id)));
    assert.equal(battle.state.party.maxActive, 3);
    assert.equal(battle.state.party.roster.length, 5);
  } finally {
    battle.close();
    input.destroy();
  }
});

test("createBattle rejects simultaneous legacy faction and unified roster selectors", () => {
  const { createBattle } = require("../core/battle");
  assert.throws(
    () => createBattle({ selectPartyFaction: true, selectPartyCharacters: true }),
    /cannot both be enabled/,
  );
});
