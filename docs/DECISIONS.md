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
**Source note:** ZIP's Falcon `maxActive` is still 4 and needs reconciliation with the latest 5v5 report.

## ADR-007 — Overshoot carry-over deferred

**Status:** Deferred  
**Decision:** Do not add overshoot carry-over yet.  
**Reason:** It matters primarily once CR-boost/CR-pull skills are introduced; current behavior should remain simpler until those mechanics are tested.
