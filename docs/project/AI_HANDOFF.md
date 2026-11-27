# AI Handoff / Project Continuation Context

Use this document as a concise starting point for future F.O.D. development sessions. It is a navigation and guardrail document; detailed behavior belongs in technical references and executable source.

## Current snapshot

- Project: F.O.D. (Fragments of Decay) combat prototype.
- Runtime: Node.js CommonJS, Node 18+; no third-party runtime dependencies.
- Default scheduler: `threshold`; `legacy` remains available for comparison.
- Default interactive flow: unified mixed-faction roster selection across Falcon Company, Phantom Rebellion, and Serpent Syndicate (3–5 unique operatives; first three active, remaining selected members become reserves), followed by `trainingGround`.
- Current roster: 15 selectable operatives, five per faction. Tekushiki is an official/canon member of Serpent by user authorization on 2026-11-23.
- Current verification: `npm test` — 370 passed, 0 failed, 0 skipped.
- All three faction tactical controllers and symmetric faction-duel simulations are integrated.

## Start every work session by

1. Inspect the actual Git branch, working tree, and latest files. A ZIP snapshot is not proof of the latest remote commit.
2. Read [project status](PROJECT_STATUS.md), [architecture](../reference/ARCHITECTURE.md), and the relevant focused reference.
3. Run `npm test` before making changes.
4. Identify the exact source and tests that own the behavior being changed.
5. Make incremental changes and rerun targeted tests plus the full suite.

Do not commit, push, or merge unless explicitly requested.

## Architecture boundaries

- `core/battle.js` is the composition root.
- `core/turnEngine.js`, `core/turnRunner.js`, `core/turnView.js`, and `core/decisions.js` own turn flow and action validation.
- `ai/enemyAI.js` evaluates data-defined enemy policies; `ai/targeting.js` owns generic enemy target selection.
- `ai/falconTacticsV2.js`, `ai/phantomTactics.js`, and `ai/serpentTactics.js` contain faction-specific tactical policies.
- `core/actionResolver.js` owns shared basic-attack execution; `core/skillInterpreter.js` owns skill execution orchestration.
- `core/skillLifecycle.js` is a compatibility facade; `systems/passives/runtime.js` owns passive, summon, and actor lifecycle hooks.
- `systems/effects/` owns declarative effect handlers and registry; `systems/passives/` and `systems/summons/` own lifecycle registries.
- `core/skillDataValidation.js` validates skill definitions and passive/summon contracts.
- `characters/falcon.js`, `characters/phantom.js`, and `characters/serpent.js` create faction actors; `characters/roster.js` owns the unified selectable-faction registry.
- `characters/skillData/` owns the live Falcon, Phantom, and Serpent skill/passive definitions; `characters/skills.js` builds the registries through the shared interpreter.
- `data/` owns enemy skills, archetypes, AI policy, and encounter definitions.

See [Architecture](../reference/ARCHITECTURE.md) for the full module map.

## Determinism and regression rules

- Combat RNG is stored as plain data in `state.rng`; engine randomness must use the injected battle RNG.
- Preserve random-call order when refactoring existing behavior unless a deliberate behavior change is approved.
- Replays depend on seed, party order, and accepted decisions.
- Golden transcript changes require deliberate regeneration, review, and a changelog explanation.
- Use `structuredClone(state)` for scheduler previews; JSON cloning breaks object references held by the threshold ready queue.

## Data and canon authority

- Runtime behavior is defined by executable code, data definitions, and automated tests.
- Falcon, Phantom, and Serpent skill data: `characters/skillData/*.js`.
- Enemy skill data: `data/enemySkills/*.js`; archetypes and policies: `data/enemies/*.js`, `data/enemyAI/*.js`; encounters: `data/encounters/*.js`.
- `references/characterTerraData.js` is a compact owner-reference extract containing selected skill objects and stats; it is not a full roster and is not imported by the engine.
- The owner maintains separate website-facing character data. Use the supplied updated JSON when relevant, but do not overwrite original uploads or package the full original JSON into the prototype archive.
- The hidden operative key `elishia_p` must remain player-facing as `Unknown`; keep all descriptions and roster preview output neutral.
- Tekushiki is canon as a Serpent member by explicit owner authorization. Keep his broad established identity (former scientist turned rogue operative, Tether of Ruin, Serpent Syndicate) but do not invent the tether's origin or unexplained past details unless the owner asks.
- Do not silently canonize Kane, Galloz, Claude, or other backstories whose source text remains labelled as a development proposal.

