# Falcon implementation guide — approved kit v1

**Authority.** Live Falcon mechanics are defined by `characters/skillData/*.js`, assembled by `characters/skills.js`, and executed by `core/skillInterpreter.js` with shared handlers in `systems/effects/`, `systems/passives/`, and `systems/summons/`. This guide records the approved Falcon design and the implementation currently in this prototype. The separate website JSON is a display/reference file, not a runtime dependency.

## Runtime conventions

- `Mpow` bonuses affect mastery-based attacks; `ATK` bonuses affect ATK-based/physical attacks. They are not interchangeable.
- Evasion bonuses/penalties are flat points; SPD, ATK, Mpow, DEF and RES modifiers are percentage modifiers.
- Same-stat same-direction modifiers use strongest-value priority. Weaker modifiers remain tracked and can resume when the strongest expires. Opposing percentage modifiers offset in percentage points.
- Reapplying the same status refreshes duration without increasing its strength. Explicitly stackable effects use their declared cap.
- Different status types coexist. Damage vulnerability and RES reduction are separate modifiers.
- Shields are separate pools; oldest shield absorbs first. Each shield tracks its own capacity and duration.
- Active skill duration is measured in the affected unit's turns unless the effect explicitly uses an owner-turn clock.
- MP regenerates by 5% Max MP at actor turn start (rounded up); cooldowns also decrement at actor turn start. DOT resolves before HOT and other turn-start healing. Status/shield duration ticks after the affected actor completes their turn. Effects applied during the current turn do not lose duration immediately.

## Elishia — Nanotech versatile specialist

**Biotech Overdrive.** At battle start, Elishia gains SPD +10% and Evasion +10 for 3 Elishia turns. After using a Nanotech skill, her next active skill costs 8 MP less. The discount is consumed by the next active skill and does not stack.

**Nano Swarm — 20 MP, 2-turn cooldown.** Choose one mode: Repair heals one selected ally for 15% Max HP; Disrupt deals 0.6× Nanotech mastery damage to one enemy and applies SPD -10% for 2 turns; Decoy grants Elishia +15 Evasion for 2 turns.

**Adaptive Barrier — 25 MP, 3-turn cooldown.** Target Elishia or one ally. Create a shield equal to 25% of target Max HP for 2 turns or until depleted. The latest damage type absorbed grants 15% resistance against that type for the shield's remaining duration.

**EB's Drone: Meo-9 — 35 MP, 4-turn cooldown.** Deploy Meo-9 for 3 subsequent Elishia turns; it skips its deployment turn and does not take a separate scheduler turn. After each subsequent Elishia turn, it checks living active non-summon allies below 25% Max HP. If any qualify, it heals the ally with the lowest HP percentage for 10% Max HP instead of attacking. Otherwise it performs one non-critical Physical cover-fire attack at 0.5× its own ATK against the first living enemy. During Nanotech Singularity, the cover-fire power becomes 0.75× its own ATK. There is no scan vulnerability, EMP destruction effect, Final Protocol, or other expiry effect. Meo-9 is targetable by enemies.

**Nanotech Singularity — 65 MP, 6-turn cooldown.** Deploy a field for 3 Elishia turns. Active non-summon allies gain ATK +15% and SPD +10%, and recover 5% Max HP at the start of their turns. Enemies receive SPD -10%. While Meo-9 remains deployed, its cover-fire power is 0.75× its own ATK.

## Evalete — Energy field medic

**Catalyst Protocol.** At battle start, deploy a targetable, non-turn-taking Catalyst Wing. It has 25% of Evalete's Max HP, 50% of her base DEF and 50% of her base RES. It lasts 12 Evalete turns and pulses at the start of every even Evalete turn, beginning on turn 2 and including turn 12. Each pulse heals active non-summon combatants on Evalete's own side for 8% Max HP and grants each a separate shield equal to 10% Max HP for 2 target turns. Destroying the Wing stops future pulses and gives no fallback shield.

**Sentinel Pulse — 20 MP, 2-turn cooldown.** Deal 0.75× Energy mastery damage to one enemy and apply DEF -15% for 2 turns.

**Triage Infusion — 25 MP, 3-turn cooldown.** Heal one ally for 22% Max HP and apply healing over time of 10% Max HP at the start of each of that ally's next 3 turns.

**Guardian Field — 40 MP, 4-turn cooldown.** Heal all active non-summon allies for 12% Max HP and grant DEF +15% for 2 turns.

