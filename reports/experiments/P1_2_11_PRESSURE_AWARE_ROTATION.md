# P1.2.11 — Pressure-Aware Rotation Policy Experiment

## Purpose
Exploratory, matched-seed test of whether recent incoming HP pressure can improve Verra's reserve rotation decisions. No production/default AI policy was changed.

## Experimental policy
- Baseline: Verra's rotation threshold remains 16% HP.
- Pressure condition: Verra's rolling three-round `incomingPressure.recentDamage` is at least 20% of her max HP and a reserve meets the existing healthy-reserve eligibility rule.
- Under that condition only, experimental Verra rotation threshold increases to 22% HP.
- Critical teammate-treatment deferral is preserved.
- All other Serpent decisions are delegated to the existing controller.

## Protocol
- 20 seeds per matchup (20261110–20261129)
- Both seats
- Both policies per seed and seat
- Matchups: Serpent vs Phantom and Serpent vs Falcon
- Total: 160 battles (40 per matchup-policy combination)

## Results

| Matchup | Policy | Serpent wins | Verra KOs | Avg rounds | Verra HP damage | Treatment healing | Verra switches | Pressure triggers |
|---|---|---:|---:|---:|---:|---:|---:|
| Phantom | Baseline | 2/40 | 40/40 | 17.95 | 88,232 | 60,944 | 14 | 0 |
| Phantom | Pressure | 0/40 | 40/40 | 16.25 | 79,400 | 52,770 | 34 | 230 |
| Falcon | Baseline | 6/40 | 40/40 | 47.98 | 107,650 | 148,234 | 22 | 0 |
| Falcon | Pressure | 6/40 | 38/40 | 47.63 | 108,356 | 149,902 | 24 | 448 |

## Paired comparison
- **Phantom:** baseline won 2 battles that the pressure policy lost; pressure gained no wins. Verra KOs were unchanged. Pressure policy shortened battles by 1.70 rounds on average and reduced recorded Verra HP damage and treatment healing, but this did not translate into better outcomes.
- **Falcon:** win count was unchanged (6/40). Pressure policy prevented 2 Verra KOs, with a small average round reduction (0.35), but recorded Verra HP damage and treatment healing increased slightly.
- Seat split was symmetric in this sample: Phantom baseline 1 win per seat, pressure 0; Falcon 3 wins per seat for both policies. Verra KO counts also split evenly by seat.

## Decision
**Do not promote pressure-aware rotation to the default.** The signal produced additional switches (14→34 vs Phantom; 22→24 vs Falcon), but its outcome value is inconsistent: it regressed the Phantom matchup and only improved Verra survival without improving wins against Falcon. Treat this as a rejected/ inconclusive policy candidate, not a balance win.

## Limitations
- Sample is exploratory (20 seeds × 2 seats per matchup-policy).
- This experiment tests one threshold pair and one pressure criterion only.
- Results do not prove a causal improvement beyond the sampled seeds.
- The default 16% threshold remains untouched.
