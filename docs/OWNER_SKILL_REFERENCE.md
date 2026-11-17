# Owner-provided Falcon skill reference

**Canonical source:** the original character reference uploaded by the project owner on 2026-11-16. The full original file is intentionally not included in project ZIPs; `references/characterTerraData.js` contains only the selected stats, skills and stat-description objects.

Use this file as the authority for Falcon skill names, descriptions, MP costs, cooldowns and passive design. Engine code in `data/skills/` implements these rules; where the source leaves a mechanic or number unspecified, do not invent a value—record it as pending owner clarification.

## Elishia Bluestein (`elishia`)

**Passive — Biotech Overdrive:** Nanotechnology improves Elishia's aim stability, reload speed, and evasion. At battle start, gain 10% SPD and 10% Evasion for 3 turns. After Elishia uses a Nanotech skill, her next skill costs 8 MP less. The discount is consumed upon skill use, cannot stack, and cannot reduce a skill's MP cost below 0. This passive does not increase damage.

### Skill 1: Nano Swarm — 20 MP, 2 turn cooldown

Deploy nanobots and select one mode:

Mode A (Repair): Restores 15% of all allies' Max HP.

Mode B (Disrupt): Deals 60% Nanotech Damage to all enemies and reduces their SPD by 10% for 2 turns. SPD reduction does not stack; reapplication refreshes its duration.

Mode C (Decoy): Grants Elishia 15% Evasion for 2 turns. Reapplication refreshes the effect's duration without stacking.

### Skill 2: Adaptive Barrier — 25 MP, 3 turn cooldown

Protect Elishia or one ally with a nanotech barrier absorbing damage equal to 25% of the target's Max HP. Lasts 2 turns or until depleted. Adapts to the last damage type absorbed, granting 15% resistance against that type for the remaining duration.

### Skill 3: Meo-v9 — 35 MP, 4 turn cooldown

Deploy Meo-v9 for 3 turns. It scans enemies, increasing their damage taken from Elishia by 10%, and fires once per Meo-v9 turn for 50% of its own ATK as Physical Damage.

Emergency Field: At the start of Meo-v9's turn, if an ally is below 25% Max HP, Meo-v9 may restore 10% of that ally's Max HP instead of attacking. It prioritizes the ally with the lowest current HP percentage and cannot heal and attack during the same activation.

Final Protocol: When its deployment expires, Meo-v9 launches at one selected enemy and releases an EMP. The selected enemy receives direct damage, while all enemies receive Electromagnetic damage. Secondary enemies receive 50% of the primary EMP damage. All enemies hit have their SPD reduced by 15% for 1 turn.

### Ultimate: Nanotech Singularity — 60 MP, 6 turn cooldown

Deploy a nanotech field for 3 turns.

All allies gain 15% ATK and 10% SPD and recover 5% Max HP at the start of their turns.

All enemies suffer 10% SPD reduction and Nanotech damage over time at the start of their turns. The SPD reduction refreshes rather than stacks.

While the field is active, Meo-v9's covering fire increases to 75% of its own ATK as Physical Damage. Enemies scanned by Meo-v9 take an additional 10% damage from Elishia. Nanotech damage over time does not trigger additional damage-over-time effects.

## Evalete Rosewelt (`evalete`)

**Passive — Catalyst Protocol:** The Catalyst Wing persists for 12 turns. At the end of every second turn, all active allies recover 8% of their Max HP and gain a shield equal to 10% of their Max HP for 2 turns. These shields do not stack; reapplication refreshes their duration. If the Catalyst Wing is destroyed before its lifespan expires, Evalete gains a shield equal to 15% of her Max HP for 4 turns. The emergency shield does not stack with itself.

### Skill 1: Sentinel Pulse — 20 MP, 2 turn cooldown

Fires an Energy pulse at one enemy, dealing Energy mastery damage at 0.75x Mpow power. Reduces the target's DEF by 15% for 2 turns. Reapplication refreshes the duration rather than stacking.

