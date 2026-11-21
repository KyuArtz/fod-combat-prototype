const { createEffectRegistry } = require("./registry");
const { createDefaultEffectHandlers } = require("./defaultHandlers");

function createDefaultEffectRegistry(context, extensions = {}) {
  const registry = createEffectRegistry();
  const handlers = createDefaultEffectHandlers(context);
  for (const [type, definition] of Object.entries(handlers)) registry.register(type, definition);
  for (const [type, definition] of Object.entries(extensions)) registry.register(type, definition);
  return registry;
}

module.exports = { createEffectRegistry, createDefaultEffectRegistry };
