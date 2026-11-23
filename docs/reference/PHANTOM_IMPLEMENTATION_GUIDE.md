# Phantom Rebellion Implementation Guide

This guide records the first Phantom Rebellion migration into the shared combat runtime. Executable definitions are in `characters/skillData/`; actor creation and normalized runtime stats are in `characters/phantom.js`. All five kits use the same skill interpreter, effect registry, passive registry, damage pipeline, and status lifecycle as Falcon.

## Runtime roster

| Character | Mastery | Combat role | Source HP | Source MP | Source ATK | Source MPow |
|---|---|---|---:|---:|---:|---:|
| Mirazhel Veyra | Anomaly | Tactician / Vanguard | 1,300 | 145 | 90 | 135 |
| Unknown operative (`elishia_p` internal key) | Anomaly | Stalker | 1,100 | 160 | 120 | 165 |
| Lucaz Durn | Kinetic | Juggernaut | 1,950 | 100 | 118 | 20 |
| Clarke Voss | Electromagnetic | Vanguard | 1,325 | 110 | 112 | 60 |
| Liezli Noct | Anomaly | Stalker | 1,020 | 130 | 118 | 0 |

The runtime normalizes the source JSON's `Mpow` to `MPow` and `EVA` to `Evasion`. Each unit receives a +15 mastery bonus for its assigned primary mastery. Other mastery resistance entries default to zero. Lucaz, Clarke, and Liezli use ATK as their offensive scaling stat where their source kits specify ATK-based damage; the `MPow` value is not substituted for those skill formulas.

## Mirazhel Veyra

**Passive — Phantom Mark**

Successful Anomaly damage applies a 10% increased-damage-taken mark for 2 turns. The mark benefits Phantom-faction attackers only. Reapplication refreshes the duration; it does not stack. The target-side multiplier filters by the attacker's faction in the shared damage calculation.

| Ability | Runtime behavior | MP | Cooldown |
|---|---|---:|---:|
| Wraithfang Pursuit | 1.25× MPow Anomaly damage to one enemy; grants +15 Evasion for 1 turn after a successful hit. | 20 | 1 |
| Veil of the Unseen | Selects one other Phantom ally; grants SPD +15% and CritRate +10% for 2 turns. Self-targeting and non-Phantom targets are rejected before MP is spent. | 25 | 3 |
| Requiem of the Vanishing Blade | 2.0× MPow Anomaly damage; deals 25% more damage if the target has Phantom Mark. | 40 | 4 |
| Nocturne of the Phantom Queen | 1.0× MPow Anomaly damage to all enemies hit; active allies gain ATK +15% for 2 turns. Phantom Mark is applied by the passive to successful Anomaly hits. | 60 | 6 |

## Unknown operative (`elishia_p` internal key)

The in-game display name is `Unknown`. All five player-facing skill descriptions in the owner-reference extract and website-facing JSON are deliberately neutral. The migration does not change the source skill names or reveal an identity in the ability descriptions.

**Passive — Sovereign Authority**

Successful Anomaly attacks reduce the target's DEF and RES by 10% for 2 turns. Each reduction refreshes independently and does not stack with itself.

