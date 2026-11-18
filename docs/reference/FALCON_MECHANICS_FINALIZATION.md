# Falcon Mechanics Finalization — Step 9

The executable skill definitions in `data/skills/*.js`, shared runtime in `core/skillInterpreter.js` and `core/skillEffects.js`, runtime stats in `characters/falcon.js`, and automated tests define current combat behavior. See the [Falcon Implementation Guide](FALCON_IMPLEMENTATION_GUIDE.md) for the complete value-by-value behavior reference.

No character-specific combat loop was added. Falcon skills remain declarative and execute through the shared skill runtime and combat systems.

## Owner-approved implementation choices

The following values fill details omitted from the original owner reference. They are implementation/balance decisions approved by the owner, not values quoted from the original source:

1. **Meo-v9 Final Protocol:** 1.0x Meo-v9 MPow against the selected primary enemy and 0.5x against other living enemies, as Electromagnetic damage. Surviving enemies receive SPD -15 for one turn. It fires once on natural expiry only; Meo-v9's runtime MPow is 80.
2. **Nanotech Singularity DoT:** 0.2x Elishia MPow, calculated when applied with critical hits disabled and stored as a fixed tick amount. It applies at the start of affected enemy turns for three turns and does not trigger additional DoT effects.
3. **Catalyst Wing:** targetable passive summon with 25% of Evalete's Max HP and 50% of her base DEF/RES. Early destruction grants Evalete a shield equal to 15% Max HP for four turns; natural expiry does not.
4. **Zackry Overwatch Accuracy:** +10 next-attack Accuracy token, consumed by the recipient's next supported attack, including skill-hit paths. Guaranteed-hit attacks remain guaranteed and still consume the token.
5. **Jazen Stagger:** first application pushes readiness back by 20 points. It delays readiness without deleting the next action; reapplication refreshes the marker without another pushback. Jazen is immune to Stagger/action-delay statuses.

## Regression coverage

`test/falconFinalizedMechanics.test.js` and `test/ownerFalconMechanics.test.js` cover Final Protocol expiry, Singularity DoT, Catalyst Wing lifecycle, Accuracy-token behavior, Stagger readiness delay, Recoil Dampeners, and Railshot. Run `npm test` from the project root.
