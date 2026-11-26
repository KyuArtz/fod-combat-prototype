# Local Simulation Reports

Simulator outputs written to `reports/` are generated artifacts and are ignored by Git by default (`*.json` and `*.csv`). Keep only durable findings and evidence needed to reproduce a decision.


## Retention policy

- Keep curated summaries that capture durable decisions or verification results.
- Keep raw JSON/CSV only when it is necessary to reproduce, independently validate, or investigate a result.
- Delete superseded runs and duplicate samples after confirming the useful conclusion is preserved elsewhere.
- Do not treat smoke-test samples as balance evidence. Record seed, configuration, battle count, and interpretation.
- Large forensic event timelines should be summarized, then discarded unless an active investigation needs the event-level detail.

## Current retained evidence
- `experiments/P1-2-7-matchup-dependent-rotation-feasibility.md` — telemetry-only feasibility audit of opponent-independent adaptive rotation inputs (80 battles, no AI changes).
- `experiments/P1-2-6-expanded-matched-seed-validation.md` — expanded 800-battle matched-seat rotation threshold comparison; 22% rejected globally, 16% retained.

- `experiments/falcon-enemy-action-metadata-seat-bias-fix.md` — seat-bias fix notes.
- `experiments/seat-bias-fix-validation-100.json` — matched-seat validation evidence.
- `p1-serpent-observational-100.json` — 100 battles per Serpent matchup (Falcon and Phantom), alternating seats.
- `p1-serpent-phantom-forensic-summary.json` — compact 20-seed matched-seat forensic summary (40 battles), derived from a timeline replay; raw timeline discarded.
- `P1_SERPENT_TACTICAL_AUDIT.md` — interpretation and follow-up plan for P1.

## Example

```bash
npm run simulate -- --battles 100 --seed 42
npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3
```
