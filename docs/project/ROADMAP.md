# Development Roadmap

This roadmap separates completed foundations from proposed future work. An unchecked item is not a commitment or permission to begin implementation.

## Completed foundations

- [x] Modular Node.js CLI combat loop and actor factory.
- [x] Physical/mastery damage, MP, cooldown, shield, and status systems.
- [x] Active/reserve formation, manual switching, and automatic replacement.
- [x] Legacy and threshold readiness schedulers; threshold is preferred.
- [x] Seeded RNG, typed event bus, controller-driven turns, decision validation, and deterministic replay.
- [x] Player-first PvE opening initiative.
- [x] Data-driven Falcon skills/passives and shared skill interpreter.
- [x] Shared player/enemy basic-attack resolver.
- [x] Full-battle regression coverage and golden transcript fixtures.
- [x] Typed combat event contracts.
- [x] Headless simulator and scheduler comparison tooling.
- [x] Data-driven enemy skills, enemy archetypes, AI policies, and encounter definitions.
- [x] Multi-wave encounter progression, per-instance stat overrides, defeat-count reinforcements, and completion/reward metadata hooks.
- [x] Falcon mechanics finalization with owner-approved implementation values documented separately from owner-authored values.
- [x] Documentation and codebase baseline audit/restructure: modular skill runtime, standard project metadata, ignore/formatting conventions, and reorganized documentation.

## Active architecture work — passive event migration

- [x] Keep active skill effect execution behind the pluggable `systems/effects/` registry.
- [x] Move passive/summon lifecycle implementation ownership out of `core/` while preserving the compatibility facade.
- [x] Define declarative passive event subscriptions (event, condition, handler/effects) in character skill data.
- [x] Add a battle-scoped passive handler registry under `systems/passives/`.
- [x] Migrate Catalyst Protocol, Biotech Overdrive, Unobserved, Recoil Dampeners, and Overwatch Protocol away from character-ID branches.
- [x] Replace timed passive-specific stat fields with generic timer-keyed stat modifiers; retain data-driven defensive reaction fields.
- [x] Finish auditing current Falcon defensive passive stat and action-resolution data contracts with conditional `statMods` and typed `incomingAttackMods`.
- [x] Generalize summon activation and natural-expiry effects through `systems/summons/registry.js`; migrate Meo-v9 Emergency Field, cover fire, and Final Protocol to declarative subscriptions.
- [x] Dispatch summon destruction owner reactions from summon-declared owner-event subscriptions; preserve generic on-destroy effects.
- [x] Remove the legacy summon behavior compatibility adapter.
- [x] Add focused modifier and regression tests; preserve seeded RNG draw order and existing behavior.

## Active architecture follow-up — status lifecycle generalization

- [x] Classify effect, passive, and summon handlers by reuse boundary without changing combat behavior.
- [x] Replace named `singularityDot` turn-start handling with a declarative status tick contract.
- [x] Replace named `commandUplink` refresh handling with a declarative conditional status-value contract.
- [x] Replace named `tacticalMark` defeat reward handling with a declarative defeat reaction.
- [x] Reassess specialized effect composition after the shared lifecycle contracts exist; Tactical Mark now uses the generic status primitive.
- [x] Replace Cipher Tag's specialized handler with the reusable `statusGroup` operation; verify linked-status replacement and refresh behavior.
- [x] Review Railshot and compose it from generic `masteryHit` with declarative conditional power and guaranteed-accuracy policies; preserve Accuracy-token and RNG behavior.
- [x] Review Zero Hour and compose its execute threshold and Cipher Tag follow-up from generic `masteryHit` and `conditionalStatus`; preserve strict HP boundary and miss/defeat semantics.
- [x] Review Singularity and compose its battle-wide timer/heal, status application, area DoT, conditional summon power, and summon announcement from reusable contracts; preserve reserve-entry behavior and turn-start ordering.

## Open technical decisions

- [ ] Decide whether and when runtime Falcon base stats should be synchronized with the owner-maintained stat sheet.
- [ ] Decide PvP and ambush opening-initiative policies.
- [ ] Decide whether to support encounter waves with fewer than five enemy entries.
- [ ] Expand enemy skill kits and AI policy vocabulary when encounter design requires them.
- [ ] Add source attribution to damage events if attacker-level damage analytics are required.
- [ ] Evaluate stage/level scaling and broader combat balance using multiple policies, encounters, and seed ranges.

## Next planned feature milestone — not started

**Reward System and Stage Progression Foundation**

Potential scope, subject to approval before implementation:

1. Define reward payloads for XP, currency, and items.
2. Award rewards only after successful encounter completion.
3. Define stage progression and encounter sequencing.
4. Separate persistent agent/progression data from battle runtime state.
5. Establish a versioned save-data schema and migration policy.

The encounter completion callback and reward metadata from Step 8 are integration points, not an existing reward system.

## Release / merge gate

Before merging a development change to `main`:

1. Run `npm test` and require all tests to pass.
2. Run targeted battle regressions for the changed systems.
3. Review any golden fixture changes and document intentional behavior changes.
4. Run relevant simulator samples and record configuration/seed ranges; do not treat small samples as balance proof.
5. Update the current reference, roadmap, and changelog only where their responsibilities require it.
6. Verify Git branch/status and review the final diff before committing or merging.


## Passive migration follow-up

- [x] Introduce passive event handler registry under `systems/passives/`.
- [x] Move Unobserved, Recoil Dampeners, and Overwatch Protocol triggers to declarative subscriptions.
- [x] Migrate Catalyst Protocol and Catalyst Wing creation, pulse, expiry, and destruction behavior to reusable passive/summon handlers.
- [x] Migrate Biotech Overdrive timed battle-start modifiers to generic timer-keyed passive stat modifiers; Nanotech skill trigger remains declarative.
- [x] Migrate Meo-v9 activation and expiry behavior to the summon handler registry.
- [x] Generalize summon destruction owner-event dispatch and remove passive-specific timed-stat fields.
- [x] Complete final audit of defensive passive modifiers and action-resolution hooks using reusable modifier records.
- [x] Complete Falcon shared-runtime character-ID audit; move Zackry targeter attribution and Jazen Recoil Dampeners status identity into passive data.
- [x] Expand passive event/modifier contract validation and re-run deterministic regression coverage.
