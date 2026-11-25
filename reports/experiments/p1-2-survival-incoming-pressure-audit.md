# P1.2 — Survival & Incoming Pressure Audit

**Status:** Diagnostic audit complete. No AI, combat, character, or balance changes made.

## Protocol

- 20 matched seed pairs; Serpent vs Phantom, each seed played in both seats (40 battles total).
- Seed range: `20261224`–`20261243`.
- Three active slots; speed opening initiative; full action timeline and snapshots enabled for forensic telemetry.
- Run through the existing `tools/serpentForensicReplay.js` harness.
- This is a targeted sample, not a broad balance proof.


## Matchup outcomes

- Serpent wins: **2/40 (5%)**; losses: 38/40.
- Seat results: **1/20 wins in each seat**.
- Average battle length: **18.85 rounds**.
- Average operative KOs: Serpent **4.95**, Phantom **1.55**.

## Verra survival findings

- Verra was KO'd in **40/40 battles** in this sample.
- Her action-level telemetry recorded **306 turns/actions**: 150 treat modes, 128 remedy modes, and 28 actions with no treatment mode (switch/basic/other).
- Across 278 treatment/remedy actions, **186 targeted Verra herself (66.9%)** and 92 targeted teammates.
- Verra's HP at her decision points: median **45.16%**, lower quartile **26.72%**, minimum **1.24%**.
- 20 Verra actions occurred at **15% HP or below**; those actions included 14 remedies, 2 treat actions, 2 switches, and 2 basics (mode counts shown separately from action types; the action timeline confirms switches can still occur at critical HP).

### Interpretation

Verra's high self-treatment rate is consistent with the current decision tree prioritizing self-preservation when she is injured, but her repeated low-HP turns and universal KO rate show that treatment alone does not reliably stabilize her. The P1.1 emergency-treatment rotation deferral is **not yet demonstrated to be the primary cause**: the telemetry contains critical-HP switch decisions as well as treatment decisions. The condition also considers Verra herself among eligible critical friendlies, so the implementation's naming/intent (“critical ally”) is broader than its behavior. That is a code-level risk worth isolating in a controlled scenario, not yet a reason to change thresholds.

## Incoming pressure / target distribution

Across 4,330 recorded Phantom damage-target events in this sample:

| Serpent target | Events | Share |
|---|---:|---:|
| Galloz | 1,744 | 40.3% |
| Verra | 790 | 18.2% |
| Tekushiki | 778 | 18.0% |
| Kane | 510 | 11.8% |
| Claude | 508 | 11.7% |

Verra is receiving notable focus, but she is **not uniquely over-targeted** in this raw count; Tekushiki receives a similar share. Galloz absorbs the largest share. Phantom's field-medic/support priority makes Verra a logical target, while other Phantom actors pursue their own target rules. These are counts of damage-target events, not normalized damage, attack opportunities, or proof of a targeting defect.

## Confirmed / unresolved

1. **Confirmed:** Verra is consistently eliminated in this 40-battle matched-seat sample.
2. **Confirmed:** Her treatment actions are predominantly self-directed (66.9%), with a large portion of her action economy devoted to healing/cleanse modes.
3. **Confirmed:** Phantom pressure is spread across the Serpent active roster; Verra's hit share is significant but similar to Tekushiki's.
4. **Not confirmed:** A P1.1 rotation deferral bug as the dominant cause. Critical-HP switch decisions still occur, and this audit has not yet isolated treatment-deferral logic with a controlled before/after replay.
5. **Not confirmed:** A broad Phantom target-selection imbalance. Current raw counts are not normalized for targetability, defensive uptime, or attack volume.

## Next recommended investigation

**P1.2.1 — Verra emergency rotation control-flow isolation:** create a small deterministic test matrix for Verra at low HP with (a) self as the only critical target, (b) a teammate as the only critical target, (c) both critical, (d) treatment unavailable, and (e) reserve availability varied. Verify that the P1.1 deferral is triggered only for intended ally-treatment cases, and that a safe reserve rotation remains possible when Verra herself is critical. Do not tune HP, defense, healing, or enemy target weights until this behavior is isolated.

## Artifact retention

Keep this compact report. The full forensic event timeline remains disposable and was not added to the project. The reproducible runner is retained.
