# P1.2.2 — Incoming Pressure & Survival Decision Audit

**Status:** Diagnostic audit complete; no combat changes made.

## Scope and method

- 40 seeded battles each vs Phantom and Falcon (80 total), seed range 20261124–20261163 for Phantom and 20261164–20261203 for Falcon (per-matchup runs with alternating Serpent seat).
- Both Serpent seat orientations included (20 player-seat and 20 opponent-seat battles per matchup).
- Captured action decisions, incoming damage events, healing events, switches, and KO status from event timelines.
- Confirmed baseline with `npm test`: 370 passed, 0 failed, 0 skipped. Syntax check: 155 JavaScript files passed.
- These are deterministic samples, not general win-rate estimates.

## Results

### Verra's survival and incoming pressure

| Metric | Phantom | Falcon |
|---|---:|---:|
| Battles | 40 | 40 |
| Verra KO | 40/40 (100%) | 39/40 (97.5%) |
| Total incoming damage (HP + absorbed) | 88,396 | 105,225 |
| Average incoming damage per battle | 2,209.9 | 2,630.6 |
| Verra turns | 333 (8.33/battle) | 1,132 (28.30/battle) |
| Damage absorbed by Verra's shields | 0 | 0 |
| Verra outgoing switch actions | 18 | 23 |
| Healing received by Verra (actual) | 43,396 | 60,384 |
| Healing requested on Verra | 47,088 | 60,752 |

### Damage-source distribution into Verra

Phantom total (88,396): Elishia_P 45,608 (51.6%); Mirazhel 15,659 (17.7%); Lucaz 15,752 (17.8%); Clarke 7,845 (8.9%); Liezli 3,532 (4.0%). Elishia_P is the dominant source in this sample.

Falcon total (105,225): Evalete 32,722 (31.1%); Elishia 32,359 (30.7%); Zackry 33,685 (32.0%); Zenki 2,219 (2.1%); Jazen 1,948 (1.9%); Meo-9 2,292 (2.2%). Damage pressure is concentrated among the three primary Falcon attackers rather than one sole attacker.

### Verra action economy

| Decision | Phantom (40) | Falcon (40) |
|---|---:|---:|
| Caustic Injection — treat | 155 | 612 |
| Unstable Remedy — remedy | 125 | 2 |
| Basic attack | 32 | 440 |
| Caustic Injection — attack | 0 | 12 |
| Chemical Catastrophe | 0 | 43 |
| Switch | 18 | 23 |
| Total Verra decisions | 330 | 1,132 |

Phantom: 194 of 280 treatment decisions (69.3%) targeted Verra herself; 86 targeted allies. In the 40 Falcon battles, 291 of 614 treatment decisions (47.4%) targeted Verra herself; 323 targeted allies (Galloz 198, Kane 125, plus minor targets). Treatment is a major share of her action economy, especially against Phantom. The counts are behavior observations, not proof that self-treatment is always incorrect.

## Confirmed observations

1. Verra is eliminated in nearly every battle in both matchup samples.
2. Verra generated no shields and absorbed no damage with shields in either sample; her kit/AI is relying on healing rather than shield mitigation.
3. Against Phantom, Elishia_P accounted for 51.6% of incoming damage to Verra in this sample.
4. Verra's treatment priority often directs actions to herself: 69.3% of treatment actions vs Phantom and 47.4% vs Falcon.
5. Rotation is infrequent relative to KO incidence (18 and 23 Verra-out switch decisions across 40 battles each); this is a signal to inspect the rotation decision thresholds and opportunity timing, not evidence that switching is inherently correct.

## Not established

- Whether treatment loops directly cause Verra's KO or are an adaptive response to damage.
- Whether rotation should occur earlier or more often; reserve health, action timing, and team state still need paired scenario testing.
- Whether target focus should be changed; raw incoming-damage telemetry cannot establish that target selection is unfair or strategically wrong.
- Whether stat buffs are warranted. None were applied.

## Recommended follow-up

**P1.2.3 — Verra Action Priority & Rotation Opportunity Audit:** isolate decision sequences with current HP, incoming pressure, available treatments, target eligibility, reserve HP, and the next action opportunity. Compare treatment-first and rotation-first branches in paired seeded scenarios. Do not change healing values, thresholds, target weights, or stats until a specific decision failure is reproduced.
