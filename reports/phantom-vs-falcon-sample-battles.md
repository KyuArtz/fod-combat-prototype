# Phantom vs Falcon — Sample Battle Highlights

These are curated excerpts from two deterministic battles run after the side-relative support and status-display fixes. They are not complete transcripts; the raw logs are in the project playtest output. Skill descriptions use the neutral in-game display name **Unknown** for the hidden operative.

## Seed 20261122 — Falcon side wins

- Player-side faction: **Falcon**
- Opposing faction: **Phantom**
- Outcome: **VICTORY** in **29 rounds**
- Formation: 3 active members and 2 reserves per side

- **Round 1:** Unknown releases Scarlet Eclipse against all enemies and gains 15% increased damage dealt for 2 turns.
- **Round 1:** FULL SPECTRUM ASSAULT! All living enemies are Tactical Marked and active allies gain MPow +20% and SPD +10% (3 turns).
- **Round 1:** Unknown executes Crimson Phalanx against Zackry, resolving its three-strike sequence as one 229 Anomaly damage instance and applying Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).
- **Round 1:** Mirazhel releases Nocturne of the Phantom Queen, striking all enemies and empowering active allies with ATK +15% for 2 turns.
- **Round 1:** Lucaz unleashes Cataclysm of the Iron Titan, damaging and Staggering all enemies while active allies gain 10% damage reduction for 2 turns.
- **Round 2:** Mirazhel executes Zackry with Requiem of the Vanishing Blade for 224 Anomaly damage (Phantom Mark bonus).
- **Round 2:** Evalete uses Triage Infusion on Zackry, restoring 275 HP and applying 10% Max HP healing each turn for 3 turns.
- **Round 3:** Nano Swarm repairs Zackry, restoring 187 HP.
- **Round 6:** Clarke uses Riftpiercer against Evalete for 99 Electromagnetic damage.
- **Round 10:** Liezli unleashes Silverpoint Barrage against all enemies, applying Bleeding (15% of the applier's ATK as Anomaly damage per tick) and reducing their accuracy by 15% for 2 turns.
- **Round 11:** Liezli fires Ghostlight Volley at Zackry for 130 Anomaly damage and applies Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).
- **Round 14:** Zenki executes Zero Hour on Clarke with 3 rail shots for 412 total Energy damage (execution shot).
- **Round 14:** Evalete deploys to ally formation slot 1!
- **Round 16:** Zackry deploys to ally formation slot 1!
- **Round 28:** Lucaz is incapacitated!

**Survivors**
- Falcon: Jazen (597/1350 HP), Zenki (1000/1000 HP)
- Phantom: None

## Seed 20261125 — Phantom side wins

- Player-side faction: **Phantom**
- Opposing faction: **Falcon**
- Outcome: **VICTORY** in **26 rounds**
- Formation: 3 active members and 2 reserves per side

- **Round 1:** Unknown executes Crimson Phalanx against Zackry, resolving its three-strike sequence as one 229 Anomaly damage instance and applying Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).
- **Round 1:** Mirazhel releases Nocturne of the Phantom Queen, striking all enemies and empowering active allies with ATK +15% for 2 turns.
- **Round 1:** Zackry fires EMP Burst at Unknown: 95 Electromagnetic damage; SPD -20% (2 turns).
- **Round 1:** Lucaz unleashes Cataclysm of the Iron Titan, damaging and Staggering all enemies while active allies gain 10% damage reduction for 2 turns.
- **Round 2:** Mirazhel executes Meo-9 with Requiem of the Vanishing Blade for 316 Anomaly damage (Phantom Mark bonus).
- **Round 3:** Evalete uses Triage Infusion on Zackry, restoring 275 HP and applying 10% Max HP healing each turn for 3 turns.
- **Round 7:** Clarke uses Riftpiercer against Zackry for 96 Electromagnetic damage.
- **Round 10:** Liezli unleashes Silverpoint Barrage against all enemies, applying Bleeding (15% of the applier's ATK as Anomaly damage per tick) and reducing their accuracy by 15% for 2 turns.
- **Round 11:** Liezli fires Last Light, No Witnesses at Zackry for 203 Anomaly damage.
- **Round 11:** Liezli fires Ghostlight Volley at Evalete for 133 Anomaly damage and applies Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).
- **Round 16:** Zenki executes Zero Hour on Lucaz with 3 rail shots for 311 total Energy damage (execution shot).
- **Round 16:** Elishia deploys to enemy formation slot 2!
- **Round 18:** Unknown deploys to ally formation slot 3!
- **Round 20:** Liezli fires Ghostlight Volley at Jazen for 223 Anomaly damage and applies Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).
- **Round 25:** Liezli fires Ghostlight Volley at Zenki for 124 Anomaly damage and applies Bleeding for 2 turns (15% of the applier's ATK as Anomaly damage per tick).
- **Round 26:** Zenki is incapacitated!

**Survivors**
- Falcon: None
- Phantom: Liezli (728/1020 HP), Clarke (1135/1325 HP)

## Bleeding baseline observed in combat

The migrated initial Bleeding value is **0.15× the applier’s ATK**, calculated when the effect is applied as Anomaly damage. It ticks at the start of the affected unit’s turns for **2 turns**. It does not stack; reapplication refreshes duration. For example, the log records the actual resolved damage per tick after the shared Anomaly damage formula and target mitigation, so displayed tick numbers can be lower than the pre-mitigation scaling value.

## What these samples demonstrate

- Both factions can win when placed on the player side or the enemy side.
- Three-active/two-reserve deployment and replacement occur during the battle.
- Phantom Mark, Bleeding, stagger, healing, evasion, shields, summons, and multi-hit skills appear in actual battle output.
- The hidden operative remains displayed as **Unknown** in battle-facing text.
