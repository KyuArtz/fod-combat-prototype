const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventBus } = require("../core/eventBus");

test("handlers receive typed events with payload and an increasing seq", () => {
  const bus = createEventBus();
  const seen = [];
  bus.on("DamageDealt", (event) => seen.push(event));
  bus.emit("DamageDealt", { targetId: "zenki", amount: 42 });
  bus.emit("Healed", { targetId: "zenki", amount: 5 });
  bus.emit("DamageDealt", { targetId: "elishia", amount: 7 });
  assert.deepEqual(seen, [
    { targetId: "zenki", amount: 42, type: "DamageDealt", seq: 1 },
    { targetId: "elishia", amount: 7, type: "DamageDealt", seq: 3 },
  ]);
});

test("onAny sees every event in order and handlers run in subscription order", () => {
  const bus = createEventBus();
  const calls = [];
  bus.on("A", () => calls.push("typed-1"));
  bus.onAny((event) => calls.push(`any:${event.type}`));
  bus.on("A", () => calls.push("typed-2"));
  bus.emit("A");
  bus.emit("B");
  assert.deepEqual(calls, ["typed-1", "typed-2", "any:A", "any:B"]);
});

test("unsubscribe stops delivery, including from inside a handler", () => {
  const bus = createEventBus();
  const calls = [];
  const off = bus.on("A", () => calls.push("first"));
  bus.emit("A");
  off();
  bus.emit("A");
  assert.deepEqual(calls, ["first"]);

  const selfRemoving = [];
  const offSelf = bus.on("B", () => {
    selfRemoving.push("once");
    offSelf();
  });
  bus.on("B", () => selfRemoving.push("second"));
  bus.emit("B");
  bus.emit("B");
  assert.deepEqual(selfRemoving, ["once", "second", "second"]);
});

test("payload cannot override type or seq", () => {
  const bus = createEventBus();
  const event = bus.emit("Real", { type: "Fake", seq: 999, value: 1 });
  assert.equal(event.type, "Real");
  assert.equal(event.seq, 1);
  assert.equal(event.value, 1);
});

test("record option keeps a replayable history; default does not", () => {
  const recording = createEventBus({ record: true });
  recording.emit("A", { n: 1 });
  recording.emit("B", { n: 2 });
  assert.deepEqual(recording.history.map((event) => event.type), ["A", "B"]);
  assert.deepEqual(structuredClone(recording.history), recording.history);

  const plain = createEventBus();
  plain.emit("A");
  assert.equal(plain.history.length, 0);
});

test("emitting with no subscribers is fine; bad arguments throw", () => {
  const bus = createEventBus();
  assert.doesNotThrow(() => bus.emit("Nobody"));
  assert.throws(() => bus.on("", () => {}), TypeError);
  assert.throws(() => bus.on("A", "not a function"), TypeError);
  assert.throws(() => bus.onAny(null), TypeError);
  assert.throws(() => bus.emit(""), TypeError);
});

test("a throwing handler propagates so a broken view fails loudly", () => {
  const bus = createEventBus();
  bus.on("A", () => {
    throw new Error("view crashed");
  });
  assert.throws(() => bus.emit("A"), /view crashed/);
});
