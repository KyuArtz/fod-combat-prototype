# Owner Skill Reference and Authority

This page explains how the compact in-project owner reference is used. It is not a full copy of the website roster.

- `references/characterTerraData.js` is the single in-project reference file. It contains selected character skill objects and stat information only.
- The separate website-facing character data is maintained by the project owner and is not bundled here in its full original JSON format.
- The combat engine's executable data, shared systems, and automated tests define actual runtime behavior. The compact reference is a design/reference aid, not an engine import.
- Runtime Falcon skill definitions live in `characters/skillData/*.js`. Their exact implemented behavior is described in [Falcon Implementation Guide](FALCON_IMPLEMENTATION_GUIDE.md).
- When the reference JS changes, the owner personally applies the latest relevant content to the separate site-facing data. Do not create a second reference directory or copy the full original JSON into the project.

For current approved behavior, use the [Falcon Implementation Guide](FALCON_IMPLEMENTATION_GUIDE.md) and [ADR-017](../project/DECISIONS.md). The earlier Step 9 choices are preserved as a superseded [historical milestone](../history/milestones/STEP9_SUPERSEDED_FALCON_MECHANICS.md).
