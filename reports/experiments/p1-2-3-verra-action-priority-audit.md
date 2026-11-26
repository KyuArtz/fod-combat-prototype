# P1.2.3 — Verra Action Priority & Rotation Opportunity Audit

**Status:** Decision-level audit completed; no AI, combat, or balance changes made.

## Method

- Ran 10 seeded Phantom matchups (seeds 20261623–20261632) with Serpent on both seats: 20 battles total.
- Seat symmetry was checked for each seed; action-count analysis uses the player-seat battle once per seed to avoid double-counting mirrored decision data.
- Captured Verra decision snapshots: HP%, MP, action/mode/target, active ally HP/status, critical allies, and rounds.
- Existing replay tooling did not capture reserve HP/rotation eligibility at each decision, so reserve causes remain unresolved.
- Baseline unchanged: `npm test` 370 passed, 0 failed, 0 skipped; 155 JS files pass `node --check`.

## Results

- **10/10** Verra KOs in the 10 unique player-seat seed sample.
- **69** Verra decisions total: 34 Caustic Injection treatment, 27 Unstable Remedy remedy, 4 switches, 4 basic attacks.
- **40** treatment actions targeted Verra; **21** targeted teammates (61 total treatment actions). Self-treatment proportion is 65.6% in this sample.
- At **16–30% HP**, all **14** recorded decisions were self-treatment (9 Injection, 5 Remedy); no switch was selected in this band.
- At **≤16% HP**, 4 of 6 decisions were switches. Two non-switch decisions occurred at 0.71% HP (remedy on Galloz) and 1.33% HP (basic attack on Lucaz). The replay snapshots did not include reserve health, so it is not possible to determine whether a safe reserve was available.
- The high-HP self-treatment decisions sometimes carried cleansing context; self-targeted actions should not be automatically classified as wasted healing.
- Only one observed action window had a critical teammate; Verra treated that teammate in that window.

## Interpretation

The most actionable signal is the **rotation opportunity gap between 16% and 30% HP**: Verra continued to self-treat through that band, then often reached the switch threshold at a much lower HP. This is a confirmed behavior pattern in this seed sample, but not proof that a higher switch threshold would improve team survival. Reserve-health availability and treatment value at each decision need to be captured before policy changes.

The two very-low-HP non-switch decisions are **not classified as AI failures** because reserve eligibility was not recorded. This audit also does not establish that enemy targeting is unfair or that Verra needs stat buffs.

## Recommended follow-up

**P1.2.4 — Reserve Eligibility & Treatment Value Capture:** extend the replay instrumentation to capture reserve HP and the exact reserve-switch candidate list, usable treatment targets/modes, and the HP delta before Verra's next action. Re-run a small paired seed set. If evidence shows a safe reserve was available while Verra selected low-value treatment, isolate that exact decision in tests before changing rotation thresholds.
