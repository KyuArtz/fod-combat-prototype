/**
 * Pluggable effect-handler registry.
 * Handlers are registered once at composition time; action execution only dispatches
 * declarative effect records by their `type` key.
 */
function createEffectRegistry() {
  const handlers = new Map();

  function register(type, definition) {
    if (typeof type !== "string" || !type.trim()) throw new TypeError("Effect type must be a non-empty string");
    const normalized = typeof definition === "function" ? { execute: definition } : definition;
    if (!normalized || typeof normalized.execute !== "function") {
      throw new TypeError(`Effect handler \"${type}\" must provide execute(effect, run)`);
    }
    if (handlers.has(type)) throw new Error(`Effect handler \"${type}\" is already registered`);
    handlers.set(type, Object.freeze({
      execute: normalized.execute,
      validate: normalized.validate,
      targeting: normalized.targeting,
      resultKeys: normalized.resultKeys || [],
    }));
    return this;
  }

  function has(type) { return handlers.has(type); }
  function get(type) { return handlers.get(type); }
  function dispatch(effect, run) {
    const handler = handlers.get(effect?.type);
    if (!handler) throw new Error(`No effect handler registered for \"${effect?.type}\"`);
    return handler.execute(effect, run);
  }
  function validate(effect, context = {}) {
    const handler = handlers.get(effect?.type);
    if (!handler) return `unknown effect type \"${effect?.type}\"`;
    return handler.validate ? handler.validate(effect, context) : null;
  }
  function entries() { return [...handlers.entries()]; }
  return Object.freeze({ register, has, get, dispatch, validate, entries });
}

module.exports = { createEffectRegistry };
