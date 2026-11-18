# Documentation and Codebase Baseline Audit

**Audit snapshot:** 2026-11-18  
**Input:** `fod-combat-prototype-11-18-26.zip`  
**Purpose:** establish a maintainable documentation and module baseline before resuming feature development.

## Baseline observations

The supplied archive was structurally intact and its initial automated suite passed **202 tests, 0 failures**. The audit identified:

- Current-state pages repeated historical milestone details and had inconsistent descriptions of implemented Falcon mechanics.
- Several pages referred to the obsolete `ref/` path or described the compact reference as if it were the full website roster.
- Some milestone-era limitations had not been marked as historical after later steps superseded them.
- The testing guide contained stale test descriptions and duplicated milestone detail.
- The skill runtime combined execution orchestration, effect handlers, validation, message formatting, and passive/summon lifecycle responsibilities in one large module.
- The project had no package manifest, standard npm scripts, ignore rules for generated simulation output, or editor/line-ending conventions.
- Previously generated simulator reports were included without enough context to establish them as durable project artifacts.

## Changes made

### Documentation structure

- Added `docs/README.md` as the documentation index.
- Moved current technical references to `docs/reference/`.
- Moved project status, roadmap, testing, handoff, decisions, and changelog to `docs/project/`.
- Moved Step 3–8 reports and the original Falcon skill migration report to `docs/history/milestones/`.
- Renamed the player-facing copy document to `PLAYER_FACING_SKILL_COPY.md` to distinguish descriptive copy from executable mechanics.
- Rewrote current status, roadmap, testing guide, AI handoff, architecture reference, combat mechanics, roster/skills, owner-reference guidance, and Step 9 finalization note.
- Marked historical limitations as historical where later milestones superseded them.
- Added this audit record and checked all internal Markdown links.

### Code organization

Split the former combined skill runtime into five modules:

- `core/skillInterpreter.js`: skill execution orchestration and skill metadata.
- `core/skillLifecycle.js`: passive, summon, and actor lifecycle hooks.
- `core/skillEffects.js`: declarative effect handlers.
- `core/skillDataValidation.js`: definition validation.
- `core/skillMessages.js`: message placeholder formatting.

The original public exports from `core/skillInterpreter.js` (`createSkillInterpreter`, `validateSkillData`, and `formatMessage`) remain available to avoid breaking existing callers and tests. This was a responsibility split; skill behavior and data were not intentionally changed.

### Project conventions

- Added `package.json` with `start`, `test`, `simulate`, and `compare:schedulers` scripts and Node.js `>=18` requirement.
- Added `.gitignore`, `.editorconfig`, and `.gitattributes`.
- Removed unlabelled generated `reports/results.json` and `reports/results.csv` from the project package; added `reports/README.md` and ignore rules for generated JSON/CSV reports.
- Kept `references/characterTerraData.js` as the only in-project owner-reference file. No `ref/` directory or full original JSON was added.

## Verification

| Check | Result |
|---|---|
| Supplied archive integrity | Passed |
| Initial baseline test suite | 202 passed, 0 failed |
| Tests after skill runtime split | 202 passed, 0 failed |
| JavaScript syntax (`node --check` for every `.js`) | Passed |
| Local CommonJS dependency scan (82 source modules) | All local require targets resolved; no dependency cycles detected |
| Internal Markdown links | All checked links resolve |
| `npm run simulate` smoke test, `siegeBreakthrough`, 3 seeded battles | 3/3 completed; two waves and reinforcement metrics reported; 0 rejected decisions |
| `npm run compare:schedulers -- 5` | Completed for both schedulers and opening policies |
| Reference package check | Only `references/characterTerraData.js` is present |

Simulation smoke results are execution checks only, not balance conclusions.

## Deliberately unchanged

- Combat formulas, skill values, AI policies, encounter definitions, and battle rules.
- Golden transcript fixtures and other existing tests.
- The current five-enemy-per-wave formation requirement.
- The owner-approved Step 9 Falcon mechanics and the separate open decision about runtime base-stat synchronization.

## Remaining review items

- The project owner should review the reorganized documentation and module boundaries before feature development resumes.
- Any further extraction from `core/battle.js` or `core/skillLifecycle.js` should be driven by a specific responsibility or testability problem, not by file length alone.
- The next planned feature milestone remains Reward System and Stage Progression Foundation; it is intentionally not part of this audit.
