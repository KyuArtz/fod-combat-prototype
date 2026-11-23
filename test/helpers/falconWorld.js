const { createBattleState } = require("../../core/battleState");
const { createFalconParty } = require("../../characters/falcon");
const { createTrainingEnemies } = require("../../characters/enemies");
const { createSkills } = require("../../characters/skills");
const { createActionResolver } = require("../../core/actionResolver");
const { createEventBus } = require("../../core/eventBus");
const { addStatus, effectiveStat } = require("../../systems/statusEffects");
const { addShield, tickShields } = require("../../systems/shields");
const { applyDamage, heal } = require("../../systems/damageApplication");
const { pay, ready, tickCooldowns } = require("../../systems/cooldowns");
const { makeActor } = require("../../characters/actorFactory");
const formation = require("../../systems/formation");

function createFalconWorld({ seed = 77, randomValue = 0.99 } = {}) {
  const state = createBattleState({ seed });
  const allies = createFalconParty();
  const enemies = createTrainingEnemies();
  state.party.roster = allies;
  state.party.active = allies;
  state.enemyParty.roster = enemies;
  state.enemyParty.active = enemies;
  state.actors = [...allies, ...enemies];
  const logs = [];
  const events = createEventBus({ record: true });
  const say = (line) => logs.push(line);
  const random = typeof randomValue === "function" ? randomValue : () => randomValue;
  const effective = (actor, stat) => effectiveStat(state, actor, stat);
  let skillSet;
  const damage = (target, amount, type, sourceActor = null, metadata = {}) => {
    const hpLoss = applyDamage(target, amount, say, () => {}, type);
    skillSet?.onDamageTaken(target, amount, type, hpLoss, {
      kind: metadata.kind || "direct",
      sourceId: sourceActor?.id || null,
    });
    return hpLoss;
  };
  const resolver = createActionResolver({
    state,
    effectiveStat: effective,
    applyDamage: damage,
    say,
    random,
  });
  const context = {
    state,
    say,
    random,
    events,
    alive: formation.alive,
    addStatus,
    addShield,
    applyDamage: damage,
    calculateMastery: resolver.calculateMastery,
    heal,
    hitMastery: resolver.hitMastery,
    hitPhysical: resolver.hitPhysical,
    makeActor,
    pay,
    ready,
    tickCooldowns,
    tickShields,
    tickStatuses(actor) {
      require("../../systems/statusEffects").tickStatuses(actor);
    },
  };
  skillSet = createSkills(context);
  const byId = Object.fromEntries(allies.map((actor) => [actor.id, actor]));
  return { state, allies, enemies, logs, events, resolver, skillSet, byId, effective, damage };
}

function skill(world, characterId, key) {
  const result = world.skillSet.skills[characterId]?.find((entry) => entry.key === key);
  if (!result) throw new Error(`Unknown skill ${characterId}.${key}`);
  return result;
}

module.exports = { createFalconWorld, skill };
