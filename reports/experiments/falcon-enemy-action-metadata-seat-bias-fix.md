# Falcon Enemy-Side Action Metadata Fix and Seat-Bias Validation

## Root cause

Faction enemy action views omitted skill `cost` (and `cooldown`) metadata. Falcon Evalete's controller uses the Catalyst Overdrive cost to decide whether to conserve MP while Toxic pressure is present. When Evalete was on the player/ally seat, the view included `cost: 65`; at the enemy seat, `cost` was undefined. Consequently, the check `actor.mp < catalystOption.cost` was false on enemy-side views, allowing Evalete to choose Triage instead of preserving MP for Catalyst Overdrive. This changed behavior by seat and was a concrete source of the observed Falcon seat asymmetry.

## Fix

- `ai/enemyAI.js`: enemy skill descriptions now include `cost` and current `cooldown` values.
- `core/turnView.js`: enemy-side action objects now expose those metadata fields to faction controllers, matching player-side action views.
- Regression tests verify enemy skill descriptions retain cost/cooldown and Falcon Evalete conserves MP identically when on the enemy side.

No character stats, skills, damage formulas, or tactical thresholds were changed.

## Validation protocol

- 100 matched seeds, `20264200`–`20264299`
- Both Serpent seat orientations per seed, per matchup
- 200 battles per matchup (400 battles total)
- Conservative Rotation retained: standard 12%, Verra 10%, poisoned 22%
- Corrected seat-neutral scheduler retained

## Results

| Matchup | Serpent wins overall | Ally-seat wins | Enemy-seat wins | Paired seeds with differing outcomes |
|---|---:|---:|---:|---:|
| Serpent vs Phantom | 12/200 (6%) | 6/100 (6%) | 6/100 (6%) | 0/100 |
| Serpent vs Falcon | 22/200 (11%) | 11/100 (11%) | 11/100 (11%) | 0/100 |

### Phantom
- Average rounds: 18.54 in both seats
- Average Serpent KOs: 4.90
- Average opponent KOs: 1.43
- Average damage dealt: 5,104.50
- Average damage received: 8,778.11

### Falcon
- Average rounds: 43.55 (ally seat), 43.57 (enemy seat)
- Average Serpent KOs: 4.62 (ally seat), 4.70 (enemy seat)
- Average opponent KOs: 1.12 (ally seat), 1.05 (enemy seat)
- Average damage dealt: 11,965.14 (ally seat), 11,931.80 (enemy seat)
- Average damage received: 10,530.80 (ally seat), 10,585.70 (enemy seat)

Each matched seed had the same win/loss outcome in both seat orientations for both matchups (0 discordant pairs). 

## Remaining balance conclusion

Seat fairness is now confirmed for this tested seed block and these two matchups after the action-view metadata correction. The matchups remain difficult for Serpent: 6% vs Phantom and 11% vs Falcon. Treat these as fresh corrected-scheduler baselines, not universal balance conclusions.

## Test suite

- `npm test`: 363 passed, 0 failed.
