# Roster & Skill Reference

## F.O.D. mastery types

The project defines these eight mastery types:

1. Energy
2. Kinetic
3. Electromagnetic
4. Toxic
5. Nuclear
6. Nanotech
7. Cryogenic
8. Anomaly

Falcon agents receive a +15 mastery bonus for their assigned mastery in the current data. Mastery resistance defaults to zero unless configured.

## Falcon playable roster (source snapshot)

Base stats from `characters/falcon.js`. Elishia's Biotech Overdrive temporarily raises effective SPD to 104 and Evasion to 20 for her first three turns; see her entry below.

| Agent | Mastery | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Elishia | Nanotech | 1100 | 130 | 95 | 150 | 75 | 82 | 95 | 15 | 10 |
| Evalete | Energy | 1450 | 110 | 85 | 120 | 110 | 95 | 75 | 10 | 5 |
| Zackry | Electromagnetic | 1250 | 120 | 100 | 135 | 90 | 100 | 85 | 10 | 5 |
| Jazen | Kinetic | 1350 | 100 | 125 | 95 | 100 | 75 | 70 | 10 | 5 |
| Zenki | Anomaly | 1000 | 150 | 80 | 145 | 70 | 110 | 110 | 10 | 5 |

## Training enemy roster (source snapshot)

| Enemy | HP | MP | ATK | MPow | DEF | RES | SPD | Crit | Evasion | Mastery |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Training Drone | 700 | 0 | 65 | 50 | 45 | 45 | 70 | 5 | 0 | Kinetic |
| Rogue Automaton | 850 | 0 | 75 | 60 | 55 | 50 | 60 | 5 | 0 | Kinetic |
| Siege Turret | 900 | 0 | 90 | 45 | 70 | 40 | 35 | 5 | 0 | Kinetic |
| Recon Drone | 620 | 0 | 58 | 70 | 35 | 65 | 115 | 5 | 12 | Kinetic |
| Toxic Stalker | 760 | 0 | 72 | 85 | 45 | 60 | 82 | 5 | 0 | Toxic |

(The SPD column was missing from an earlier version of these tables; the values above are read from the source.)

## Owner-aligned Falcon skill reference

The canonical skill source is the original character reference supplied by the owner; the project bundles only selected stats, skills and stat descriptions in `references/characterTerraData.js`. See `docs/OWNER_SKILL_REFERENCE.md` for the full extracted text and implementation caveats. The data modules in `data/skills/` mirror that source where the engine has enough information to implement the behavior.

| Agent | Passive | Skill 1 | Skill 2 | Skill 3 | Ultimate |
|---|---|---|---|---|---|
| Elishia | Biotech Overdrive | Nano Swarm (20 MP / 2) | Adaptive Barrier (25 / 3) | Meo-v9 (35 / 4) | Nanotech Singularity (60 / 6) |
| Evalete | Catalyst Protocol | Sentinel Pulse (20 / 2) | Triage Infusion (25 / 3) | Guardian Field (40 / 4) | Catalyst Overdrive (60 / 6) |
| Zackry | Overwatch Protocol | Tactical Mark (20 / 2) | Command Uplink (30 / 3) | EMP Burst (35 / 4) | Full Spectrum Assault (60 / 6) |
| Jazen | Recoil Dampeners | Impact Grenade (20 / 2) | Breach Charge (30 / 3) | Reinforced Plating (25 / 3) | Cataclysmic Payload (60 / 6) |
| Zenki | Unobserved | Railshot (20 / 2) | Cipher Tag (25 / 3) | Ghost Protocol (35 / 4) | Zero Hour Execution (60 / 6) |

### Implemented passive mechanics

- **Elishia — Biotech Overdrive:** at battle start, +10% SPD and +10 Evasion for 3 of Elishia's turns; after each Nanotech skill, her next skill costs 8 less MP (minimum 0).
- **Evalete — Catalyst Protocol:** Catalyst Wing support lasts 12 turns (currently tracked in Evalete actor turns); every second Evalete turn all active allies recover 8% Max HP and gain a 10% Max HP shield for 2 turns. The destruction-triggered 15% shield is pending because the owner reference does not define Wing HP/targetability.
- **Zackry — Overwatch Protocol:** +10 Accuracy for the next basic attack of the relevant ally; Tactical Mark reduces target Evasion by 10. Marked enemy defeat restores 5% Max MP to active allies.
- **Jazen — Recoil Dampeners:** after a hit exceeding 10% Max HP, ATK +10% for 2 turns, stacking to +20%; immune to Stagger/action delay.
- **Zenki — Unobserved:** +12 Evasion while no enemy skill has targeted him during the current round; being hit suppresses the passive until his next turn. Basic attacks against him also suffer the passive's 10-point Accuracy penalty.

### Implementation notes and explicit gaps

- All five active skill sets are declarative and use `core/skillInterpreter.js`; `characters/skills.js` assembles the registry.
- Shared interpreter effects include healing, healing-over-time, cleansing, shields, stat changes, area mastery damage, damage-taken/dealt modifiers, marks, stagger, conditional attacks and summons.
- **Meo-v9 Final Protocol:** expiry EMP structure is described but damage scaling is absent; no multiplier is guessed.
- **Nanotech Singularity DoT:** the owner reference does not give damage amount/scaling; the rest of Singularity is implemented.
- **Catalyst Wing destruction shield:** 15% Max HP for 4 turns is known, but no Wing HP/targetability/destruction trigger is specified.
- **Accuracy:** the current prototype has an accuracy check on basic attacks; the +10 bonus is consumed there. No global skill-hit accuracy system has been invented.
- Base stats in `characters/falcon.js` are still prototype values. This milestone aligns skills and passives only; a separate owner-approved stat sync is required before replacing them.

## Skill execution architecture

A skill entry contains `key`, `name`, `cost`, `cooldown`, `targeting`, optional `tags`, `effects` and a result `message`. The controller selects the action/target; `core/skillInterpreter.js` checks readiness, pays MP, sets cooldowns, applies effects and triggers passive hooks. Skills never prompt directly.

`node --test` validates data, effect behavior, passive lifecycle and seeded battle regressions. See `docs/ARCHITECTURE.md`, `docs/COMBAT_MECHANICS.md` and `docs/TESTING_AND_PLAYTESTING.md`.
