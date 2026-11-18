// Validation for declarative Falcon and enemy skill definitions.
const TARGETING = ["enemy", "ally", "none", "mode"];

const KNOWN_EFFECTS = new Set([
  "heal", "healAllies", "hotAllies", "damage", "status", "shield", "shieldSelf", "shieldAllies",
  "statusSelf", "statusAllies", "statusEnemies", "masteryHit", "masteryDamageAllEnemies", "cleanseAllies",
  "tacticalMark", "commandUplink", "conditionalStatus", "cipherTag", "railshot", "zeroHour", "summon",
  "singularity", "nextSkillDiscount", "physicalHit",
]);
const isNum = (value) => typeof value === "number" && Number.isFinite(value);
function validateSkillData(data) {
  const fail = (where, problem) => { throw new Error(`Invalid skill data (${data && data.characterId}${where ? ` / ${where}` : ""}): ${problem}`); };
  if (!data || typeof data.characterId !== "string") fail("", "missing characterId");
  if (!Array.isArray(data.skills) || !data.skills.length) fail("", "skills must be a non-empty array");
  const summons = data.summons || {};
  const keys = new Set();
  const resultKeys = {
    heal: ["healed"], damage: ["damage"], physicalHit: ["damage"], masteryHit: ["damage"], shield: ["shield"],
    shieldSelf: ["shield"], summon: ["scan"], railshot: ["damage", "bonusText"], zeroHour: ["damage", "bonusText"],
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
      if (!KNOWN_EFFECTS.has(effect?.type)) fail(where, `unknown effect type "${effect?.type}"`);
      const type = effect.type;
      if (["heal", "shield", "masteryHit", "damage", "tacticalMark", "conditionalStatus", "cipherTag", "railshot", "zeroHour", "physicalHit"].includes(type) && !["enemy", "ally"].includes(targeting)) {
        fail(where, `${type} effect acts on a target but targeting is "${targeting}"`);
      }
      if (["heal", "healAllies", "hotAllies"].includes(type) && !(isNum(effect.percentMaxHP) && effect.percentMaxHP > 0)) fail(where, `${type} needs percentMaxHP > 0`);
      if (["damage", "masteryHit", "masteryDamageAllEnemies"].includes(type) && !(typeof effect.element === "string" && isNum(effect.power) && effect.power > 0)) fail(where, `${type} needs element and power > 0`);
      if (type === "physicalHit" && !(isNum(effect.power) && effect.power > 0)) fail(where, "physicalHit needs power > 0");
      if (["shield", "shieldSelf", "shieldAllies"].includes(type)) {
        if (!(isNum(effect.percentMaxHP) && effect.percentMaxHP > 0 && Number.isInteger(effect.turns) && effect.turns > 0)) fail(where, "shield needs percentMaxHP > 0 and turns > 0");
        if (effect.adaptive && !(isNum(effect.adaptive.resistance) && effect.adaptive.resistance > 0 && effect.adaptive.resistance <= 100)) fail(where, "adaptive needs resistance between 0 and 100");
      }
      if (["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type)) checkStatus(where, effect);
      if (type === "conditionalStatus") checkStatus(where, effect, true);
      if (type === "tacticalMark" || type === "cipherTag") {
        if (!Number.isInteger(effect.turns) || effect.turns < 1) fail(where, `${type} needs turns > 0`);
      }
      if (type === "commandUplink" && (!Number.isInteger(effect.turns) || effect.turns < 1 || !isNum(effect.amount))) fail(where, "commandUplink needs amount and turns > 0");
      if (type === "railshot" && !(isNum(effect.normalPower) && effect.normalPower > 0 && isNum(effect.unobservedBonus))) fail(where, "railshot needs normalPower and unobservedBonus");
      if (type === "zeroHour" && !(isNum(effect.normalPower) && effect.normalPower > 0 && isNum(effect.executePower) && effect.executePower > 0 && isNum(effect.hpThresholdPercent))) fail(where, "zeroHour needs normalPower, executePower and hpThresholdPercent");
      if (type === "summon" && !summons[effect.template]) fail(where, `unknown summon template "${effect.template}"`);
      if (type === "singularity") {
        if (!Number.isInteger(effect.turns) || effect.turns < 1 || !Array.isArray(effect.allies) || !Array.isArray(effect.enemies)) fail(where, "singularity effect needs turns > 0 and allies/enemies status lists");
        if (effect.dot && (!effect.dot.id || typeof effect.dot.element !== "string" || !(isNum(effect.dot.power) && effect.dot.power > 0) || !Number.isInteger(effect.dot.turns) || effect.dot.turns < 1)) fail(where, "singularity dot needs id, element, positive power and turns");
        for (const status of [...effect.allies, ...effect.enemies]) {
          if (!status.id || !Number.isInteger(status.turns) || status.turns < 1 || (status.hotPercent === undefined && (typeof status.stat !== "string" || !isNum(status.amount)))) fail(where, "singularity effect contains an invalid status");
        }
      }
      if (type === "nextSkillDiscount" && (!isNum(effect.amount) || effect.amount < 0)) fail(where, "nextSkillDiscount needs amount >= 0");
      for (const token of resultKeys[type] || []) produced.add(token);
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
  for (const mod of (data.passive?.statMods || [])) {
    const hasPercent = isNum(mod.percent), hasPoints = isNum(mod.points);
    if (typeof mod.stat !== "string" || hasPercent === hasPoints) fail("passive", "each stat modifier needs exactly one numeric percent or points");
  }
  if (data.passive?.battleStartBuffs) {
    if (!Number.isInteger(data.passive.battleStartBuffTurns) || data.passive.battleStartBuffTurns < 1) fail("passive", "battleStartBuffTurns must be a positive integer");
    for (const buff of data.passive.battleStartBuffs) {
      if (typeof buff.stat !== "string" || !isNum(buff.amount)) fail("passive", "battle-start buffs need a stat and numeric amount");
    }
  }
  for (const hook of (data.passive?.onSkillUsed || [])) {
    if (typeof hook.tag !== "string") fail("passive", "each onSkillUsed hook needs a tag");
    for (const effect of hook.effects || []) if (effect.type !== "nextSkillDiscount") fail("passive", `unsupported passive effect "${effect.type}"`);
  }
  for (const [name, summon] of Object.entries(summons)) {
    if (!summon.id || !summon.name || !summon.stats || !Number.isInteger(summon.turns) || summon.turns < 1) fail(`summon ${name}`, "needs id, name, stats and turns >= 1");
    if (summon.behavior && summon.behavior.type !== "coverFire") fail(`summon ${name}`, `unknown behavior "${summon.behavior.type}"`);
    if (summon.finalProtocol && (typeof summon.finalProtocol.element !== "string" || !(isNum(summon.finalProtocol.power) && summon.finalProtocol.power > 0) || !(isNum(summon.finalProtocol.secondaryMultiplier) && summon.finalProtocol.secondaryMultiplier > 0 && summon.finalProtocol.secondaryMultiplier <= 1) || !Number.isInteger(summon.finalProtocol.turns) || summon.finalProtocol.turns < 1)) fail(`summon ${name}`, "finalProtocol needs element, positive power, secondaryMultiplier in (0,1] and turns");
  }
  return true;
}

module.exports = { validateSkillData };
