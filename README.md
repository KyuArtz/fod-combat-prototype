# F.O.D. Combat Prototype

A Node.js command-line sandbox for experimenting with **Fragments of Decay (F.O.D.)** combat mechanics. This repository is a development/playtest project, not yet the production combat implementation.

> **Current development direction (2026-11-16):** threshold-based continuous readiness is the preferred scheduler; development testing uses a **5 Falcon vs. 5 enemy active formation**. Reserve systems remain implemented, but with five Falcon agents deployed, the current test setup has no reserve members. Battles are **seeded and replayable** (`FOD_SEED`), and readable battle logs plus structured combat events flow through the typed event bus (steps 1 and 4). In PvE the **player's side acts first** (opening initiative), because the fastest unit in 5v5 is an enemy (Recon Drone, SPD 115 vs Zenki 110). Every turn is **controller-driven**: the terminal menu, enemy AI, and headless/scripted players share the same view-and-decision interface (step 2). All five Falcon agents' skills are **data-driven and aligned to the owner's reference**. The project bundles only selected character stats, skills, and stat descriptions in `references/characterTerraData.js`; `core/skillInterpreter.js` runs active skills and supported passives. See `docs/OWNER_SKILL_REFERENCE.md`. Full-battle regression coverage and typed combat events are complete. Step 5 headless balance simulation is complete; see the Step 5 guide for CLI usage and metric limitations. The Training Drone and Rogue Automaton enemy skills have now also moved to the shared data/interpreter architecture (Step 6); see `docs/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md`. Other enemies remain unchanged.

## Quick start

Requirements: a modern Node.js runtime with CommonJS and `node:test` support.

```bash
node index.js
```

Select a scheduler:

```bash
# Preferred scheduler
FOD_SCHEDULER=threshold node index.js

# Legacy comparison scheduler
FOD_SCHEDULER=legacy node index.js
```

On Windows PowerShell:

```powershell
$env:FOD_SCHEDULER="threshold"; node index.js
$env:FOD_SCHEDULER="legacy"; node index.js
```

Replay a battle with a fixed seed (crits, evasion and enemy skill rolls are reproducible):

```bash
FOD_SEED=12345 node index.js
```

```powershell
$env:FOD_SEED="12345"; node index.js
```

Every battle prints `Seed: N` at the start. Leave `FOD_SEED` unset for a random seed. The same seed **plus the same menu choices** replays the same battle.

Opening initiative (who acts first):

```bash
# Default: the player's side opens the battle
FOD_OPENING=player-first node index.js

# Pure SPD order (the fastest unit opens, even if it is an enemy)
FOD_OPENING=speed node index.js
```

```powershell
$env:FOD_OPENING="speed"; node index.js
```

Compare the schedulers and the opening rule without playing by hand:

```bash
node tools/compareSchedulers.js 60
```

Run repeatable headless balance batches (random legal Falcon actions by default):

```bash
node tools/simulate.js --battles 1000 --seed 42
node tools/simulate.js -n 250 --scheduler legacy --policy basic
node tools/simulate.js -n 100 --format json --out reports/simulation.json
node tools/simulate.js -n 100 --format csv --out reports/simulation.csv
```

The simulator reports win rate, battle length, actions, HP damage received, shield absorption, healing, MP spending and rejected decisions. JSON includes per-battle/per-actor received-damage details. See [Step 5 — Headless Simulator](docs/STEP5_HEADLESS_SIMULATOR.md) for options and metric limitations (including the current lack of source-attributed damage).

Play without a terminal (controllers, headless runs, replays):

```js
const { createBattle } = require("./core/battle");
const { createRandomController } = require("./core/controllers");

const battle = createBattle({
  seed: 12,
  output: { log() {} },                                   // silence the console
  partyOrder: ["zenki", "elishia", "jazen", "evalete", "zackry"],   // skips the formation prompts
  controllers: { player: createRandomController({ seed: 1 }) },
});
const result = await battle.run();                         // "VICTORY" or "DEFEAT"
```

A controller is a function (or an object with `chooseAction(view)`) that returns a decision such as `{ type: "basic", targetId: "recon-drone" }`. `battle.events` emits `ActionChosen` for every accepted decision, so a battle can be replayed from its seed, party order and recorded decisions (`createDecisionRecorder` / `createScriptedController` in `core/controllers.js`). See [Architecture](docs/ARCHITECTURE.md#turns-controllers-and-decisions).

Run tests:

```bash
node --test
```

## Documentation

- [Project status](docs/PROJECT_STATUS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Combat mechanics](docs/COMBAT_MECHANICS.md)
- [Roster and skills](docs/ROSTER_AND_SKILLS.md)
- [Testing and playtesting](docs/TESTING_AND_PLAYTESTING.md)
- [Step 3 full-battle regression report](docs/STEP3_FULL_BATTLE_REGRESSION.md)
- [Step 4 typed combat events](docs/STEP4_TYPED_COMBAT_EVENTS.md)
- [Step 5 headless simulator](docs/STEP5_HEADLESS_SIMULATOR.md)
- [Development roadmap](docs/ROADMAP.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)
- [AI handoff / continuation prompt](docs/AI_HANDOFF.md)

## Repository layout

```text
ai/                 Enemy decision-making and target selection
characters/          Actor factory, Falcon roster, enemies, skills (Elishia's come from data/)
data/skills/        Skill data for all five Falcon agents (Elishia also defines passive and Meo-9); interpreter is core/skillInterpreter.js
core/               Battle orchestration, state, action resolution, turn engine, seeded RNG, event bus
systems/             Readiness, opening initiative, formation, damage, cooldown, shield, status systems
ui/                 Terminal menus, deployment selection, logs, status display
test/               Automated tests (scheduler, RNG, event bus, determinism, opening initiative, controllers, golden transcripts)
tools/              Dev tools (scheduler comparison, headless simulator, golden updater) and helpers in tools/lib/
docs/               Project reference and development history
index.js             Entry point and scheduler selection
```

## Branch policy

- `main`: stable baseline / merge destination.
- `development`: active experimentation and integration branch.
- Keep scheduler comparisons and experimental combat tuning in `development`.
- Merge to `main` only after tests, battle regression, and playtest review are satisfactory.

## Source / documentation status

The standard setup uses **5 active Falcon agents vs. 5 active enemies**. Falcon skills follow the owner-provided reference; the project keeps only extracted stats, skills, and stat descriptions in `references/characterTerraData.js`. Enemy skills are still handled by `ai/enemyAI.js`. Steps 1–4 are complete; see the roadmap for the next milestone. See [Project status](docs/PROJECT_STATUS.md) and [Owner skill reference](docs/OWNER_SKILL_REFERENCE.md).
