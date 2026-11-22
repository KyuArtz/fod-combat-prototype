# Documentation Index

This index is the entry point for project documentation. Current-state documents describe the code as it exists now; milestone reports preserve the historical scope and limitations at the time each change was made.

## Project guidance

| Document | Purpose |
|---|---|
| [Project status](project/PROJECT_STATUS.md) | Current implemented capabilities, verification, and known limitations |
| [Baseline audit](project/BASELINE_AUDIT.md) | Findings, restructuring decisions, and verification for this documentation/codebase pass |
| [Roadmap](project/ROADMAP.md) | Remaining work and planned development sequence |
| [Testing and playtesting](project/TESTING_AND_PLAYTESTING.md) | Test commands, regression policy, simulator use, and merge gate |
| [AI handoff](project/AI_HANDOFF.md) | Concise source-grounded continuation context and development rules |
| [Architecture decisions](project/DECISIONS.md) | Accepted and deferred design decisions (ADRs) |
| [Changelog](project/CHANGELOG.md) | Chronological record of implementation milestones |
| [Cleanup report](project/CLEANUP_REPORT.md) | Obsolete-code/test removals and intentionally preserved compatibility coverage |
| [Engine coverage audit](project/ENGINE_COVERAGE_AUDIT.md) | Registry, targeting, DoT attribution, summon ownership, and reserve-lifecycle verification |

## Technical references

| Document | Purpose |
|---|---|
| [Architecture](reference/ARCHITECTURE.md) | Module ownership, runtime flow, and data boundaries |
| [Combat mechanics](reference/COMBAT_MECHANICS.md) | Current scheduler, turn, damage, status, and encounter rules |
| [Roster and skills](reference/ROSTER_AND_SKILLS.md) | Runtime roster, mastery types, skill registry overview |
| [Unified roster selection](reference/UNIFIED_ROSTER_SELECTION.md) | Mixed-faction selection, filters, character previews, formation ordering, and extension guidance |
| [Falcon implementation guide](reference/FALCON_IMPLEMENTATION_GUIDE.md) | Executable Falcon skill/passive behavior and exact values |
| [Phantom implementation guide](reference/PHANTOM_IMPLEMENTATION_GUIDE.md) | Executable Phantom skill/passive behavior, neutral hidden-operative copy, and migration notes |
| [Falcon approved-kit history](history/milestones/STEP9_SUPERSEDED_FALCON_MECHANICS.md) | Historical Step 9 decisions, superseded where they conflict with ADR-017 |
| [Enemy archetypes and balance](reference/ENEMY_ARCHETYPES_AND_BALANCE.md) | Six enemy passive/skill kits, the Blightheart boss, tactical Falcon policy, and seeded playtest results |
| [Owner skill reference](reference/OWNER_SKILL_REFERENCE.md) | Authority and handling of the compact owner-reference extract |
| [Player-facing skill copy](reference/PLAYER_FACING_SKILL_COPY.md) | Descriptive text; executable data remains authoritative |

## Historical milestone reports

These reports preserve the scope and verification recorded when each milestone was completed. If a historical limitation conflicts with a current technical reference, use the current reference and current source.

- [Step 3 — Full-battle regression coverage](history/milestones/STEP3_FULL_BATTLE_REGRESSION.md)
- [Step 4 — Typed combat events](history/milestones/STEP4_TYPED_COMBAT_EVENTS.md)
- [Step 5 — Headless simulator](history/milestones/STEP5_HEADLESS_SIMULATOR.md)
- [Step 6 — Data-driven enemy skills](history/milestones/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md)
- [Step 7 — Data-driven enemy AI and encounters](history/milestones/STEP7_DATA_DRIVEN_ENEMY_AI_AND_ENCOUNTERS.md)
- [Step 8 — Encounter progression, waves, and reinforcements](history/milestones/STEP8_ENCOUNTER_PROGRESSION.md)
- [Falcon skill migration history](history/milestones/FALCON_SKILL_MIGRATION.md)

## Documentation maintenance rules

1. Keep current behavior in one authoritative reference; do not copy the same full explanation into status, roadmap, handoff, and changelog pages.
2. Keep `PROJECT_STATUS.md` concise and current. Put planned work in `ROADMAP.md`, decisions in `DECISIONS.md`, and completed historical details in `CHANGELOG.md` or milestone reports.
3. Treat implementation guides as descriptive references, not substitutes for executable data and tests.
4. Every internal Markdown link must resolve. Update this index when adding, moving, or retiring a document.
5. Historical milestone limitations must be labeled as historical when later work supersedes them.
