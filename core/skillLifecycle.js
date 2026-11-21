// Compatibility facade. Passive and summon lifecycle implementation is owned by systems/passives.
const { createRuntime } = require('../systems/passives/runtime');
function createSkillLifecycle(context) { return createRuntime(context); }
module.exports = { createSkillLifecycle };
