// A tiny synchronous event bus. The engine emits events; views (the terminal
// log today, a GUI later, a simulator or test any time) subscribe to them.
//
// Events are plain data: { type, seq, ...payload }. Keep payloads
// structured-clone friendly (ids, numbers, strings, no functions or actor
// objects) so they can be recorded, replayed and sent across to a UI.
//
// Handlers run synchronously, in subscription order. A handler that throws
// propagates the error to the emitter, so a broken view fails loudly instead of
// silently desyncing from the engine.

function createEventBus({ record = false } = {}) {
  const handlersByType = new Map();
  const anyHandlers = new Set();
  const history = [];
  let seq = 0;

  function assertHandler(handler) {
    if (typeof handler !== "function") {
      throw new TypeError("Event handler must be a function.");
    }
  }

  function on(type, handler) {
    if (typeof type !== "string" || !type) {
      throw new TypeError("Event type must be a non-empty string.");
    }
    assertHandler(handler);
    if (!handlersByType.has(type)) handlersByType.set(type, new Set());
    handlersByType.get(type).add(handler);
    return () => handlersByType.get(type)?.delete(handler);
  }

  function onAny(handler) {
    assertHandler(handler);
    anyHandlers.add(handler);
    return () => anyHandlers.delete(handler);
  }

  function emit(type, payload = {}) {
    if (typeof type !== "string" || !type) {
      throw new TypeError("Event type must be a non-empty string.");
    }
    // type and seq always win over anything in the payload.
    const event = { ...payload, type, seq: ++seq };
    if (record) history.push(event);
    // Copy before iterating so handlers may unsubscribe while an event is dispatched.
    for (const handler of [...(handlersByType.get(type) || [])]) handler(event);
    for (const handler of [...anyHandlers]) handler(event);
    return event;
  }

  return { on, onAny, emit, history };
}

module.exports = { createEventBus };
