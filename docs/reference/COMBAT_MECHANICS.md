# Combat Mechanics

This document summarizes the current prototype behavior. Executable systems and tests are authoritative when details differ.

## Readiness and action order

### Threshold scheduler (preferred)

- Models readiness as continuous time.
- For each living deployed actor below 100 CR, computes time to readiness as `(100 - CR) / effective SPD`.
- Advances global scheduler time to the next actor's readiness and advances other actors proportionally to effective SPD.
- Handles simultaneous readiness through a stable actor key and rotating tie cursor rather than formation-array order.
- Faster actors may legitimately receive consecutive turns.
- Invalid or zero effective SPD is rejected to avoid an infinite scheduling loop.

### Legacy scheduler

- Retained as a fixed-step comparison implementation.
- Select with `FOD_SCHEDULER=legacy`; threshold is the default.

### CR adjustment

`adjustCR(actor, amount)` clamps readiness to `[0, 100]`. CR-pulled actors are ordered by CR, effective SPD, and stable actor key. Stagger applies a 20-point readiness pushback on first application; reapplication refreshes its marker without another pushback.

## Turn and round behavior

At actor turn start:

- MP regenerates by `ceil(Max MP × 5%)`, capped at Max MP.
- Cooldowns tick.
- Turn-start passive effects and healing-over-time run.
- While Nanotech Singularity is active, non-summon allies recover 5% Max HP at turn start.
- A `staggered` marker is consumed at turn start after its readiness pushback; it delays readiness but does not erase the actor's next action. `actionDelay` is a separate marker that skips the action.

After the actor's action:

- Status and shield durations tick after the affected actor completes its turn.
- An effect applied during the actor's current turn does not immediately lose a duration tick.
- Passive turn-end effects run, then the actor's CR resets.
- A round ends when every living deployed non-passive-summon actor has acted at least once. The round counter is an action-bookkeeping construct, not a fixed duration of scheduler time.

## Resources

- **HP:** health; reaching zero incapacitates the actor.
- **MP:** skill resource; regenerates 5% Max MP (rounded up) at each actor turn start.
- **CR:** readiness value with a threshold of 100.
- **Cooldown:** skill-specific turn counter.
- **Shields:** separate damage-absorption pools with durations; adaptive shields can add temporary resistance after absorbing a damage type.
- **Summon duration:** Meo-v9 and passive summons use their configured lifecycle counters.

## Damage

The shared damage system supports physical and mastery damage, power multipliers, DEF/RES, mastery bonuses/resistance, critical hits, damage-dealt and damage-taken modifiers, adaptive resistance, and outside bonus multipliers. The exact formulas live in `systems/damage.js`; application and shield absorption live in `systems/damageApplication.js` and `systems/shields.js`.

Damage is applied to shields before HP. A downed active actor may be replaced by the first living reserve. Damage events currently identify the target and damage values but do not identify the source actor; this limits source-attributed simulator metrics.

Damage types are `Physical` or one of the configured mastery types: Energy, Kinetic, Electromagnetic, Toxic, Nuclear, Nanotech, Cryogenic, and Anomaly.

## Opening initiative

PvE defaults to `player-first`. If the enemy's fastest actor would otherwise be ready first or tied, living allies receive a uniform time head start while retaining their relative SPD ordering. Use `FOD_OPENING=speed` for pure speed order.

## Accuracy and evasion

- Enemy basic attacks check ally Evasion, clamped to 0–75%, and can trigger ally Retaliation after a successful hit.
- Player basic attacks retain their historical no-dodge/no-retaliation behavior unless an Accuracy token is present.
- Zackry's +10 next-attack Accuracy token is consumed by the recipient's next attack, including supported skill-hit paths; it reduces the target's Evasion check by 10 points. Guaranteed-hit attacks remain guaranteed and still consume the token.
- Zenki's Unobserved grants +12 Evasion while its condition is active. Enemy basic attacks against Zenki also receive the passive's 10-point Accuracy penalty.
- There is no general accuracy roll for every mastery skill; only the implemented Accuracy-token path performs a skill-hit evasion check.

## Status effects and cooldowns

Statuses are stored by key on each actor. Most stat modifiers are percentage amounts; Evasion modifiers are additive points. Statuses may also carry damage-dealt/taken modifiers, healing-over-time, marks, accuracy/evasion modifiers, Stagger, or passive metadata.

Status and shield durations decrement after the affected actor completes their turn. An effect applied during that actor's current turn is protected from an immediate duration tick. Cooldowns tick at actor turn start, so higher-SPD actors receive more frequent cooldown and MP-regeneration turns over scheduler time; this remains a balance consideration.

## Formation and battle result

- `party.maxActive` and `enemyParty.maxActive` define active slots; the current default is five per side.
- Roster entries after the active slice are reserves.
- A downed active actor can be replaced by the first living reserve.
- Player-controlled actors can manually switch with a living reserve.
- Victory occurs when the enemy side has no living non-summon active actor or reserve; defeat uses the equivalent condition for the Falcon side.
- Summons do not independently prevent victory or defeat.

## Skills and summons

Falcon and registered enemy skills are declarative data interpreted by the shared skill runtime. See [Falcon Implementation](FALCON_IMPLEMENTATION_GUIDE.md) for exact playable skill/passive behavior.

Meo-v9 is a temporary allied actor defined in `data/skills/elishia.js`. It lasts three summon activations, scans enemies to increase Elishia's damage by 10% (an additional 10% while Singularity is active), and uses Emergency Field to heal the lowest-HP-ratio living ally below 25% Max HP instead of attacking. Otherwise it performs non-critical physical cover fire. On natural expiry, Final Protocol fires once: 1.0x Meo-v9 MPow against the selected primary enemy and 0.5x MPow against other living enemies as Electromagnetic damage, with SPD -15 for one turn. Early destruction does not trigger Final Protocol.

Evalete's Catalyst Wing is a targetable passive summon that does not take turns. It has 25% of Evalete's Max HP and 50% of her base DEF/RES. It pulses healing and shields every second Evalete turn; early destruction grants Evalete the configured emergency shield, while natural expiry does not.

## Encounter progression

Encounter definitions live in `data/encounters/` and may contain sequential waves, per-instance enemy stat overrides, defeat-count reinforcement groups, and reward metadata. Reinforcements join the enemy reserve and deploy through normal replacement. The final encounter completion callback exposes metadata only; it does not award XP, currency, or items and does not persist progression.

Current constraints: each wave requires at least five enemy entries, and the only reinforcement trigger is `enemyDefeatedCount`. See the [Step 8 milestone report](../history/milestones/STEP8_ENCOUNTER_PROGRESSION.md).
