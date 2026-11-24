# Testing and Playtesting

## Automated test command

From the project root:

```bash
npm test
```

This runs Node's built-in test runner (`node --test`). No third-party test framework or install step is required.

The historical Iteration 3 and Iteration 5 snapshots had earlier test totals. The current three-faction checkout reports **367 tests passing, 0 failing, 0 skipped** after Serpent migration and selector-preview coverage. Always use the result from the current checkout rather than relying on a historical count.

## Test consolidation policy

The current test suite was reviewed for redundancy in [Test Redundancy Review](TEST_REDUNDANCY_REVIEW.md). No test sources were removed: the review found related coverage clusters but no proven duplicate assertions safe to delete. Similar test names or topics are not sufficient grounds for removal.

## Test suite map

The test suite is grouped by responsibility. Keep tests that protect distinct contracts; consolidate only when overlap is proven and coverage remains explicit.

| Area | Test files | Coverage focus |
|---|---|---|
| Core combat and targeting | `basicAttack.test.js`, `cleansePriority.test.js`, `damageAttribution.test.js`, `passiveModifiers.test.js`, `statusDisplay.test.js` | Action resolution, damage sources, cleanse ordering, modifiers, player-facing status presentation |
| Battle flow and controller contracts | `controllers.test.js`, `eventBus.test.js`, `turnViewAndDecisions.test.js`, `factionSideRelativeSupport.test.js`, `fullBattleRegression.test.js` | Legal action views, controller injection, decisions, battle integration, side-relative support |
| RNG and replay determinism | `determinism.test.js`, `rng.test.js`, `goldenTranscripts.test.js`, `goldenElishia.test.js` | Seeded replay, RNG behavior, exact transcript/final-state fixtures |
| Scheduling and initiative | `openingInitiative.test.js`, `thresholdCombatReadiness.test.js` | Opening policy, continuous readiness, tie fairness, reserve CR and scheduler previews |
| Effect, passive, summon and timing registries | `effectRegistry.test.js`, `effectTiming.test.js`, `passiveRegistry.test.js`, `summonRegistry.test.js`, `battleTimers.test.js`, `skillSetAlias.test.js` | Shared handler contracts, duration/stacking, lifecycle hooks, timers and aliases |
| Skill definitions and faction mechanics | `falconSkillData.test.js`, `falconApprovedSkillData.test.js`, `falconApprovedElishia.test.js`, `falconApprovedLifecycle.test.js`, `falconApprovedRoster.test.js`, `falconFinalizedMechanics.test.js`, `elishiaMechanics.test.js`, `phantomMigration.test.js`, `serpentMigration.test.js` | Skill schema, faction passives, and migration coverage |
| Faction AI and matchup integration | `falconTacticalController.test.js`, `falconTacticsV2.test.js`, `phantomBattleIntegration.test.js`, `phantomFactionDuel.test.js`, `serpentTactics.test.js`, `fieldMedicSwap.test.js` | Tactical controller decisions, real battles, faction support on either side, and matchup tooling |
| Enemy data and encounter progression | `enemyDataAndEncounter.test.js`, `enemySkillData.test.js`, `encounterProgression.test.js`, `engineCoverageAudit.test.js` | Enemy kits, policies, encounters, waves, reinforcement hooks, and registry-wide contract audits |
| Simulator and reporting | `simulator.test.js`, `battleTelemetry.test.js` | CLI options, batch metrics, telemetry, output formats and aggregation |
| Roster and reference boundaries | `unifiedRosterSelection.test.js`, `referencePackaging.test.js` | Mixed-faction selection, public previews, active/reserve formation and compact reference packaging |

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