| Ability | Runtime behavior | MP | Cooldown |
|---|---|---:|---:|
| Scarlet Severance | 1.5× MPow Anomaly damage to one enemy. | 20 | 1 |
| Aegis of the Scarlet Veil | Grants the operative or one selected ally a barrier equal to 120% of the operative's MPow for 2 turns or until depleted. Recasting replaces only this skill's barrier group. | 30 | 3 |
| Crimson Phalanx | One 2.0× MPow Anomaly damage instance representing the three-strike sequence; applies Bleeding for 2 turns (0.15× the applier's ATK as Anomaly damage per tick). | 40 | 4 |
| Scarlet Eclipse | 1.1× MPow Anomaly damage to all enemies; successful hits trigger the passive reductions. The operative gains +15% damage dealt for 2 turns. | 60 | 6 |

## Lucaz Durn

**Passive — Colossus Frame**

Lucaz takes 10% less damage. Each qualifying direct hit that exceeds 10% of his Max HP after mitigation but before shield absorption grants a Reinforcement stack: DEF +8% per stack for 2 turns, up to two stacks. Reaching the cap refreshes the stack duration. At two stacks, the next Kinetic damaging skill receives +20% damage and consumes the Reinforcement/charge. Non-Kinetic skills do not consume the Kinetic charge.

| Ability | Runtime behavior | MP | Cooldown |
|---|---|---:|---:|
| Ironwake Impact | 1.5× ATK Kinetic damage to one enemy; +20% damage against a Staggered target. | 15 | 1 |
| Bastion of the Unyielding | DEF +25%, RES +15%, Taunt, and SPD -15% for 2 turns. | 25 | 3 |
| Faultline Breaker | 0.9× ATK Kinetic damage to all enemies and Stagger for 1 turn. | 35 | 4 |
| Cataclysm of the Iron Titan | 1.8× ATK Kinetic damage to all enemies, Stagger for 1 turn, and 10% damage reduction for active allies for 2 turns. | 55 | 6 |

## Clarke Voss

**Passive — Phase Stride**

A successful evasion grants Phase Advantage for 2 turns and a one-use +20% bonus to the next offensive skill. Phase Advantage does not refresh or stack while already active. If Aegis Reversal is active when Clarke evades, he also receives a separate +15% bonus specifically for the next Riftpiercer.

| Ability | Runtime behavior | MP | Cooldown |
|---|---|---:|---:|
| Riftpiercer | 1.5× ATK Electromagnetic damage; if Clarke has Phase Advantage, the target also receives DEF -10% for 2 turns. | 15 | 1 |
| Aegis Reversal | +20 Evasion for 2 turns. Evasion during this stance primes the Riftpiercer-only +15% bonus. | 20 | 3 |
| Thousandfold Pursuit | 2.2× ATK Electromagnetic damage; Phase Advantage grants +10 CritRate for this attack. | 35 | 4 |
| Eventide Impalement | 3.0× ATK Electromagnetic damage; +20% damage if the target is below 40% Max HP; Clarke gains +15 Evasion for 2 turns. | 50 | 6 |

The source roster expresses Evasion as a percentage. The engine represents Evasion as points in the `Evasion` stat, so `+20 Evasion` is a 20-point modifier.

## Liezli Noct

**Passive — Mirage Synchronization**

A successful evasion grants +10 CritRate for the next offensive skill. The bonus cannot stack and expires after 2 turns or when consumed by an offensive skill.

| Ability | Runtime behavior | MP | Cooldown |
|---|---|---:|---:|
| Ghostlight Volley | 1.6× ATK Anomaly damage to one enemy and Bleeding for 2 turns (0.15× the applier's ATK as Anomaly damage per tick). | 15 | 1 |
| Phantom Refraction | +20 Evasion for 2 turns and a one-use +20% bonus to the next damaging skill. | 20 | 3 |
| Silverpoint Barrage | 1.0× ATK Anomaly damage to all enemies hit; applies Bleeding for 2 turns (0.15× the applier's ATK as Anomaly damage per tick) and a 15-point accuracy penalty for 2 turns. | 35 | 4 |
| Last Light, No Witnesses | 3.0× ATK Anomaly damage to one enemy; +25% damage if the target is below 30% Max HP. | 55 | 6 |

The current accuracy-penalty consumer affects eligible basic-attack evasion checks. Mastery skills do not currently use a universal accuracy roll; this is an existing combat-system limitation, not a Phantom-only rule.

## Initial Bleeding tick value

The initial playtest value is **0.15× the applier's ATK**, resolved through the shared Anomaly mastery damage calculation and stored when Bleeding is applied. The resulting damage ticks at the start of the affected unit's turn for **2 turns**. Bleeding does not stack; reapplication refreshes its duration without adding another tick or increasing its stored damage. Follow-up Bleeding is applied only to targets actually hit by the associated skill. This is the approved initial balance baseline and remains tunable after faction playtesting.

## Shared implementation details

- Phantom Mark's faction restriction is a generic `damageTakenFaction` filter in `systems/damage.js`.
- `targetFaction` and `excludeSelf` are shared targeting constraints, surfaced through turn views and rechecked before MP payment.
- `conditionalStatus.conditionOn` can check a status on the acting unit while applying a debuff to the target; Clarke's Riftpiercer uses this for Phase Advantage.
- Multi-target effects retain the IDs they actually hit; follow-up Bleed/status effects can restrict themselves to hit targets.
- ATK- or MPow-scaled mastery skills use the same damage formula and `masteryBonus` pipeline as other characters.
- All effects follow Combat Stacking v1 and Effect Timing/Trigger v1.
- Bleeding uses the shared `characters/skillData/effects/bleeding.js` definition so its tick strength and timing remain consistent across all Phantom skills.
- Faction actors on either side use the same ally/enemy targeting semantics relative to their own faction; support skills remain on the actor's own side.

## Verification and scope

The migration adds a real `createBattle` integration test using `createPhantomParty`; all five Phantom actors take turns and execute skills with zero rejected decisions. Focused tests cover all 20 skill definitions, Phantom-only mark vulnerability, faction-restricted ally support, evasion passives, Lucaz's stack/consume behavior, shield replacement, Bleeding, and the neutral hidden-operative descriptions.

The Phantom tactical controller is implemented in `ai/phantomTactics.js` and can play on either faction side. The interactive terminal now uses the unified mixed-faction roster selector. Run `npm start` to browse Falcon and Phantom operatives together, filter by faction/mastery/role, search, inspect a character preview, select 3–5 unique operatives, then arrange the first three active members and up to two reserves. The `elishia_p` operative remains displayed as `Unknown`; neither the selector nor its preview exposes the internal key. The chosen formation enters the default Training Ground encounter. The legacy faction-only selector remains available to compatibility tests and explicit callers. Faction-versus-faction testing is available through `npm run simulate:factions`, which alternates the player-side faction and runs both tactical controllers. These systems share the existing declarative skill interpreter and side-relative targeting views.


## Initial faction-versus-faction playtest — 2026-11-22

The first 500-battle tactical faction-duel batch used three active combatants and two reserves per side, mirrored tactical controllers, alternating faction seating, speed-based opening initiative, and symmetric hit/evasion handling. Both factions used the same shared combat runtime and action legality checks.

| Outcome | Battles | Rate |
|---|---:|---:|
| Falcon victories | 355 / 500 | 71.0% |
| Phantom victories | 145 / 500 | 29.0% |
| Draws | 0 / 500 | 0.0% |

Average battle length was 27.912 rounds. The simulator recorded 3.764 reserve deployments per battle and zero rejected decisions.

### Seating fairness check

| Falcon placement | Battles | Falcon wins | Falcon win rate |
|---|---:|---:|---:|
| Player side | 250 | 175 | 70.0% |
| Enemy side | 250 | 180 | 72.0% |

The small 2 percentage-point difference indicates that the earlier player-side rules asymmetry was resolved for this duel harness. The duel uses `symmetricEvasion` so both sides apply the same Evasion and basic-attack counter/retaliation behavior; this is a faction-duel setting and does not silently change the established PvE hit rules.

### Damage and balance interpretation

Average damage attributed to Phantom was 7,433.046 per battle versus 4,503.252 for Falcon. Despite the larger raw damage total, Phantom won fewer battles. This suggests Phantom is delivering substantial burst/offensive pressure, while Falcon's healing, shielding, defensive tools, and ability to sustain its active formation are converting more encounters into wins. This is an observation from this AI-versus-AI batch, not a definitive character balance verdict.

The next useful balance pass should inspect Phantom survivability and support coverage before increasing its damage values. Keep the approved skills and stat values unchanged until individual contribution and survival metrics are reviewed.

### Reproducibility

From the project root:

```bash
npm run simulate:factions -- --battles 500 --seed 20261122 --active 3
```

Raw results are in `reports/phantom-vs-falcon-500.json`. Curated samples and a detailed report are in `reports/phantom-vs-falcon-sample-battles.md` and `reports/phantom-vs-falcon-playtest-report.md`. The interactive terminal supports selecting either faction with `npm start`; the selected roster is then ordered by the player, with the first three members active and the remaining two in reserve. The `elishia_p` member continues to display as `Unknown`.
