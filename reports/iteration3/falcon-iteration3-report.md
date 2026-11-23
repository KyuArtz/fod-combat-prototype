# F.O.D. Falcon Playtest — Iteration 3

**Snapshot:** 2026-11-22  
**Encounter:** `blightheartSanctum` (two waves)  
**Scheduler:** threshold / continuous readiness  
**Opening:** player-first  
**Primary policy:** coordinated Falcon (`ai/falconTacticsV2.js`)  
**Runtime:** shared headless battle engine; no alternate simulation ruleset

## Scope delivered

1. Added a coordinated Falcon decision policy that selects only legal actions exposed by the turn view. It uses role-aware threat scoring, clears dangerous adds before focusing the boss, prioritizes the boss below 40% HP, avoids redundant marks/buffs, watches Toxic DoT, uses Adaptive Barrier on poisoned allies when appropriate, preserves MP for Catalyst Overdrive cleanse, and rotates endangered active members into healthier reserves.
2. Corrected the headless formation setup so the `maxActive` limit is assigned before party formation initialization. The three-active test now begins with Jazen, Evalete, and Zackry active, with Elishia and Zenki in reserve.
3. Wired `cleanseAllies` into Evalete's live `Catalyst Overdrive` definition. It removes harmful statuses from living active non-summon allies when a status is marked `debuff` or carries a negative stat amount. Positive buffs are preserved. Cleanse happens before the Ultimate's healing and defensive effects.
4. Added regression coverage for Toxic DoT detection, cleanse selection, MP conservation for a pending cleanse, Adaptive Barrier selection, enemy focus behavior, reserve switching, true three-active formation setup, coordinated boss battle completion, and the actual live Catalyst Overdrive cleanse execution.
5. Added complete seeded sample transcripts for one coordinated victory and one coordinated defeat.

## Regression verification

The latest fresh `npm test` run completed with:

| Result | Count |
|---|---:|
| Passed | 273 |
| Failed | 0 |
| Skipped | 38 |
| Total tests discovered | 311 |

The 38 skipped cases are legacy assertions superseded by the approved-kit regression coverage. No active tests failed.

## Playtest setup

### Primary formation

- Active: Jazen, Evalete, Zackry
- Reserve: Elishia, Zenki
- Party order: `jazen,evalete,zackry,elishia,zenki`
- Encounter: `blightheartSanctum`
- Both waves are played to completion or party defeat.

### Comparison runs

All tests used the same encounter, seed ranges, threshold scheduler, player-first opening, and party order. Only player policy and active-unit count changed.

| Player policy | Active formation | Battles | Victories | Defeats | Win rate | Mean rounds |
|---|---|---:|---:|---:|---:|---:|
| Coordinated | 3 active + 2 reserves | 150 | 103 | 47 | 68.7% | 56.79 |
| Random legal action | 3 active + 2 reserves | 100 | 1 | 99 | 1.0% | 39.31 |
| Coordinated | 5 active | 100 | 100 | 0 | 100.0% | 31.86 |

### Primary three-active run metrics

| Metric | Mean / total |
|---|---:|
| Turns per battle | 392.76 |
| Ally skill uses per battle | 64.85 |
| Enemy skill uses per battle | 87.37 |
| Falcon damage dealt (HP + shield damage) | 10,906.88 / battle |
| Enemy damage dealt (HP + shield damage) | 13,037.56 / battle |
| Healing to Falcon | 4,432.11 / battle |
| Shield damage absorbed by Falcon | 1,844.23 / battle |
| Harmful statuses cleansed | 1.80 / battle |
| Party-switch events | 1.86 / battle |
| Reserve-deployment events | 0.91 / battle |
| Rejected decisions | 0 |

The controller switched at least once in all 150 three-active battles. Reserve-deployment events occurred in 71 of 150 battles. The reserve roster is real and accessible to the controller; it is not simply a five-active formation with an altered display limit.

### Falcon damage contribution

Average total damage attributed to each Falcon agent per three-active attempt (including battles where that character spent time in reserve):

| Character | Damage / battle |
|---|---:|
| Jazen | 3,659.8 |
| Evalete | 2,445.1 |
| Zenki | 2,203.4 |
| Zackry | 1,416.1 |
| Elishia | 1,073.8 |

Jazen remains the primary damage contributor. Evalete contributes notable damage while also providing the largest share of squad sustain and cleanse utility.

## Interpretation

- **The three-active formation is the primary balance target.** The coordinated policy won 103/150 runs (68.7%), which leaves meaningful failure risk without making the encounter feel impossible for the tested controller.
- **The five-active control overwhelms the current boss.** Coordinated five-active won 100/100 and completed battles much faster. This does not mean the boss is fairly tuned for five active; it shows that adding two extra active characters materially changes the encounter difficulty. Do not tune the primary encounter solely around the five-active control if three active plus reserves is the intended mode.
- **Random play is not a useful performance expectation.** The random policy won only 1/100 three-active battles. It wastes key support effects and fails to sequence target focus, healing, cleansing, and reserve rotation. This is a controller comparison, not a statement about human skill.
- **Toxic pressure is being answered, but not erased.** Evalete's cleanse activated in the live fight path and the controller attempts to hold MP when several allies have Toxic DoT. The 68.7% result shows that this is useful counterplay, not a guaranteed solution.
- **No invalid decisions occurred.** Both the new action choices and reserve-switch decisions were accepted by the shared validator in the tested samples.

These are seeded headless prototype observations, not manual GUI tests and not estimates of a human player's win probability. The random and coordinated controllers use different strategies, and this report should not be read as a claim that one team is universally balanced at every player skill level.

## Sample battles

`falcon-iteration3-sample-battles.md` contains the complete battle logs for:

- Seed `996000`: coordinated victory, 56 rounds.
- Seed `996004`: coordinated defeat, 45 rounds.

The victory transcript includes Catalyst Overdrive cleansing, direct-damage reflection, Meo-9 activations, and reserve switching. The defeat transcript shows that reserve rotation and healing are not sufficient to guarantee a win.

## Reproduction commands

```bash
# Primary coordinated 3-active / 2-reserve benchmark
node tools/simulate.js --battles 150 --seed 996000 --policy coordinated --active 3 --party-order jazen,evalete,zackry,elishia,zenki --encounter blightheartSanctum --format json --out reports/iteration3/falcon-coordinated-3active-150.json

# Random 3-active control
node tools/simulate.js --battles 100 --seed 997000 --policy random --active 3 --party-order jazen,evalete,zackry,elishia,zenki --encounter blightheartSanctum --format json --out reports/iteration3/falcon-random-3active-100.json

# Coordinated 5-active comparison
node tools/simulate.js --battles 100 --seed 996500 --policy coordinated --active 5 --party-order jazen,evalete,zackry,elishia,zenki --encounter blightheartSanctum --format json --out reports/iteration3/falcon-coordinated-5active-100.json

npm test
```

## Artifacts

- `falcon-coordinated-3active-150.json`
- `falcon-random-3active-100.json`
- `falcon-coordinated-5active-100.json`
- `falcon-iteration3-sample-battles.md`

## Next balance questions

1. Confirm whether three active plus two reserves is the intended normal PvE formation; the current default is still five active.
2. If three-active is the intended default, tune boss cadence/phase pressure based on this benchmark rather than inflating every enemy stat.
3. Add a second boss archetype with a different counter pattern so the coordinated controller is not overfit to Toxic pressure.
4. Inspect human-controlled runs before adjusting Falcon skill values or enemy base stats.
