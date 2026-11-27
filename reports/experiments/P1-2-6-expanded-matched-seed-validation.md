# P1.2.6 — Expanded Matched-Seed Validation

## Purpose
Re-evaluate Verra's experimental 22% rotation threshold against the 16% baseline on a substantially larger, matched sample. This is an experiment only; no default AI behavior was changed.

## Protocol
- 100 new seeds: `20261700`–`20261799`.
- Matchups: Serpent vs Phantom and Serpent vs Falcon.
- Both seat orientations per seed per matchup.
- 200 battles per matchup per policy; 400 total per policy, 800 total battles.
- Baseline Verra threshold: 16%; experimental: 22%.
- Other controller policy, character data, combat rules, treatment behavior, enemy behavior and formations held constant.
- Full battle rows in `p1-2-6-expanded-matched-seed-validation.json`; summary and paired outcomes in `p1-2-6-expanded-validation-summary.json`.

## Overall results
| Metric | Baseline 16% | Experimental 22% |
|---|---:|---:|
| Battles | 400 | 400 |
| Serpent wins | 31 | 27 |
| Opponent wins | 369 | 373 |
| Verra KOs | 393 | 389 |
| Average rounds | 32.9225 | 32.7950 |
| Damage to Verra (total) | 939,502 | 914,283 |
| Healing to Verra (total) | 492,902 | 468,582 |

## Matchup-specific results
### Phantom (200 battles per policy)
- Baseline: 10 Serpent wins; experimental: 0.
- Paired transitions: 10 baseline-only wins, 0 experimental-only wins.
- Verra KOs: 200 in both policies.
- Average rounds: 18.50 baseline vs 17.61 experimental.
- Damage/healing totals were lower in the experimental sample, but the policy did not improve Verra's KO rate and eliminated all baseline Serpent wins in this sample.

### Falcon (200 battles per policy)
- Baseline: 21 Serpent wins; experimental: 27.
- Paired transitions: 4 baseline-only wins, 10 experimental-only wins (net +6 wins).
- Verra KOs: 193 baseline vs 189 experimental; 4 paired KO improvements, none worsened.
- Average rounds: 47.345 baseline vs 47.980 experimental.
- Damage and healing totals were nearly unchanged.

## Interpretation / decision
The threshold change is **matchup-dependent and not suitable as a global default**. The 22% policy had a small aggregate reduction in Verra KOs and damage, and helped in Falcon; however, Serpent wins fell from 31 to 27 overall, with a pronounced regression against Phantom (10 baseline wins lost, none gained in matched outcomes). The small earlier sample's positive overall signal did not generalize.

**Decision: reject 22% as a global threshold. Keep the 16% baseline.** This does not rule out a matchup-specific rotation policy, but that requires a separate hypothesis and targeted validation. No balance or AI changes were made.

## Verification
- `npm test`: 370 passed, 0 failed, 0 skipped.
- JavaScript syntax checks: all project JS files passed.
- Archive integrity checked with `unzip -t`.
- Test suite rerun from extracted archive.
