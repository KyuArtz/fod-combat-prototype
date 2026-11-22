# Project Status

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Snapshot:** 2026-11-21  
**Runtime:** Node.js CommonJS CLI  
**Preferred scheduler:** Threshold / continuous-time  
**Default encounter:** `trainingGround` (five active Falcon agents versus five active enemies)

## Current state

The prototype has a controller-driven battle loop, deterministic seeded randomness, replayable player decisions, typed combat events, two readiness schedulers, declarative Falcon and enemy skills, a pluggable effect-handler registry, data-driven enemy AI, and data-driven multi-wave encounters with reinforcement support.

The interactive entry point is `index.js`. Headless execution and simulation use the same battle engine through `tools/lib/headless.js` and `tools/simulate.js`.

## Implemented capabilities

- Five playable Falcon agents with 20 active skills and passive definitions in `characters/skillData/`.
- Training Drone and Rogue Automaton skills defined in `data/enemySkills/` and executed by the shared skill runtime.
- Five enemy archetypes and declarative AI policies in `data/enemies/` and `data/enemyAI/`.
- Encounter definitions in `data/encounters/`, including single-wave encounters and the multi-wave `siegeBreakthrough` example.
- Per-instance enemy stat overrides and defeat-count-triggered reinforcement groups.
- Threshold and legacy readiness schedulers; threshold is the default.
- Player-first PvE opening initiative, configurable with `FOD_OPENING`.
- Seeded combat randomness (`FOD_SEED`) and replay from seed, party order, and recorded decisions.
- Controller-driven turns for terminal, enemy AI, summon automation, scripted, and random controllers.
- Shared basic-attack resolution for player and enemy actions.
- Typed combat events alongside human-readable logs.
- Headless simulator output in table, JSON, and CSV formats.
- Automated regression coverage including deterministic golden transcripts.

## Verification

The latest Falcon architecture snapshot passed `npm test`: **227 tests passed, 0 failed**. The status lifecycle migrations moved Singularity DoT ticking, Command Uplink conditional ATK refresh, and Tactical Mark defeat rewards into declarative status metadata. Cipher Tag uses the reusable `statusGroup` operation. Railshot and Zero Hour compose through generic `masteryHit`; Zero Hour's Cipher Tag follow-up uses `conditionalStatus`. Nanotech Singularity composes generic battle-timer, status, area-DoT, and summon conditional-power/announcement operations. Regression coverage includes deterministic replay, unchanged golden transcripts, Railshot's Accuracy-token/RNG behavior, Zero Hour's exact HP threshold and miss/defeat follow-up gates, and battle-timer turn-start and reserve-entry behavior. Run `npm test` from the project root to verify the current checkout.

The current Node baseline is 18 or newer. The project has no third-party runtime dependencies.

## Known limitations

- The prototype is terminal/headless; there is no graphical battle client.
- The default formation uses five active units per side. Encounter waves currently require at least five enemy entries.
- Only defeat-count reinforcement triggers are supported; reinforcement units enter the enemy reserve and deploy through normal replacement.
- Enemy skill variety is limited to the currently registered Training Drone and Rogue Automaton skill sets; the other three archetypes use the basic-only AI policy.
- Simulator damage reporting measures damage received by targets; the `DamageApplied` event does not currently include source actor identity.
- Encounter reward data and `onEncounterComplete` are integration hooks only. XP, currency, inventory, reward distribution, persistent stage progression, and save/load are not implemented.
- Runtime Falcon base stats in `characters/falcon.js` remain prototype values. A separate owner-approved stat-sheet synchronization decision is still open.

## Reference authority

Executable code and automated tests define actual runtime behavior. `references/characterTerraData.js` is the compact owner-reference extract containing selected skill objects and stat information; it is not a full character roster and is not imported by the engine. The owner maintains the separate website-facing character data and applies relevant updates there.

## Development status

