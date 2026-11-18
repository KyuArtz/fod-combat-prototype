# Falcon implementation guide (Step 9)

**Authority and scope.** This guide describes the Step 9 executable implementation in `data/skills/*.js`, `characters/falcon.js`, and `core/skillInterpreter.js`. Values below are engine values, not proposed balance changes. Percentages and multipliers are stated as encoded. The separate website roster JSON is not an engine dependency; the owner updates that site data manually. The engine's compact reference is `references/characterTerraData.js`.

## Runtime conventions

- Skill costs and cooldowns are shown exactly as declared in the skill data.
- `x Mpow` means mastery damage calculated by the shared mastery damage pipeline, not a guaranteed final HP loss. Physical summon cover fire uses the shared physical pipeline.
- Status durations are turn counters managed by shared status systems. Reapplication behavior is determined by the status implementation; do not assume every effect stacks.
- A skill description must not imply behavior absent from the executable effect data or interpreter.

## Elishia

**Passive — Biotech Overdrive.** At battle start, Elishia receives SPD +10 and Evasion +10 for 3 turns. After she uses a skill tagged `Nanotech`, she gains a next-skill MP discount of 8. The discount is stored as the maximum current discount, so repeated triggers do not add together. It is consumed by the next successful skill payment and cannot reduce cost below zero (see cooldown/payment system).

**Nano Swarm — 20 MP, 2-turn cooldown.** Choose one mode:
- **Repair:** restore 15% of each active non-summon ally's Max HP.
- **Disrupt:** deal 0.6x Elishia's mastery damage as Nanotech damage to each living enemy and apply SPD -10 for 2 turns.
- **Decoy:** apply Evasion +15 to Elishia for 2 turns. This is a flat Evasion stat amount, not +15%.

**Adaptive Barrier — 25 MP, 3-turn cooldown.** Target Elishia or one ally. Apply a shield equal to 25% of the target's Max HP for 2 turns, with adaptive resistance +15 against the damage type absorbed by the shield, for the remaining shield duration.

**Meo-v9 — 35 MP, 4-turn cooldown.** Summon Meo-v9 for 3 summon activations. Meo-v9 has HP 350, ATK 65, MPow 80, DEF 35, RES 35 and SPD 100. Its scan increases damage dealt by Elishia to scanned enemies by 10%. On each summon activation, it attacks the first living enemy for 0.5x its own ATK as Physical damage (non-critical). If any active non-summon ally is below 25% of Max HP at that activation, Meo-v9 instead heals the ally with the lowest current-HP percentage for 10% Max HP; it does not also attack that activation.

**Final Protocol (Meo-v9 natural expiry).** On natural expiry after its 3rd summon activation, it fires once. The primary target is the enemy selected when Meo-v9 was deployed (the explicit skill target, otherwise the most recently ally-targeted living enemy, otherwise the first living enemy). The primary takes 1.0x Meo-v9's MPow (80) as Electromagnetic mastery damage; every other living enemy takes 0.5x Meo-v9's MPow (40). Enemies hit receive SPD -15 for 1 turn. If Meo-v9 is destroyed before natural expiry, Final Protocol does not fire.

**Nanotech Singularity — 60 MP, 6-turn cooldown.** Apply a 3-turn field. Active non-summon allies gain ATK +15 and SPD +10, and recover 5% Max HP at the start of their turns. Living enemies receive SPD -10 for 3 turns and a Nanotech DoT for 3 enemy turns. DoT damage is calculated when applied using 0.2x Elishia's MPow through the mastery calculation with critical hits disabled; the resulting damage amount is stored on the status and applied at the start of each affected enemy turn. It does not trigger additional DoT effects. While the field is active, Meo-v9's cover-fire multiplier is 0.75x its own ATK instead of 0.5x.

## Evalete

**Passive — Catalyst Protocol.** At battle start, creates a targetable, non-turn-taking Catalyst Wing. It lasts 12 Evalete turn-end ticks and has HP equal to 25% of Evalete's Max HP, DEF equal to 50% of Evalete's base DEF and RES equal to 50% of her base RES. At the end of every second Evalete turn, all active non-summon allies recover 8% Max HP and receive a shield equal to 10% Max HP for 2 turns. The passive refreshes its own shield rather than adding another shield from the same source. If the Wing is destroyed while its remaining-turn counter is positive, Evalete gains a shield equal to 15% Max HP for 4 turns and the Wing timer is ended. Natural expiry does not grant this shield.

**Sentinel Pulse — 20 MP, 2-turn cooldown.** Deal 0.75x Evalete's Energy mastery damage to one enemy and apply DEF -15 for 2 turns.

**Triage Infusion — 25 MP, 3-turn cooldown.** Restore 22% of one ally's Max HP.

**Guardian Field — 40 MP, 4-turn cooldown.** Restore 12% Max HP to all active non-summon allies and apply DEF +15 for 2 turns.

**Catalyst Overdrive — 60 MP, 6-turn cooldown.** Cleanse ally statuses marked as debuffs (and negative-amount statuses), restore 18% Max HP to active non-summon allies, apply DEF +25 and Retaliation +25 for 3 turns, and apply healing over time equal to 10% Max HP at the start of each ally turn for 3 turns.