### Skill 2: Triage Infusion — 25 MP, 3 turn cooldown

Administers a concentrated bio-catalyst dose to one ally, instantly restoring 22% of their Max HP. This direct healing is unaffected by shield absorption and does not apply additional healing-over-time effects.

### Skill 3: Guardian Field — 40 MP, 4 turn cooldown

Generates a protective field around all active allies, restoring 12% of their Max HP and granting DEF +15% for 2 turns. DEF bonuses do not stack; reapplication refreshes their duration.

### Ultimate: Catalyst Overdrive — 60 MP, 6 turn cooldown

Activates the full Catalyst Protocol on all active allies, cleansing removable debuffs and restoring 18% of their Max HP. Grants DEF +25% and 25% Retaliation for 3 turns, alongside a healing-over-time effect restoring 10% Max HP at the start of each ally's turn for 3 turns. DEF bonuses and Retaliation do not stack; reapplication refreshes their duration.

## Zackry Selviria (`zackry`)

**Passive — Overwatch Protocol:** Whenever Zackry uses a skill on an ally or an enemy currently targeted by an ally, that ally gains 10% Accuracy for their next attack. This effect does not stack; reapplication refreshes the bonus. Additionally, Tactical Marked enemies lose 10% Evasion for the duration of the mark.

### Skill 1: Tactical Mark — 20 MP, 2 turn cooldown

Designates one enemy as a priority target, increasing damage they receive from all sources by 15% for 3 turns and reducing their Evasion by 10%. If the marked enemy is defeated while marked, all active allies recover 5% of their Max MP. The MP recovery triggers only once per marked enemy defeated. Tactical Mark does not stack; reapplication refreshes its duration.

### Skill 2: Command Uplink — 30 MP, 3 turn cooldown

Broadcasts a combat directive to all active allies, granting ATK +15% for 3 turns. Allies with more than 50% current HP receive an additional ATK +5%. The conditional bonus is recalculated at the start of each affected ally's turn. ATK bonuses from Command Uplink do not stack; reapplication refreshes their duration.

### Skill 3: EMP Burst — 35 MP, 4 turn cooldown

Fires an electromagnetic pulse at one enemy, dealing Electromagnetic mastery damage at 0.8x Mpow power and reducing their SPD by 20% for 2 turns. If the target is Tactical Marked, the SPD reduction increases to 35%. SPD reduction does not stack; reapplication refreshes its duration.

### Ultimate: Full Spectrum Assault — 60 MP, 6 turn cooldown

Marks all living enemies with Tactical Mark for 3 turns and grants all active allies ATK +20%, Mpow +15%, and SPD +10% for 3 turns. While the assault is active, allies gain 10% Critical Rate against Tactical Marked targets. The Ultimate's Tactical Marks follow normal Tactical Mark rules. Its ATK, Mpow, and SPD bonuses do not stack with themselves; reapplication refreshes their duration.

## Jazen Pryce (`jazen`)

**Passive — Recoil Dampeners:** Jazen's Falconite Gauntlets absorb kinetic feedback. After taking a hit that deals more than 10% of his Max HP, he gains ATK +10% for 2 turns, stacking up to 2 times. Reapplication refreshes the duration of existing stacks. Additionally, Jazen is immune to Stagger and action-delay effects.

### Skill 1: Impact Grenade — 20 MP, 2 turn cooldown

Launches an Impact Grenade at all enemies, dealing Kinetic mastery damage at 0.8x Mpow power. Each enemy hit has a 20% chance to become Staggered for 1 turn. Staggered enemies have their next action delayed. Stagger does not stack.

### Skill 2: Breach Charge — 30 MP, 3 turn cooldown

Detonates a Breach Charge on one enemy, dealing Kinetic mastery damage at 1.2x Mpow power and reducing the target's DEF by 20% for 2 turns. The target becomes Staggered for 1 turn, delaying its next action. Stagger does not stack.

### Skill 3: Reinforced Plating — 25 MP, 3 turn cooldown

