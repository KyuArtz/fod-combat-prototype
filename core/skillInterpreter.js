// Shared runtime for declarative Falcon and enemy skills.
// Controllers choose actions; this module validates, interprets and dispatches them.

const { createDefaultEffectRegistry } = require("../systems/effects");
const { createSkillLifecycle } = require("./skillLifecycle");
const { formatMessage } = require("./skillMessages");
const { validateSkillData } = require("./skillDataValidation");

function createSkillInterpreter(context) {
  const { pay, ready, say, state } = context;
  const effectRegistry = context.effectRegistry || createDefaultEffectRegistry(context, context.effectHandlers || {});
  const lifecycle = createSkillLifecycle(context);

  function runSkill(data, skill, actor, { mode, target } = {}) {
    const variant = skill.targeting === "mode" ? skill.modes.find((candidate) => candidate.id === mode) : skill;
    if (!variant) return false;
    if (variant?.targeting === "ally" && target) {
      if (skill.excludeSelf && target.id === actor.id) {
        say(`${skill.name} cannot target its user.`);
        return false;
      }
      if (skill.targetFaction && target.faction !== skill.targetFaction) {
        say(`${skill.name} can only target ${skill.targetFaction} allies.`);
        return false;
      }
    }
    if (!ready(actor, skill.key, skill.cost)) {
      say(skill.unavailableMessage || `${skill.name} is unavailable (MP/cooldown).`);
      return false;
    }
    pay(actor, skill.cost);
    actor.cooldowns[skill.key] = skill.cooldown;
    const run = { data, skill, actor, target, mode, results: {}, after: [] };
    const messageValues = { actor: actor.name, target: target && target.name };
    if (variant.announce) say(formatMessage(variant.announce, messageValues));
    for (const effect of variant.effects) effectRegistry.dispatch(effect, run);
    if (variant.message) say(formatMessage(variant.message, { ...messageValues, ...run.results }));
    for (const line of run.after) say(line);

    for (const hook of (data.passive && data.passive.onSkillUsed) || []) {
      if (!skill.tags.includes(hook.tag)) continue;
      for (const effect of hook.effects) effectRegistry.dispatch(effect, run);
    }
    lifecycle.passiveRegistry?.dispatch(actor, "skillUsed", { skill, target, mode, run });
    return true;
  }

  function buildSkills(data) {
    validateSkillData(data, effectRegistry, lifecycle.passiveRegistry, lifecycle.summonRegistry);
    return data.skills.map((skill) => ({
      name: skill.name, key: skill.key, cost: skill.cost, cooldown: skill.cooldown,
      tags: [...(skill.tags || [])], targeting: skill.targeting,
      ...(skill.category ? { category: skill.category } : {}),
      ...(skill.description ? { description: skill.description } : {}),
      ...(skill.excludeSelf ? { excludeSelf: true } : {}),
      ...(skill.targetFaction ? { targetFaction: skill.targetFaction } : {}),
      ...(skill.targeting === "mode" ? { modes: skill.modes.map(({ id, label, targeting }) => ({ id, label, targeting })) } : {}),
      run: (actor, args) => runSkill(data, skill, actor, args),
    }));
  }

  return { buildSkills, runSkill, effectRegistry, ...lifecycle };
}

module.exports = { createSkillInterpreter, validateSkillData, formatMessage };
