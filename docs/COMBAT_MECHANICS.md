# Combat Mechanics (Current Prototype)

This document describes mechanics visible in the inspected source. Values are prototype values and should not be treated as final game balance.

## Readiness / action order

### Legacy scheduler

- Uses fixed-step CR advancement.
- Each living deployed actor gains CR based on effective SPD during an advancement tick.
- Actors at or above 100 CR become ready.
- Ready actors are selected by descending CR.
- Legacy remains selectable for comparison.

### Threshold scheduler (preferred)

- Models readiness as continuous time.
- For each living actor below 100 CR, computes time-to-ready as `(100 - CR) / effective SPD`.
- Advances global scheduler time by the smallest time-to-ready.
- Every actor advances by `effective SPD × elapsed time`.
- Actors crossing the threshold together are placed in a ready queue.
- Simultaneous ties are stable-key sorted and rotated using a tie cursor.
- Ready queue selection avoids formation-array order deciding who goes first.
- CR is reset after an actor takes an action.
- Faster actors may legitimately take consecutive turns if their SPD crosses readiness multiple times before slower actors.
- Zero/invalid SPD is rejected to avoid an infinite scheduling loop.

### CR adjustment

`adjustCR(actor, amount)` clamps CR to `[0, 100]`. Actors pushed to readiness outside normal advancement are enqueued by CR, then effective SPD, then stable actor key. Equal CR/equal SPD falls back to stable identity.

## Turn and round behavior

At an actor's turn start:

- MP regenerates by `ceil(max MP × 5%)`, capped at max MP.
- Cooldowns tick.
- Status durations tick.
- Shields tick.
- While Nanotech Singularity is active, allies receive 5% max-HP healing at turn start.

After the actor acts:

- Their CR resets.
- They are recorded as having acted for the round.
- Expired summons are removed.
- A round ends when every living deployed actor has acted at least once; round effects/bookkeeping update and status display runs.

**Note:** The threshold scheduler is continuous-time, while the current round counter is an action bookkeeping construct. Do not assume a round is a fixed number of seconds.

## Resources

- HP: actor health; at zero actor is down.
- MP: skill resource; regenerates 5% max MP (rounded up) at each actor turn start.
- CR: readiness resource, threshold 100.
- Cooldown: skill-specific turn counter.
- Shields: separate absorption pool(s), each with a duration.
- Summon duration: Meo-9 tracks remaining summon turns.

## Damage

The damage module supports physical and mastery damage, power multipliers, defense/resistance, mastery bonus/resistance, criticals, target tactical-mark amplification, adaptive resistance, and an outside bonus multiplier (Meo-9's scan). The exact formula is defined in `systems/damage.js`; treat that source as canonical if this document and implementation differ.

Damage application consumes shields before HP. Downed actors are marked and may trigger formation replacement.

**Damage types.** Every hit carries a type: `Physical` (basic attacks, physical skills, enemy attacks, retaliation) or a mastery type (Energy, Kinetic, Electromagnetic, Toxic, Nuclear, Nanotech, Cryogenic, Anomaly). Typeless damage is possible but cannot trigger adaptation.

**Adaptive Barrier.** A shield created with `adaptive` remembers the last damage type it absorbed. When it absorbs damage of a type, the shielded unit gets the status `adaptiveResistance { damageType, amount: 15, turns: the shield's remaining turns }`, announced once per type change. Later damage of that type is multiplied by 0.85 (after DEF or mastery resistance). The newest absorbed type replaces the old one. The status ends with the barrier's duration even if the shield was used up earlier.

**Meo-9 scan.** While a summon with a `scan` rule is alive, the damage its owner deals to enemies is multiplied by 1.10 (1.20 during Nanotech Singularity); several summons do not stack, and only the owner benefits.

## Opening initiative

In PvE the player's side acts first. If the enemy's fastest unit would otherwise be ready first or tied (in the 5v5 roster Recon Drone, SPD 115, versus Zenki, SPD 110), every living ally starts with a small CR head start, equal to its own SPD times the readiness gap between the two fastest units (about 0.04 time units; Zenki starts with about 4.35 CR). The head start never makes an ally start ready, does not change relative SPD order among allies, and does not change long-run turn share. If allies are already the fastest, nothing changes. Use `FOD_OPENING=speed` to disable it and see pure SPD order.

## Randomness

All combat randomness (critical hits, enemy evasion checks, enemy skill-use chances) draws from the battle's seeded generator, `state.rng`, so a battle is reproducible from its seed plus the same menu choices. The seed is printed as `Seed: N` at battle start; set it with `FOD_SEED`. See [Architecture](ARCHITECTURE.md#randomness).

## Evasion

The shared basic-attack resolver checks effective Evasion for enemy attacks against allies. Player basic attacks normally do not roll against enemy Evasion, but Zackry's +10 Accuracy token is consumed by the recipient's next basic attack and reduces the target's Evasion chance when an enemy has Evasion. Zenki's Unobserved adds +12 Evasion while no enemy skill has targeted him during the current round; when an enemy basic-attacks him, the attack also receives the passive's 10-point Accuracy penalty. General mastery-skill hit accuracy is not implemented.

## Status effects

Statuses are stored by key on each actor. Percentage stat modifiers multiply; Evasion uses additive points. Status and shield durations decrement after the affected actor completes their turn; an effect applied during that actor’s current turn does not immediately consume a duration turn. Statuses can also carry damage-taken/dealt modifiers, healing-over-time, accuracy/evasion penalties, and passive metadata. Singularity's SPD bonus is a normal timed ally status; its 5% Max HP recovery is applied at each ally turn start while the field is active.

## Cooldowns and MP

Skills check MP and cooldown readiness before paying. Skill payment consumes MP and assigns cooldown. Cooldown timing is turn-based (ticks at actor turn start), so high-SPD actors also receive more frequent resource/cooldown ticks over battle time. This is a balance consideration to revisit.

## Formation and battle result

- `party.maxActive` and `enemyParty.maxActive` define active slots.
- Roster members after the active slice become reserve.
- Downed active members can be replaced by the first living reserve.
- Player can manually swap an active member with a reserve during a player action.
- Victory occurs when the enemy side has no living non-summon active actor and no living reserve.
- Defeat occurs when Falcon has no living non-summon active actor and no living reserve.
- Summons do not independently prevent victory/defeat.

## Summon

Meo-v9 is an allied temporary actor defined in `data/skills/elishia.js`. It is scheduled like other deployed actors and expires after three summon turns. While alive it increases Elishia's damage to enemies by 10% (20% during Singularity), and cover fire deals 50% of its ATK (75% during Singularity). At its turn it first checks for a living ally below 25% Max HP; if found, Emergency Field heals the lowest-HP-ratio eligible ally for 10% Max HP instead of attacking. It does not revive incapacitated allies.

The owner reference describes a Final Protocol EMP on deployment expiry but does not provide damage scaling. The expiry EMP is intentionally not implemented until the owner supplies that value. Catalyst Wing destruction behavior for Evalete is similarly deferred because the reference does not specify the Wing's HP/targetability.