## Zackry

**Passive — Overwatch Protocol.** After Zackry uses a skill, if its target is an ally, that ally receives a +10 next-attack Accuracy token. If its target is an enemy currently targeted by an ally, the ally recorded as targeting that enemy receives the token. Untargeted/all-team skills do not distribute tokens. The token is consumed by the recipient's next attack action, including a skill attack, and reduces the target's Evasion check by 10 points. A guaranteed-hit attack remains guaranteed and still consumes the token. Tactical Mark separately applies Evasion -10 to its marked enemy.

**Tactical Mark — 20 MP, 2-turn cooldown.** Mark one enemy for 3 turns: incoming damage +15% and Evasion -10. When a marked enemy is defeated, each living active non-summon ally recovers 5% of their own Max MP. The defeat reward is guarded against repeat claims.

**Command Uplink — 30 MP, 3-turn cooldown.** For 3 turns, active non-summon allies gain ATK +15. At the start of each affected ally's turn, the amount is recalculated from the base +15; if current HP is strictly greater than 50% of Max HP, the bonus is +20 total. This is a conditional total, not an additional stacking buff.

**EMP Burst — 35 MP, 4-turn cooldown.** Deal 0.8x Zackry's Electromagnetic mastery damage to one enemy. Apply SPD -20 for 2 turns, or SPD -35 for 2 turns if the target has Tactical Mark.

**Full Spectrum Assault — 60 MP, 6-turn cooldown.** Mark all living enemies for 3 turns using Tactical Mark's +15% incoming damage and -10 Evasion behavior. Active non-summon allies gain ATK +20, MPow +15 and SPD +10 for 3 turns, plus Critical Rate +10 against Tactical Marked targets for 3 turns. The Ultimate's marks use the same marked-enemy defeat reward hook.

## Jazen

**Passive — Recoil Dampeners.** When Jazen takes a damage event that causes actual HP loss strictly greater than 10% of his Max HP (after shield absorption), he gains ATK +10 per stack for 2 turns, up to 2 stacks (+20 total). The status refreshes with the current stack count. Jazen is immune to `staggered` and `actionDelay` statuses.

**Impact Grenade — 20 MP, 2-turn cooldown.** Deal 0.8x Jazen's Kinetic mastery damage to all living enemies. Each enemy hit independently has a 20% chance to receive Stagger for 1 turn.

**Breach Charge — 30 MP, 3-turn cooldown.** Deal 1.2x Kinetic mastery damage to one enemy, apply DEF -20 for 2 turns, and apply Stagger for 1 turn.

**Stagger behavior.** First application pushes the target's combat readiness back by 20 points; it does not delete or skip an action. Reapplication refreshes the one-turn status marker without applying another readiness pushback.

**Reinforced Plating — 25 MP, 3-turn cooldown.** Jazen gains a shield equal to 25% Max HP for 3 turns, DEF +20 for 3 turns, and Taunt for 2 turns.

**Cataclysmic Payload — 60 MP, 6-turn cooldown.** Deal 1.5x Kinetic mastery damage to all living enemies, apply DEF -15 for 2 turns, and independently give each enemy hit a 25% chance to receive Stagger for 1 turn.

## Zenki

**Passive — Unobserved.** At the start of Zenki's turn, the engine records whether an enemy targeted her since her previous turn. If not targeted, Railshot is eligible for its Unobserved bonus on that turn. Being targeted by an enemy skill or taking damage marks her as targeted/suppresses the condition until the next turn-start check. The passive data also defines an attacker Accuracy penalty of 10; actual attack handling is shared by the targeting/combat systems.

**Railshot — 20 MP, 2-turn cooldown.** Deal 1.1x Zenki's Energy mastery damage to one enemy. If she was not targeted by an enemy during the preceding interval, power is multiplied by 1.30, resulting in 1.43x. The attack explicitly bypasses Accuracy/miss checks.

**Cipher Tag — 25 MP, 3-turn cooldown.** Apply a 3-turn mark to one enemy: incoming damage +12% and RES -15. Applying Cipher Tag to a new enemy removes the prior enemy's Cipher Tag and associated RES reduction.

**Ghost Protocol — 35 MP, 4-turn cooldown.** Zenki gains Evasion +25, SPD +20 and damage dealt +25% for 3 turns.

**Zero Hour Execution — 60 MP, 6-turn cooldown.** Deal 2.4x Zenki's Energy mastery damage to one enemy. If the target's current HP is strictly below 40% of Max HP when the hit resolves, use 3.2x instead. If the target survives and has Cipher Tag, apply SPD -25 for 2 turns. The slow is not applied if the target is defeated by the hit.

## Values intentionally not generalized

- `+10 Evasion`, `-15 DEF`, `+20 ATK`, etc. are stat amounts as encoded, not percentages unless the engine stat system explicitly treats that stat amount as a percentage modifier. Do not append `%` to flat-stat values in website text.
- The engine's prototype battle stats in `characters/falcon.js` are the runtime stats. They are distinct from the separate website roster JSON.
- The descriptions above do not infer unimplemented effects from flavor text. When engine code changes, update this guide and then the owner's separate website JSON manually.
