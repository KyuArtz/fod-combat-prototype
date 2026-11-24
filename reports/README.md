# Local Simulation Reports

Simulator outputs written to `reports/` are local, generated artifacts and are ignored by Git by default (`*.json` and `*.csv`). Do not commit large raw batches or sample transcripts unless they are specifically needed for reproducibility or an audit.

## Retention policy

- Keep a small, curated summary when it captures a durable decision or an important verification result.
- Keep raw JSON/CSV only when it is necessary to reproduce, independently validate, or investigate that result.
- Delete superseded runs and duplicate samples after confirming that the useful conclusion is preserved elsewhere.
- Do not treat smoke-test samples as balance evidence. Record the seed, configuration, number of battles, and interpretation.

## Examples

```bash
npm run simulate -- --battles 100 --seed 42
npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3
```

The clean project snapshot retains the concise seat-bias fix report and its 100-seed matched-seat JSON validation as current audit evidence. The earlier 20-seed smoke artifact was discarded as superseded by the larger validation. These are exceptions, not a general archive of historical runs.
