# P1.2.10 — Pressure Telemetry Correctness Validation

## Objective
Validate the pressure telemetry implementation against `DamageApplied` event history before using it for tactical decisions. No combat policy, thresholds, or balance values were changed.

## Coverage
- Six deterministic integration-test battles across `random` and `basic` controller policies, with standard and reversed party orders.
- Additional 40-seed validation batch (seeds 4107–4146), alternating controller policies and varying formation orientation.
- Reconstructed event round from `RoundStarted` and compared the rolling three-round window against actual `DamageApplied.hpLoss`.
- Compared target/source aggregate HP damage, hit count, and last-hit round; duplicate actor IDs were normalized for cross-source comparison.
- Validation pruned telemetry at final battle round before comparing.

## Results
- 40/40 additional seeded battles matched exactly.
- 573 eligible HP-damage events reconciled.
- 32,123 HP damage reconciled.
- Average battle length: 18.725 rounds.
- Full test suite: 376 passed.
- JavaScript syntax checks: 162 files passed.

## Conclusion
Pressure telemetry correctly reconciles with opposing-source `DamageApplied` HP-loss events for the validated seed/policy/formation sample. No discrepancy was found. This confirms the current capture and rolling-window aggregation in the sampled battles; it does not establish correctness for every edge case or authorize policy changes.

## Next
P1.2.11 may begin as a pressure-aware rotation policy experiment, keeping telemetry correctness fixed and evaluating policy changes with matched seeds, both seats, and explicit baseline comparisons.
