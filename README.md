# F.O.D. Combat Prototype

A Node.js command-line prototype for experimenting with **Fragments of Decay (F.O.D.)** turn-based combat. This repository is a development and playtesting environment; it is not the production game implementation.

## Current baseline

- Controller-driven combat with terminal, AI, scripted, random, and headless controllers.
- Seeded randomness and deterministic decision replay.
- Threshold-based continuous readiness scheduler (preferred) and legacy scheduler (comparison).
- Data-driven Falcon skills and passives, plus six enemy archetypes (including the Blightheart boss) with a passive, three skills, an Ultimate, and dedicated AI policies.
- Data-driven enemy archetypes, AI policies, encounter compositions, waves, and defeat-count reinforcements.
- A coordinated Falcon controller with role-aware target focus, Toxic-counterplay, and three-active/two-reserve rotation.
- Typed combat events alongside readable battle logs.
- Headless simulator with table, JSON, and CSV reports.
- Automated regression suite: **260 tests passing, 0 failing, 0 skipped** in the cleaned development build; run `npm test` locally to verify your checkout.

Reward awarding, XP, inventory, persistent stage progression, and save/load are not implemented. The encounter completion callback exposes reward metadata for a future progression layer.

## Requirements

- Node.js **18 or newer**.
- No third-party runtime dependencies.

## Quick start

```bash
npm start
```

Run the test suite:

```bash
npm test
```

Run a deterministic simulation batch:

```bash
npm run simulate -- --battles 100 --seed 42
```

Compare the readiness schedulers:

```bash
npm run compare:schedulers -- 60
```

## Runtime configuration

| Environment variable | Values | Default | Purpose |
|---|---|---|---|
| `FOD_SCHEDULER` | `threshold`, `legacy` | `threshold` | Select readiness scheduler |
| `FOD_OPENING` | `player-first`, `speed` | `player-first` | Select opening initiative policy |
| `FOD_SEED` | unsigned 32-bit integer | random | Set a reproducible battle seed |

PowerShell example:

```powershell
$env:FOD_SEED="12345"
$env:FOD_SCHEDULER="threshold"
npm start
```

## Headless simulator

The simulator runs the same battle engine used by interactive play. It does not implement a second combat ruleset.

```bash
node tools/simulate.js --battles 100 --seed 42 --encounter trainingGround
node tools/simulate.js --battles 100 --seed 42 --encounter droneCalibration
node tools/simulate.js --battles 100 --seed 42 --encounter siegeBreakthrough
node tools/simulate.js --battles 100 --seed 42 --policy tactical --encounter blightheartSanctum
node tools/simulate.js --battles 100 --format json --out reports/sample.json
node tools/simulate.js --battles 100 --format csv --out reports/sample.csv
```

See [the simulator guide](docs/history/milestones/STEP5_HEADLESS_SIMULATOR.md) for options and [the enemy archetype and balance notes](docs/reference/ENEMY_ARCHETYPES_AND_BALANCE.md) for current enemy kits, stat comparisons, and the scaled Falcon playtests, tactical controller, and Blightheart boss encounter. Damage events include source attribution for actor contribution analysis. Generated reports are local artifacts and are ignored by Git; see `reports/README.md`.

## Documentation

Start at the [documentation index](docs/README.md). It separates current project guidance, technical references, and historical milestone records.

## Project structure

```text
ai/                 Enemy AI policy evaluator and targeting
characters/         Actor factory, Falcon party, enemy/encounter loader, skill registry
core/               Battle composition, state, turns, decisions, events, RNG, skill runtime
core/skillLifecycle.js Passive and summon lifecycle hooks
core/skillDataValidation.js Skill data validation
core/skillMessages.js Skill message formatting
systems/             Readiness, initiative, damage, formation, cooldown, shield and status systems
systems/effects/     Shared declarative effect registry and handlers
data/                Enemy archetypes, enemy skills, AI policies, encounter definitions
ui/                  Terminal menu, deployment selection, status display, battle log
test/                Automated tests and deterministic golden fixtures
tools/                Simulator, scheduler comparison, fixture updater, headless helpers
docs/                Documentation index, current references, project guidance, milestone history
references/          Compact owner-reference extract: selected skill objects and stat information
reports/             Local generated simulator outputs (ignored by Git)
index.js              Interactive CLI entry point
package.json          Project metadata and standard npm scripts
```

## Source and data authority

- Executable code and automated tests define actual runtime combat behavior.
- `characters/skillData/` contains the live Falcon skill/passive definitions; `data/enemySkills/`, `data/enemies/`, `data/enemyAI/`, and `data/encounters/` contain enemy and encounter definitions. `ai/falconTactics.js` provides the initial tactical Falcon controller; `ai/falconTacticsV2.js` provides the coordinated controller with reserve rotation and Toxic-counter logic. `characters/skills.js` assembles player and enemy registries through the shared interpreter.
- `references/characterTerraData.js` is a compact owner-reference extract containing selected skill objects and stat information. It is not a full character roster and is not imported by the combat engine.
- The owner maintains the separate website-facing character data. When engine mechanics change, update the relevant implementation/reference notes and provide the owner with the corresponding reference changes to apply to the site-facing data. Do not create a duplicate `ref/` directory or package the full original JSON.

## Development workflow

- `main` is the stable merge destination; `development` is the integration branch. Verify the actual Git branch/status before committing.
- Preserve deterministic RNG call order unless a gameplay change intentionally changes it.
- Treat golden transcript changes as behavior changes: regenerate only deliberately, review the diff, and document the reason.
- Run `npm test` before handing off a change. Record simulator samples as observations, not proof of balance.
- Do not start the next feature milestone until the documentation/codebase baseline audit is accepted.

See [project status](docs/project/PROJECT_STATUS.md), [architecture](docs/reference/ARCHITECTURE.md), and [testing guidance](docs/project/TESTING_AND_PLAYTESTING.md).
