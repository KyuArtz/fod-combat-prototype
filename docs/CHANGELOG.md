# Changelog

This changelog records notable project decisions and implementation milestones. It is not a substitute for Git history.

## 2026-11-07 — Documentation baseline / threshold scheduler hardening

- Documented threshold scheduler as preferred implementation.
- Captured scheduler comparison against legacy and an external patch review.
- Recorded scheduler state on `state.scheduler` for cloned-state previews.
- Recorded CR-pull ready-queue order: CR, effective SPD, stable actor key.
- Added/verified formation-order-independent tie behavior and rotating tie cursor.
- Added long-run real-roster and randomized SPD/time-order checks.
- Test suite verified from supplied ZIP: **18/18 passing**.
- Development branch testing moved from 4v5 to **5v5** per project owner.
- Reserve logic remains in place; no reserve members are held when all five Falcon agents are active.
- Future agent leveling and stage mechanics remain planned.

## Earlier scheduler comparison (reported)

- Legacy: 351 incorrect time-order selections out of 440 real-roster turns; Zenki 132 turns.
- Threshold: 0 incorrect time-order selections; Zenki 110 turns, matching SPD share.
- Claude patch: also corrected time ordering but lacked formation-independent tie rotation; threshold was retained.

## Changelog discipline

For every future milestone, add:

- Date and branch/commit.
- Added/changed/removed behavior.
- Reason or issue addressed.
- Tests run and results.
- Playtest outcome.
- Known limitations and next steps.
