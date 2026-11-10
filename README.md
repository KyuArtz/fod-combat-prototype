# F.O.D. Combat Prototype

A Node.js command-line sandbox for experimenting with **Fragments of Decay (F.O.D.)** combat mechanics. This repository is a development/playtest project, not yet the production combat implementation.

> **Current development direction (2026-11-07):** threshold-based continuous readiness is the preferred scheduler; development testing uses a **5 Falcon vs. 5 enemy active formation**. Reserve systems remain implemented, but with five Falcon agents deployed, the current test setup has no reserve members. Battles are now **seeded and replayable** (`FOD_SEED`), and battle log lines flow through an **event bus** (engine/view separation, step 1). In PvE the **player's side acts first** (opening initiative), because the fastest unit in 5v5 is an enemy (Recon Drone, SPD 115 vs Zenki 110). Every turn is **controller-driven**: the terminal menu, the enemy AI, and headless/scripted players all plug into the same view-and-decision interface (engine/view separation, step 2).

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
- [Development roadmap](docs/ROADMAP.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)
- [AI handoff / continuation prompt](docs/AI_HANDOFF.md)

## Repository layout

```text
ai/                 Enemy decision-making and target selection
characters/          Actor factory, Falcon roster, enemies, skills
core/               Battle orchestration, state, action resolution, turn engine, seeded RNG, event bus
systems/             Readiness, opening initiative, formation, damage, cooldown, shield, status systems
ui/                 Terminal menus, deployment selection, logs, status display
test/               Automated tests (scheduler, RNG, event bus, determinism, opening initiative, controllers, golden transcripts)
tools/              Dev tools (scheduler comparison, golden-transcript updater) and helpers in tools/lib/
docs/               Project reference and development history
index.js             Entry point and scheduler selection
```

## Branch policy

- `main`: stable baseline / merge destination.
- `development`: active experimentation and integration branch.
- Keep scheduler comparisons and experimental combat tuning in `development`.
- Merge to `main` only after tests, battle regression, and playtest review are satisfactory.

## Source / documentation status

As of the 2026-11-07 snapshot, `core/battleState.js` sets `maxActive` to **5** for both parties, so source and documentation agree on 5v5. See [Project status](docs/PROJECT_STATUS.md).
