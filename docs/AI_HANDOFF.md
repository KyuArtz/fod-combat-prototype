# AI Handoff / Project Continuation Context

Paste this into a future coding assistant session when continuing F.O.D. combat work.

---

You are helping develop the user's **F.O.D. (Fragments of Decay) combat prototype**, a Node.js/CommonJS CLI JRPG battle sandbox. Work should be incremental, source-grounded, and preserve the user's existing architecture.

## Project workflow

- `main` is the stable branch.
- `development` is the active experimental/integration branch.
- Do not assume ZIP/source snapshot equals latest remote commit. Inspect files and branch status first.
- Prefer changes in `development`; do not merge/push unless the user explicitly asks.

## Scheduler

- Preferred scheduler: `systems/thresholdCombatReadiness.js`.
- Legacy comparison: `systems/combatReadiness.js`.
- Select with `FOD_SCHEDULER=threshold|legacy`; default threshold.
- Threshold CR cap is 100 and uses continuous elapsed time based on effective SPD.
- Scheduler state lives in `state.scheduler` (`time`, `tieCursor`, `readyQueue`).
- Use `structuredClone(state)` for scheduler previews; JSON cloning breaks actor references in readyQueue.
- Tie handling: stable actor key + rotating tie cursor.
- CR-pulled ready actors: descending CR, then effective SPD, then stable key.
- Overshoot carry-over is intentionally deferred pending CR manipulation skills.
- Preserve legacy for comparisons unless the owner decides otherwise.

## Current formation/test setup

Latest owner-reported development battle: **5 active Falcon agents vs 5 active enemies (5v5)**. Reserve structure remains implemented; no reserves are held in this setup. The inspected ZIP had Falcon `maxActive: 4`, so reconcile source before assuming it is current.

Falcon agents: Elishia, Evalete, Zackry, Jazen, Zenki. Training enemies: Training Drone, Rogue Automaton, Siege Turret, Recon Drone, Toxic Stalker.

## Verified test status (uploaded snapshot)

`node --test`: 18 passing, 0 failing. Test file is scheduler-focused; add battle-level integration tests for full 5v5, victory/defeat, AI, skills, and reserve transitions.

## Future direction

- Battle balance and SPD/MP/cooldown economy.
- Full 5v5 playtest/regression.
- Agent management and formation expansion.
- Leveling and stage mechanics.
- Deterministic random seed, analytics, GUI turn-order preview, saves/replays (planned).

## Working rules

1. Inspect the current files and tests before editing.
2. State which behavior is confirmed versus proposed.
3. Do not duplicate stats/data structures unnecessarily.
4. Keep mechanics internally consistent and test them.
5. Run `node --test` after changes.
6. Add tests for bug fixes and edge cases.
7. Update `docs/CHANGELOG.md`, status, and relevant mechanics docs when behavior changes.
8. Explain any source/document mismatch rather than silently guessing.
