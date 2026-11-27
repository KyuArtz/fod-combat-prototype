const test = require("node:test");
const assert = require("node:assert/strict");
const { createFalconParty } = require("../characters/falcon");
const { createPhantomParty } = require("../characters/phantom");
const { createSerpentParty } = require("../characters/serpent");

const parties = [createFalconParty(), createPhantomParty(), createSerpentParty()];
const playable = parties.flat();

test("B6.3: all 15 playable roster actors are organic by canon default", () => {
  assert.equal(playable.length, 15);
  for (const actor of playable) assert.ok(actor.capabilities.includes("organic"), `${actor.name} should be organic`);
});

test("B6.3: Galloz retains organic classification and gains electronic-systems interaction tag", () => {
  const galloz = playable.find((actor) => actor.id === "galloz");
  assert.ok(galloz);
  assert.deepEqual(galloz.capabilities, ["organic", "electronic-systems"]);
});

test("B6.3: non-Galloz playable actors are not classified as electronic systems", () => {
  for (const actor of playable.filter((actor) => actor.id !== "galloz")) {
    assert.ok(!actor.capabilities.includes("electronic-systems"), `${actor.name} should not receive an electronic-systems tag`);
  }
});
