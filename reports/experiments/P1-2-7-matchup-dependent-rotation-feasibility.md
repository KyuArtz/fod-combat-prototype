# P1.2.7 — Matchup-Dependent Rotation Policy Feasibility

## Scope and decision
Telemetry-only feasibility audit. **No rotation policy, AI behavior, engine, character stats, or combat rules were changed.** The study asks whether the current controller exposes sufficient opponent-independent context to support adaptive rotation without hardcoding enemy names.

## Protocol
- 20 seeds (`20261800`–`20261819`), both seat orientations, both Phantom and Falcon matchups: 80 battles total.
- Captured 2,085 Verra decision snapshots (328 Phantom, 1,757 Falcon).
- Captured selected action, Verra HP ratio, active opponent count/roles, ally HP ratios, reserve/active HP ratios, and usable treatment target counts.
- Summarized damage dealt to Serpent and Verra by source and role.
- Baseline controller, fixed seed, same combat rules; telemetry wrapper only.

## Incoming-pressure overview
| Matchup | Battles | Damage to Serpent | Damage to Verra | Verra share | Avg damage/battle |
|---|---:|---:|---:|---:|---:|
| Phantom | 40 | 173,955 | 44,956 | 25.84% | 4,348.9 |
| Falcon | 40 | 207,193 | 49,058 | 23.68% | 5,179.8 |

The sample is not a threat-model ranking. It confirms the pressure varies between matchups, but Verra's share of team incoming damage is similar in these two samples.

### Role mix of damage to Serpent
- Phantom: Stalker 81,721 (47.0%); Vanguard 42,383 (24.4%); Juggernaut 32,076 (18.4%); Tactician 17,775 (10.2%).
- Falcon: Versatile 46,937 (22.7%); Field Medic 46,303 (22.4%); Tactician 44,424 (21.4%); Stalker 34,666 (16.7%); Juggernaut 33,478 (16.2%); Summon 1,385 (0.7%).
Role labels are not a faction-neutral, validated measure of damage threat. These distributions do not justify role-specific rotation weights.

## Decision-time context captured
- **Phantom:** 328 Verra decisions. 282 treatments, 18 switches, 28 basic/other actions. At 16–22% HP: 40/40 decisions treated, none switched; a safe reserve was present in 36/40 snapshots under the existing reserve-health criterion. At <=16%: 18/32 switches, 10 treatments, 4 other, safe reserve in 18/32.
- **Falcon:** 1,757 Verra decisions. 854 treatment, 815 basic/other, 20 skill, 29 offensive-mode, 19 switch, and 20 skills without treatment/attack mode (represented as `skill` or `enemySkill` depending on side). At 16–22% HP: 11 treatments, 31 other, zero switches; reserve eligibility in 24/42 snapshots. At <=16%: 14 switches, 35 treatments, 26 other; reserve eligibility in 14/75 snapshots.

The controller-return categories are retained in the JSON and distinguish side-dependent skill decision types. The simple switch/treat/offense buckets are not a complete action-economy classification.

## Feasibility conclusion
**Context-aware rotation is feasible in a limited reactive form today.** The existing turn view already provides current actor HP/status/shields, living allies and opponents (including role labels and HP), available actions/targets, active/reserve HP and reserve eligibility. These are sufficient for state-based decisions that respond to current danger and replacement readiness without opponent-name rules.

**Historical incoming-pressure adaptation is not currently supported by the decision view.** It does not include rolling damage received by Verra, damage by source, attack frequency, or recent focus-fire history. A true pressure-responsive policy would need a small, faction-neutral view contract addition (e.g., a bounded recent-damage summary), supplied by engine/telemetry state. That addition should be designed and tested separately before policy experiments.

Opponent role labels are available, but are not a reliable universal threat score; the samples show different role mixes, and no role-based policy should be proposed from this audit alone.

## Recommendation
1. Keep the current 16% Verra rotation default.
2. Do not add matchup-name rules or role-weighted heuristics.
3. If pursuing adaptive pressure response, next design a minimal, faction-neutral recent-damage signal in the turn view and prove its lifecycle/reset semantics.
4. Then compare a context-aware prototype against baseline on matched seeds, both seats, and both matchups.

## Artifacts and verification
- Experiment runner: `tools/experiments/p1-2-7-policy-feasibility.js`
- Decision snapshots and battle telemetry: `reports/experiments/p1-2-7-policy-feasibility.json`
- 80 battles; 2,085 captured Verra decisions.
- Full suite: 370 passed, 0 failed, 0 skipped.
- JavaScript syntax checks: verify during package step.
