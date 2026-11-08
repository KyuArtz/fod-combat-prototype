# Architecture Reference

## High-level flow

```text
index.js
  └─ chooses readiness scheduler (FOD_SCHEDULER)
     └─ core/battle.js (composition root)
        ├─ creates battle state and terminal I/O
        ├─ builds Falcon/enemy rosters
        ├─ runs formation selection and setup
        ├─ wires action resolver, skills, menu, enemy AI
        └─ core/turnEngine.js
             ├─ asks scheduler for next actor
             ├─ applies actor turn-start effects
             ├─ runs player / enemy / summon action
             ├─ resets actor CR
             ├─ removes expired summons
             └─ checks round and battle result
```

## Module responsibilities

| Path | Responsibility |
|---|---|
| `index.js` | CLI entry point; selects `legacy` or `threshold` scheduler |
| `core/battle.js` | Composition root; constructs state, dependencies, and battle loop |
| `core/battleState.js` | Creates battle-state object, party containers, round and scheduler fields |
| `core/turnEngine.js` | Readiness/action loop, turn-start resource/effect ticks, round bookkeeping |
| `core/actionResolver.js` | Shared physical/mastery action calculations and hit application |
| `characters/actorFactory.js` | Normalizes actor construction and initializes runtime fields |
| `characters/falcon.js` | Five Falcon playable-agent definitions and F.O.D. mastery types |
| `characters/enemies.js` | Five training enemy definitions |
| `characters/skills.js` | Falcon skill actions, costs, cooldowns, summon and ultimate effects |
| `ai/enemyAI.js` | Enemy action selection and enemy skill behavior |
| `ai/targeting.js` | Enemy target-selection rules |
| `systems/combatReadiness.js` | Legacy CR scheduler and shared CR helpers |
| `systems/thresholdCombatReadiness.js` | Continuous-time threshold scheduler |
| `systems/formation.js` | Formation setup, active/reserve management, replacement, battle result |
| `systems/damage.js` | Physical/mastery damage formula |
| `systems/damageApplication.js` | Applies damage, shields, HP and down-state behavior |
| `systems/cooldowns.js` | Skill readiness, MP payment, cooldown ticking |
| `systems/shields.js` | Shield creation, expiry, absorption |
| `systems/statusEffects.js` | Status application, effective stats, duration ticking |
| `ui/battleMenu.js` | Player action menu, target selection, party switch |
| `ui/deploymentSelection.js` | Player roster ordering and active/reserve selection |
| `ui/statusDisplay.js` | Actor, status, cooldown, formation display |
| `ui/battleLog.js` | State-backed battle logging |
| `test/thresholdCombatReadiness.test.js` | Scheduler and scheduler-adjacent regression tests |

## Dependency/injection pattern

`core/battle.js` is the composition root. It injects functions and shared state into:

- `createActionResolver`
- `createSkills`
- `createBattleMenu`
- `createEnemyAI`
- `createTurnEngine`

The readiness scheduler is injected into the turn engine. This keeps the engine from hardcoding one scheduler and allows controlled A/B tests.

## Battle state (conceptual)

```js
{
  actors: [],                 // deployed actors currently participating in scheduling
  round: 1,
  schedulerTicks: 0,
  scheduler: null,            // lazily created threshold scheduler data
  singularityTurns: 0,
  log: [],
  party: {
    roster: [],
    active: [],
    reserve: [],
    maxActive: 5             // latest reported dev setting; ZIP snapshot says 4
  },
  enemyParty: {
    roster: [],
    active: [],
    reserve: [],
    maxActive: 5
  }
}
```

`actors` is the scheduler/action-loop collection. Party containers retain roster and formation bookkeeping. Summons are inserted into `actors` and are not ordinary roster members.

## Actor lifecycle

1. `makeActor` constructs an actor with runtime state (HP/MP, CR, cooldowns, statuses, shields, alive state).
2. Formation setup stores roster, slices active/reserve, and adds active actors to `state.actors`.
3. A downed active non-summon may be replaced by the first living reserve.
4. A manual player switch swaps an active and reserve actor and resets both CR values.
5. Summons are temporary scheduler actors; expired/dead summons are removed by `removeInactiveSummons`.

## Scheduler lifecycle

- Scheduler API: `nextActor(state, effectiveStat)`, `advanceCR(state, effectiveStat)`, `resetCR(actor)`, `adjustCR(actor, amount)`.
- CR threshold: `100`.
- The threshold scheduler stores `{ time, tieCursor, readyQueue }` in `state.scheduler`.
- State cloning for preview must use `structuredClone(state)`; JSON serialization breaks actor object references inside the ready queue.
- Scheduler instances are isolated; their state belongs to each battle state, not a shared module-level queue.
