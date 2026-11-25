const { createBattleState } = require("../../core/battleState");
const { createSerpentParty } = require("../../characters/serpent");
const { createTrainingEnemies } = require("../../characters/enemies");
const { createSkills } = require("../../characters/skills");
const { createActionResolver } = require("../../core/actionResolver");
const { createEventBus } = require("../../core/eventBus");
const { addStatus, effectiveStat, tickStatuses } = require("../../systems/statusEffects");
const { addShield, tickShields } = require("../../systems/shields");
const { applyDamage, heal } = require("../../systems/damageApplication");
const { pay, ready, tickCooldowns } = require("../../systems/cooldowns");
const formation = require("../../systems/formation");
const { makeActor } = require("../../characters/actorFactory");

function createSerpentWorld({ seed = 91, randomValue = 0.99 } = {}) {
  const state = createBattleState({ seed });
  const allies = createSerpentParty();
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
    const kind = metadata.kind || "direct";
    skillSet?.onDamageTaken(target, amount, type, hpLoss, {
      kind, sourceId: sourceActor?.id || null,
      actionType: metadata.actionType || null, skillKey: metadata.skillKey || null,
    });
    if (sourceActor && kind === "direct") {
      skillSet?.onDamageDealt(sourceActor, target, amount, type, {
        kind, actionType: metadata.actionType || null, skillKey: metadata.skillKey || null,
      });
    }
    return hpLoss;
  };
  const resolver = createActionResolver({
    state,
    effectiveStat: effective,
    applyDamage: damage,
    say,
    random,
    symmetricEvasion: true,
    onEvade: (target, attacker) => skillSet?.onEvade(target, attacker),
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
    basicAttack: resolver.basicAttack,
    calculateMastery: resolver.calculateMastery,
    calculatePhysical: resolver.calculatePhysical,
    effectiveStat: effective,
    heal,
    hitMastery: resolver.hitMastery,
    hitPhysical: resolver.hitPhysical,
    makeActor,
    pay,
    ready,
    tickCooldowns,
    tickShields,
    tickStatuses,
  };
  skillSet = createSkills(context);
  const byId = Object.fromEntries(allies.map((actor) => [actor.id, actor]));
  return { state, allies, enemies, logs, events, resolver, skillSet, byId, effective, damage };
}

function serpentSkill(world, characterId, key) {
  const result = world.skillSet.skills[characterId]?.find((entry) => entry.key === key);
  if (!result) throw new Error(`Unknown Serpent skill ${characterId}.${key}`);
  return result;
}

module.exports = { createSerpentWorld, serpentSkill };
