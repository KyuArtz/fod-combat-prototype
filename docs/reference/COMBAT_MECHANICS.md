# Combat Mechanics

This document summarizes the current prototype behavior. Executable systems and automated tests are authoritative if a description differs.

## Readiness and action order

### Threshold scheduler (preferred)

- Models readiness as continuous time.
- For each living deployed actor below 100 CR, computes time to readiness as `(100 - CR) / effective SPD`.
- Advances global scheduler time to the next actor's readiness and advances other actors proportionally to effective SPD.
- Handles simultaneous readiness through a stable actor key and rotating tie cursor rather than formation-array order.
- Faster actors may legitimately receive consecutive turns.
- Invalid or zero effective SPD is rejected to avoid an infinite scheduling loop.

### Legacy scheduler

- Retained as a fixed-step comparison implementation. Select with `FOD_SCHEDULER=legacy`; threshold is the default.

### CR adjustment

`adjustCR(actor, amount)` clamps readiness to `[0, 100]`. CR-pulled actors are ordered by CR, effective SPD, and stable actor key. Stagger applies a 20-point readiness pushback on first application; reapplication refreshes the marker without another pushback. Stagger does not erase an action; `actionDelay` is separate.

## Turn lifecycle

At actor turn start:

1. Regenerate 5% Max MP (rounded up, capped at Max MP).
2. Decrement that actor's cooldowns.
3. Resolve DOT.
4. Resolve HOT and other turn-start healing (including Nanotech Singularity's 5% team recovery).
5. Run passive turn-start checks, including Zenki's Unobserved.
6. Permit the actor's action if still alive.

At actor turn end, run passive and owner-summon lifecycle events, then decrement that actor's status/shield durations. An effect applied during the current actor turn does not immediately lose a duration turn. Actor-turn durations follow the affected unit; owner-clocked fields/summons follow their owner. Global round timers remain separate. A unit in reserve does not take actor turns, so its actor-turn statuses and owner-clocked summon activations/durations pause until it is redeployed.

The round counter is an action-bookkeeping construct, not a fixed duration of scheduler time. A round ends when every living deployed non-passive-summon actor has acted at least once.

## Resources and status stacking

- **HP:** reaching zero incapacitates the actor.
- **MP:** regenerates 5% Max MP (rounded up) at actor turn start.
- **CR:** readiness value with a threshold of 100.
- **Cooldown:** skill-specific turn counter; it ticks at the skill owner's turn start.
- **Shields:** independent damage-absorption pools with individual capacity and duration. Oldest shield absorbs first. Adaptive shields can add temporary resistance after absorbing a damage type.

**Global Combat Stacking v1:** applies to all allies, enemies, bosses and summons.

- Different stats stack normally.
- Same-stat same-direction modifiers do not add; the strongest active value takes priority. Weaker active modifiers remain tracked and can resume when the stronger effect expires.
- Opposing percentage modifiers offset in percentage points (for example, +20% and -10% produce +10%).
- Reapplying the same effect refreshes duration without strengthening it unless the effect explicitly declares stackable behavior.
- Explicit stacks use their declared maximum (Jazen's Recoil Dampeners: two stacks).
- Different status types can coexist. Damage vulnerability and RES reduction are separate modifiers.
- Separate shields maintain their own capacity and duration.

## Damage and reflection

The shared damage system supports Physical and mastery damage, power multipliers, DEF/RES, mastery bonuses/resistance, critical hits, damage-dealt/taken modifiers, adaptive resistance and external modifiers. Formulas are in `systems/damage.js`; shields and HP application are in `systems/damageApplication.js` and `systems/shields.js`.

Damage is calculated and mitigated before being absorbed by shields, then remaining damage reduces HP. Direct-damage reflection uses post-mitigation incoming damage before shield absorption, then applies the reflected amount through the original attacker's normal defenses. Reflected damage cannot reflect again. DOT, self-inflicted damage, counter damage, and reflected damage do not trigger damage reflection.

Damage types are `Physical` or one of the configured masteries: Energy, Kinetic, Electromagnetic, Toxic, Nuclear, Nanotech, Cryogenic and Anomaly.

DoT source attribution resolves the saved source ID and side against deployed actors and both party rosters, so damage remains attributed if its applier is in reserve or has left the active actor list. If a turn-start DoT incapacitates its target, later simultaneous DoT ticks on that target are skipped.

## Accuracy and evasion

- Enemy basic attacks check ally Evasion, clamped to 0–75%, and may trigger configured counter behavior after a successful hit.
- Player basic attacks retain their historical no-dodge/no-retaliation behavior unless an Accuracy-token path is explicitly used.
- There is no universal accuracy roll for every mastery skill. An effect can request guaranteed accuracy or use standard hit handling.
- Evasion modifiers are flat points; most other stat modifiers are percentages.

## Formation and battle result

- `party.maxActive` and `enemyParty.maxActive` define active slots; the prototype default is five per side.
- Roster entries after the active slice are reserves.
- A downed active actor can be replaced by the first living reserve.
- Player-controlled actors can manually switch with a living reserve.
- Victory/defeat use active and reserve roster state; passive summons do not independently prevent a result.
- When an owner is incapacitated, its active owner-linked summons are dismissed. Dismissal is not summon destruction: it does not dispatch on-destroy bursts or owner-destroyed reactions.

## Character skills, passives and summons

Falcon and Phantom skill definitions live in `characters/skillData/` and are interpreted through the same `core/skillInterpreter.js` runtime. Effect handlers are registered in `systems/effects/`; passive and owner-summon hooks are in `systems/passives/` and `systems/summons/`. Skill-data validation checks that every declared passive event, passive handler, and summon handler exists in the live registries before a battle is assembled. Ally-mode restrictions such as `targetFaction` and `excludeSelf` are rechecked by the interpreter at execution time. Phantom-specific behavior is summarized in the [Phantom Implementation Guide](PHANTOM_IMPLEMENTATION_GUIDE.md).

- **Meo-9:** targetable passive summon. Skips its deployment turn, then acts after each subsequent Elishia turn for three owner activations. It heals the lowest-HP-ratio living active ally below 25% Max HP for 10% Max HP instead of attacking; otherwise it performs non-critical Physical cover fire at 0.5× its ATK (0.75× during Nanotech Singularity). No scan bonus, EMP, Final Protocol or expiry effect.
- **Catalyst Wing:** targetable passive summon that never takes a separate turn. It has 25% of Evalete's Max HP and 50% of her base DEF/RES. It pulses at the start of every even Evalete turn (2 through 12), healing active non-summon combatants on Evalete's own side by 8% Max HP and granting each a separate 10% Max HP shield for 2 target turns. Destruction stops future pulses and grants no fallback shield.

See [Falcon Implementation Guide](FALCON_IMPLEMENTATION_GUIDE.md) for skill-by-skill values and durations.

## Encounter progression

Encounter definitions live in `data/encounters/` and may contain sequential waves, per-instance enemy stat overrides, defeat-count reinforcement groups and reward metadata. Reinforcements join enemy reserve and deploy through normal replacement. The final encounter completion callback exposes metadata only; it does not award XP, currency or items and does not persist progression.

Current constraints: each wave requires at least five enemy entries, and the only reinforcement trigger is `enemyDefeatedCount`.
