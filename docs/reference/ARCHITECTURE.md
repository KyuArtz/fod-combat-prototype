# Architecture Reference

This document describes current module ownership and runtime flow. Executable source and tests take precedence if this document becomes stale.

## High-level runtime flow

```text
index.js
  └─ selects scheduler and opening policy from environment
     └─ core/battle.js (composition root)
        ├─ creates battle state, seeded RNG, and event bus
        ├─ resolves enemy encounter data and creates Falcon/enemy actors
        ├─ sets up active/reserve formations
        ├─ applies opening initiative
        ├─ wires combat systems, skill registries, AI, controllers, and terminal UI
        └─ core/turnEngine.js
             ├─ selects the next actor through the scheduler
             ├─ applies turn-start effects
             ├─ core/turnRunner.js: view → controller → validate → execute
             ├─ applies turn-end lifecycle and duration ticks
             ├─ advances encounter waves/reinforcements when required
             └─ checks round and battle completion
```

## Module ownership

| Area | Modules | Responsibility |
|---|---|---|
| Composition | `index.js`, `core/battle.js`, `core/battleState.js` | CLI configuration, dependency wiring, initial state, battle lifecycle |
| Turn flow | `core/turnEngine.js`, `core/turnRunner.js`, `core/turnView.js`, `core/decisions.js` | Scheduler loop, turn views, controller selection, decision validation, execution dispatch |
| Controllers | `core/controllers.js`, `ui/battleMenu.js`, `ai/enemyAI.js` | Player, scripted, random, summon, and enemy decision policies |
| Combat resolution | `core/actionResolver.js`, `systems/damage.js`, `systems/damageApplication.js` | Shared basic attacks, damage calculation/application, HP and incapacitation |
| Skill runtime | `core/skillInterpreter.js`, `core/skillLifecycle.js` (compatibility facade), `systems/passives/`, `systems/summons/`, `systems/effects/`, `core/skillDataValidation.js`, `core/skillMessages.js` | Skill execution orchestration, passive and summon registries/runtimes, effect handlers, data validation, message formatting |
| Actor and registry | `characters/actorFactory.js`, `characters/falcon.js`, `characters/skills.js`, `characters/enemies.js` | Runtime actor construction, Falcon roster, skill registry assembly, enemy/encounter resolution |
| Data definitions | `data/skills/`, `data/enemySkills/`, `data/enemies/`, `data/enemyAI/`, `data/encounters/` | Declarative skill, archetype, policy, and encounter content |
| Reusable systems | `systems/` | Readiness, initiative, formation, cooldowns, shields, statuses, damage, effect handlers, and passive lifecycle runtime |
| Events and randomness | `core/eventBus.js`, `core/combatEvents.js`, `core/rng.js` | Battle-local deterministic RNG, event delivery, typed event validation |
| Presentation | `ui/` | Terminal prompts, deployment selection, status display, readable battle log |
| Tooling | `tools/`, `tools/lib/` | Headless execution, simulation, scheduler comparison, golden fixture maintenance |

## Dependency rules

- `core/battle.js` is the composition root and may wire UI, AI, systems, characters, and tools-facing interfaces together.
- Reusable combat rules belong in `systems/` or `core/`, not in terminal UI modules.
- UI controllers present a view and return a decision; they do not directly mutate combat state.
- Enemy AI chooses actions from data-defined policies. Enemy skill definitions describe effects; the shared interpreter executes them.
- Character/enemy data modules should remain declarative. Runtime actor objects are created through `characters/actorFactory.js`.
- Keep the skill runtime boundaries explicit: execution orchestration in `skillInterpreter`, passive/summon lifecycle in `skillLifecycle`, effect handlers in `skillEffects`, validation in `skillDataValidation`, and formatting in `skillMessages`.
- Avoid introducing new module-level mutable battle state. State that differs per battle belongs on the battle state or in a battle-scoped context.

## Turns, controllers, and decisions

For each actor turn, `core/turnRunner.js`:

