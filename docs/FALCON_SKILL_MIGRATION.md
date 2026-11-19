# Falcon Skill Engine Alignment — 2026-11-16

## Canonical design source

The project owner supplied a character reference for website guidance. A reference copy is kept at `ref/characterTerraData.json`; it is not loaded by the combat engine and does not define runtime behavior. The combat engine implementation and tests are authoritative. Update the reference JSON after engine mechanics change. The five Falcon entries are summarized in `docs/OWNER_SKILL_REFERENCE.md`.

This source supersedes the earlier prototype skill definitions. Use it for Falcon skill titles, descriptions, passive rules, MP costs and cooldowns. Do not silently preserve earlier prototype substitutions when they conflict with the owner reference.

## What changed

- Replaced the previous prototype skill data for Elishia, Evalete, Zackry, Jazen and Zenki with the owner's named skills and values.
- Updated all five passives where their rules can be implemented without inventing missing source details.
- Expanded `core/skillInterpreter.js` with area healing, healing-over-time, cleanse, damage-taken/dealt modifiers, tactical/cipher marks, conditional statuses, threshold attacks, stagger chance, and passive lifecycle hooks.
- Added passive lifecycle callbacks for battle start, actor turn start/end, damage taken, enemy skill targeting, round start and unit defeat.
- Added flat MP discounts for Elishia's 8 MP Biotech Overdrive discount.
- Added Jazen's Recoil Dampeners, Stagger/action-delay immunity, Stagger readiness pushback (without deleting the next action), and Taunt-aware enemy targeting.
- Added Zackry's Tactical Mark damage/evasion modifiers, marked-defeat MP recovery, conditional Command Uplink, Full Spectrum Critical Rate bonus, and next-attack Accuracy token (basic or skill attack).
- Added Zenki's Unobserved Evasion, Railshot conditional damage, single-target Cipher Tag, Ghost Protocol damage bonus, and Zero Hour execute threshold.
- Updated Meo-v9 Emergency Field to heal the lowest-HP-ratio living ally below 25% Max HP for 10% Max HP instead of reviving downed allies.
- Added focused tests for all five agents' implemented mechanics and retained the original battle test suite.

## Finalized implementation choices — 2026-11-17

The owner approved balanced additions where the original reference omitted implementation values. The following values are explicit implementation decisions, not quoted owner-specified numbers:

1. **Meo-v9 Final Protocol:** 1.0x Elishia Mpow Electromagnetic damage to the priority primary enemy and 0.5x Mpow to each secondary enemy; all surviving enemies receive SPD -15% for 1 turn. The primary is the enemy most recently targeted by an ally when Meo-v9 is deployed, falling back to the first living enemy. It fires once only on natural expiry; early destruction does not trigger it.
2. **Nanotech Singularity DoT:** 0.2x Elishia Mpow as non-critical Nanotech damage at the start of each enemy turn for the 3-turn field. The tick is applied through the shared damage pipeline and does not trigger additional DoT effects.
3. **Catalyst Wing:** a non-turn-taking, enemy-targetable passive summon with 25% of Evalete's Max HP and 50% of her base DEF/RES. Early destruction ends its passive pulses and grants Evalete the specified 15% Max HP shield for 4 turns; natural expiry does not grant that shield.
4. **Zackry Accuracy:** the +10 Accuracy token is consumed by the recipient's next attack, including skill attacks, and reduces the target's Evasion check by 10 points. Attacks explicitly unable to miss remain guaranteed hits and still consume the token.
5. **Jazen Stagger:** first application pushes the target back by 20 readiness points. It delays readiness without erasing the target's next action; reapplication refreshes the one-turn marker without adding another pushback. Jazen remains immune.

All values above are isolated in skill/passive data or shared status/damage systems; MP costs, cooldowns, and owner-authored values remain unchanged.

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

The Falcon finalization intentionally changes combat behavior and logs. Golden transcript fixtures are regenerated after focused tests and full-suite verification. See `docs/FALCON_MECHANICS_FINALIZATION.md` for the final implementation contract.

## Next agreed development step

The next work item is **Step 3: expand full-battle regression coverage** for victory/defeat, all five Falcon skill kits in real battles, passive interactions, enemy AI targeting, status duration, and reserve transitions. Do not start enemy skill migration until those engine regressions are established.