## Current character mechanics

- Falcon uses the approved owner-reviewed kits and global stacking/timing rules. See [Falcon Implementation](../reference/FALCON_IMPLEMENTATION_GUIDE.md).
- Phantom uses five migrated kits; the hidden operative remains neutral. Bleeding is provisionally 0.15× applier ATK as Anomaly damage at each affected-unit turn start for 2 turns. See [Phantom Implementation](../reference/PHANTOM_IMPLEMENTATION_GUIDE.md).
- Serpent uses five migrated kits. Verra Poison ticks at 0.25× her Mpow; Kane and Claude Poison tick at 0.20× their Mpow for two affected-unit turns. Poison is distinct from Phantom Bleeding. See [Serpent Implementation](../reference/SERPENT_IMPLEMENTATION_GUIDE.md).

## Faction testing

Run an alternating-seat matchup with:

```bash
npm run simulate:factions -- --player serpent --opponent falcon --battles 100 --active 3
npm run simulate:factions -- --player serpent --opponent phantom --battles 100 --active 3
```

Available player/opponent factions are `falcon`, `phantom`, and `serpent`; they must be different. Small smoke batches are execution checks only; use larger seed ranges and inspect per-actor metrics before proposing balance changes.

## Known limitations

- Interactive selection is terminal-based; no graphical roster screen or saved formation persistence is implemented.
- Enemy and faction AI are deterministic rule-based policies, not learning systems.
- Encounter rewards, XP, inventory, persistent stage progression, and save/load are not implemented.
- Runtime Falcon stats remain prototype values pending a separate stat-sync decision.
- **Taunt is only enforced by the default PvE enemy AI** (`ai/targeting.js`). Controller-driven sides (faction duels) still see every opponent as a legal target, so Lucaz's Bastion and Galloz's Tyrant's Guard do not redirect enemy attacks there. Pending test: the `todo` case in `test/gallozFullBattle.test.js`. Fixing it changes duel balance and touches target legality in `core/turnView.js` plus every tactical controller.

## Documentation rules

Use the [documentation index](../README.md) to navigate. Keep current state in `PROJECT_STATUS.md`, plans in `ROADMAP.md`, design decisions in `DECISIONS.md`, implementation history in `CHANGELOG.md`, and detailed historical scope in milestone reports. Historical milestones preserve the capabilities and limitations known at their own dates and must not be mistaken for current status.

- **P1.2.4 audit completed (diagnostic only):** 10 paired-seat Phantom seeds (20 battles) captured 160 Verra decision snapshots, reserve health/eligibility, treatment options, and healing/cleanse events. 148 treatment actions; 106 self-targeted (71.6%). At ≤16% HP, 8 decisions had no safe reserve; the reserve Claude was at 1.33% HP in those windows. At 16–30% HP, a healthy reserve was present in 38/40 snapshots, but Verra is not switch-eligible until 16% under current policy. Treatment output: 34,066 actual healing from 36,768 requested (2,702 overheal, 7.35%) and 140 cleanse events. No AI changes. Next: isolated threshold-policy comparison with matched seeds/seats.

- **P1.2.7 feasibility audit completed (telemetry only):** 80 matched-seat battles (20 seeds, Phantom/Falcon) captured 2,085 Verra decisions. Existing decision view supports reactive context (HP/status, enemies, ally/reserve health, action availability), but has no rolling incoming-damage/focus-fire history. Avoid opponent-name and unvalidated role-weight heuristics; keep Verra threshold at 16%. Next if pursued: design a minimal faction-neutral recent-damage view field, then test a prototype separately.
