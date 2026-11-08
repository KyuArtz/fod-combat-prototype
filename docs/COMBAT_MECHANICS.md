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

The damage module supports physical and mastery damage, power multipliers, defense/resistance, mastery bonus/resistance, criticals, and target tactical-mark amplification. The exact formula is defined in `systems/damage.js`; treat that source as canonical if this document and implementation differ.

Damage application consumes shields before HP. Downed actors are marked and may trigger formation replacement.

## Randomness

All combat randomness (critical hits, enemy evasion checks, enemy skill-use chances) draws from the battle's seeded generator, `state.rng`, so a battle is reproducible from its seed plus the same menu choices. The seed is printed as `Seed: N` at battle start; set it with `FOD_SEED`. See [Architecture](ARCHITECTURE.md#randomness).

## Evasion

Enemy basic attacks check target effective Evasion, clamped between 0 and 75, then roll against it. Evasion is currently implemented in enemy basic-attack behavior; do not assume every skill or damage path checks evasion.

## Status effects

Statuses are stored by key on each actor. A status can modify a stat by percentage (Evasion uses additive points). Durations decrement at turn start and expire at zero. The effective-stat function also applies the global Singularity SPD bonus to allies while active.

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

Meo-9 is an allied temporary actor. It is scheduled like other deployed actors, attacks automatically on its turn, and expires after its configured number of summon turns. It is excluded from ordinary party formation and victory/defeat survival checks.