1. Determines the controller kind (`player`, `enemy`, or `summon`).
2. Builds a plain-data view containing the acting actor, living allies/enemies, legal actions, targets, skill readiness, and supported modes.
3. Requests a decision from the controller.
4. Validates the decision with `core/decisions.js`.
5. Emits `ActionChosen` for accepted decisions and dispatches execution.
6. Emits `DecisionRejected` and retries an invalid decision, with a bounded retry count.

Controllers do not own combat rules. The terminal menu, built-in enemy AI, scripted controller, and random controller all use the same view/decision contract. Replay requires the battle seed, party order, and recorded accepted player decisions.

## Skill runtime

- `data/skills/*.js` defines Falcon skills and passive data.
- `data/enemySkills/*.js` defines the current enemy skill sets.
- `characters/skills.js` builds both registries through `core/skillInterpreter.js`.
- `core/skillInterpreter.js` checks readiness, pays MP, assigns cooldowns, and runs the selected skill variant.
- `core/skillLifecycle.js` is now a compatibility facade; passive, summon, and actor lifecycle implementation is located in `systems/passives/runtime.js`.
- `systems/effects/registry.js` and `systems/effects/defaultHandlers.js` own pluggable effect registration and shared effect implementations.
- `core/skillDataValidation.js` rejects invalid definitions, unsupported effect types, malformed targeting, missing message placeholders, and invalid effect values.
- `core/skillMessages.js` formats messages using named placeholders.

When adding an effect, update its handler and validation rules together, add focused tests, and verify full-battle/golden behavior. Do not put prompts or terminal I/O in skill data or effect handlers.

## Enemy AI and encounters

- `data/enemies/` contains archetype identity, base stats, skill-set references, and AI policy keys.
- `data/enemyAI/` contains ordered conditions, actions, and fallback decisions.
- `ai/enemyAI.js` evaluates policy rules and delegates skill execution to the shared registry; `ai/targeting.js` owns target selection.
- `data/encounters/` contains encounter compositions, waves, per-instance overrides, reinforcement rules, and reward metadata.
- `characters/enemies.js` validates and resolves encounter data into runtime enemy actors.
- `core/battle.js` and the turn engine coordinate wave transitions, reserve reinforcements, and encounter completion.

Current encounter constraints and trigger support are documented in [Combat Mechanics](COMBAT_MECHANICS.md) and the [Step 8 report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md).

## Readiness and deterministic randomness

The preferred threshold scheduler models readiness as continuous time. Scheduler state belongs to `state.scheduler`; the legacy fixed-step scheduler remains available for comparisons. Use `structuredClone(state)` for previews because the threshold ready queue contains actor references.

Combat randomness is stored as plain data in `state.rng` and exposed to battle-scoped systems through the injected `random()` function. Preserve the number and order of random draws when refactoring existing behavior. Player random-policy selection uses its own RNG so it does not perturb the battle RNG.

## Events

`core/eventBus.js` provides synchronous subscriptions. `core/combatEvents.js` validates typed event payloads. Events contain serializable IDs and values, not live actor objects. `Log` events retain the readable text stream.

The vocabulary includes battle, round, turn, action, skill, basic attack, damage, healing, shield, status, incapacitation, summon, formation, reserve deployment, encounter, wave, reinforcement, and completion events. See the [Step 4 report](../history/milestones/STEP4_TYPED_COMBAT_EVENTS.md) and [Step 8 report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md) for milestone-specific catalogs.

Known analytics limit: `DamageApplied` does not currently identify the source actor, so the simulator reports damage received by targets rather than damage dealt by source actor.

## Data authority

Runtime behavior is defined by executable code, data definitions, and automated tests. `references/characterTerraData.js` is a compact owner-reference extract of selected skill objects and stat information; it is not a full roster and is not imported by the engine. The owner maintains the separate website-facing data. Do not create a duplicate `ref/` directory or include the full original JSON in project packages.


## Extensible effect and passive lifecycle work (current development)

The action-pipeline update moved default skill effect implementations into `systems/effects/` and introduced a registry that supports additional handlers at composition time. The current follow-up extracts passive/summon lifecycle runtime ownership from `core/` into `systems/passives/runtime.js`; `core/skillLifecycle.js` remains as a compatibility facade so existing callers and tests do not need to change.

