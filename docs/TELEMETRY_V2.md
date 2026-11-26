# Battle Telemetry v2

The telemetry collector is observational: it subscribes to the battle event bus and does not change combat decisions or state.

## API

```js
const { createBattleTelemetry } = require("../core/telemetry/battleTelemetry");
const telemetry = createBattleTelemetry(battle.events, battle.state, {
  includeTimeline: false, // compact summaries by default
  maxTimelineEvents: 10000,
});
const report = telemetry.summary();
telemetry.dispose();
```

## Report contents

- `version`: schema version (2)
- `totalEventCount`: all observed events
- `eventCount`: captured enriched timeline events (0 when timeline disabled)
- `timelineTruncated`: true when timeline capture reached its limit
- `turnCount`: observed TurnStarted count
- `koTimeline`: ordered incapacitations with round/turn and last damage source
- `actorMetrics`: attributed damage, HP damage, shield absorption, requested/actual healing, overheal, shields generated, status turns, KO, turns taken, target selection, reserve contribution and decision rejection metrics
- `factionMetrics`: aggregated metrics by actor faction; summon actors inherit owner faction where available. KO totals include summon KOs and expose `summonKOs` / `operativeKOs` breakdowns.
- `reserveMetrics`: deployment metadata and deployment-to-end contribution totals
- `statusUptime`: status durations completed by expiry/cleanse plus active effects at battle end
- `timeline`: chronological raw events with event-time snapshots when `includeTimeline: true`

Timeline snapshots are opt-in to limit memory and JSON size during large Monte Carlo batches. Metrics are always collected. `summary()` is idempotent and does not mutate the raw event history.

## Interpretation caveats

- “Finish opportunity” is a heuristic based on a target at or below 20% of base HP, not an exact damage forecast.
- `targetCounts` includes all AI decisions carrying target IDs, not attack-only targeting.
- Reserve-origin contribution is counted from the reserve deployment event through battle end; it does not mean the actor is currently bench-positioned.
- Status reapplications/refreshes close the prior interval and begin a new one.
- Shield expiration count is not yet an estimate of unused shield value; shield instance lifecycle/expiration value needs a dedicated shield event contract.
- Status uptime measures the affected actor's turn boundaries, not wall-clock time.
- Summons and non-faction actors may be grouped by side when faction metadata is unavailable.

## Batch investigation runner

Use the compact summary runner for reproducible faction telemetry batches without writing per-battle timelines:

```bash
node tools/serpentTelemetryBatch.js --battles 500 --seed 20261123 --opponents falcon,phantom --out reports/serpent-telemetry-500-each-summary.json
```

The report aggregates win rates, alternating seats, faction/actor metrics, KO final-blow attribution, status uptime, and reserve-origin contribution. For full forensic event timelines, run a single battle through `playFactionDuel()` with `telemetryOptions: { includeTimeline: true }`.

## Incoming pressure telemetry (P1.2.9)

The battle state keeps a bounded rolling incoming-damage buffer for tactical observation. Enemy-attributed HP loss is recorded after shields and mitigation, with events grouped by target and source. Same-side/self-inflicted damage and zero HP-loss events are excluded. The AI turn view exposes a detached `actor.incomingPressure` summary: `recentDamage`, `recentHits`, `window` (3 rounds), `damageBySource`, and `lastHitRound`. The summary is observational only; no action-selection policy consumes it yet. A fresh battle creates a fresh telemetry buffer.
