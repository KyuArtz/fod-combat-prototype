# Falcon Skill Engine Alignment — 2026-11-16

## Canonical design source

The project owner supplied the original character reference. The complete original file is not bundled in updated ZIPs; `references/characterTerraData.js` contains only selected character stats, skills and stat descriptions. The five Falcon entries are summarized in `docs/OWNER_SKILL_REFERENCE.md`.

This source supersedes the earlier prototype skill definitions. Use it for Falcon skill titles, descriptions, passive rules, MP costs and cooldowns. Do not silently preserve earlier prototype substitutions when they conflict with the owner reference.

## What changed

- Replaced the previous prototype skill data for Elishia, Evalete, Zackry, Jazen and Zenki with the owner's named skills and values.
- Updated all five passives where their rules can be implemented without inventing missing source details.
- Expanded `core/skillInterpreter.js` with area healing, healing-over-time, cleanse, damage-taken/dealt modifiers, tactical/cipher marks, conditional statuses, threshold attacks, stagger chance, and passive lifecycle hooks.
- Added passive lifecycle callbacks for battle start, actor turn start/end, damage taken, enemy skill targeting, round start and unit defeat.
- Added flat MP discounts for Elishia's 8 MP Biotech Overdrive discount.
- Added Jazen's Recoil Dampeners, Stagger/action-delay immunity, Staggered turn skip, and Taunt-aware enemy targeting.
- Added Zackry's Tactical Mark damage/evasion modifiers, marked-defeat MP recovery, conditional Command Uplink, Full Spectrum Critical Rate bonus, and next-basic-attack Accuracy bonus.
- Added Zenki's Unobserved Evasion, Railshot conditional damage, single-target Cipher Tag, Ghost Protocol damage bonus, and Zero Hour execute threshold.
- Updated Meo-v9 Emergency Field to heal the lowest-HP-ratio living ally below 25% Max HP for 10% Max HP instead of reviving downed allies.
- Added focused tests for all five agents' implemented mechanics and retained the original battle test suite.

## Explicitly deferred — source lacks required numbers or trigger rules

1. Meo-v9 Final Protocol's expiry EMP has no primary damage scaling in the owner reference.
2. Nanotech Singularity's enemy Nanotech DoT has no damage amount/scaling.
3. Catalyst Wing's destruction shield has no Wing HP, targetability or destruction trigger.
4. Zackry Accuracy currently affects the prototype's basic-attack accuracy check; the engine does not yet have a general accuracy/miss model for mastery skills.

These are documented gaps, not guessed mechanics. Ask the owner for the missing rules before implementing them.

## Values now in engine data

| Agent | Skill 1 | Skill 2 | Skill 3 | Ultimate |
|---|---|---|---|---|
| Elishia | Nano Swarm 20/2 | Adaptive Barrier 25/3 | Meo-v9 35/4 | Nanotech Singularity 60/6 |
| Evalete | Sentinel Pulse 20/2 | Triage Infusion 25/3 | Guardian Field 40/4 | Catalyst Overdrive 60/6 |
| Zackry | Tactical Mark 20/2 | Command Uplink 30/3 | EMP Burst 35/4 | Full Spectrum Assault 60/6 |
| Jazen | Impact Grenade 20/2 | Breach Charge 30/3 | Reinforced Plating 25/3 | Cataclysmic Payload 60/6 |
| Zenki | Railshot 20/2 | Cipher Tag 25/3 | Ghost Protocol 35/4 | Zero Hour Execution 60/6 |

Notation is `MP cost / cooldown in turns`.

## Verification

Run:

```bash
node --test
```

The owner-alignment change intentionally changes skill behavior and combat logs. The golden transcript fixtures were regenerated only after adding focused mechanic tests and checking the resulting battle runs. See `docs/TESTING_AND_PLAYTESTING.md` for the current count.

## Next agreed development step

The next work item is **Step 3: expand full-battle regression coverage** for victory/defeat, all five Falcon skill kits in real battles, passive interactions, enemy AI targeting, status duration, and reserve transitions. Do not start enemy skill migration until those engine regressions are established.