Passive behavior is split into declarative event subscriptions and reusable modifier records. `systems/passives/registry.js` dispatches lifecycle subscriptions to registered handlers. `systems/statusEffects.js` evaluates conditional `statMods`, exposes generic `incomingAttackMods`, and exports the shared actor-flag condition matcher used by conditional hit modifiers; `core/actionResolver.js` consumes incoming attack modifiers through dependency injection. Modifier conditions read actor `passiveFlags` and ordinary actor state. New passive modifiers can therefore use existing shared consumers without adding character-specific branches to combat resolution.

This is a reusable contract, not a claim that every possible passive effect is expressible as a modifier: event-driven reactions still belong in registered handlers, and genuinely new combat operations may require a new generic handler or consumer capability.


## Declarative passive event registry

Falcon passive triggers have been migrated from character-ID conditionals into `systems/passives/registry.js`. Passive data may declare `events` subscriptions keyed by lifecycle event (for example `turnStart`, `damageTaken`, and `skillUsed`); each subscription names a registered handler. The lifecycle runtime emits events and the registry dispatches matching handlers. New handler behavior can be registered through the passive registry without adding character branches to the runtime.

Current migrated subscriptions include Zenki's Unobserved turn/damage triggers, Jazen's Recoil Dampeners damage trigger, Zackry's Overwatch Protocol skill-use trigger, Evalete's Catalyst Protocol lifecycle, and Elishia's Biotech Overdrive timer lifecycle.


## Passive event dispatch

Passive definitions subscribe to lifecycle events in their character skill data. `systems/passives/runtime.js` emits lifecycle events; `systems/passives/registry.js` resolves each subscription to a registered handler. The runtime does not select behavior by character ID for migrated passives. Current registered lifecycle handlers cover Catalyst Wing setup/pulse/destruction protection and Biotech Overdrive duration, alongside the previously migrated Unobserved, Recoil Dampeners, and Overwatch reactions.

Battle-scoped durations use `state.battleTimers` and the generic helpers in `systems/battleTimers.js`. A registered `setBattleTimer` effect declares the key, round duration, and optional actor turn-start reactions. Reactions are processed after that actor's MP recovery and cooldown tick; all timers decrement once at completed-round timing. Systems such as summon scan and activation power modifiers query the same timer through `isBattleTimerActive`, so consumers do not need a character-specific field check. Nanotech Singularity uses a `healPercentMaxHP` reaction scoped to living non-summon allies; reserve members therefore receive the effect if they enter while the timer remains active.

Summon activation and natural expiry are dispatched through `systems/summons/registry.js`. Meo-v9 declares Emergency Field, cover fire, and Final Protocol as activation/expiry subscriptions in `characters/skillData/elishia.js`. The registry supports additional handlers through battle-scoped registration. Summons may declare owner-event subscriptions for destruction reactions; generic `onDestroyed` effects are independently supported. The runtime owns only summon turn-count/expiry timing and event dispatch; no legacy behavior adapter remains. Timed passive modifiers use `passiveTimers` with a declarative `timerKey` on each modifier. Conditional stat modifiers use `when` conditions against generic actor flags; incoming attack modifiers use typed additive entries (currently `evasion`) that remain independent of conditional stat suppression. Zenki’s Unobserved uses this contract for its Evasion bonus and separate incoming basic-attack penalty, while Railshot reads a generic passive flag established by event subscriptions.


## Falcon architecture audit follow-up

The final shared-runtime scan found two remaining character-specific configuration leaks and moved both into passive data: Zackry's exclusion from ally targeter attribution is now `passive.targeting.trackTargeter: false`, and Recoil Dampeners supplies its status key through `passive.statusId`. `core/turnRunner.js` and the registered passive handler no longer name Zackry or Jazen. Passive validation now checks event subscription shapes and handler names, boolean initial flags, targeting configuration, status IDs, and conditional modifier flag arrays.

