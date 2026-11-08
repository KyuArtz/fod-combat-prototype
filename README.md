# F.O.D. Combat Prototype

A Node.js command-line sandbox for experimenting with **Fragments of Decay (F.O.D.)** combat mechanics. This repository is a development/playtest project, not yet the production combat implementation.

> **Current development direction (2026-11-07):** threshold-based continuous readiness is the preferred scheduler; development testing has moved to a **5 Falcon vs. 5 enemy active formation**. Reserve systems remain implemented, but with five Falcon agents deployed, the current test setup has no reserve members.

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
core/               Battle orchestration, state, action resolution, turn engine
systems/             Readiness, formation, damage, cooldown, shield, status systems
ui/                 Terminal menus, deployment selection, logs, status display
test/               Automated scheduler tests
docs/               Project reference and development history
index.js             Entry point and scheduler selection
```

## Branch policy

- `main`: stable baseline / merge destination.
- `development`: active experimentation and integration branch.
- Keep scheduler comparisons and experimental combat tuning in `development`.
- Merge to `main` only after tests, battle regression, and playtest review are satisfactory.

## Scope caveat

The uploaded ZIP's `core/battleState.js` sets `party.maxActive` to **4**, while the latest project update described in the conversation says development is now **5v5**. The docs record the latest intended test configuration as 5v5, but the source snapshot must be reconciled before assuming the ZIP itself launches 5v5. See [Project status](docs/PROJECT_STATUS.md).
