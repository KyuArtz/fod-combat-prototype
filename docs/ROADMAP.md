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
- [x] Full-battle integration/regression tests for all Falcon skills, Taunt/Stagger AI behavior, victory/defeat, reserve replacement/switching and deterministic replay (see `docs/STEP3_FULL_BATTLE_REGRESSION.md`).

## Phase B — Battle balance

- [x] Compare 5v5 threshold and legacy (scheduler-only and 120 seeded scripted battles, `tools/compareSchedulers.js`); a hand-played legacy 5v5 log has not been collected.
- [x] Player-first opening initiative for PvE (`FOD_OPENING`, ADR-010).
- [ ] Decide opening-initiative policy for PvP and ambush encounters (`firstSide: "enemy"` exists in code).
- [ ] Tune SPD against MP regeneration and cooldown pacing.
- [ ] Review damage/defense/resistance scaling.
- [ ] Evaluate enemy target selection and action variety.
- [x] Add deterministic RNG/seed option for reproducible simulations (`FOD_SEED`, `state.rng`).
- [x] Add headless simulator CLI and combat analytics summary (actions, HP damage received, healing, shields, MP use); source-attributed damage remains a known event-schema limitation.

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
- [x] Typed combat lifecycle/action events with validated, clone-safe payloads (step 4).
- [x] Replay from seed + party order + recorded decisions (`createDecisionRecorder`, `createScriptedController`).
- [ ] Combat log export to a file and a command-line replay tool.
- [ ] Save/load battle snapshots.
- [x] Data-driven skills for the Training Drone and Rogue Automaton (see `docs/STEP6_DATA_DRIVEN_ENEMY_SKILLS.md`).
- [ ] Data-driven encounter configuration and migration of additional enemy kits.

## Phase F — Agreed combat-engine sequence

- [x] Step 1: migrate Falcon skills to data-driven definitions and a shared interpreter.
- [x] Step 2: unify player/enemy basic-attack execution in `core/actionResolver.js`.
- [x] Owner-reference alignment: implement all sufficiently specified Falcon skills/passives from the owner-provided character reference (selected extract: `references/characterTerraData.js`); document source gaps rather than inventing values.
- [x] **Step 3: full-battle regression coverage.** Added 27 battle-level tests; full suite at that milestone was 171/171 passing.
- [x] **Step 4: typed combat events** alongside text logs; see `docs/STEP4_TYPED_COMBAT_EVENTS.md`.
- [x] **Step 5: headless simulator CLI** for repeatable balance runs; see `docs/STEP5_HEADLESS_SIMULATOR.md`.
- [x] **Step 6: data-driven enemy skills** for the Training Drone and Rogue Automaton, using the shared interpreter and preserving existing AI policy.

### Owner-reference gaps to resolve

- [ ] Meo-v9 Final Protocol EMP damage scaling.
- [ ] Nanotech Singularity enemy DoT amount/scaling.
- [ ] Catalyst Wing HP/targetability/destruction trigger.
- [ ] Decide whether to add a general skill-hit accuracy model beyond basic attacks.
- [ ] Separately decide when to sync base Falcon stats from the owner-provided character reference into `characters/falcon.js`.

## Release/merge gate

A development milestone should be considered merge-ready only when:

1. Automated tests pass.
2. Battle-level regression cases pass.
3. Manual playtest findings are recorded.
4. No known blocker remains untriaged.
5. Documentation/changelog are updated.
6. Main-branch compatibility is checked.
