# F.O.D. Combat Prototype

A Node.js command-line prototype for experimenting with **Fragments of Decay (F.O.D.)** turn-based combat. This repository is a development and playtesting environment; it is not the production game implementation.

## Current baseline

- Controller-driven combat with terminal, AI, scripted, random, and headless controllers.
- Seeded randomness and deterministic decision replay.
- Threshold-based continuous readiness scheduler (preferred) and legacy scheduler (comparison).
- Data-driven Falcon, Phantom, and Serpent skills and passives, plus six enemy archetypes (including the Blightheart boss) with a passive, three skills, an Ultimate, and dedicated AI policies.
- Unified mixed-faction character selection: choose three to five unique Falcon/Phantom/Serpent operatives, inspect their combat profiles, filter by faction/mastery/role, and arrange three active slots plus an optional two-member reserve queue.
- Runtime coverage audit for all fifteen playable and six enemy skill sets, including passive/summon handler registration, mode-target validation, DoT attribution, DoT defeat ordering, and owner-linked summon cleanup.
- Data-driven enemy archetypes, AI policies, encounter compositions, waves, and defeat-count reinforcements.
- Coordinated Falcon, Phantom, and Serpent controllers with role-aware target focus, faction-specific tactics, Toxic-counterplay, and three-active/two-reserve rotation.
- Typed combat events alongside readable battle logs.
- Headless simulator with table, JSON, and CSV reports.
- Automated regression suite: **363 tests passing, 0 failing, 0 skipped** after Serpent migration and mixed-faction preview/selection coverage; run `npm test` locally to verify your checkout.

Reward awarding, XP, inventory, persistent stage progression, and save/load are not implemented. The encounter completion callback exposes reward metadata for a future progression layer.

## Requirements

- Node.js **18 or newer**.
- No third-party runtime dependencies.

## Quick start

```bash
npm start
```

The interactive deployment flow opens the **unified operative roster**. You can mix Falcon Company, Phantom Rebellion, and Serpent Syndicate characters, filter by faction/mastery/role, search public profile details, inspect character stats and abilities, and select three to five unique operatives. You then choose the three active slots in order and arrange any remaining choices into the reserve queue. The default setup is three active plus up to two reserves, and the resulting mixed team enters the Training Ground PvE encounter. The hidden `elishia_p` operative appears as **Unknown** in player-facing output; its internal roster ID is not displayed in the selection interface.

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

Run seeded faction matchups (the harness supports any distinct pair and alternates faction seating with symmetric hit/evasion behavior):

```bash
npm run simulate:factions -- --battles 500 --seed 20261122 --active 3
npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3
npm run simulate:factions -- --player serpent --opponent phantom --battles 100 --active 3
```

Compare Falcon with Evalete against temporary one-for-one Phantom replacements (100 matched-seed battles per variant by default):

```bash
npm run simulate:medic-swap -- --battles 100 --seed 20261122 --active 3
```

Evalete substitution is available as an experimental mixed-faction test via `npm run simulate:medic-swap`; the experiment report is not included in this clean snapshot.

See [the simulator guide](docs/history/milestones/STEP5_HEADLESS_SIMULATOR.md) for options and [the enemy archetype and balance notes](docs/reference/ENEMY_ARCHETYPES_AND_BALANCE.md) for current enemy kits, stat comparisons, and the scaled Falcon playtests, tactical controller, and Blightheart boss encounter. Damage events include source attribution for actor contribution analysis. Generated reports are local artifacts and are ignored by Git; see [reports workflow](reports/README.md).

## Documentation

Start at the [documentation index](docs/README.md). It separates current project guidance, technical references, and historical milestone records.

## Project structure

```text
ai/                 Enemy AI policy evaluator and targeting
characters/         Actor factory, faction parties, unified playable-roster registry, enemy/encounter loader, skill registry
core/               Battle composition, state, turns, decisions, events, RNG, skill runtime
core/skillLifecycle.js Passive and summon lifecycle hooks
core/skillDataValidation.js Skill data validation
core/skillMessages.js Skill message formatting
systems/             Readiness, initiative, damage, formation, cooldown, shield and status systems
systems/effects/     Shared declarative effect registry and handlers
data/                Enemy archetypes, enemy skills, AI policies, encounter definitions
ui/                  Terminal menu, unified deployment/formation selection, status display, battle log
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
- `characters/skillData/` contains the live Falcon, Phantom, and Serpent skill/passive definitions; `data/enemySkills/`, `data/enemies/`, `data/enemyAI/`, and `data/encounters/` contain enemy and encounter definitions. `ai/falconTactics.js` provides the initial tactical Falcon controller; `ai/falconTacticsV2.js` provides the coordinated Falcon controller with reserve rotation and Toxic-counter logic; `ai/phantomTactics.js` and `ai/serpentTactics.js` provide Phantom and Serpent faction-specific tactical controllers. `characters/phantom.js` and `characters/serpent.js` create their actors; `characters/skills.js` assembles player and enemy registries through the shared interpreter.
- `characters/roster.js` is the central registry for player-selectable factions and builds the unified actor catalog; the deployment selector contains no faction-specific selection branches.
- `references/characterTerraData.js` is a compact owner-reference extract containing selected skill objects and stat information. It is not a full character roster and is not imported by the combat engine.
- The owner maintains the separate website-facing character data. The `elishia_p` internal key displays as `Unknown`; all five player-facing skill descriptions remain neutral. Phantom Bleeding currently uses an initial provisional baseline of 0.15× the applier's ATK as Anomaly damage per affected-unit turn-start tick for 2 turns; it does not stack, and reapplication refreshes duration. This value is documented in `docs/reference/PHANTOM_IMPLEMENTATION_GUIDE.md`. When engine mechanics change, update the relevant implementation/reference notes and provide the owner with the corresponding reference changes to apply to the site-facing data. Do not create a duplicate `ref/` directory or package the full original JSON.

## Development workflow

- `main` is the stable merge destination; `development` is the integration branch. Verify the actual Git branch/status before committing.
- Preserve deterministic RNG call order unless a gameplay change intentionally changes it.
- Treat golden transcript changes as behavior changes: regenerate only deliberately, review the diff, and document the reason.
- Run `npm test` before handing off a change. Record simulator samples as observations, not proof of balance.
- Serpent Syndicate is now integrated into the unified roster and shared skill runtime. Future milestones can focus on three-faction balance testing, further encounter coverage, or a graphical roster interface.

See [project status](docs/project/PROJECT_STATUS.md), [architecture](docs/reference/ARCHITECTURE.md), and [testing guidance](docs/project/TESTING_AND_PLAYTESTING.md).
