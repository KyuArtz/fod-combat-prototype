# Testing and Playtesting

## Automated test command

From the project root:

```bash
npm test
```

This runs Node's built-in test runner (`node --test`). No third-party test framework or install step is required.

The pre-cleanup Iteration 3 snapshot contained 311 discovered tests, including 38 skipped superseded assertions. The cleaned checkout now reports **260 tests passing, 0 failing, 0 skipped**. Always use the result from the current checkout rather than relying on a historical count.

## Test suite map

| Test file | Main coverage |
|---|---|
| `basicAttack.test.js` | Shared player/enemy basic attack, evasion, retaliation, invalid inputs |
| `controllers.test.js` | Controller injection, headless battles, decision recording/replay, rejected decisions |
| `determinism.test.js`, `rng.test.js` | Seed validation, RNG state, deterministic battle replay |
| `eventBus.test.js` | Event delivery, subscriptions, typed event contracts, payload behavior |
| `battleTimers.test.js`, `effectRegistry.test.js`, `effectTiming.test.js` | Battle-scoped timers, pluggable effect handlers, and status/shield duration timing |
| `passiveModifiers.test.js`, `passiveRegistry.test.js`, `summonRegistry.test.js` | Generic passive modifiers, passive event dispatch, and reusable summon lifecycle handlers |
| `damageAttribution.test.js` | Direct, reflected, and DoT source attribution and simulator damage contribution metrics |
| `openingInitiative.test.js` | Player-first and speed opening policies, ties, scheduler compatibility |
| `thresholdCombatReadiness.test.js` | Continuous readiness, tie ordering, CR adjustments, reserves, cloned state |
| `turnViewAndDecisions.test.js` | Turn views, legal action shapes, target validation, terminal decisions |
| `falconApprovedSkillData.test.js`, `falconSkillData.test.js`, `enemySkillData.test.js` | Approved Falcon definitions, generic data validation, registry construction and shared interpreter execution |
| `elishiaMechanics.test.js`, `falconApprovedElishia.test.js`, `falconApprovedLifecycle.test.js`, `falconApprovedRoster.test.js`, `falconFinalizedMechanics.test.js`, `effectTiming.test.js` | Adaptive Barrier, approved Falcon passives/skills, cross-kit generic mechanics, and status/shield duration timing |
| `fullBattleRegression.test.js` | Full-battle skill use, AI interactions, battle outcomes, status timing, switching, reserves |
| `goldenTranscripts.test.js`, `goldenElishia.test.js` | Deterministic full-battle logs and final-state fixtures |
| `enemyDataAndEncounter.test.js` | Enemy archetype, policy, boss passive, and encounter data validation |
| `falconTacticalController.test.js` | Deterministic tactical player controller, legal actions, and boss-encounter execution |
| `encounterProgression.test.js` | Waves, stat overrides, reinforcement triggers, lifecycle and completion callback |
| `simulator.test.js` | CLI validation, deterministic batch metrics, output formats, encounter reporting |
| `referencePackaging.test.js` | Ensures the compact owner-reference package contains only the intended reference file |

Golden fixtures are stored in `test/fixtures/golden/` as compressed files.

## Golden transcript policy

Golden transcripts protect seeded battle behavior, terminal prompts, action order, and combat output. If a test fails after a refactor, first determine whether the change was intended.

Only regenerate fixtures for an intentional behavior or presentation change:

```bash
node tools/updateGolden.js
npm test
```

Review the fixture diff and record the reason in the changelog. Do not update fixtures merely to silence a regression.

## Headless simulation

Examples:

```bash
npm run simulate -- --battles 100 --seed 42 --encounter trainingGround
npm run simulate -- --battles 100 --seed 42 --encounter droneCalibration
npm run simulate -- --battles 100 --seed 42 --encounter siegeBreakthrough
npm run simulate -- --battles 150 --seed 20266122 --policy tactical --encounter blightheartSanctum --format json --out reports/falcon-boss.json
npm run simulate -- --battles 100 --seed 42 --format json --out reports/sample.json
```

The simulator reuses `createBattle` and the production battle systems. Review the [Step 5 simulator report](../history/milestones/STEP5_HEADLESS_SIMULATOR.md) for metric definitions and caveats. The simulator reports damage by receiving side and, for source-attributed damage events, by attacking actor; JSON rows also include `skillUsesByActor` and `skillUsesByKey`. The deterministic `tactical` player policy is available for role-aware Falcon comparisons, and `blightheartSanctum` is a two-stage boss encounter. `DamageApplied` includes `sourceId`, `sourceSide`, and `kind`; periodic damage with no retained source is attributed to a null source.

## Scheduler comparison

```bash
npm run compare:schedulers -- 60
```

The comparison tool is useful when changing readiness or opening initiative. Keep the player policy and seed range identical when comparing configurations.

## Manual playtest notes

Record:

- Date, branch, and commit.
- Encounter, scheduler, opening policy, and seed.
- Player controller or manual decision policy.
- Outcome, rounds, and observed turn order.
- Unexpected status, cooldown, shield, reserve, or reinforcement behavior.
- Expected behavior versus actual behavior.
- Follow-up action and whether it is a bug, balance issue, or design question.

A high win rate from a random/basic policy or a small seed sample is a smoke-test observation, not a balance verdict.

## Merge gate

- [ ] `npm test` passes.
- [ ] Relevant full-battle regressions pass.
- [ ] Golden fixture changes are intentional and reviewed.
- [ ] Relevant simulator configurations are recorded.
- [ ] Manual playtest findings are documented where applicable.
- [ ] Documentation and source agree on behavior and known limitations.
- [ ] Final Git diff is reviewed on the intended branch.
