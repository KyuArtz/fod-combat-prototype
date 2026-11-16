// Shared interpreter for owner-authored Falcon skill data in data/skills/*.js.
// Controllers choose actions; this module owns their rules and effects.

const TARGETING = ["enemy", "ally", "none", "mode"];
const pct = (value, percent) => Math.floor((value * percent) / 100);

function formatMessage(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in values) || values[key] === undefined) {
      throw new Error(
        `Message placeholder {${key}} has no value in "${template}".`,
      );
    }
    return String(values[key]);
  });
}

function createSkillInterpreter(context) {
  const {
    addShield,
    addStatus,
    alive,
    applyDamage,
    calculateMastery,
    heal,
    hitMastery,
    hitPhysical,
    makeActor,
    pay,
    ready,
    say,
    state,
    random = Math.random,
  } = context;

  const EFFECTS = {
    heal(effect, run) {
      run.results.healed = heal(
        run.target,
        pct(run.target.stats.HP, effect.percentMaxHP),
      );
    },
    healAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        heal(ally, pct(ally.stats.HP, effect.percentMaxHP));
      }
    },
    hotAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        addStatus(ally, effect.id, {
          hotPercentMaxHP: effect.percentMaxHP,
          turns: effect.turns,
        });
      }
    },
    damage(effect, run) {
      const outcome = calculateMastery(
        run.actor,
        run.target,
        effect.element,
        effect.power,
        effect.canCrit ?? true,
      );
      applyDamage(run.target, outcome.damage, effect.element);
      run.results.damage = outcome.damage;
    },
    status(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      if (!unit) return;
      const { type, to, ...data } = effect;
      addStatus(unit, effect.id, data);
    },
    shield(effect, run) {
      run.results.shield = pct(run.target.stats.HP, effect.percentMaxHP);
      addShield(run.target, run.results.shield, effect.turns, effect.adaptive);
    },
    shieldSelf(effect, run) {
      run.results.shield = pct(run.actor.stats.HP, effect.percentMaxHP);
      addShield(run.actor, run.results.shield, effect.turns, effect.adaptive);
    },
    shieldAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        addShield(
          ally,
          pct(ally.stats.HP, effect.percentMaxHP),
          effect.turns,
          effect.adaptive,
        );
      }
    },
    statusSelf(effect, run) {
      const { type, ...data } = effect;
      addStatus(run.actor, effect.id, data);
    },
    statusAllies(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        const { type, ...data } = effect;
        addStatus(ally, effect.id, data);
      }
    },
    statusEnemies(effect) {
      for (const enemy of alive(state, "enemy")) {
        const { type, ...data } = effect;
        addStatus(enemy, effect.id, data);
      }
    },
    masteryHit(effect, run) {
      const outcome = hitMastery(
        run.actor,
        run.target,
        effect.element,
        effect.power,
        effect.canCrit ?? true,
      );
      run.results.damage = outcome.damage;
    },
    masteryDamageAllEnemies(effect, run) {
      for (const enemy of alive(state, "enemy")) {
        const outcome = hitMastery(
          run.actor,
          enemy,
          effect.element,
          effect.power,
          effect.canCrit ?? true,
        );
        if (
          effect.status &&
          enemy.alive &&
          random() * 100 < effect.statusChance
        ) {
          addStatus(enemy, effect.status.id, {
            turns: effect.status.turns,
            debuff: true,
          });
        }
        if (enemy === run.target) run.results.damage = outcome.damage;
      }
    },
    cleanseAllies() {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        for (const [key, status] of Object.entries(ally.statuses)) {
          if (status.debuff || status.amount < 0) delete ally.statuses[key];
        }
      }
    },
    tacticalMark(effect, run) {
      addStatus(run.target, "tacticalMark", {
        amount: effect.damageTakenPercent,
        damageTakenPercent: effect.damageTakenPercent,
        evasionPenalty: effect.evasionPenalty,
        turns: effect.turns,
        debuff: true,
      });
    },
    commandUplink(effect) {
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        addStatus(ally, "commandUplink", {
          stat: "ATK",
          amount: effect.amount,
          conditionalAmount: effect.conditionalAmount,
          hpThresholdPercent: effect.hpThresholdPercent,
          turns: effect.turns,
        });
      }
    },
    conditionalStatus(effect, run) {
      const unit = effect.to === "self" ? run.actor : run.target;
      const amount = unit.statuses[effect.conditionStatus]
        ? effect.conditionalAmount
        : effect.amount;
      addStatus(unit, effect.id, {
        stat: effect.stat,
        amount,
        turns: effect.turns,
        debuff: effect.debuff,
      });
    },
    cipherTag(effect, run) {
      for (const enemy of alive(state, "enemy")) {
        delete enemy.statuses.cipherTag;
        delete enemy.statuses.cipherResDown;
      }
      addStatus(run.target, "cipherTag", {
        damageTakenPercent: effect.damageTakenPercent,
        turns: effect.turns,
        debuff: true,
      });
      addStatus(run.target, "cipherResDown", {
        stat: "RES",
        amount: effect.resDown,
        turns: effect.turns,
        debuff: true,
      });
    },
    railshot(effect, run) {
      const power =
        effect.normalPower *
        (run.actor.railshotUntargeted ? 1 + effect.unobservedBonus / 100 : 1);
      const outcome = hitMastery(
        run.actor,
        run.target,
        effect.element,
        power,
        true,
      );
      run.results.damage = outcome.damage;
      run.results.bonusText = run.actor.railshotUntargeted
        ? " (unobserved bonus)"
        : "";
    },
    zeroHour(effect, run) {
      const power =
        run.target.hp / run.target.stats.HP < effect.hpThresholdPercent / 100
          ? effect.executePower
          : effect.normalPower;
      const outcome = hitMastery(
        run.actor,
        run.target,
        effect.element,
        power,
        true,
      );
      run.results.damage = outcome.damage;
      run.results.bonusText =
        power === effect.executePower ? " (execution bonus)" : "";
      if (run.target.alive && run.target.statuses[effect.cipherStatus]) {
        addStatus(run.target, "zeroHourSpdDown", {
          stat: "SPD",
          amount: effect.cipherSpdDown,
          turns: effect.cipherTurns,
          debuff: true,
        });
      }
    },
    summon(effect, run) {
      const template = run.data.summons[effect.template];
      const summon = makeActor({
        id: template.id,
        name: template.name,
        side: "ally",
        mastery: template.mastery,
        summon: true,
        summonTurns: template.turns,
        stats: structuredClone(template.stats),
        behavior: structuredClone(template.behavior),
        ownerId: run.actor.id,
        scan: template.scan && structuredClone(template.scan),
        onDestroyed:
          template.onDestroyed && structuredClone(template.onDestroyed),
      });
      state.actors.push(summon);
      run.results.scan = template.scan ? template.scan.damageBonus : 0;
    },
    singularity(effect, run) {
      state.singularityTurns = effect.turns;
      for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
        for (const status of effect.allies) {
          if (status.hotPercent !== undefined)
            addStatus(ally, status.id, {
              hotPercentMaxHP: status.hotPercent,
              turns: status.turns,
            });
          else
            addStatus(ally, status.id, {
              stat: status.stat,
              amount: status.amount,
              turns: status.turns,
            });
        }
      }
      for (const foe of alive(state, "enemy")) {
        for (const status of effect.enemies)
          addStatus(foe, status.id, {
            stat: status.stat,
            amount: status.amount,
            turns: status.turns,
            debuff: true,
          });
      }
      for (const summon of alive(state, "ally").filter(
        (unit) => unit.summon && unit.behavior?.singularityPower,
      )) {
        if (effect.summonMessage)
          run.after.push(
            formatMessage(effect.summonMessage, {
              actor: summon.name,
              power: Math.round(summon.behavior.singularityPower * 100),
            }),
          );
      }
    },
    nextSkillDiscount(effect, run) {
      run.actor.mpDiscount = Math.max(
        run.actor.mpDiscount || 0,
        effect.amount || 0,
      );
    },
  };

  function runSkill(data, skill, actor, { mode, target } = {}) {
    const variant =
      skill.targeting === "mode"
        ? skill.modes.find((candidate) => candidate.id === mode)
        : skill;
    if (!variant) return false;
    if (!ready(actor, skill.key, skill.cost)) {
      say(
        skill.unavailableMessage ||
          `${skill.name} is unavailable (MP/cooldown).`,
      );
      return false;
    }
    pay(actor, skill.cost);
    actor.cooldowns[skill.key] = skill.cooldown;
    const run = { data, actor, target, results: {}, after: [] };
    const messageValues = { actor: actor.name, target: target && target.name };
    if (variant.announce) say(formatMessage(variant.announce, messageValues));
    for (const effect of variant.effects) EFFECTS[effect.type](effect, run);
    if (variant.message)
      say(formatMessage(variant.message, { ...messageValues, ...run.results }));
    for (const line of run.after) say(line);

    for (const hook of (data.passive && data.passive.onSkillUsed) || []) {
      if (!skill.tags.includes(hook.tag)) continue;
      for (const effect of hook.effects) EFFECTS[effect.type](effect, run);
    }
    if (data.passive?.id === "overwatchProtocol") {
      const recipients = [];
      if (target?.side === "ally") recipients.push(target);
      else if (target?.targetedByAllyId) {
        const recipient = state.actors.find(
          (unit) => unit.id === target.targetedByAllyId && unit.alive,
        );
        if (recipient) recipients.push(recipient);
      } else if (!target && ["uplink", "ultimate"].includes(skill.key)) {
        recipients.push(...alive(state, "ally").filter((unit) => !unit.summon));
      }
      for (const recipient of recipients)
        recipient.nextAttackAccuracy = data.passive.nextAttackAccuracy || 10;
    }
    return true;
  }

  function buildSkills(data) {
    validateSkillData(data);
    return data.skills.map((skill) => ({
      name: skill.name,
      key: skill.key,
      cost: skill.cost,
      cooldown: skill.cooldown,
      tags: [...(skill.tags || [])],
      targeting: skill.targeting,
      ...(skill.category ? { category: skill.category } : {}),
      ...(skill.description ? { description: skill.description } : {}),
      ...(skill.targeting === "mode"
        ? {
            modes: skill.modes.map(({ id, label, targeting }) => ({
              id,
              label,
              targeting,
            })),
          }
        : {}),
      run: (actor, args) => runSkill(data, skill, actor, args),
    }));
  }

  function onBattleStart(actors) {
    for (const actor of actors) {
      if (actor.passive?.id === "catalystProtocol") {
        actor.catalystWingTurns = actor.passive.wingTurns;
        actor.catalystWingTurnCount = 0;
      }
      if (actor.passive?.id === "biotechOverdrive") {
        actor.biotechOverdriveTurns = actor.passive.battleStartBuffTurns || 3;
      }
    }
  }

  function onTurnStart(actor) {
    if (actor.passive?.id === "unobserved") {
      actor.railshotUntargeted = !actor.targetedByEnemySinceLastTurn;
      actor.targetedByEnemySinceLastTurn = false;
      actor.unobservedSuppressed = false;
    }
    for (const status of Object.values(actor.statuses)) {
      if (status.hotPercentMaxHP)
        heal(actor, pct(actor.stats.HP, status.hotPercentMaxHP));
    }
    const uplink = actor.statuses.commandUplink;
    if (uplink) {
      // Recalculate from the base amount every turn; never compound the conditional bonus.
      if (uplink.baseAmount === undefined) uplink.baseAmount = uplink.amount;
      uplink.amount =
        uplink.baseAmount +
        (actor.hp / actor.stats.HP > uplink.hpThresholdPercent / 100
          ? uplink.conditionalAmount || 0
          : 0);
    }
  }

  function onTurnEnd(actor) {
    if (
      actor.passive?.id === "biotechOverdrive" &&
      actor.biotechOverdriveTurns > 0
    ) {
      actor.biotechOverdriveTurns--;
    }
    if (
      actor.passive?.id !== "catalystProtocol" ||
      !(actor.catalystWingTurns > 0)
    )
      return;
    actor.catalystWingTurnCount++;
    actor.catalystWingTurns--;
    if (actor.catalystWingTurnCount % actor.passive.pulseEvery !== 0) return;
    for (const ally of alive(state, "ally").filter((unit) => !unit.summon)) {
      heal(ally, pct(ally.stats.HP, actor.passive.healPercent));
      const amount = pct(ally.stats.HP, actor.passive.shieldPercent);
      const existing = ally.shields.find(
        (shield) => shield.sourceId === "catalystWing",
      );
      if (existing) {
        existing.value = amount;
        existing.turns = actor.passive.shieldTurns;
      } else {
        addShield(ally, amount, actor.passive.shieldTurns);
        ally.shields[ally.shields.length - 1].sourceId = "catalystWing";
      }
    }
  }

  function onDamageTaken(target, amount) {
    if (
      target.alive &&
      target.passive?.id === "recoilDampeners" &&
      amount > pct(target.stats.HP, target.passive.damageThresholdPercent)
    ) {
      const passive = target.passive;
      const previous = target.statuses.jazenRecoil?.stacks || 0;
      const stacks = Math.min(passive.maxStacks, previous + 1);
      addStatus(target, "jazenRecoil", {
        stat: "ATK",
        amount: passive.attackBonusPercent * stacks,
        stacks,
        turns: passive.duration,
      });
    }
    if (target.passive?.id === "unobserved") target.unobservedSuppressed = true;
  }

  function onEnemySkillTargeted(attacker, target) {
    if (!target || target.side !== "ally") return;
    target.targetedByEnemySinceLastTurn = true;
    target.enemySkillTargetedThisRound = true;
  }

  function onRoundStart() {
    for (const actor of state.actors) {
      actor.enemySkillTargetedThisRound = false;
      actor.targetedByAllyId = null;
    }
  }

  function onUnitDefeated(unit, statuses = {}) {
    if (!statuses.tacticalMark || statuses.tacticalMark.rewardClaimed) return;
    for (const ally of alive(state, "ally").filter(
      (member) => !member.summon,
    )) {
      ally.mp = Math.min(ally.stats.MP, ally.mp + pct(ally.stats.MP, 5));
    }
  }

  // Meo-v9's Emergency Field replaces the old prototype revive behavior. It heals
  // the most injured living ally below 25% Max HP instead of firing that activation.
  function summonTurn(summon) {
    if (!summon.alive || summon.summonTurns <= 0) return;
    const behavior = summon.behavior || {};
    let healed = false;
    const rule = behavior.emergencyField;
    if (rule) {
      const candidates = alive(state, "ally").filter(
        (unit) =>
          !unit.summon && unit.hp / unit.stats.HP < rule.thresholdPercent / 100,
      );
      candidates.sort((a, b) => a.hp / a.stats.HP - b.hp / b.stats.HP);
      if (candidates.length) {
        const target = candidates[0];
        const amount = heal(target, pct(target.stats.HP, rule.healPercent));
        say(
          formatMessage(rule.message, {
            actor: summon.name,
            target: target.name,
            healed: amount,
          }),
        );
        healed = true;
      }
    }
    if (!healed) {
      const target = alive(state, "enemy")[0];
      if (target && behavior.type === "coverFire") {
        const power =
          state.singularityTurns > 0 && behavior.singularityPower
            ? behavior.singularityPower
            : behavior.power;
        const outcome = hitPhysical(summon, target, power, behavior.canCrit);
        say(
          formatMessage(behavior.message, {
            actor: summon.name,
            target: target.name,
            damage: outcome.damage,
          }),
        );
      }
    }
    summon.summonTurns--;
    if (summon.summonTurns <= 0) {
      summon.alive = false;
      say(
        formatMessage(
          behavior.expireMessage || "{actor}'s deployment expires.",
          { actor: summon.name },
        ),
      );
    }
  }

  function summonDestroyed(summon) {
    const burst = summon.onDestroyed;
    if (!burst) return;
    say(formatMessage(burst.message, { actor: summon.name }));
    const opposing = summon.side === "ally" ? "enemy" : "ally";
    for (const foe of alive(state, opposing)) {
      hitMastery(summon, foe, burst.element, burst.power, false);
      if (foe.alive)
        addStatus(foe, burst.status.id, {
          stat: burst.status.stat,
          amount: burst.status.amount,
          turns: burst.status.turns,
        });
    }
  }

  return {
    buildSkills,
    summonTurn,
    summonDestroyed,
    runSkill,
    onBattleStart,
    onTurnStart,
    onTurnEnd,
    onDamageTaken,
    onEnemySkillTargeted,
    onRoundStart,
    onUnitDefeated,
  };
}

