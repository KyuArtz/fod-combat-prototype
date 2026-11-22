# AI Handoff / Project Continuation Context

Use this document as a concise starting point for future F.O.D. development sessions. It is a navigation and guardrail document; detailed behavior belongs in the technical references and executable source.

## Current snapshot

- Project: F.O.D. (Fragments of Decay) combat prototype.
- Runtime: Node.js CommonJS, Node 18+.
- Dependencies: no third-party runtime dependencies.
- Default scheduler: `threshold`; `legacy` remains available for comparison.
- Default interactive flow: unified mixed-faction roster selection (3–5 unique operatives; first three active and remaining members in reserve), followed by the `trainingGround` encounter. Headless/test defaults remain explicitly configured by each runner.
- Steps 1–9, Falcon and Phantom shared-runtime/passive audits, initial Phantom migration, faction-duel harness, Iteration 4 unified character selection, and Iteration 5 engine coverage audit are complete.
- The Falcon active-effect reuse review is complete: Tactical Mark, Cipher Tag, Railshot, Zero Hour, and Nanotech Singularity now compose reusable effect and lifecycle contracts.
- Latest verified snapshot: Falcon and Phantom kits, global stacking/timing implementation, both tactical controllers, side-relative faction combat, field-medic substitution harness, and unified mixed-faction character selection. Current verification is 313 passed, 0 failed, 0 skipped.

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
- `characters/skills.js` assembles Falcon, Phantom, and enemy skill registries; `characters/roster.js` builds the player-facing selectable roster from the faction registry and provides identity-safe preview data.
- `characters/enemies.js` resolves data definitions into runtime enemy actors and encounter waves.
- `systems/` owns reusable combat systems, including generic battle-scoped timers in `systems/battleTimers.js`; `ui/` owns terminal presentation and input.
- `characters/skillData/` owns Falcon and Phantom skill/passive definitions; `characters/phantom.js` creates Phantom actors; `characters/roster.js` owns the unified playable faction registry; `data/` owns enemy, AI policy, and encounter definitions.

See [Architecture](../reference/ARCHITECTURE.md) for the full module map and runtime flow.

## Determinism and regression rules

- Combat RNG is stored as plain data in `state.rng`; engine randomness must use the injected battle RNG.
- Preserve random-call order when refactoring enemy policies or combat effects unless a deliberate behavior change is approved.
- Replays depend on seed, party order, and accepted player decisions.
- Golden transcript changes require deliberate regeneration, review, and a changelog explanation. Never update fixtures just to make a failing test pass.
- Use `structuredClone(state)` for scheduler previews; JSON cloning breaks object references held by the threshold ready queue.

## Data and reference authority

- Runtime behavior is defined by executable code, data definitions, and tests.
- Falcon and Phantom skill data: `characters/skillData/*.js` (the live roster source consumed by `characters/skills.js`).
- Enemy skill data: `data/enemySkills/*.js`.
- Enemy archetypes and policies: `data/enemies/*.js`, `data/enemyAI/*.js`.
- Encounter data: `data/encounters/*.js`.
- `references/characterTerraData.js` is a compact owner-reference extract containing selected skill objects and stat information. It is not a full roster and is not imported by the engine.
- The owner maintains the separate website-facing character data. The `elishia_p` player-facing descriptions must remain neutral and the in-game name remains `Unknown`. Do not move files into a new `ref/` directory, do not create a duplicate `ref/` folder, and do not package the full original JSON. Keep `references/characterTerraData.js` as the single in-project reference file.
- When that reference JS changes, the owner personally applies the latest relevant content to the separate website-facing data.
- Read [Falcon implementation](../reference/FALCON_IMPLEMENTATION_GUIDE.md), [Phantom implementation](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md), and [ADR-017](DECISIONS.md) before changing character mechanics. The earlier Step 9 choices are preserved as a superseded [historical milestone](../history/milestones/STEP9_SUPERSEDED_FALCON_MECHANICS.md).

## Known limitations

- The interactive selector currently includes Falcon Company and Phantom Rebellion only; Serpent Syndicate is not migrated or selectable yet.
- The selector is terminal-based; there is no graphical roster UI.
- Formation save/load and saved presets are not implemented.
- Reinforcement trigger support is limited to enemy defeat count; reinforcements enter reserve and use normal replacement.
- Reward metadata and `onEncounterComplete` are hooks only; there is no reward distribution, XP, inventory, persistent stage progression, or save/load.
- Damage events include source attribution for direct, reflected, and DoT damage, enabling per-actor simulator contribution summaries.
- Falcon runtime base stats remain prototype values pending a separate stat-sync decision.

## Documentation rules

Use the [documentation index](../README.md) to navigate. Keep current state in `PROJECT_STATUS.md`, plans in `ROADMAP.md`, design decisions in `DECISIONS.md`, implementation history in `CHANGELOG.md`, and detailed historical scope in milestone reports. Avoid copying full feature descriptions into multiple documents.


## Current migration baseline — 2026-11-22

The latest source snapshot includes the conservative Iteration 3 cleanup, Phantom Rebellion migration and faction-duel harness, and Iteration 4 unified mixed-faction character selection. The obsolete duplicate `data/skills/` source, unreachable `core/skillEffects.js` implementation, Meo-9 scan/Final Protocol plumbing, and superseded legacy assertions have been removed. Current Falcon and Phantom definitions live in `characters/skillData/`; shared effect handlers live in `systems/effects/`; the interactive roster is assembled by `characters/roster.js`.

Keep the legacy fixed-step scheduler for comparison, `ai/falconTactics.js` as the initial deterministic controller, `ai/falconTacticsV2.js` as the coordinated controller, `core/skillLifecycle.js` as a compatibility facade, generic Accuracy-token and Stagger mechanics, generic conditional-status/multi-hit handlers, and deterministic golden fixtures. Historical Step 9 decisions and earlier playtest records remain under `docs/history/` and are not current behavior where ADR-017 differs.

Current verification after Iteration 5 engine coverage audit: `npm test` — 313 passed, 0 failed, 0 skipped. The interactive `npm start` path now opens the combined roster selector; legacy `selectPartyFaction` remains available for compatibility and focused tests. Do not commit, push, or merge unless explicitly requested. Keep user-supplied source JSON and previous archives untouched.

## Phantom migration follow-up

- Five Phantom actors and all 20 active skills plus passives are migrated through the shared engine. See [Phantom Implementation Guide](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md).
- Bleeding magnitude is provisional at 0.15× ATK as Anomaly damage per affected-unit turn for 2 turns; seek owner approval before treating it as final balance.
- Phantom tactical AI, mirrored Falcon-versus-Phantom combat, and unified mixed-faction selection are implemented. The current selector includes Falcon and Phantom only; register Serpent after its migration is complete.
- The selector supports terminal filters (`filter faction`, `filter mastery`, `filter role`), `search`, `info`, and ordered active/reserve assignment. It does not yet save/load formations.
