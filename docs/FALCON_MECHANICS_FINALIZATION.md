# Falcon Mechanics Finalization — Step 9

The executable skill definitions in `data/skills/*.js`, shared interpreter in `core/skillInterpreter.js`, runtime stats in `characters/falcon.js`, and automated tests define actual combat behavior. See [FALCON_IMPLEMENTATION_GUIDE.md](FALCON_IMPLEMENTATION_GUIDE.md) for the detailed, value-by-value guide.

No character-specific combat loop was added. Falcon skills remain declarative and execute through the shared skill interpreter and combat systems.

## Explicit tuning decisions

- Meo-v9 Final Protocol: 1.0x Meo-v9 MPow against the selected primary enemy, 0.5x Meo-v9 MPow against other living enemies, Electromagnetic damage, SPD -15 for 1 turn; fires once only on natural expiry. Meo-v9's runtime MPow is 80.
- Nanotech Singularity DoT: 0.2x Elishia MPow, calculated at application with critical hits disabled, stored as a fixed tick amount, applied at the start of affected enemy turns for 3 turns.
- Catalyst Wing: targetable passive summon, 25% Evalete Max HP, 50% base DEF and RES; early destruction grants 15% Max HP shield for 4 turns; natural expiry does not.
- Zackry Overwatch: +10 next-attack Accuracy token, consumed by the next attack; no team-wide token from untargeted skills.
- Jazen Stagger: first application delays readiness by 20 points; it does not delete an action; Jazen is immune.

## Regression coverage

The Falcon regression tests cover Final Protocol expiry/one-shot behavior, Singularity DoT, Catalyst Wing destruction and natural expiry, Overwatch token behavior, Stagger readiness delay, shield-aware Recoil Dampeners, and guaranteed-hit Railshot. Run `node --test` from the project root.
