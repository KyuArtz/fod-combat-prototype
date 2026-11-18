// Shared runtime for declarative Falcon and enemy skills.
// Controllers choose actions; this module validates, interprets and dispatches them.

const { createSkillEffects } = require("./skillEffects");
const { createSkillLifecycle } = require("./skillLifecycle");
const { formatMessage } = require("./skillMessages");
const { validateSkillData } = require("./skillDataValidation");

function createSkillInterpreter(context) {
  const { pay, ready, say, state } = context;
  const EFFECTS = createSkillEffects(context);
  const lifecycle = createSkillLifecycle(context);

  function runSkill(data, skill, actor, { mode, target } = {}) {
    const variant = skill.targeting === "mode" ? skill.modes.find((candidate) => candidate.id === mode) : skill;
    if (!variant) return false;
    if (!ready(actor, skill.key, skill.cost)) {
      say(skill.unavailableMessage || `${skill.name} is unavailable (MP/cooldown).`);
      return false;
    }
    pay(actor, skill.cost);
    actor.cooldowns[skill.key] = skill.cooldown;
    const run = { data, actor, target, results: {}, after: [] };
    const messageValues = { actor: actor.name, target: target && target.name };
    if (variant.announce) say(formatMessage(variant.announce, messageValues));
    for (const effect of variant.effects) EFFECTS[effect.type](effect, run);
    if (variant.message) say(formatMessage(variant.message, { ...messageValues, ...run.results }));
    for (const line of run.after) say(line);

    for (const hook of (data.passive && data.passive.onSkillUsed) || []) {
      if (!skill.tags.includes(hook.tag)) continue;
      for (const effect of hook.effects) EFFECTS[effect.type](effect, run);
    }
    if (data.passive?.id === "overwatchProtocol") {
      const recipients = [];
      if (target?.side === "ally") recipients.push(target);
      else if (target?.targetedByAllyId) {
        const recipient = state.actors.find((unit) => unit.id === target.targetedByAllyId && unit.alive);
        if (recipient) recipients.push(recipient);
      }
      for (const recipient of recipients) recipient.nextAttackAccuracy = data.passive.nextAttackAccuracy || 10;
    }
    return true;
  }

  function buildSkills(data) {
    validateSkillData(data);
    return data.skills.map((skill) => ({
      name: skill.name, key: skill.key, cost: skill.cost, cooldown: skill.cooldown,
      tags: [...(skill.tags || [])], targeting: skill.targeting,
      ...(skill.category ? { category: skill.category } : {}),
      ...(skill.description ? { description: skill.description } : {}),
      ...(skill.targeting === "mode" ? { modes: skill.modes.map(({ id, label, targeting }) => ({ id, label, targeting })) } : {}),
      run: (actor, args) => runSkill(data, skill, actor, args),
    }));
  }

  return { buildSkills, runSkill, ...lifecycle };
}

module.exports = { createSkillInterpreter, validateSkillData, formatMessage };
