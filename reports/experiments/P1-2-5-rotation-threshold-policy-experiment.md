# P1.2.5 — Rotation Threshold Policy Experiment

## Objective
Compare Verra's current 16% rotation threshold against an earlier 22% threshold while holding other AI policy values, combat data, opponents, seeds, and seat orientation constant.

## Protocol
- Matchups: Serpent vs Phantom and Serpent vs Falcon.
- Seeds: 20261643–20261652 (10 matched seeds per matchup).
- Both faction seat orientations for every seed.
- 40 battles per policy (20 per matchup), 80 total.
- Baseline Verra threshold: 0.16.
- Experimental Verra threshold: 0.22.
- Standard and poison thresholds unchanged; no stats, skills, healing logic, enemy AI, or treatment priority changed.
- Raw battle rows: `p1-2-5-rotation-threshold-policy-experiment.json`.

## Results
| Metric | Baseline 16% | Earlier 22% |
|---|---:|---:|
| Battles | 40 | 40 |
| Serpent wins | 0 | 2 |
| Opponent wins | 40 | 38 |
| Verra KOs | 40 | 39 |
| Average rounds | 29.10 | 27.60 |
| Verra damage received (total) | 96,950 | 92,271 |
| Verra healing received (total) | 51,950 | 47,518 |

### By matchup
| Matchup | Baseline wins | Earlier wins | Baseline rounds | Earlier rounds | Verra KOs baseline → earlier |
|---|---:|---:|---:|---:|
| Phantom (20 each) | 0 | 0 | 18.30 | 16.60 | 20 → 20 |
| Falcon (20 each) | 0 | 2 | 39.90 | 38.60 | 20 → 19 |

## Interpretation
The 22% policy is a **small positive preliminary signal**, not a demonstrated improvement. It produced two Serpent wins (both in the Falcon matchup), one fewer Verra KO, lower aggregate incoming damage and healing, and shorter average battles. However, the sample is small and the Phantom matchup showed no wins or Verra-survival improvement. The reduction in healing may be consistent with earlier rotations but cannot be interpreted as reduced treatment quality without measuring treatment value and team survival directly.

No threshold change is adopted as the default. Keep the 16% baseline pending a larger matched-seed follow-up and additional outcomes (team KOs, actual switch events, treatment value, and reserve survival). This experiment changes only the threshold in the controller override and is not a balance patch.

## Verification
- Full suite: 370/370 passed, 0 failed, 0 skipped.
- All JavaScript syntax checks: to be recorded with package verification.
