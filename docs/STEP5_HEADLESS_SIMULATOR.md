# Step 5 — Headless simulator CLI

**Status:** implemented 2026-11-16  
**Purpose:** run repeatable batches of complete battles without terminal prompts, then summarize outcomes and combat-economy metrics for balance work.

## Run it

From the project root:

```bash
# 100 battles, random legal Falcon decisions, threshold scheduler
node tools/simulate.js

# Larger seeded sample
node tools/simulate.js --battles 1000 --seed 42

# Compare the legacy scheduler and basic-attack-only player policy
node tools/simulate.js -n 250 --scheduler legacy --policy basic

# Machine-readable output
node tools/simulate.js -n 100 --format json --out reports/threshold-100.json
node tools/simulate.js -n 100 --format csv --out reports/threshold-100.csv
```

Options:

| Option | Values | Default |
|---|---|---|
| `--battles`, `-n` | integer 1–100000 | `100` |
| `--seed` | unsigned 32-bit integer | `1` |
| `--scheduler` | `threshold`, `legacy` | `threshold` |
| `--opening` | `player-first`, `speed` | `player-first` |
| `--policy` | `random`, `basic` | `random` |
| `--format` | `table`, `json`, `csv` | `table` |
| `--out` | output file path | stdout |

The first battle uses the supplied seed; each subsequent battle uses the next unsigned 32-bit seed. The random player controller has a separate deterministic RNG derived from that battle's seed, so its action selection does not consume or perturb the battle RNG. Enemy behavior remains the built-in enemy AI. `basic` makes the Falcon controller use the first living enemy with a basic attack; `random` chooses uniformly from its currently legal actions, including usable skills.

## Reported metrics

The aggregate report includes victories, defeats and other terminal results; win rate; average rounds and actor turns; average skill/basic-attack counts; average HP damage received by each side; average ally shield absorption and healing; average MP spent by each side; and rejected decisions. JSON also contains one record per battle with seed, result, and per-actor received HP damage, shield absorption and healing. CSV contains one row per battle for spreadsheet analysis.

## Metric interpretation and limitations

- `hpDamageToAllies` / `hpDamageToEnemies` are HP actually removed from targets, not requested damage.
- Shield absorption is reported separately from HP loss.
- Healing is actual HP restored, not the requested amount.
- The current `DamageApplied` event does not identify a source actor. Consequently, this first simulator reports damage received by target side/actor, not damage dealt by each attacker. Do not interpret target-side damage totals as source-attributed damage analytics.
- `rounds` uses the battle state's round counter at completion; actor turns are counted from `TurnStarted` events.
- A 100% win rate in a sample is only an observation for that encounter, policy, scheduler and seed range. It is not proof of overall game balance. Compare multiple policies, schedulers, seed ranges and encounter compositions before tuning.
- The standard encounter remains five Falcon agents versus five training enemies. This step does not add enemy skill definitions or change combat mechanics.

## Implementation and verification

- `tools/simulate.js` provides argument parsing, repeated runs, aggregation, and table/JSON/CSV output.
- `tools/lib/headless.js` now supports deterministic `basic` and `random` player policies and a recordable event bus by default.
- `test/simulator.test.js` checks CLI validation, metric structure, repeatability, and CSV output.
- The simulator reuses the same `createBattle` engine, scheduler implementations, controller interface and typed events as interactive battles; it does not implement a second combat ruleset.
