# Step 3 — Full-battle regression coverage

**Snapshot:** 2026-11-16  
**Status:** Complete for the current Falcon engine scope

## Purpose

Step 3 moves confidence from isolated skill tests into complete controller-driven battles. The tests use the same battle entry point, turn views, decision validation, skill interpreter, damage application, AI, and battle-end logic as normal encounters.

## Added coverage

`test/fullBattleRegression.test.js` adds 27 battle-level regression tests:

- All 20 Falcon active skills are selected and executed during actual battles. Each case verifies the action was accepted, no decision rejection occurred, the battle progressed, and it reached a terminal result.
- A five-agent battle exercises all five Falcon actors and multiple passive-triggering skills in one encounter.
- Jazen's Reinforced Plating Taunt is verified against the built-in enemy controller's target choice.
- Breach Charge Stagger is verified by observing the enemy readiness pushback while preserving its next action.
- Manual reserve switching in a three-active formation is replayed from the recorded player decisions; result, log, RNG state, and final active formation match.
- Automatic reserve deployment is exercised after an active Falcon is incapacitated.
- Victory and defeat result checks cover deployed actors and living reserves.
- Jazen's shield and cooldown are observed across his actual actor turns to verify their duration/expiry schedule.

The tests deliberately use the registered skill keys from `data/skills/`; display names are not assumed to be internal identifiers.

## Existing tests retained

The full suite continues to cover owner-specific passive and skill mechanics, typed damage and shields, status timing, cooldown readiness, scheduler behavior, summons, controller validation, seeded randomness, golden transcripts, and deterministic replay. Step 3 adds integration evidence; it does not replace the focused unit tests.

## Verification

From the project root:

```bash
node --test
```

Latest full run: **171 tests passed, 0 failed**.

## Scope boundaries

- This milestone validates the currently implemented owner-aligned Falcon mechanics. It does not fill the documented owner-source gaps for Meo-v9 Final Protocol EMP scaling, Singularity DoT scaling, Catalyst Wing destruction, or general skill-hit Accuracy.
- It does not migrate enemy skills to the shared data/interpreter architecture.
- Manual playtesting and balance analytics remain separate follow-up work; passing regression tests are not a balance sign-off.

## Next agreed engine step

At the time, the next step was Step 4: add typed combat lifecycle events (for example `TurnStarted`, `DamageDealt`, and related events) alongside the existing text `Log` events, preserving deterministic event order and plain-data payloads.
