# Project Status

**Project:** F.O.D. (Fragments of Decay) Combat Prototype  
**Snapshot:** 2026-11-18  
**Runtime:** Node.js CommonJS CLI  
**Preferred scheduler:** Threshold / continuous-time  
**Default encounter:** `trainingGround` (five active Falcon agents versus five active enemies)

## Current state

The prototype has a controller-driven battle loop, deterministic seeded randomness, replayable player decisions, typed combat events, two readiness schedulers, data-driven Falcon and enemy skills, data-driven enemy AI, and data-driven multi-wave encounters with reinforcement support.

The interactive entry point is `index.js`. Headless execution and simulation use the same battle engine through `tools/lib/headless.js` and `tools/simulate.js`.

## Implemented capabilities

- Five playable Falcon agents with 20 active skills and passive mechanics defined in `data/skills/`.
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

The uploaded source snapshot passed `node --test`: **202 tests passed, 0 failed**. The documentation/codebase audit refactor also retains this result after splitting the skill runtime into effect, validation, message-formatting, lifecycle, and orchestration modules. Run `npm test` from the project root to verify the current checkout.

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

Steps 1–9 are complete. The documentation and codebase baseline audit/restructure is recorded in [Baseline Audit](BASELINE_AUDIT.md). Feature development is paused until this baseline is accepted. The next planned feature milestone is the Reward System and Stage Progression Foundation; it has not started.

See the [architecture reference](../reference/ARCHITECTURE.md), [testing guide](TESTING_AND_PLAYTESTING.md), and [roadmap](ROADMAP.md) for details.