Activates Reinforced Plating, granting Jazen a shield equal to 25% of his Max HP and DEF +20% for 3 turns. Additionally, Jazen Taunts eligible enemies for 2 turns, forcing them to prioritize him when selecting single-target attacks. Taunt does not override scripted attacks or unavoidable AoE.

### Ultimate: Cataclysmic Payload — 60 MP, 6 turn cooldown

Unleashes Cataclysmic Payload on all enemies, dealing Kinetic mastery damage at 1.5x Mpow power and reducing their DEF by 15% for 2 turns. Each enemy hit has a 25% chance to become Staggered for 1 turn, delaying their next action. Stagger does not stack.

## Zenki Archeron (`zenki`)

**Passive — Unobserved:** Zenki is difficult to track and predict. He gains +12 Evasion while no enemy has used a skill on him during the current round. If an enemy targets him with a basic attack, that attacker's Accuracy is reduced by 10% for that attack. After Zenki is hit by any source, Unobserved is suppressed until the start of his next turn.

### Skill 1: Railshot — 20 MP, 2 turn cooldown

Zenki charges the Longstrike rail sniper and fires a high-velocity Falconite slug at a single enemy, dealing Energy mastery damage at 1.1× Mpow power. The attack cannot miss. If Zenki has not been targeted by an enemy since his last turn, Railshot deals +30% damage.

### Skill 2: Cipher Tag — 25 MP, 3 turn cooldown

Zenki deploys a tracking exploit against a single enemy, marking it as compromised. The marked enemy takes +12% damage from all sources and suffers -15% RES for 3 turns. Only one enemy can be Cipher Tagged at a time; applying the mark to another enemy replaces the existing one. The effects refresh when reapplied.

### Skill 3: Ghost Protocol — 35 MP, 4 turn cooldown

Zenki activates Ghost Protocol, optimizing his combat algorithms and disrupting enemy targeting predictions. He gains +25 Evasion, +20% SPD, and +25% damage dealt for 3 turns. These buffs refresh when reapplied and do not stack.

### Ultimate: Zero Hour Execution — 60 MP, 6 turn cooldown

Zenki charges the Longstrike rail sniper and fires an exceptionally powerful Falconite bolt at a single enemy, dealing Energy mastery damage at 2.4× Mpow power. If the target is below 40% of its Max HP, the shot instead deals 3.2× Mpow power. If the target is Cipher Tagged, the impact additionally reduces its SPD by 25% for 2 turns.

## Engine implementation notes

- **Implemented from the reference:** all five Falcon skill sets, the defined passive mechanics that have sufficient rules, owner-listed MP costs/cooldowns, and reusable interpreter handlers.
- **Elishia — Meo-v9 Final Protocol:** deployment expiry specifies a selected primary enemy, Electromagnetic damage to all enemies and 50% secondary damage, but gives no damage scaling. The engine does not invent a multiplier; expiry EMP damage remains pending.
- **Elishia — Nanotech Singularity damage-over-time:** the source specifies Nanotech damage-over-time but gives no amount or scaling. The SPD reduction, ally buffs and turn-start healing are implemented; the DoT is pending.
- **Evalete — Catalyst Wing destruction shield:** the 15% Max HP shield for 4 turns is specified, but the source gives no Catalyst Wing HP, targetability or destruction trigger. The 12-turn periodic heal/shield pulse is implemented, currently interpreted as a pulse every second Evalete actor turn; destruction trigger is pending.
- **Zackry — Accuracy:** the prototype has an accuracy check only on basic attacks. Overwatch grants the +10 next-attack accuracy token and the basic-attack resolver consumes it; no new universal skill-hit accuracy model has been invented.
- **Meo-v9 Emergency Field:** heals the lowest-HP-ratio living ally below 25% Max HP for 10% Max HP instead of cover fire. It does not revive incapacitated agents.
- **Owner reference stats are not automatically treated as the engine balance sheet.** This task aligns skill mechanics; base combat stats in `characters/falcon.js` remain the current prototype values until a separate stats-sync decision.
