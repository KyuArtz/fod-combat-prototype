# AI Handoff / Project Continuation Context

Use this document as a concise starting point for future F.O.D. development sessions. It is a navigation and guardrail document; detailed behavior belongs in the technical references and executable source.

## Current snapshot

- Project: F.O.D. (Fragments of Decay) combat prototype.
- Runtime: Node.js CommonJS, Node 18+.
- Dependencies: no third-party runtime dependencies.
- Default scheduler: `threshold`; `legacy` remains available for comparison.
- Default encounter: `trainingGround`, five active Falcon agents versus five active enemies.
- Steps 1–9 and the Falcon shared-runtime/passive audit are complete.
- The Falcon active-effect reuse review is complete: Tactical Mark, Cipher Tag, Railshot, Zero Hour, and Nanotech Singularity now compose reusable effect and lifecycle contracts.
- Latest verified snapshot: Falcon approved kit v1, global stacking/timing implementation, coordinated Falcon controller, Toxic cleanse decision logic, and three-active/two-reserve formation coverage; 273 tests passed, 0 failed, and 38 superseded legacy assertions skipped. The two-stage Blightheart boss is covered by seeded simulations.

## Start every work session by

1. Inspect the actual Git branch, working tree, and latest files. A ZIP snapshot is not proof of the latest remote commit.
2. Read [project status](PROJECT_STATUS.md), [architecture](../reference/ARCHITECTURE.md), and the relevant focused reference.
3. Run `npm test` before making changes.
4. Identify the exact source and tests that own the behavior being changed.
5. Make incremental changes and rerun targeted tests plus the full suite.

Do not commit, push, or merge unless explicitly asked.

## Architecture boundaries

- `core/battle.js` is the composition root.
- `core/turnEngine.js`, `core/turnRunner.js`, `core/turnView.js`, and `core/decisions.js` own turn flow and action validation.
- `ai/enemyAI.js` evaluates data-defined enemy policies; `ai/targeting.js` owns enemy target selection.
- `core/actionResolver.js` owns shared basic-attack execution.
- `core/skillInterpreter.js` owns skill execution orchestration.
- `core/skillLifecycle.js` is a compatibility facade; `systems/passives/runtime.js` owns passive, summon, and actor lifecycle hooks.
- `systems/effects/` owns declarative effect handlers and registry.
- `core/skillDataValidation.js` validates skill definitions and passive contracts.
- `core/skillMessages.js` formats skill messages.
- `characters/skills.js` assembles the Falcon and enemy skill registries.
- `characters/enemies.js` resolves data definitions into runtime enemy actors and encounter waves.
- `systems/` owns reusable combat systems, including generic battle-scoped timers in `systems/battleTimers.js`; `ui/` owns terminal presentation and input.
- `characters/skillData/` owns Falcon skill and passive definitions; `data/` owns enemy, AI policy, and encounter definitions.

See [Architecture](../reference/ARCHITECTURE.md) for the full module map and runtime flow.

## Determinism and regression rules

- Combat RNG is stored as plain data in `state.rng`; engine randomness must use the injected battle RNG.
- Preserve random-call order when refactoring enemy policies or combat effects unless a deliberate behavior change is approved.
- Replays depend on seed, party order, and accepted player decisions.
- Golden transcript changes require deliberate regeneration, review, and a changelog explanation. Never update fixtures just to make a failing test pass.
- Use `structuredClone(state)` for scheduler previews; JSON cloning breaks object references held by the threshold ready queue.

## Data and reference authority

- Runtime behavior is defined by executable code, data definitions, and tests.
- Falcon skill data: `characters/skillData/*.js` (the live roster source consumed by `characters/skills.js`).
- Enemy skill data: `data/enemySkills/*.js`.
- Enemy archetypes and policies: `data/enemies/*.js`, `data/enemyAI/*.js`.
- Encounter data: `data/encounters/*.js`.
- `references/characterTerraData.js` is a compact owner-reference extract containing selected skill objects and stat information. It is not a full roster and is not imported by the engine.
- The owner maintains the separate website-facing character data. Do not move files into a new `ref/` directory, do not create a duplicate `ref/` folder, and do not package the full original JSON. Keep `references/characterTerraData.js` as the single in-project reference file.
- When that reference JS changes, the owner personally applies the latest relevant content to the separate website-facing data.
- Read [Falcon implementation](../reference/FALCON_IMPLEMENTATION_GUIDE.md) and [Step 9 decisions](../reference/FALCON_MECHANICS_FINALIZATION.md) before changing Falcon mechanics.

## Known limitations

- Default formation and each encounter wave currently require five enemy entries.
- Reinforcement trigger support is limited to enemy defeat count; reinforcements enter reserve and use normal replacement.
- Reward metadata and `onEncounterComplete` are hooks only; there is no reward distribution, XP, inventory, persistent stage progression, or save/load.
- Damage events include source attribution for direct, reflected, and DoT damage, enabling per-actor simulator contribution summaries.
- Falcon runtime base stats remain prototype values pending a separate stat-sync decision.

## Documentation rules

Use the [documentation index](../README.md) to navigate. Keep current state in `PROJECT_STATUS.md`, plans in `ROADMAP.md`, design decisions in `DECISIONS.md`, implementation history in `CHANGELOG.md`, and detailed historical scope in milestone reports. Avoid copying full feature descriptions into multiple documents.


## Current architecture handoff — Falcon shared-runtime audit complete

Continue from the latest Zero Hour composition snapshot. The verified archive is the Railshot Composition snapshot plus the Zero Hour generic effect composition increment. `systems/passives/runtime.js` owns lifecycle timing and event emission; `systems/passives/registry.js` dispatches declarative subscriptions; `systems/effects/` and `systems/summons/` provide their respective handler registries. `core/skillLifecycle.js` remains a compatibility facade.

The latest Falcon pass keeps character-specific behavior in declarative `characters/skillData/*.js` definitions and generic handlers. ADR-017 records the approved kit, global stacking, and effect timing rules. `docs/reference/FALCON_IMPLEMENTATION_GUIDE.md` and `docs/reference/COMBAT_MECHANICS.md` are the current references; earlier Step 9 docs are historical where they conflict. That earlier audit snapshot had 233 tests passing. The current verification is 273 passed, 0 failed, 38 superseded legacy assertions skipped. Tactical/boss playtest results and caveats are recorded in `reports/` and `docs/reference/ENEMY_ARCHETYPES_AND_BALANCE.md`. No Phantom Rebellion content is in scope. Preserve the established `docs/history/`, `docs/project/`, and `docs/reference/` tree, update docs in place, and keep user-supplied JSON/files out of the project package.