Steps 1–9, the skill effect-registry pipeline, the passive event registry, and the first generic summon lifecycle registry are complete. `core/skillLifecycle.js` remains a compatibility facade over `systems/passives/runtime.js`; passive subscriptions are dispatched through `systems/passives/registry.js`, and summon activation/expiry subscriptions through `systems/summons/registry.js`. Summon destruction owner reactions now use summon-declared event subscriptions, the legacy summon behavior adapter has been removed, and timed passive stat modifiers use generic timer keys. The current Falcon shared-runtime character-ID audit is complete: Zackry targeter attribution and Jazen Recoil Dampeners status identity are configured in passive data, not hard-coded in shared runtime. Passive subscription and modifier configuration validation has been expanded. The defensive passive modifier audit is complete for current Falcon passives: conditional stat modifiers and incoming attack modifiers use reusable data contracts consumed by shared systems. Event-driven passive effects remain registry handlers. A focused specialized-handler reuse audit has now classified shared primitives, parameterized mechanic handlers, and coordinated specialized effects. It also identified three named-status branches in the passive lifecycle runtime (`singularityDot`, `commandUplink`, and `tacticalMark`); all three are now migrated to generic status lifecycle consumers. Tactical Mark's active-skill application also now uses the generic `status` effect rather than a dedicated effect handler, while preserving its named status ID for damage and skill consumers. Cipher Tag's dedicated effect handler has now been replaced by the reusable `statusGroup` operation, which replaces matching grouped statuses across a configured side before applying the new group to the selected target. Railshot and Zero Hour now both compose through generic `masteryHit`; Railshot retains its guaranteed accuracy and conditional +30% Unobserved power, while Zero Hour uses a strict-below-40% fixed execute override and a gated Cipher Tag follow-up through `conditionalStatus`. Nanotech Singularity now composes generic `setBattleTimer`, `statusAllies`, `statusEnemies`, area `damageOverTime`, and `announceSummonPowerModifier` effects; its 5% turn-start heal is a timer reaction and applies to non-summon allies entering from reserve while active. Conditional Meo scan and cover-fire bonuses read the same generic battle timer. No Singularity-specific active effect handler remains. Details are in [Handler Reuse Audit](../reference/HANDLER_REUSE_AUDIT.md). The documentation and codebase baseline audit/restructure is recorded in [Baseline Audit](BASELINE_AUDIT.md).

See the [architecture reference](../reference/ARCHITECTURE.md), [testing guide](TESTING_AND_PLAYTESTING.md), and [roadmap](ROADMAP.md) for details.


### Historical passive-registry migration note

This paragraph records the state at the start of the passive-registry migration, not the current state: the migration introduced `systems/passives/registry.js` and declarative event subscriptions. Subsequent increments migrated Catalyst Protocol, Biotech Overdrive, summon lifecycle, and the remaining defensive modifier/targeting configuration. The current audit result is summarized above.

## Passive lifecycle migration status

- Declarative passive event subscriptions and a battle-scoped handler registry are active under `systems/passives/`.
- Evalete's Catalyst Protocol now uses registered `battleStart`, `turnEnd`, and `summonDestroyed` handlers for Catalyst Wing lifecycle, pulse healing/shields, and its destruction shield.
- Elishia's Biotech Overdrive uses registered battle-start/turn-end handlers and generic timer-keyed stat modifiers; no character-specific timer field remains.
- Unobserved, Recoil Dampeners, and Overwatch Protocol were migrated in the preceding passive-registry step.
- Meo-v9's Emergency Field, cover fire, and Final Protocol now use declarative activation/expiry handlers in `systems/summons/registry.js`. Summon destruction owner reactions are dispatched from summon-declared owner-event subscriptions, and generic on-destroy effects remain supported. The legacy behavior adapter has been removed. No Phantom Rebellion content is part of this snapshot.
- Defensive modifier follow-up: Unobserved now uses generic `passiveFlags`, conditional `statMods`, and typed `incomingAttackMods`; no Unobserved-specific field or branch remains in shared combat systems. Railshot bonus state is also tracked through the generic passive flag contract.
- Railshot uses generic mastery-hit data for conditional power and guaranteed accuracy; no Railshot-specific effect handler remains.
- Zero Hour uses generic mastery-hit target-HP modifiers and a gated conditional-status follow-up; no Zero Hour-specific effect handler remains.
- Latest verification: 227 tests pass, 0 fail.
