# Evalete Substitution Experiment — Falcon + Phantom Trial

## Question

Does Falcon's faction-duel performance drop because Evalete supplies most of the team's sustained healing and defensive support? To test this, Evalete was temporarily removed from the Falcon roster and replaced one-for-one with each Phantom character, without changing the permanent faction rosters or approved character skill data.

## Method

- Six variants: full Falcon control plus five separate Phantom substitutions.
- 100 seeded battles per variant (600 total).
- Seed range: `20261122`–`20261221`; the same seed range was used for every variant.
- Three active members and two reserves per side.
- Initial active lineup: Elishia, replacement slot, Zackry; Jazen and Zenki begin in reserve.
- The enemy side always uses the complete five-member Phantom roster.
- Tactical AI vs tactical AI; faction placement alternates every battle.
- Symmetric Evasion rules on both sides.
- The temporary Phantom unit retains its original stats, mastery, role, passive, and skill set, but is assigned to Falcon's side/faction for the experiment. Its actor ID is namespaced so it can coexist with the original Phantom counterpart on the opposing roster.
- Phantom-only faction support remains faction-aware. For example, Mirazhel's Veil cannot target Falcon-faction teammates in this mixed lineup.

The experiment uses the live `createBattle` engine, not a separate combat simulation. Player skill lookup now resolves through `actor.skillSet || actor.id`, allowing a temporary display/actor ID to use its original data-driven skill set. Enemy skill resolution already used `skillSet`.

## Results

| Falcon-side roster | Wins | Win rate | Avg rounds | Healing received | Shields granted | Shield absorption | HP damage taken |
|---|---:|---:|---:|---:|---:|---:|---:|
| Full Falcon (Evalete) | 76/100 | 76% | 28.09 | 3,967 | 2,510 | 1,387 | 8,716 |
| Replace Evalete with Mirazhel | 8/100 | 8% | 17.80 | 1,808 | 1,196 | 786 | 7,749 |
| Replace Evalete with Unknown (`elishia_p`) | 6/100 | 6% | 16.38 | 1,294 | 1,492 | 948 | 7,001 |
| Replace Evalete with Lucaz | 0/100 | 0% | 15.36 | 1,029 | 899 | 442 | 7,684 |
| Replace Evalete with Clarke | 0/100 | 0% | 13.07 | 1,186 | 765 | 360 | 7,226 |
| Replace Evalete with Liezli | 0/100 | 0% | 13.65 | 1,306 | 805 | 475 | 7,057 |

### Seat split

Each variant alternated which side held the temporary Falcon-side roster:

| Roster | Hybrid wins as player side | Hybrid wins as enemy side |
|---|---:|---:|
| Full Falcon | 35/50 | 41/50 |
| Mirazhel replacement | 4/50 | 4/50 |
| Unknown replacement | 2/50 | 4/50 |
| Lucaz replacement | 0/50 | 0/50 |
| Clarke replacement | 0/50 | 0/50 |
| Liezli replacement | 0/50 | 0/50 |

The low win rates are not explained by a simple player-side seating advantage; the side split is balanced by construction and the observed counts are similar.

## Interpretation

The result strongly supports the sustain hypothesis. The full Falcon control averaged about **3,967 effective healing** and **2,510 shield points granted** per battle. Every replacement variant fell well below that healing output, and all had lower shield generation and shorter battles.

- **Unknown (`elishia_p`) is the closest direct defensive-support substitute.** Aegis was used and produced the highest shield grant/absorption totals among the Phantom replacements (about 1,492 granted and 948 absorbed per battle). It still achieved only 6% wins in this 100-battle batch because it cannot reproduce Evalete's broad healing and team sustain.
- **Mirazhel** achieved the highest replacement win rate (8%). Her value came from buffs, marking, and damage—not healing. Veil's Phantom-faction target restriction prevents it from buffing Falcon teammates in this mixed-side test.
- **Lucaz** brings personal mitigation and a team damage guard, but he is primarily a juggernaut, not a medic. His one-off team reduction does not compensate for the lost healing loop.
- **Clarke and Liezli** primarily improve their own evasion/offense and do not provide enough team sustain to fill the missing role.

The mixed teams also dealt less damage on average and ended much earlier. This is consistent with losing turns to incapacitation and reserve rotation before the team can sustain a long fight. These results are a directional AI-vs-AI balance test, not a claim about a human-controlled party's exact win probability.

## Recommendation

Keep Evalete as Falcon's primary field medic. If a temporary Phantom crossover is desired, **Unknown** is the most natural support-oriented substitute because Aegis can shield an ally, but should not be treated as a replacement for a dedicated healer. Mirazhel can be tested as a tactical-support alternative, while Lucaz is better viewed as a frontline mitigation option.

Do not buff Phantom damage based on this experiment. The results point to sustain and defensive coverage—not lack of offensive output—as the main gap. For a proper Phantom faction balance pass, consider either designing a dedicated sustain option later or testing team tactics that protect their fragile damage dealers without adding a healer to the current roster.

## Reproduction

```bash
npm run simulate:medic-swap -- --battles 100 --seed 20261122 --active 3
```

Raw per-battle outcomes and aggregate metrics are in `reports/field-medic-substitution-100.json`.