The architecture is extensible at the registration boundaries: a new skill can compose existing effect records; a new effect operation can be registered in the effect registry; passive event handlers can be registered without changing lifecycle dispatch; and summon lifecycle handlers can be registered without changing summon timing. The generic `statusGroup` effect removes statuses with a matching group key from a configured side before applying the declared status entries to the selected target. Cipher Tag uses this operation to replace its paired mark and RES reduction without a character-specific effect handler. This does not mean every future mechanic is data-only: a mechanic that needs a new operation still needs an appropriately scoped handler, but it should not require a character-ID branch in core action or turn resolution.


## Specialized handler reuse audit

The current registered handlers have been reviewed for reuse boundaries. Shared heal/damage/status/shield operations, `statusGroup`, battle timers, and conditional hit modifiers are reusable. The passive lifecycle runtime no longer contains named-status branches for `singularityDot`, `commandUplink`, or `tacticalMark`; defeat reactions are consumed generically from status metadata. Cipher Tag declares its paired statuses through `statusGroup`; Railshot and Zero Hour compose the generic `masteryHit` operation, and Zero Hour's Cipher Tag slow is a follow-up `conditionalStatus`. Nanotech Singularity now composes generic battle-timer, status, area-DoT, and summon conditional-power/announcement operations; no Singularity-specific active-skill handler remains. See [Handler Reuse Audit](HANDLER_REUSE_AUDIT.md) for the handler-by-handler classification and migration order.


## Generic mastery-hit modifiers and accuracy policy

The generic `masteryHit` effect accepts an optional `accuracy` policy (`standard` by default or `guaranteed`) and an ordered `powerModifiers` list. A modifier may combine actor-flag conditions with a strict target-HP-percent-below condition, and may either scale the current power by `percent` or set an exact `setPower` override; optional `bonusText` carries presentation text. Actor-flag conditions use the same shared flag-matching semantics as passive stat modifiers. Zenki's Railshot declares its 1.1x Energy mastery base, guaranteed accuracy, and conditional +30% power from `unobservedActive`. Zero Hour declares its 2.4x base and exact 3.2x override when the target is below 40% HP; exactly 40% uses normal power. A guaranteed hit still consumes an available next-attack Accuracy token, bypasses the Evasion check without adding an accuracy RNG draw, and retains the ordinary mastery critical roll.

The generic `conditionalStatus` effect may require an existing status and/or a living target before applying its declared status. It also skips execution when the preceding hit in the same skill run marked the target as missed. Zero Hour composes this after `masteryHit` to apply the -25% SPD status for two turns only when the target survives and still has Cipher Tag. This preserves the original hit-before-follow-up ordering and does not add RNG draws.

## Declarative status turn-start behavior

Statuses may declare a `turnStart` contract describing which stored damage and damage-type fields to use and an optional message template. `systems/statusEffects.js` processes these contracts at actor turn start; the passive lifecycle runtime delegates to this generic consumer rather than checking a character-specific status identifier. Nanotech Singularity's DoT uses the generic `damageOverTime` effect with `side: "enemy"`; the effect calculates and stores one non-critical damage amount per living enemy at application time. Its contract preserves status duration ticking in the normal end-of-turn status pass; it does not move or shorten the effect's duration.


## Declarative conditional status refresh

Statuses may declare a `turnStartRefresh` contract that maps their base amount, current amount, conditional bonus, and HP-threshold fields. `systems/statusEffects.js` recalculates the current amount from the base each actor turn, preventing conditional bonuses from compounding. Command Uplink uses this contract with its existing strict-greater-than 50% HP threshold; refresh remains after passive turn-start dispatch and HoT processing, preserving the established runtime order.


## Declarative unit-defeated status reactions

A status may declare an `onUnitDefeated` reaction with a registered generic handler. `systems/statusEffects.js` dispatches the reaction from the defeated unit's status snapshot, and the passive lifecycle runtime only forwards the defeat event. Tactical Mark declares a `restoreMpToLivingAllies` reaction for 5% of each living non-summon ally's Max MP; both Zackry's single-target Mark and Full Spectrum Assault's party-wide status application carry the same reaction data. The single-target application uses the generic `status` effect handler; no dedicated Tactical Mark application handler remains. The reaction is once-only for the supplied defeat snapshot, and skill-data validation checks the handler and configured percentage range.
