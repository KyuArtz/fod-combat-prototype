# Architecture & Design Decisions

## ADR-001 — Keep both readiness schedulers during experimentation

**Status:** Accepted  
**Decision:** Keep legacy and threshold schedulers selectable. Threshold is the preferred scheduler; legacy exists for A/B comparison and regression reference.  
**Reason:** The new implementation corrects SPD/time-order behavior while retaining a baseline for measuring impact.  
**Selection:** `FOD_SCHEDULER=threshold` (default) or `FOD_SCHEDULER=legacy`.

## ADR-002 — Threshold scheduler uses continuous readiness

**Status:** Accepted  
**Decision:** Actors accumulate readiness continuously according to effective SPD and become ready at CR 100.  
**Reason:** Fixed-step advancement caused incorrect selection order and skewed turn shares.  
**Trade-off:** Fast actors can legitimately act consecutively; this is not automatically a bug.

## ADR-003 — Scheduler state belongs to battle state

**Status:** Accepted  
**Decision:** Threshold scheduler bookkeeping (`time`, `tieCursor`, `readyQueue`) is stored in `state.scheduler`.  
**Reason:** State copies can support future GUI turn-order previews, replay, and save snapshots.  
**Constraint:** Use `structuredClone`; JSON round-tripping breaks ready-queue actor references.

## ADR-004 — Stable, rotating tie handling

**Status:** Accepted  
**Decision:** Simultaneous crossings use stable actor keys and a rotating tie cursor.  
**Reason:** Tie order should not be dictated by actor array/formation order or always favor one side.  
**Behavior:** One cursor is shared across tie groups within a battle state. Rotation is deterministic, but a tie's offset depends on previous tie groups; this is intentional and should remain documented.

## ADR-005 — Inject scheduler into battle engine

**Status:** Accepted  
**Decision:** `core/battle.js` chooses and injects the scheduler into `core/turnEngine.js`.  
**Reason:** Keeps the turn engine scheduler-agnostic and supports A/B testing.

## ADR-006 — Formation data separates roster, active, and reserve

**Status:** Accepted  
**Decision:** Party containers keep `roster`, `active`, `reserve`, and `maxActive`. `state.actors` contains deployed scheduler actors.  
**Reason:** Supports full-party selection now and reserve/stage management later.  
**Current test setup:** Five active Falcon agents vs five active enemies; reserves are empty at this roster/active-cap configuration.  
**Source note:** Resolved 2026-11-07: `maxActive` is 5 for both parties in source.

## ADR-007 — Overshoot carry-over deferred

**Status:** Deferred  
**Decision:** Do not add overshoot carry-over yet.  
**Reason:** It matters primarily once CR-boost/CR-pull skills are introduced; current behavior should remain simpler until those mechanics are tested.

## ADR-008 — Battle randomness is seeded and stored as plain data on state

**Status:** Accepted (2026-11-07)  
**Decision:** All engine randomness draws from `state.rng` (`{ seed, state }`, mulberry32) through the battle context's `random()`. Engine code must not call `Math.random()` directly. The seed is printed at battle start and can be set with `createBattle({ seed })` or `FOD_SEED`.  
**Reason:** Reproducible bugs, replays, simulations, and cloned-state previews. Plain-data state means `structuredClone(state)` carries the RNG forward with the rest of the battle.  
**Trade-off:** Replay requires the same seed *and* the same menu choices; choices are not recorded yet. Changing the RNG algorithm changes what every saved seed replays, so `test/rng.test.js` locks golden values.

## ADR-009 — Engine output flows through an event bus

**Status:** Accepted (incremental migration, 2026-11-07)  
**Decision:** `say()` emits `Log` events on a synchronous bus; the terminal printer is one subscriber. Typed events will be added alongside text logs rather than replacing them in one step.  
**Reason:** A GUI, headless simulator, or test must be able to observe battles without parsing console text.  
**Constraints:** Event payloads are plain, structured-clone-friendly data. Handler errors propagate to the emitter so a broken view fails loudly instead of desyncing from the engine.

## ADR-010 — Player-first opening initiative (PvE)

**Status:** Accepted (2026-11-07)  
**Decision:** At battle start the player's side acts first. If the enemy's fastest unit would be ready first or tied, every living ally gets a uniform time head start (`CR += SPD * delta`) just large enough that the fastest ally is ready strictly first. Selectable with `openingInitiative: "player-first" | "speed"` / `FOD_OPENING`; default `player-first`.  
**Reason:** Accurate SPD ordering exposed that the fastest unit in 5v5 is an enemy (Recon Drone 115 vs Zenki 110), so the enemy opened the battle. The legacy scheduler only avoided this by accident (clamped CR ties resolved by array order). In PvE the player should start.  
**Alternatives rejected:** a free extra opening turn for one ally (adds a turn to the player's share); per-ally flat CR bonuses (do not guarantee the fastest-vs-fastest outcome); forcing the first pick in the scheduler (violates time order and needs per-scheduler changes).  
**Trade-off:** Allies gain a small phase advantage (about 0.04 time units on the real roster), so a few early close calls can flip in the player's favor; long-run turn share is unchanged. `applyOpeningInitiative` supports `firstSide: "enemy"` for future ambush stages; PvP policy is undecided.

