// Validation for declarative Falcon and enemy skill definitions.
const TARGETING = ["enemy", "ally", "none", "mode"];

const { createDefaultEffectRegistry } = require("../systems/effects");
const DEFAULT_VALIDATION_REGISTRY = createDefaultEffectRegistry({});
const isNum = (value) => typeof value === "number" && Number.isFinite(value);
function validateSkillData(data, effectRegistry = DEFAULT_VALIDATION_REGISTRY) {
  const fail = (where, problem) => { throw new Error(`Invalid skill data (${data && data.characterId}${where ? ` / ${where}` : ""}): ${problem}`); };
  if (!data || typeof data.characterId !== "string") fail("", "missing characterId");
  if (!Array.isArray(data.skills) || !data.skills.length) fail("", "skills must be a non-empty array");
  const summons = data.summons || {};
  const keys = new Set();
  const resultKeys = {
    heal: ["healed"], damage: ["damage"], physicalHit: ["damage"], masteryHit: ["damage", "missed", "bonusText"], shield: ["shield"],
    shieldSelf: ["shield"], summon: ["scan"],
  };
  const checkText = (where, value, allowed, label) => {
    if (value === undefined) return;
    if (typeof value !== "string" || !value) fail(where, `${label} must be a non-empty string`);
    for (const [, token] of value.matchAll(/\{(\w+)\}/g)) {
      if (!allowed.includes(token)) fail(where, `uses {${token}} but nothing produces it`);
    }
  };
  const checkStatus = (where, effect, needsStat = false) => {
    if (!effect || typeof effect.id !== "string" || !effect.id || !Number.isInteger(effect.turns) || effect.turns < 1 ||
      (effect.amount !== undefined && !isNum(effect.amount)) || (needsStat && typeof effect.stat !== "string")) {
      fail(where, "status effect needs id, positive integer turns, optional numeric amount and optional stat");
    }
  };
  const checkEffects = (where, effects, targeting, message) => {
    if (!Array.isArray(effects) || !effects.length) fail(where, "effects must be a non-empty array");
    const produced = new Set(["actor"]);
    if (["enemy", "ally"].includes(targeting)) produced.add("target");
    for (const effect of effects) {
      const type = effect?.type;
      const registryError = effectRegistry.validate(effect, { data, skill: where, targeting, summons });
      if (registryError) fail(where, registryError);
      const handlerTargeting = effectRegistry.get(type)?.targeting;
      if (handlerTargeting) {
        const allowedTargeting = Array.isArray(handlerTargeting) ? handlerTargeting : [handlerTargeting];
        if (!allowedTargeting.includes(targeting)) fail(where, `${type} effect is not valid for targeting "${targeting}"`);
      }
      if (type === "damageOverTime" && effect.side !== undefined && !["ally", "enemy"].includes(effect.side)) {
        fail(where, "damageOverTime side must be ally or enemy");
      }
      if (["heal", "shield", "masteryHit", "damage", "damageOverTime", "conditionalStatus", "statusGroup", "physicalHit"].includes(type) &&
        !(type === "damageOverTime" && ["ally", "enemy"].includes(effect.side)) && !["enemy", "ally"].includes(targeting)) {
        fail(where, `${type} effect acts on a target but targeting is "${targeting}"`);
      }
      if (["heal", "healAllies", "hotAllies"].includes(type) && !(isNum(effect.percentMaxHP) && effect.percentMaxHP > 0)) fail(where, `${type} needs percentMaxHP > 0`);
      if (["damage", "masteryHit", "masteryDamageAllEnemies", "damageOverTime"].includes(type) && !(typeof effect.element === "string" && isNum(effect.power) && effect.power > 0)) fail(where, `${type} needs element and power > 0`);
      if (type === "damageOverTime") {
        if (typeof effect.id !== "string" || !effect.id || !Number.isInteger(effect.turns) || effect.turns < 1) fail(where, "damageOverTime needs id and turns > 0");
        if (effect.side !== undefined && !["ally", "enemy"].includes(effect.side)) fail(where, "damageOverTime side must be ally or enemy");
        if (effect.turnStart !== undefined) {
          const tick = effect.turnStart;
          if (!tick || typeof tick.damageField !== "string" || !tick.damageField ||
            typeof tick.damageTypeField !== "string" || !tick.damageTypeField) fail(where, "damageOverTime turnStart needs damageField and damageTypeField");
          checkText(where, tick.message, ["actor", "damage", "damageType"], "damageOverTime turnStart message");
        }
      }
      if (type === "setBattleTimer") {
        if (typeof effect.key !== "string" || !effect.key || !Number.isInteger(effect.turns) || effect.turns < 1) {
          fail(where, "setBattleTimer needs a non-empty key and turns > 0");
        }
        if (effect.turnStart !== undefined && (!Array.isArray(effect.turnStart) || effect.turnStart.some((reaction) =>
          !reaction || reaction.handler !== "healPercentMaxHP" || !(isNum(reaction.percentMaxHP) && reaction.percentMaxHP > 0 && reaction.percentMaxHP <= 100) ||
          (reaction.side !== undefined && !["ally", "enemy"].includes(reaction.side)) ||
          (reaction.excludeSummons !== undefined && typeof reaction.excludeSummons !== "boolean")))) {
          fail(where, "setBattleTimer turnStart reactions must be valid healPercentMaxHP contracts");
        }
      }
      if (type === "announceSummonPowerModifier") {
        if (typeof effect.ruleHandler !== "string" || !effect.ruleHandler || typeof effect.battleTimer !== "string" || !effect.battleTimer) {
          fail(where, "announceSummonPowerModifier needs ruleHandler and battleTimer keys");
        }
        checkText(where, effect.message, ["actor", "power"], "announceSummonPowerModifier message");
      }
      if (type === "masteryHit") {
        if (effect.accuracy !== undefined && effect.accuracy !== "guaranteed" && effect.accuracy !== "standard") fail(where, "masteryHit accuracy must be standard or guaranteed");
        if (effect.powerModifiers !== undefined && !Array.isArray(effect.powerModifiers)) fail(where, "masteryHit powerModifiers must be an array");
        for (const modifier of effect.powerModifiers || []) {
          const condition = modifier?.when;
          const hasFlag = typeof condition?.flag === "string" && Boolean(condition.flag) && typeof condition.equals === "boolean";
          const validFlag = condition?.flag === undefined || hasFlag;
          const validAndFlags = condition?.andFlags === undefined ||
            (Array.isArray(condition.andFlags) && condition.andFlags.every((item) => item && typeof item.flag === "string" && item.flag && typeof item.equals === "boolean"));
          const hasTargetHpCondition = condition?.targetHpPercentBelow !== undefined;
          const validTargetHpCondition = !hasTargetHpCondition ||
            (isNum(condition.targetHpPercentBelow) && condition.targetHpPercentBelow > 0 && condition.targetHpPercentBelow <= 100);
          const hasCondition = hasFlag || (Array.isArray(condition?.andFlags) && condition.andFlags.length > 0) || hasTargetHpCondition;
          const hasPercent = isNum(modifier?.percent) && modifier.percent > -100;
          const hasSetPower = isNum(modifier?.setPower) && modifier.setPower > 0;
          if (!hasCondition || !validFlag || !validAndFlags || !validTargetHpCondition ||
            hasPercent === hasSetPower ||
            (modifier?.bonusText !== undefined && typeof modifier.bonusText !== "string")) {
            fail(where, "masteryHit power modifiers need a boolean flag condition and/or target HP condition, exactly one of percent > -100 or setPower > 0, and optional bonusText");
          }
        }
      }
      if (type === "physicalHit" && !(isNum(effect.power) && effect.power > 0)) fail(where, "physicalHit needs power > 0");
      if (["shield", "shieldSelf", "shieldAllies"].includes(type)) {
        if (!(isNum(effect.percentMaxHP) && effect.percentMaxHP > 0 && Number.isInteger(effect.turns) && effect.turns > 0)) fail(where, "shield needs percentMaxHP > 0 and turns > 0");
        if (effect.adaptive && !(isNum(effect.adaptive.resistance) && effect.adaptive.resistance > 0 && effect.adaptive.resistance <= 100)) fail(where, "adaptive needs resistance between 0 and 100");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type)) checkStatus(where, effect);
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.hotPercentMaxHP !== undefined &&
        !(isNum(effect.hotPercentMaxHP) && effect.hotPercentMaxHP > 0 && effect.hotPercentMaxHP <= 100)) {
        fail(where, "hotPercentMaxHP must be greater than 0 and at most 100");
      }
      if (type === "conditionalStatus") {
        checkStatus(where, effect, true);
        if (effect.conditionStatus !== undefined && (typeof effect.conditionStatus !== "string" || !effect.conditionStatus)) fail(where, "conditionalStatus conditionStatus must be a non-empty status ID");
        if (effect.conditionalAmount !== undefined && !isNum(effect.conditionalAmount)) fail(where, "conditionalStatus conditionalAmount must be numeric");
        if (effect.requiresStatus !== undefined && (typeof effect.requiresStatus !== "string" || !effect.requiresStatus)) fail(where, "conditionalStatus requiresStatus must be a non-empty status ID");
        if (effect.requireAlive !== undefined && typeof effect.requireAlive !== "boolean") fail(where, "conditionalStatus requireAlive must be a boolean");
        if (effect.to !== undefined && !["self", "target"].includes(effect.to)) fail(where, "conditionalStatus to must be self or target");
      }
      if (type === "statusGroup") {
        if (typeof effect.group !== "string" || !effect.group || !["ally", "enemy"].includes(effect.replaceOn) ||
          !Array.isArray(effect.statuses) || !effect.statuses.length) fail(where, "statusGroup needs group, replaceOn side, and a non-empty statuses list");
        const ids = new Set();
        for (const entry of effect.statuses) {
          if (!entry || typeof entry.id !== "string" || !entry.id || ids.has(entry.id) || !entry.data ||
            !Number.isInteger(entry.data.turns) || entry.data.turns < 1) fail(where, "statusGroup entries need unique ids and data with turns > 0");
          ids.add(entry.id);
        }
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.onUnitDefeated !== undefined) {
        const reaction = effect.onUnitDefeated;
        if (!reaction || reaction.handler !== "restoreMpToLivingAllies" || !isNum(reaction.percentMaxMP) ||
          reaction.percentMaxMP < 0 || reaction.percentMaxMP > 100 ||
          (reaction.side !== undefined && reaction.side !== "ally") ||
          (reaction.excludeSummons !== undefined && typeof reaction.excludeSummons !== "boolean") ||
          (reaction.once !== undefined && typeof reaction.once !== "boolean")) {
          fail(where, "status onUnitDefeated must define a valid restoreMpToLivingAllies reaction (percentMaxMP 0–100)");
        }
      }
      if (type === "commandUplink" && (!Number.isInteger(effect.turns) || effect.turns < 1 || !isNum(effect.amount) ||
        !isNum(effect.conditionalAmount) || !isNum(effect.hpThresholdPercent) || effect.hpThresholdPercent < 0 || effect.hpThresholdPercent > 100)) {
        fail(where, "commandUplink needs amount, conditionalAmount, hpThresholdPercent (0–100), and turns > 0");
      }
      if (type === "summon" && !summons[effect.template]) fail(where, `unknown summon template "${effect.template}"`);
      if (type === "nextSkillDiscount" && (!isNum(effect.amount) || effect.amount < 0)) fail(where, "nextSkillDiscount needs amount >= 0");
      for (const token of [...(resultKeys[type] || []), ...(effectRegistry.get(type)?.resultKeys || [])]) produced.add(token);
    }
    checkText(where, message, [...produced], "message");
  };
  for (const skill of data.skills) {
    const where = skill?.key;
    if (!skill || typeof skill.key !== "string" || typeof skill.name !== "string") fail(where, "needs key and name");
    if (keys.has(skill.key)) fail(where, "duplicate skill key");
    keys.add(skill.key);
    if (!Number.isInteger(skill.cost) || skill.cost < 0) fail(where, "cost must be a non-negative integer");
    if (!Number.isInteger(skill.cooldown) || skill.cooldown < 0) fail(where, "cooldown must be a non-negative integer");
    if (!Array.isArray(skill.tags) || !skill.tags.every((tag) => typeof tag === "string")) fail(where, "tags must be an array of strings");
    if (!TARGETING.includes(skill.targeting)) fail(where, `targeting must be one of ${TARGETING.join(", ")}`);
    const variants = skill.targeting === "mode" ? skill.modes : [skill];
    if (skill.targeting === "mode") {
      if (!Array.isArray(skill.modes) || skill.modes.length < 2) fail(where, "a mode skill needs at least 2 modes");
      const ids = new Set();
      for (const mode of variants) {
        if (typeof mode.id !== "string" || typeof mode.label !== "string") fail(where, "each mode needs id and label");
        if (ids.has(mode.id)) fail(where, `duplicate mode "${mode.id}"`);
        ids.add(mode.id);
        if (!["enemy", "ally", "none"].includes(mode.targeting)) fail(`${where}/${mode.id}`, "mode targeting must be enemy, ally or none");
        checkEffects(`${where}/${mode.id}`, mode.effects, mode.targeting, mode.message);
        checkText(`${where}/${mode.id}`, mode.announce, mode.targeting === "enemy" || mode.targeting === "ally" ? ["actor", "target"] : ["actor"], "announce");
        if (!mode.message && !mode.announce) fail(`${where}/${mode.id}`, "message or announce is required");
      }
    } else {
      checkEffects(where, skill.effects, skill.targeting, skill.message);
    }
    if (skill.targeting !== "mode" && !skill.message && !skill.announce) fail(where, "message or announce is required");
    checkText(where, skill.announce, ["actor", ...(skill.targeting === "enemy" || skill.targeting === "ally" ? ["target"] : [])], "announce");
  }
  const passive = data.passive || {};
  if (passive.initialFlags && Object.values(passive.initialFlags).some((value) => typeof value !== "boolean")) {
    fail("passive", "initialFlags values must be booleans");
  }
  if (passive.targeting && typeof passive.targeting.trackTargeter !== "boolean") {
    fail("passive", "targeting.trackTargeter must be a boolean");
  }
  if (passive.statusId !== undefined && (typeof passive.statusId !== "string" || !passive.statusId)) {
    fail("passive", "statusId must be a non-empty string");
  }
  if (passive.events !== undefined) {
    if (!passive.events || typeof passive.events !== "object" || Array.isArray(passive.events)) fail("passive", "events must be an event-to-subscriptions object");
    for (const [eventName, subscriptions] of Object.entries(passive.events)) {
      if (!eventName || !Array.isArray(subscriptions)) fail("passive", `events.${eventName} must be an array`);
      for (const subscription of subscriptions) {
        if (!subscription || typeof subscription.handler !== "string" || !subscription.handler) fail("passive", `events.${eventName} entries need a handler name`);
      }
    }
  }
  for (const mod of (data.passive?.statMods || [])) {
    const hasPercent = isNum(mod.percent), hasPoints = isNum(mod.points);
    if (typeof mod.stat !== "string" || hasPercent === hasPoints) fail("passive", "each stat modifier needs exactly one numeric percent or points");
    if (mod.when && (typeof mod.when.flag !== "string" || typeof mod.when.equals !== "boolean" ||
      (mod.when.andFlags !== undefined && !Array.isArray(mod.when.andFlags)) ||
      (mod.when.andFlags || []).some((condition) => !condition || typeof condition.flag !== "string" || typeof condition.equals !== "boolean"))) {
      fail("passive", "conditional stat modifiers need boolean flag conditions");
    }
  }
  for (const mod of (data.passive?.incomingAttackMods || [])) {
    if (typeof mod.type !== "string" || !isNum(mod.points)) fail("passive", "incoming attack modifiers need a type and numeric points");
  }
  for (const hook of (data.passive?.onSkillUsed || [])) {
    if (typeof hook.tag !== "string") fail("passive", "each onSkillUsed hook needs a tag");
    for (const effect of hook.effects || []) if (effect.type !== "nextSkillDiscount") fail("passive", `unsupported passive effect "${effect.type}"`);
  }
  for (const [name, summon] of Object.entries(summons)) {
    if (!summon.id || !summon.name || !summon.stats || !Number.isInteger(summon.turns) || summon.turns < 1) fail(`summon ${name}`, "needs id, name, stats and turns >= 1");
    if (summon.scan?.conditionalBonuses !== undefined && (!Array.isArray(summon.scan.conditionalBonuses) ||
      summon.scan.conditionalBonuses.some((modifier) => !modifier || typeof modifier.battleTimer !== "string" || !modifier.battleTimer || !isNum(modifier.damageBonus)))) {
      fail(`summon ${name}`, "scan conditionalBonuses need a battleTimer key and numeric damageBonus");
    }
    if (summon.lifecycle) {
      for (const phase of ["activation", "onExpire"]) {
        if (summon.lifecycle[phase] !== undefined && !Array.isArray(summon.lifecycle[phase])) fail(`summon ${name}`, `${phase} must be an array`);
        for (const subscription of summon.lifecycle[phase] || []) {
          if (typeof subscription.handler !== "string" || !subscription.handler) fail(`summon ${name}`, `${phase} entries need a handler name`);
          if (subscription.conditionalPower !== undefined && (!Array.isArray(subscription.conditionalPower) ||
            subscription.conditionalPower.some((modifier) => !modifier || typeof modifier.battleTimer !== "string" || !modifier.battleTimer ||
              !(isNum(modifier.power) && modifier.power > 0)))) {
            fail(`summon ${name}`, `${phase} conditionalPower entries need a battleTimer key and power > 0`);
          }
        }
      }
    }
  }
  return true;
}

module.exports = { validateSkillData };
