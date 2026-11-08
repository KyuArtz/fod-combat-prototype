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
- [ ] Reconcile source snapshot with latest 5v5 configuration.
- [ ] Full 5v5 battle integration/regression tests.

## Phase B — Battle balance

- [ ] Compare 5v5 threshold and legacy logs.
- [ ] Tune SPD against MP regeneration and cooldown pacing.
- [ ] Review damage/defense/resistance scaling.
- [ ] Evaluate enemy target selection and action variety.
- [ ] Add deterministic RNG/seed option for reproducible simulations.
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
- [ ] Combat log export and replay.
- [ ] Save/load battle snapshots.
- [ ] Data-driven skill and encounter configuration.

## Release/merge gate

A development milestone should be considered merge-ready only when:

1. Automated tests pass.
2. Battle-level regression cases pass.
3. Manual playtest findings are recorded.
4. No known blocker remains untriaged.
5. Documentation/changelog are updated.
6. Main-branch compatibility is checked.
