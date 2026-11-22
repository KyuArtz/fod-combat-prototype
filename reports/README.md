# Generated Reports

This directory is the default destination for local simulator output. Generated `.json` and `.csv` reports are ignored by Git so machine-specific or temporary analysis results do not become accidental source changes.

Example:

```bash
node tools/simulate.js --battles 100 --seed 42 --format json --out reports/sample.json
node tools/simulate.js --battles 100 --seed 42 --format csv --out reports/sample.csv
```

If a report is intended to be a reviewed project artifact, document its encounter, scheduler, policy, seed range, run size, and interpretation before deliberately adding it to version control.

## 2026-11-22 scaled enemy playtest

- `falcon-training-random-300.json`: 300 seeded `trainingGround` battles with the random legal-action player controller.
- `falcon-training-basic-100.json`: 100 seeded `trainingGround` battles with a basic-attack-only player controller.
- `falcon-sample-battles.md`: one Falcon victory and one enemy victory with complete seeded battle logs, skill usage, and per-actor damage contribution.
- Current enemy designs and stat comparisons: `../docs/reference/ENEMY_ARCHETYPES_AND_BALANCE.md`.


## 2026-11-22 tactical Falcon and Blightheart boss playtest

- `falcon-tactical-training-120.json`: 120 seeded Training Ground battles using the tactical Falcon controller.
- `falcon-tactical-blightheart-150.json`: 150 seeded Blightheart Sanctum battles using the tactical Falcon controller.
- `falcon-random-blightheart-150.json`: same boss encounter and seed range with random legal-action control.
- `falcon-blightheart-sample-battles.md`: a full deterministic tactical victory and defeat transcript.
- Boss details and interpretation: `../docs/reference/ENEMY_ARCHETYPES_AND_BALANCE.md`.
- JSON reports include per-actor/per-skill use counts and per-actor damage contribution; see `falcon-iteration2-report.md` for the comparative interpretation.
- `falcon-iteration2-report.md`: consolidated iteration-2 implementation, tuning history, per-agent contributions, and interpretation of the tactical/boss results.


## 2026-11-22 coordinated Falcon / reserve management playtest (Iteration 3)

- `iteration3/falcon-coordinated-3active-150.json`: 150 seeded `blightheartSanctum` runs with three active Falcons and two reserves using the coordinated controller.
- `iteration3/falcon-random-3active-100.json`: 100 three-active random-policy control runs.
- `iteration3/falcon-coordinated-5active-100.json`: 100 five-active coordinated control runs; this formation won all 100 and is not the primary balance target.
- `iteration3/falcon-iteration3-sample-battles.md`: complete deterministic victory/defeat logs for seeds 996000 and 996004.
- `iteration3/falcon-iteration3-report.md`: consolidated implementation, regression, metrics, and interpretation.
- `../docs/reference/ENEMY_ARCHETYPES_AND_BALANCE.md`: current encounter, enemy, and playtest balance notes.


## 2026-11-22 Phantom migration and faction-duel baseline

- `phantom-vs-falcon-500.json`: 500 seeded AI-versus-AI battles with three active members and two reserves per faction; player-side faction alternates each battle and the duel harness applies symmetric Evasion handling.
- Current interpretation and seating fairness breakdown: `../docs/reference/PHANTOM_IMPLEMENTATION_GUIDE.md`, section “Initial faction-versus-faction playtest”.
- The project exposes the same faction selector interactively via `npm start`; choose either Falcon Company or Phantom Rebellion, then order all five roster members.


## 2026-11-22 Phantom vs Falcon faction-duel baseline

- `phantom-vs-falcon-500.json`: raw output from 500 seeded tactical AI-vs-AI battles with three active combatants and two reserves per faction; faction seating alternates and Evasion is symmetric.
- `phantom-vs-falcon-playtest-report.md`: outcome, seat fairness, damage attribution, balance interpretation, and reproduction command.
- `phantom-vs-falcon-sample-battles.md`: curated deterministic excerpts from one Falcon win and one Phantom win.
- For interactive Phantom selection, run `npm start`, choose `2. Phantom Rebellion`, then order the five roster members; the first three deploy and the remaining two enter reserve.

## 2026-11-22 Evalete substitution experiment

- `field-medic-substitution-100.json`: six matched variants (full Falcon control plus each of the five Phantom characters temporarily replacing Evalete), 100 seeded battles per variant, alternating faction seating, and three active/two reserve formation.
- `field-medic-substitution-report.md`: aggregate win rates, sustain metrics, candidate skill usage interpretation, and reproduction command.
- Run again with `npm run simulate:medic-swap -- --battles 100 --seed 20261122 --active 3`.
- This is an experimental mixed-faction lineup; it does not change the permanent Falcon or Phantom rosters.
