# P1 — Serpent Tactical Audit (Observational Pass)

**Status:** Observational baseline complete; no combat AI, character, or engine balance changes made.

## Protocol

- Deterministic simulator telemetry: 100 battles vs Falcon and 100 vs Phantom, using seed start `20261124`, 3 active slots, speed opening initiative. Seat alternates between player and opponent; these are **not matched mirrored-seed pairs** in this 100-battle telemetry batch.
- Separate Serpent vs Phantom forensic replay: 20 matched seeds, each run with Serpent in both player and opponent seats (40 battles total), starting seed `20261124`.
- Test suite re-run after simulations: **363 passed, 0 failed, 0 skipped**.
- JavaScript syntax checks and documentation-link checks were reported during the earlier P0 pass; this pass did not repeat those checks.

## Matchup outcome

| Matchup | Serpent wins | Opponent wins | Draws | Avg. rounds | Serpent seat split |
|---|---:|---:|---:|---:|---|
| Serpent vs Falcon | 12/100 (12%) | 88/100 | 0 | 41.83 | Player 6/50; Opponent 6/50 |
| Serpent vs Phantom | 1/100 (1%) | 99/100 | 0 | 17.13 | Player 1/50; Opponent 0/50 |

The observational 100-battle samples show a much harder Phantom matchup. The seat split is descriptive only and does not prove seat bias; use the matched forensic sample for mirrored-seat comparisons.

## Phantom matched-seed forensic replay

- 4 wins / 40 battles (10%); 36 losses.
- Player seat: 2/20 wins; opponent seat: 2/20 wins.
- Average battle length: 18.75 rounds.
- Average operative KOs: Serpent 4.90; Phantom 1.35.
- Verra: 342 audited actions; 284 healing/cleanse modes, 2 offensive modes, 204 self-target treatments. She received 90,952 damage across the 40 battles and was KO'd 40 times (1 per battle on average).
- Verra's healing: 62,854 requested; 49,696 actual; 3,744 overheal. (Totals are across 40 battles.)
- Phantom damage totals into Serpent across the replay: Elishia_P 82,756; Liezli 87,472; Clarke 74,966; Lucaz 65,128; Mirazhel 37,316.
- Phantom final blows on Serpent: Clarke 78; Liezli 74; Lucaz 34; Elishia_P 8; Mirazhel 2.

## Confirmed observations / candidates

### 1. Phantom matchup is the primary balance problem

The larger telemetry batch and smaller matched-seed replay both show Serpent struggling against Phantom. The matched-seat sample has equal seat results, so the 10% observed win rate is not explained by a player/opponent-seat imbalance in this sample. This is evidence for a matchup-performance gap, not yet proof of one specific AI bug or a need for stat buffs.

### 2. Verra survival and treatment/rotation priority need a focused follow-up

Verra was KO'd in every Phantom forensic battle, while the Phantom team repeatedly applied pressure to her. In the two distinct seed situations replicated across seats where a teammate (Kane at 13.52% HP) was critical, Verra chose a reserve switch (Claude in for Kane) rather than a treatment. This is only two unique seed situations, not a broad conclusion. Investigate the switch-before-action priority and treatment target scoring before changing it.

### 3. The existing switch policy may be a contributing factor, not yet a confirmed fault

Switching a critically injured Kane out may preserve him, but it also forfeits an immediate treatment action. The value depends on healing skill availability, status urgency, incoming damage, and reserve condition. A targeted scenario test is needed before tuning the general rotation policy.

### 4. Minor code hygiene candidate

`ai/serpentTactics.js` calculates a local `lowest` target in `chooseAction()` that is not subsequently used. Confirm this is dead logic and remove it during a separate cleanup patch with tests, rather than mixing it into balance tuning.

## Recommended next steps (no changes yet)

1. Build targeted replay scenarios for Verra's switch-vs-treatment decision when an ally is critical and a healthy reserve exists.
2. Inspect Phantom target pressure and Serpent target selection/defensive skill timing in those scenarios.
3. Validate whether Verra's high self-treatment rate is appropriate; distinguish self survival from ally support and cleanse urgency.
4. Fix only a confirmed behavior, add a narrow regression test, then rerun the focused tests and matched-seat sample.
5. Do not stat-buff Serpent members until tactical findings are separated from matchup balance.

## Artifact retention

The 100-battle telemetry JSON and compact matched-seat forensic summary are retained. The 3.4 MB event-by-event forensic timeline was discarded after extracting its durable summary; it can be regenerated using the retained `tools/serpentForensicReplay.js` runner. No obsolete scripts were removed during this P1 observational pass.

> **Verification update (P1.1):** The earlier test count was affected by duplicate project nesting in the audit ZIP. The duplicate was removed in the P1.1 deliverable. The corrected single-project suite now reports 367 passing tests. See `reports/experiments/p1-1-verra-treatment-vs-rotation-audit.md`.


> **Verification update (P1.2.1):** The self-exclusion fix in Verra emergency treatment deferral is in place. Current baseline: 370 passing tests.

> **P1.2.2 update:** Incoming pressure and action economy were audited over 40 seeded battles each vs Phantom and Falcon, alternating Serpent seat. Verra was KO’d in 40/40 Phantom and 39/40 Falcon battles. Self-treatment was a substantial share of her treatment actions, and she absorbed no shield damage. No balance changes were made. Details: `reports/experiments/p1-2-2-incoming-pressure-survival-audit.md`.