const KNOWN_EFFECTS = new Set([
  "heal",
  "healAllies",
  "hotAllies",
  "damage",
  "status",
  "shield",
  "shieldSelf",
  "shieldAllies",
  "statusSelf",
  "statusAllies",
  "statusEnemies",
  "masteryHit",
  "masteryDamageAllEnemies",
  "cleanseAllies",
  "tacticalMark",
  "commandUplink",
  "conditionalStatus",
  "cipherTag",
  "railshot",
  "zeroHour",
  "summon",
  "singularity",
  "nextSkillDiscount",
]);
const isNum = (value) => typeof value === "number" && Number.isFinite(value);
function validateSkillData(data) {
  const fail = (where, problem) => {
    throw new Error(
      `Invalid skill data (${data && data.characterId}${where ? ` / ${where}` : ""}): ${problem}`,
    );
  };
  if (!data || typeof data.characterId !== "string")
    fail("", "missing characterId");
  if (!Array.isArray(data.skills) || !data.skills.length)
    fail("", "skills must be a non-empty array");
  const summons = data.summons || {};
  const keys = new Set();
  const resultKeys = {
    heal: ["healed"],
    damage: ["damage"],
    masteryHit: ["damage"],
    shield: ["shield"],
    shieldSelf: ["shield"],
    summon: ["scan"],
    railshot: ["damage", "bonusText"],
    zeroHour: ["damage", "bonusText"],
  };
  const checkText = (where, value, allowed, label) => {
    if (value === undefined) return;
    if (typeof value !== "string" || !value)
      fail(where, `${label} must be a non-empty string`);
    for (const [, token] of value.matchAll(/\{(\w+)\}/g)) {
      if (!allowed.includes(token))
        fail(where, `uses {${token}} but nothing produces it`);
    }
  };
  const checkStatus = (where, effect, needsStat = false) => {
    if (
      !effect ||
      typeof effect.id !== "string" ||
      !effect.id ||
      !Number.isInteger(effect.turns) ||
      effect.turns < 1 ||
      (effect.amount !== undefined && !isNum(effect.amount)) ||
      (needsStat && typeof effect.stat !== "string")
    ) {
      fail(
        where,
        "status effect needs id, positive integer turns, optional numeric amount and optional stat",
      );
    }
  };
  const checkEffects = (where, effects, targeting, message) => {
    if (!Array.isArray(effects) || !effects.length)
      fail(where, "effects must be a non-empty array");
    const produced = new Set(["actor"]);
    if (["enemy", "ally"].includes(targeting)) produced.add("target");
    for (const effect of effects) {
      if (!KNOWN_EFFECTS.has(effect?.type))
        fail(where, `unknown effect type "${effect?.type}"`);
      const type = effect.type;
      if (
        [
          "heal",
          "shield",
          "masteryHit",
          "damage",
          "tacticalMark",
          "conditionalStatus",
          "cipherTag",
          "railshot",
          "zeroHour",
        ].includes(type) &&
        !["enemy", "ally"].includes(targeting)
      ) {
        fail(
          where,
          `${type} effect acts on a target but targeting is "${targeting}"`,
        );
      }
      if (
        ["heal", "healAllies", "hotAllies"].includes(type) &&
        !(isNum(effect.percentMaxHP) && effect.percentMaxHP > 0)
      )
        fail(where, `${type} needs percentMaxHP > 0`);
      if (
        ["damage", "masteryHit", "masteryDamageAllEnemies"].includes(type) &&
        !(
          typeof effect.element === "string" &&
          isNum(effect.power) &&
          effect.power > 0
        )
      )
        fail(where, `${type} needs element and power > 0`);
      if (["shield", "shieldSelf", "shieldAllies"].includes(type)) {
        if (
          !(
            isNum(effect.percentMaxHP) &&
            effect.percentMaxHP > 0 &&
            Number.isInteger(effect.turns) &&
            effect.turns > 0
          )
        )
          fail(where, "shield needs percentMaxHP > 0 and turns > 0");
        if (
          effect.adaptive &&
          !(
            isNum(effect.adaptive.resistance) &&
            effect.adaptive.resistance > 0 &&
            effect.adaptive.resistance <= 100
          )
        )
          fail(where, "adaptive needs resistance between 0 and 100");
      }
      if (
        ["status", "statusSelf", "statusAllies", "statusEnemies"].includes(type)
      )
        checkStatus(where, effect);
      if (type === "conditionalStatus") checkStatus(where, effect, true);
      if (type === "tacticalMark" || type === "cipherTag") {
        if (!Number.isInteger(effect.turns) || effect.turns < 1)
          fail(where, `${type} needs turns > 0`);
      }
      if (
        type === "commandUplink" &&
        (!Number.isInteger(effect.turns) ||
          effect.turns < 1 ||
          !isNum(effect.amount))
      )
        fail(where, "commandUplink needs amount and turns > 0");
      if (
        type === "railshot" &&
        !(
          isNum(effect.normalPower) &&
          effect.normalPower > 0 &&
          isNum(effect.unobservedBonus)
        )
      )
        fail(where, "railshot needs normalPower and unobservedBonus");
      if (
        type === "zeroHour" &&
        !(
          isNum(effect.normalPower) &&
          effect.normalPower > 0 &&
          isNum(effect.executePower) &&
          effect.executePower > 0 &&
          isNum(effect.hpThresholdPercent)
        )
      )
        fail(
          where,
          "zeroHour needs normalPower, executePower and hpThresholdPercent",
        );
      if (type === "summon" && !summons[effect.template])
        fail(where, `unknown summon template "${effect.template}"`);
      if (type === "singularity") {
        if (
          !Number.isInteger(effect.turns) ||
          effect.turns < 1 ||
          !Array.isArray(effect.allies) ||
          !Array.isArray(effect.enemies)
        )
          fail(
            where,
            "singularity effect needs turns > 0 and allies/enemies status lists",
          );
        for (const status of [...effect.allies, ...effect.enemies]) {
          if (
            !status.id ||
            !Number.isInteger(status.turns) ||
            status.turns < 1 ||
            (status.hotPercent === undefined &&
              (typeof status.stat !== "string" || !isNum(status.amount)))
          )
            fail(where, "singularity effect contains an invalid status");
        }
      }
      if (
        type === "nextSkillDiscount" &&
        (!isNum(effect.amount) || effect.amount < 0)
      )
        fail(where, "nextSkillDiscount needs amount >= 0");
      for (const token of resultKeys[type] || []) produced.add(token);
    }
    checkText(where, message, [...produced], "message");
  };
  for (const skill of data.skills) {
    const where = skill?.key;
    if (
      !skill ||
      typeof skill.key !== "string" ||
      typeof skill.name !== "string"
    )
      fail(where, "needs key and name");
    if (keys.has(skill.key)) fail(where, "duplicate skill key");
    keys.add(skill.key);
    if (!Number.isInteger(skill.cost) || skill.cost < 0)
      fail(where, "cost must be a non-negative integer");
    if (!Number.isInteger(skill.cooldown) || skill.cooldown < 0)
      fail(where, "cooldown must be a non-negative integer");
    if (
      !Array.isArray(skill.tags) ||
      !skill.tags.every((tag) => typeof tag === "string")
    )
      fail(where, "tags must be an array of strings");
    if (!TARGETING.includes(skill.targeting))
      fail(where, `targeting must be one of ${TARGETING.join(", ")}`);
    const variants = skill.targeting === "mode" ? skill.modes : [skill];
    if (skill.targeting === "mode") {
      if (!Array.isArray(skill.modes) || skill.modes.length < 2)
        fail(where, "a mode skill needs at least 2 modes");
      const ids = new Set();
      for (const mode of variants) {
        if (typeof mode.id !== "string" || typeof mode.label !== "string")
          fail(where, "each mode needs id and label");
        if (ids.has(mode.id)) fail(where, `duplicate mode "${mode.id}"`);
        ids.add(mode.id);
        if (!["enemy", "ally", "none"].includes(mode.targeting))
          fail(
            `${where}/${mode.id}`,
            "mode targeting must be enemy, ally or none",
          );
        checkEffects(
          `${where}/${mode.id}`,
          mode.effects,
          mode.targeting,
          mode.message,
        );
        checkText(
          `${where}/${mode.id}`,
          mode.announce,
          mode.targeting === "enemy" || mode.targeting === "ally"
            ? ["actor", "target"]
            : ["actor"],
          "announce",
        );
        if (!mode.message && !mode.announce)
          fail(`${where}/${mode.id}`, "message or announce is required");
      }
    } else {
      checkEffects(where, skill.effects, skill.targeting, skill.message);
    }
    if (skill.targeting !== "mode" && !skill.message && !skill.announce)
      fail(where, "message or announce is required");
    checkText(
      where,
      skill.announce,
      [
        "actor",
        ...(skill.targeting === "enemy" || skill.targeting === "ally"
          ? ["target"]
          : []),
      ],
      "announce",
    );
  }
  for (const mod of data.passive?.statMods || []) {
    const hasPercent = isNum(mod.percent),
      hasPoints = isNum(mod.points);
    if (typeof mod.stat !== "string" || hasPercent === hasPoints)
      fail(
        "passive",
        "each stat modifier needs exactly one numeric percent or points",
      );
  }
  if (data.passive?.battleStartBuffs) {
    if (
      !Number.isInteger(data.passive.battleStartBuffTurns) ||
      data.passive.battleStartBuffTurns < 1
    )
      fail("passive", "battleStartBuffTurns must be a positive integer");
    for (const buff of data.passive.battleStartBuffs) {
      if (typeof buff.stat !== "string" || !isNum(buff.amount))
        fail("passive", "battle-start buffs need a stat and numeric amount");
    }
  }
  for (const hook of data.passive?.onSkillUsed || []) {
    if (typeof hook.tag !== "string")
      fail("passive", "each onSkillUsed hook needs a tag");
    for (const effect of hook.effects || [])
      if (effect.type !== "nextSkillDiscount")
        fail("passive", `unsupported passive effect "${effect.type}"`);
  }
  for (const [name, summon] of Object.entries(summons)) {
    if (
      !summon.id ||
      !summon.name ||
      !summon.stats ||
      !Number.isInteger(summon.turns) ||
      summon.turns < 1
    )
      fail(`summon ${name}`, "needs id, name, stats and turns >= 1");
    if (summon.behavior && summon.behavior.type !== "coverFire")
      fail(`summon ${name}`, `unknown behavior "${summon.behavior.type}"`);
  }
  return true;
}
module.exports = { createSkillInterpreter, validateSkillData, formatMessage };
