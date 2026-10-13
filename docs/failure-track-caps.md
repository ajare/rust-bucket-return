# Immediate failure track caps

> This benchmark predates later crisis requirement/placement changes and Fabrication.
> Historical failure-profile flags do not restore those changes; see [Fabrication](fabrication.md).

Each crisis's complete immediate failure effect is capped **after** its original consequences
and balance additions are combined:

| Phase | Maximum Heat increase | Maximum Oxygen loss | Maximum Course Error increase |
|---|---:|---:|---:|
| I — Accident | 2 | 2 | 1 |
| II — Transit | 3 | 3 | 1 |
| III — Return | 3 | 3 | 2 |

Phase III retains Phase II's Heat/Oxygen limits and raises only the Course Error limit.
The caps apply per failed crisis, not to an entire turn's combined changes. System-use Heat,
normal Life Support drain and delayed ongoing penalties remain separate. Beneficial track changes,
injuries, system damage, requirements and success rewards are not altered. The existing phase-scaled
injury profile remains 1/0, 3/2, 5/4 additional major/minor hits.

`FAILURE_BALANCE.trackCapsByPhase` and `capFailureTracks()` in `index.html` enforce the limits.
Crisis cards show final capped values; the help panel explains the table and exclusions.

## Smoke benchmark

Same 10,000 seeds and fixed salvage policy, commitment cost 0.5:

- Wins: **2,818 / 28.18%**, versus 2,416 / 24.16% before caps.
- Wilson 95% victory interval: **27.31–29.07%**.
- Defeat length: mean **11.54 stages**, population SD **1.38**, versus 11.14 / 1.63 before.

No other penalties were retuned to restore the earlier ~25% victory target. This is a
win-rate/duration smoke benchmark, **not a new death-spiral analysis**; recovery probes were not
rerun. Raw results: `docs/simulations/track-capped-benchmark.json`.

## Historical controls and tests

Original uncapped effects are retained in `BASE_FAILURES` for reproducible simulations:

- `--uncapped-tracks`: reproduce the preceding phase-scaled injury study without track caps.
- `--flat-injuries`: reproduce the older uncapped flat +3/+2 injury study.
- `--baseline`: restore the original design's failure effects, without balance additions or caps.

All three controls reproduce their existing reference reports exactly for wins, failure counts
and loss triggers. The uncapped phase-scaled control also reproduces duration distributions.
Experimental track additions are recapped unless a historical/control flag disables caps.

```sh
node tools/test-game.cjs
node tools/test-simulation.cjs
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage \
  --commitment-cost 0.5 > docs/simulations/track-capped-benchmark.json
```

Regressions cover all three phases, every existing crisis, extreme synthetic penalties,
actual track application, untouched benefits/ongoing effects, original-effect preservation,
and the unchanged phase-scaled injury profile.