**Catalyst Overdrive — 65 MP, 6-turn cooldown.** First cleanse all harmful statuses from living active non-summon allies (statuses marked as debuffs or carrying a negative stat amount; positive buffs are preserved), then heal all active non-summon allies for 18% Max HP, grant DEF +25% for 3 turns, apply healing over time of 10% Max HP for 3 turns, and grant 25% direct-damage reflection for 3 turns. Reflection is calculated from post-mitigation incoming direct damage before shield absorption, then mitigated by the original attacker's defenses. DOT, self-damage, and reflected damage do not recursively trigger reflection.

## Zackry — Electromagnetic tactician

**Overwatch Protocol.** Enemies affected by Tactical Mark lose 10 Evasion for the mark's duration. There is no ally accuracy token.

**Tactical Mark — 20 MP, 2-turn cooldown.** Mark one enemy for 3 turns: incoming damage +15% and Evasion -10.

**Command Uplink — 30 MP, 3-turn cooldown.** Active non-summon allies gain Mpow +15% for 3 turns.

**EMP Burst — 35 MP, 4-turn cooldown.** Deal 0.8× Electromagnetic mastery damage to one enemy and apply SPD -20% for 2 turns. The slow is not strengthened by Tactical Mark.

**Full Spectrum Assault — 60 MP, 6-turn cooldown.** Mark all living enemies with Tactical Mark and grant active non-summon allies Mpow +20% and SPD +10% for 3 turns.

## Jazen — Kinetic juggernaut/demolitionist

**Recoil Dampeners.** When a direct hit deals more than 10% of Jazen's Max HP after damage mitigation but before shield absorption, grant Mpow +10% for 2 turns, up to 2 stacks. Further qualifying hits at the cap refresh the duration. No Stagger or action-delay immunity is granted.

**Impact Grenade — 20 MP, 2-turn cooldown.** Deal 0.8× Kinetic mastery damage to all living enemies. No Stagger effect.

**Breach Charge — 30 MP, 3-turn cooldown.** Deal 1.2× Kinetic mastery damage to one enemy and apply DEF -20% for 2 turns. No Stagger effect.

**Reinforced Plating — 25 MP, 3-turn cooldown.** Grant Jazen a shield equal to 25% Max HP for 3 turns and DEF +20% for 3 turns. No Taunt.

**Cataclysmic Payload — 65 MP, 6-turn cooldown.** Deal 1.5× Kinetic mastery damage to all living enemies and apply DEF -15% for 2 turns.

## Zenki — Energy stalker

**Unobserved.** At the start of each Zenki turn, if he has not taken damage since the end of his previous turn, grant Evasion +12 until he takes damage. There is no attacker accuracy penalty.

**Railshot — 20 MP, 2-turn cooldown.** Deal 1.1× Energy mastery damage to one enemy. The shot cannot miss and has no conditional damage bonus.

**Cipher Tag — 25 MP, 3-turn cooldown.** Reduce one enemy's RES by 15% for 3 turns. Only one enemy can be tagged at a time; tagging another target replaces the previous tag. It does not add a damage-taken vulnerability modifier.

**Ghost Protocol — 35 MP, 4-turn cooldown.** Make Zenki untargetable until the start of his next turn. His next damaging skill receives a one-use +30% damage modifier applied to that skill's total damage, not separately multiplied per hit.

**Zero Hour Execution — 60 MP, 6-turn cooldown.** Fire three Energy rail shots at one enemy, each at 0.9× Mpow. The target's HP percentage is snapshotted at activation; if strictly below 40%, the final shot uses 1.6× Mpow instead of 0.9×. The hit multipliers are separate, the first shot uses standard hit resolution, later shots cannot miss, and remaining shots stop if the target is defeated.

## Approved global timing/stacking standards

- Stacking behavior applies globally to player units, enemies, bosses and summons.
- Same-stat same-direction modifiers use strongest-value priority; weaker active effects resume when stronger ones expire. Opposing percent modifiers offset.
- Same effect reapplication refreshes duration without strengthening it unless explicitly stackable.
- Different status types may coexist. Separate shields absorb oldest-first.
- Turn-start order: 5% Max MP regeneration and cooldown decrement; DOT; HOT and other turn-start healing; passive checks; action. Turn-end lifecycle then ticks the affected unit's statuses/shields. Owner-clocked effects and passive summons advance on owner turns.
- Stagger's first application pushes readiness back by 20 CR; reapplication refreshes without a second pushback and does not delete an action. `actionDelay` remains a separate mechanic.

See [Combat Mechanics](COMBAT_MECHANICS.md) for shared-system detail and [Falcon approved-kit reference](OWNER_SKILL_REFERENCE.md) for source organization.
