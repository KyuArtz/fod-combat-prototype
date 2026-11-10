# Development Roadmap

This is a planning list, not a promise that every item is scheduled. Mark items only after implementation and verification.

## Phase A — Combat foundation (current)

- [x] Modular CLI combat loop.
- [x] Actor factory and roster definitions.
- [x] Physical/mastery damage path.
- [x] MP, cooldown, shield, status-effect foundations.
- [x] Enemy AI and target selection.
- [x] Active/reserve formation structure.
- [x] Legacy readiness scheduler.
- [x] Threshold continuous-readiness scheduler.
- [x] Scheduler injection and `FOD_SCHEDULER` A/B selection.
- [x] Scheduler tests for time ordering, ties, cloned previews, state isolation.
- [x] Reconcile source snapshot with latest 5v5 configuration.
- [ ] Full 5v5 battle integration/regression tests (partial: determinism tests play a full scripted 5v5 battle; victory/defeat variants, skills, AI, and reserve transitions are not yet asserted individually).

## Phase B — Battle balance

- [x] Compare 5v5 threshold and legacy (scheduler-only and 120 seeded scripted battles, `tools/compareSchedulers.js`); a hand-played legacy 5v5 log has not been collected.
- [x] Player-first opening initiative for PvE (`FOD_OPENING`, ADR-010).
- [ ] Decide opening-initiative policy for PvP and ambush encounters (`firstSide: "enemy"` exists in code).
- [ ] Tune SPD against MP regeneration and cooldown pacing.
- [ ] Review damage/defense/resistance scaling.
- [ ] Evaluate enemy target selection and action variety.
- [x] Add deterministic RNG/seed option for reproducible simulations (`FOD_SEED`, `state.rng`).
- [ ] Add combat analytics summary (actions, damage, healing, resource use).

## Phase C — Agent management

- [ ] Define roster size versus active cap.
- [ ] Define deployment restrictions and unavailable agents.
- [ ] Define stage-specific active limits.
- [ ] Add agent selection/management UI beyond terminal selection.
- [ ] Validate enemy formation and reinforcement behavior.

## Phase D — Progression / stage mechanics (future)

- [ ] Agent leveling and experience.
- [ ] Stage definitions and enemy encounter composition.
- [ ] Stage rewards and completion tracking.
- [ ] Persistent agent data separate from battle runtime state.
- [ ] Progression/save schema and migration strategy.
- [ ] Balance scaling by stage/level.

## Phase E — Presentation and tooling (future)

- [ ] GUI battle view.
- [ ] Turn-order preview using cloned battle state.
- [x] Event bus carrying `Log` events (step 1).
- [x] Replay from seed + party order + recorded decisions (`createDecisionRecorder`, `createScriptedController`).
- [ ] Combat log export to a file and a command-line replay tool.
- [ ] Save/load battle snapshots.
- [ ] Data-driven skill and encounter configuration.

## Phase F — Engine/view separation (planned order)

- [x] Step 1: seeded RNG and event bus.
- [x] Step 2: controller interface; the terminal menu and enemy AI are controllers, with headless, random and scripted controllers, decision validation and exact replays (ADR-011, ADR-012).
- [ ] Step 3: data-driven skills with an effect interpreter, migrated one skill at a time with old-vs-new golden tests (same seed, compare HP/shields/statuses).
- [ ] Step 4: typed events (`TurnStarted`, `DamageDealt`, ...) alongside text logs.
- [ ] Step 5: headless simulator CLI for balance runs (building blocks exist: `tools/lib/headless.js`, random and basic-attack controllers).

## Release/merge gate

A development milestone should be considered merge-ready only when:

1. Automated tests pass.
2. Battle-level regression cases pass.
3. Manual playtest findings are recorded.
4. No known blocker remains untriaged.
5. Documentation/changelog are updated.
6. Main-branch compatibility is checked.
