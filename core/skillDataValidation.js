// Validation for declarative playable-character and enemy skill definitions.
const TARGETING = ["enemy", "ally", "none", "mode"];

const { createDefaultEffectRegistry } = require("../systems/effects");
const { createPassiveRegistry, SUPPORTED_PASSIVE_EVENTS } = require("../systems/passives/registry");
const { createSummonRegistry } = require("../systems/summons/registry");
const DEFAULT_VALIDATION_REGISTRY = createDefaultEffectRegistry({});
const DEFAULT_PASSIVE_REGISTRY = createPassiveRegistry({});
const DEFAULT_SUMMON_REGISTRY = createSummonRegistry({});
const isNum = (value) => typeof value === "number" && Number.isFinite(value);
function validateSkillData(
  data,
  effectRegistry = DEFAULT_VALIDATION_REGISTRY,
  passiveRegistry = DEFAULT_PASSIVE_REGISTRY,
  summonRegistry = DEFAULT_SUMMON_REGISTRY,
) {
  const fail = (where, problem) => { throw new Error(`Invalid skill data (${data && data.characterId}${where ? ` / ${where}` : ""}): ${problem}`); };
  if (!data || typeof data.characterId !== "string") fail("", "missing characterId");
  if (!Array.isArray(data.skills) || !data.skills.length) fail("", "skills must be a non-empty array");
  const summons = data.summons || {};
  const keys = new Set();
  const resultKeys = {
    heal: ["healed"], healPower: ["healed", "healedTargetIds"], healPowerAllies: ["healed", "healedTargetIds"], healSelf: ["healed"], damage: ["damage"], physicalHit: ["damage"], masteryHit: ["damage", "missed", "bonusText"], masteryMultiHit: ["damage", "missed", "bonusText", "hitsLanded", "hitDamages"], shield: ["shield"],
    shieldSelf: ["shield"], summon: ["summon"], cleanseAllies: ["cleansedCount"], cleanseTarget: ["cleansedCount"], consumeTetherMarks: ["consumedMarks"],
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
  const checkPowerModifiers = (where, modifiers, label = "powerModifiers") => {
    if (modifiers === undefined) return;
    if (!Array.isArray(modifiers)) fail(where, `${label} must be an array`);
    for (const modifier of modifiers) {
      const condition = modifier?.when || {};
      const hasFlag = typeof condition.flag === "string" && Boolean(condition.flag) && typeof condition.equals === "boolean";
      const validFlag = condition.flag === undefined || hasFlag;
      const validAndFlags = condition.andFlags === undefined ||
        (Array.isArray(condition.andFlags) && condition.andFlags.every((item) => item && typeof item.flag === "string" && item.flag && typeof item.equals === "boolean"));
      const hasTargetHpCondition = condition.targetHpPercentBelow !== undefined;
      const validTargetHpCondition = !hasTargetHpCondition ||
        (isNum(condition.targetHpPercentBelow) && condition.targetHpPercentBelow > 0 && condition.targetHpPercentBelow <= 100);
      const validActorStatus = condition.status === undefined || (typeof condition.status === "string" && Boolean(condition.status));
      const validTargetStatus = condition.targetStatus === undefined || (typeof condition.targetStatus === "string" && Boolean(condition.targetStatus));
      const hasCondition = hasFlag || (Array.isArray(condition.andFlags) && condition.andFlags.length > 0) || hasTargetHpCondition ||
        typeof condition.status === "string" || typeof condition.targetStatus === "string";
      const variants = [
        isNum(modifier?.percent) && modifier.percent > -100,
        isNum(modifier?.setPower) && modifier.setPower > 0,
        isNum(modifier?.addPower) && modifier.addPower > 0,
      ].filter(Boolean).length;
      if (!modifier || !hasCondition || !validFlag || !validAndFlags || !validTargetHpCondition || !validActorStatus ||
        !validTargetStatus || variants !== 1 || (modifier.bonusText !== undefined && typeof modifier.bonusText !== "string")) {
        fail(where, `${label} entries need a valid flag/status/HP condition and exactly one of percent, setPower or addPower`);
      }
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
      if (type === "damageOverTime" && effect.side !== undefined && !["ally", "enemy", "opponent"].includes(effect.side)) {
        fail(where, "damageOverTime side must be ally, enemy or opponent");
      }
      if (effect.onlyHitTargets !== undefined && typeof effect.onlyHitTargets !== "boolean") {
        fail(where, "onlyHitTargets must be a boolean");
      }
      if (effect.onlyHitTargets && !["damageOverTime", "statusEnemies"].includes(type)) {
        fail(where, "onlyHitTargets is supported only by damageOverTime and statusEnemies");
      }
      if (["heal", "healPower", "cleanseTarget", "shield", "masteryHit", "masteryMultiHit", "damage", "damageOverTime", "conditionalStatus", "statusGroup", "physicalHit", "consumeTetherMarks"].includes(type) &&
        !(type === "damageOverTime" && ["ally", "enemy", "opponent"].includes(effect.side)) && !["enemy", "ally"].includes(targeting)) {
        fail(where, `${type} effect acts on a target but targeting is "${targeting}"`);
      }
      if (["heal", "healAllies", "hotAllies", "healSelf"].includes(type) && !(isNum(effect.percentMaxHP) && effect.percentMaxHP > 0)) fail(where, `${type} needs percentMaxHP > 0`);
      if (["healPower", "healPowerAllies"].includes(type) && (!(isNum(effect.multiplier) && effect.multiplier > 0) ||
        (effect.scalingStat !== undefined && !["ATK", "MPow"].includes(effect.scalingStat)))) {
        fail(where, `${type} needs multiplier > 0 and scalingStat ATK or MPow`);
      }
      if (type === "healPower" && (effect.multiplierBelowHpPercent !== undefined || effect.conditionalMultiplier !== undefined) &&
        (!(isNum(effect.multiplierBelowHpPercent) && effect.multiplierBelowHpPercent > 0 && effect.multiplierBelowHpPercent <= 100) ||
          !(isNum(effect.conditionalMultiplier) && effect.conditionalMultiplier > 0))) {
        fail(where, "conditional healPower requires multiplierBelowHpPercent (0–100) and conditionalMultiplier > 0");
      }
      if (type === "consumeTetherMarks") {
        if (targeting !== "enemy" || (effect.minimumStacks !== undefined && (!Number.isInteger(effect.minimumStacks) || effect.minimumStacks < 1)) ||
          (effect.markStatus !== undefined && (typeof effect.markStatus !== "string" || !effect.markStatus)) ||
          (effect.removeStatuses !== undefined && (!Array.isArray(effect.removeStatuses) || !effect.removeStatuses.every((id) => typeof id === "string" && id))) ||
          (effect.apply !== undefined && (!effect.apply || typeof effect.apply.id !== "string" || !effect.apply.id || !Number.isInteger(effect.apply.turns) || effect.apply.turns < 1))) {
          fail(where, "consumeTetherMarks requires enemy targeting and valid mark/consume/apply options");
        }
      }
      if (["damage", "masteryHit", "masteryDamageAllEnemies", "masteryDamageAllOpponents", "damageOverTime"].includes(type) && !(typeof effect.element === "string" && isNum(effect.power) && effect.power > 0)) fail(where, `${type} needs element and power > 0`);
      if (type === "masteryMultiHit") {
        if (targeting !== "enemy") fail(where, "masteryMultiHit requires enemy targeting");
        if (typeof effect.element !== "string" || !Array.isArray(effect.hits) || !effect.hits.length || effect.hits.some((power) => !isNum(power) || power <= 0)) fail(where, "masteryMultiHit needs an element and non-empty hits array of powers > 0");
        if (effect.accuracy !== undefined && !["standard", "guaranteed"].includes(effect.accuracy)) fail(where, "masteryMultiHit accuracy must be standard or guaranteed");
        if (effect.lastHitModifier !== undefined) {
          const modifier = effect.lastHitModifier;
          if (!modifier || !isNum(modifier.targetHpPercentBelow) || modifier.targetHpPercentBelow <= 0 || modifier.targetHpPercentBelow > 100 || !isNum(modifier.setPower) || modifier.setPower <= 0) fail(where, "masteryMultiHit lastHitModifier needs targetHpPercentBelow (0–100) and setPower > 0");
        }
      }
      if (type === "masteryDamageAllOpponents" && targeting !== "none") fail(where, "masteryDamageAllOpponents requires none targeting");
      if (type === "damageOverTime") {
        if (typeof effect.id !== "string" || !effect.id || !Number.isInteger(effect.turns) || effect.turns < 1) fail(where, "damageOverTime needs id and turns > 0");
        if (effect.side !== undefined && !["ally", "enemy", "opponent"].includes(effect.side)) fail(where, "damageOverTime side must be ally, enemy or opponent");
        if (effect.scalingStat !== undefined && !["ATK", "MPow"].includes(effect.scalingStat)) fail(where, "damageOverTime scalingStat must be ATK or MPow");
        if (effect.turnStart !== undefined) {
          const tick = effect.turnStart;
          if (!tick || typeof tick.damageField !== "string" || !tick.damageField ||
            typeof tick.damageTypeField !== "string" || !tick.damageTypeField) fail(where, "damageOverTime turnStart needs damageField and damageTypeField");
          checkText(where, tick.message, ["actor", "damage", "damageType"], "damageOverTime turnStart message");
        }
      }
      if (type === "setBattleTimer") {
        if (effect.ownerTurnClock !== undefined && typeof effect.ownerTurnClock !== "boolean") fail(where, "setBattleTimer ownerTurnClock must be a boolean");
        if (typeof effect.key !== "string" || !effect.key || !Number.isInteger(effect.turns) || effect.turns < 1) {
          fail(where, "setBattleTimer needs a non-empty key and turns > 0");
        }
        if (effect.turnStart !== undefined && (!Array.isArray(effect.turnStart) || effect.turnStart.some((reaction) =>
          !reaction || reaction.handler !== "healPercentMaxHP" || !(isNum(reaction.percentMaxHP) && reaction.percentMaxHP > 0 && reaction.percentMaxHP <= 100) ||
          (reaction.side !== undefined && !["ally", "enemy", "owner"].includes(reaction.side)) ||
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
      if (["masteryHit", "masteryMultiHit", "masteryDamageAllEnemies", "masteryDamageAllOpponents", "damage"].includes(type) &&
        effect.scalingStat !== undefined && !["ATK", "MPow"].includes(effect.scalingStat)) {
        fail(where, `${type} scalingStat must be ATK or MPow`);
      }
      if (type === "masteryHit" && effect.critRateBonus !== undefined && !(isNum(effect.critRateBonus) && effect.critRateBonus >= 0)) {
        fail(where, "masteryHit critRateBonus must be non-negative");
      }
      if (type === "masteryHit" && effect.critRateBonusWhenStatus !== undefined &&
        (typeof effect.critRateBonusWhenStatus !== "string" || !effect.critRateBonusWhenStatus || !(isNum(effect.critRateBonus) && effect.critRateBonus >= 0))) {
        fail(where, "masteryHit critRateBonusWhenStatus needs a status ID and non-negative critRateBonus");
      }
      if (["masteryHit", "masteryMultiHit", "masteryDamageAllOpponents"].includes(type)) {
        if (effect.accuracy !== undefined && !["standard", "guaranteed"].includes(effect.accuracy)) fail(where, `${type} accuracy must be standard or guaranteed`);
        checkPowerModifiers(where, effect.powerModifiers, "powerModifiers");
        if (type === "masteryMultiHit") checkPowerModifiers(where, effect.lastHitPowerModifiers, "lastHitPowerModifiers");
      }
      if (type === "physicalHit" && !(isNum(effect.power) && effect.power > 0)) fail(where, "physicalHit needs power > 0");
      if (["shield", "shieldSelf", "shieldAllies"].includes(type)) {
        const percentShield = isNum(effect.percentMaxHP) && effect.percentMaxHP > 0;
        const statShield = effect.scalingStat !== undefined && ["ATK", "MPow"].includes(effect.scalingStat) && isNum(effect.multiplier) && effect.multiplier > 0;
        if ((!percentShield && !statShield) || !Number.isInteger(effect.turns) || effect.turns <= 0) fail(where, "shield needs percentMaxHP > 0 or scalingStat with multiplier > 0, and turns > 0");
        if (effect.replaceGroup !== undefined && (typeof effect.replaceGroup !== "string" || !effect.replaceGroup)) fail(where, "shield replaceGroup must be a non-empty string");
        if (effect.adaptive && !(isNum(effect.adaptive.resistance) && effect.adaptive.resistance > 0 && effect.adaptive.resistance <= 100)) fail(where, "adaptive needs resistance between 0 and 100");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type)) checkStatus(where, effect);
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.hotPercentMaxHP !== undefined &&
        !(isNum(effect.hotPercentMaxHP) && effect.hotPercentMaxHP > 0 && effect.hotPercentMaxHP <= 100)) {
        fail(where, "hotPercentMaxHP must be greater than 0 and at most 100");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.damageReflectionPercent !== undefined &&
        !(isNum(effect.damageReflectionPercent) && effect.damageReflectionPercent >= 0 && effect.damageReflectionPercent <= 100)) {
        fail(where, "damageReflectionPercent must be between 0 and 100");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.nextSkillPowerAdd !== undefined &&
        (!(isNum(effect.nextSkillPowerAdd) && effect.nextSkillPowerAdd > 0) ||
          (effect.scalingStat !== undefined && !["ATK", "MPow"].includes(effect.scalingStat)) ||
          (effect.damageType !== undefined && typeof effect.damageType !== "string"))) {
        fail(where, "nextSkillPowerAdd needs a positive value and optional valid scalingStat/damageType");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.untargetable !== undefined && typeof effect.untargetable !== "boolean") {
        fail(where, "untargetable must be a boolean");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.skipAction !== undefined && typeof effect.skipAction !== "boolean") {
        fail(where, "skipAction must be a boolean");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) &&
        (effect.resistanceType !== undefined || effect.resistancePercent !== undefined) &&
        (typeof effect.resistanceType !== "string" || !effect.resistanceType || !(isNum(effect.resistancePercent) && effect.resistancePercent > 0 && effect.resistancePercent <= 100))) {
        fail(where, "typed resistance needs resistanceType and resistancePercent between 0 and 100");
      }
      if (type === "statusEnemies" && effect.requiresStatus !== undefined && (typeof effect.requiresStatus !== "string" || !effect.requiresStatus)) {
        fail(where, "statusEnemies requiresStatus must be a non-empty status ID");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type) && effect.expireAtTurnStart !== undefined && typeof effect.expireAtTurnStart !== "boolean") {
        fail(where, "expireAtTurnStart must be a boolean");
      }
      if (type === "conditionalStatus") {
        checkStatus(where, effect, true);
        if (effect.conditionStatus !== undefined && (typeof effect.conditionStatus !== "string" || !effect.conditionStatus)) fail(where, "conditionalStatus conditionStatus must be a non-empty status ID");
        if (effect.conditionalAmount !== undefined && !isNum(effect.conditionalAmount)) fail(where, "conditionalStatus conditionalAmount must be numeric");
        if (effect.requiresStatus !== undefined && (typeof effect.requiresStatus !== "string" || !effect.requiresStatus)) fail(where, "conditionalStatus requiresStatus must be a non-empty status ID");
        if (effect.requireAlive !== undefined && typeof effect.requireAlive !== "boolean") fail(where, "conditionalStatus requireAlive must be a boolean");
        if (effect.to !== undefined && !["self", "target"].includes(effect.to)) fail(where, "conditionalStatus to must be self or target");
        if (effect.conditionOn !== undefined && !["actor", "target"].includes(effect.conditionOn)) fail(where, "conditionalStatus conditionOn must be actor or target");
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
    if (skill.excludeSelf !== undefined && typeof skill.excludeSelf !== "boolean") fail(where, "excludeSelf must be a boolean");
    if (skill.targetFaction !== undefined && (typeof skill.targetFaction !== "string" || !skill.targetFaction)) fail(where, "targetFaction must be a non-empty string");
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
  if (passive.damageThresholdPercent !== undefined && !(isNum(passive.damageThresholdPercent) && passive.damageThresholdPercent >= 0 && passive.damageThresholdPercent < 100)) {
    fail("passive", "damageThresholdPercent must be from 0 up to (but not including) 100");
  }
  if (passive.mpowBonusPercent !== undefined && !(isNum(passive.mpowBonusPercent) && passive.mpowBonusPercent > 0)) {
    fail("passive", "mpowBonusPercent must be greater than 0");
  }
  if (passive.maxStacks !== undefined && (!Number.isInteger(passive.maxStacks) || passive.maxStacks < 1)) {
    fail("passive", "maxStacks must be an integer greater than 0");
  }
  if (passive.duration !== undefined && (!Number.isInteger(passive.duration) || passive.duration < 1)) {
    fail("passive", "duration must be an integer greater than 0");
  }
  if (passive.events !== undefined) {
    if (!passive.events || typeof passive.events !== "object" || Array.isArray(passive.events)) fail("passive", "events must be an event-to-subscriptions object");
    for (const [eventName, subscriptions] of Object.entries(passive.events)) {
      if (!eventName || !Array.isArray(subscriptions)) fail("passive", `events.${eventName} must be an array`);
      if (!SUPPORTED_PASSIVE_EVENTS.includes(eventName)) fail("passive", `events.${eventName} is not a supported lifecycle event`);
      for (const subscription of subscriptions) {
        if (!subscription || typeof subscription.handler !== "string" || !subscription.handler) fail("passive", `events.${eventName} entries need a handler name`);
        if (!passiveRegistry?.has?.(subscription.handler)) fail("passive", `events.${eventName} references unknown passive handler "${subscription.handler}"`);
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
  for (const mod of (data.passive?.conditionalDamageMods || [])) {
    if (!mod || typeof mod.damageType !== "string" || !mod.damageType || typeof mod.targetStatus !== "string" || !mod.targetStatus ||
      !isNum(mod.percent) || mod.percent <= -100) fail("passive", "conditionalDamageMods need damageType, targetStatus and percent > -100");
  }
  for (const hook of (data.passive?.onSkillUsed || [])) {
    if (typeof hook.tag !== "string" || !hook.tag) fail("passive", "each onSkillUsed hook needs a tag");
    if (!Array.isArray(hook.effects) || !hook.effects.length) fail("passive", "each onSkillUsed hook needs at least one effect");
    for (const effect of hook.effects) {
      if (effect.type !== "nextSkillDiscount") fail("passive", `unsupported passive effect "${effect.type}"`);
      if (!isNum(effect.amount) || effect.amount < 0) fail("passive", "nextSkillDiscount needs amount >= 0");
    }
  }
  for (const [name, summon] of Object.entries(summons)) {
    if (!summon.id || !summon.name || !summon.stats || !Number.isInteger(summon.turns) || summon.turns < 1) fail(`summon ${name}`, "needs id, name, stats and turns >= 1");
    if (summon.targetableByEnemy !== undefined && typeof summon.targetableByEnemy !== "boolean") fail(`summon ${name}`, "targetableByEnemy must be a boolean");
    if (summon.ownerEvents?.destroyed !== undefined) {
      if (!Array.isArray(summon.ownerEvents.destroyed)) fail(`summon ${name}`, "ownerEvents.destroyed must be an array");
      for (const subscription of summon.ownerEvents.destroyed) {
        if (!subscription || !SUPPORTED_PASSIVE_EVENTS.includes(subscription.event)) fail(`summon ${name}`, "ownerEvents.destroyed entries need a supported passive event");
      }
    }
    if (summon.ownerTurnLifecycle) {
      const lifecycle = summon.ownerTurnLifecycle;
      if (lifecycle.skipFirstTurnEnd !== undefined && typeof lifecycle.skipFirstTurnEnd !== "boolean") fail(`summon ${name}`, "ownerTurnLifecycle.skipFirstTurnEnd must be a boolean");
      if (lifecycle.activation !== undefined && !Array.isArray(lifecycle.activation)) fail(`summon ${name}`, "ownerTurnLifecycle.activation must be an array");
      for (const subscription of lifecycle.activation || []) {
        if (!subscription || typeof subscription.handler !== "string" || !subscription.handler) fail(`summon ${name}`, "ownerTurnLifecycle activation entries need a handler name");
        if (!summonRegistry?.has?.(subscription.handler)) fail(`summon ${name}`, `ownerTurnLifecycle references unknown summon handler "${subscription.handler}"`);
        if (subscription.thresholdPercent !== undefined && !(isNum(subscription.thresholdPercent) && subscription.thresholdPercent >= 0 && subscription.thresholdPercent <= 100)) fail(`summon ${name}`, "ownerTurnLifecycle thresholdPercent must be between 0 and 100");
        if (subscription.healPercent !== undefined && !(isNum(subscription.healPercent) && subscription.healPercent > 0 && subscription.healPercent <= 100)) fail(`summon ${name}`, "ownerTurnLifecycle healPercent must be greater than 0 and at most 100");
        if (subscription.power !== undefined && !(isNum(subscription.power) && subscription.power > 0)) fail(`summon ${name}`, "ownerTurnLifecycle power must be greater than 0");
        if (subscription.conditionalPower !== undefined && (!Array.isArray(subscription.conditionalPower) || subscription.conditionalPower.some((modifier) => !modifier || typeof modifier.battleTimer !== "string" || !modifier.battleTimer || !isNum(modifier.power) || modifier.power <= 0))) fail(`summon ${name}`, "ownerTurnLifecycle conditionalPower entries need a timer and power > 0");
      }
    }
    if (summon.lifecycle) {
      for (const phase of ["activation", "onExpire"]) {
        if (summon.lifecycle[phase] !== undefined && !Array.isArray(summon.lifecycle[phase])) fail(`summon ${name}`, `${phase} must be an array`);
        for (const subscription of summon.lifecycle[phase] || []) {
          if (typeof subscription.handler !== "string" || !subscription.handler) fail(`summon ${name}`, `${phase} entries need a handler name`);
          if (!summonRegistry?.has?.(subscription.handler)) fail(`summon ${name}`, `${phase} references unknown summon handler "${subscription.handler}"`);
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
