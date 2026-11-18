# Generated Reports

This directory is the default destination for local simulator output. Generated `.json` and `.csv` reports are ignored by Git so machine-specific or temporary analysis results do not become accidental source changes.

Example:

```bash
node tools/simulate.js --battles 100 --seed 42 --format json --out reports/sample.json
node tools/simulate.js --battles 100 --seed 42 --format csv --out reports/sample.csv
```

If a report is intended to be a reviewed project artifact, document its encounter, scheduler, policy, seed range, run size, and interpretation before deliberately adding it to version control.
