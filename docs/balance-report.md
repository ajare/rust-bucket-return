# Failure-consequence balance study

> Historical flat-penalty calibration. The shipped game now uses phase-scaled injuries;
> see [the implementation and follow-up](phase-scaled-injuries.md). Add `--flat-injuries`
> to reproduce this historical failure profile with the current simulator.

## Result

The shipped game targets about **25% victories under the strongest tested automated strategy**.
It achieved **2,465 / 10,000 = 24.65%** on the final independent seed block. The 95% Wilson
confidence interval is **23.8–25.5%**. Victories include both clean returns and surviving
emergency re-entries, matching the game's existing scoring rules.

This is an empirical benchmark, not a proof of optimal human play. No requirements, alternative
requirements, success rewards, deck sizes, initial resources, crew abilities, track limits,
route-burn consequences or final RE-ENTRY consequences were changed in this tuning.

## Shipped changes

`FAILURE_BALANCE` in `index.html` adds these penalties to every regular crisis card's original
failure effects:

| Card/effect | Additional penalty |
|---|---|
| Major crisis (no OR arm) | 3 crew injury hits |
| Minor crisis (either/or) | 2 crew injury hits |
| Environmental crisis | −3 Oxygen immediately |
| A crisis already causing Course Error | +1 additional Course Error |

These stack with the original card penalties. For example, a major crisis originally causing
2 injury hits now causes 5; a minor originally causing 1 causes 3. A −2 Oxygen failure now
causes −5 on an environmental card. Existing +1 Course Error failures now cause +2, not an
automatic +3 from an empty track. Ongoing penalties are unchanged. The rendered crisis card
shows the full combined consequences. Shelter still absorbs individual injury hits.

The balance additions do not apply to synthetic route burns or the final RE-ENTRY card.
The minor cards retain their easier requirements; failing one is now a consequential decision.

## Simulator and strategy

`tools/simulate.cjs` extracts and executes the actual inline game engine in a Node VM. It
suppresses DOM rendering only; the real consume, RNG, damage, crew, repair, patch, cannibalise,
resolve, route and scoring functions run. Random seeds are deterministic integer-multiplier
sequences. The script requires only Node built-ins.

For each response, the policy exhaustively enumerates legal combinations of modes for the
available systems, including full-strength Normal via patch or Systems Engineer, plus the
Commander's flexible +1. It checks BOTH either/or arms. Patch budgets, once-per-crisis abilities,
crew health and power-system SCRAM lockouts are respected. An assertion checks the selected
plan's capability totals against the engine's actual totals.

The outer policy heals with the Doctor, repairs important systems (Life Support, Navigation,
Thrusters, Communications, Thermal Control), cannibalises redundant undrawn systems when
appropriate to obtain repair parts, and takes direct routes. Its heuristic values survival,
course correction, shelter, oxygen, heat, damage and preserving critical systems. It can accept
an unsolvable crisis while still spending systems on cooling, course correction or shelter.
It is NOT a full-game search: future crisis identities are not used for planning, and the
choice of repairs/cannibalisation is heuristic rather than exhaustive.

Six strategies and seven commitment-cost settings were compared. The selected policy is
`salvage` with commitment cost `0.5` (more willingness to spend systems). In the 1,500-game
training cost sweep this won 25.47%; an independent 3,000-game holdout won 24.9%, followed by
the 10,000-game final validation above. Default-cost salvage won 24.68% in the final seed
block; that tiny difference is within sampling noise, not evidence of a stronger policy.

### Policy comparison (3,000 shared holdout seeds, default commitment cost)

| Policy | Win rate |
|---|---:|
| Aggressive + salvage | 24.70% |
| Aggressive | 24.63% |
| Conservative repairs | 20.63% |
| Always solve when possible | 20.40% |
| Balanced | 20.37% |
| Safe routes | 1.83% |

Without the new failure additions, the selected policy wins **98.83%** on the same 3,000
holdout seeds. Thus the easier either/or deck was substantially easier than earlier heuristics
suggested. Previous conversation estimates are not the new baseline.

## Common loss reasons (final 10,000-game validation)

7,535 games lost; 2,465 won.

| Final cause of defeat | Games | % of all games | % of losses |
|---|---:|---:|---:|
| Crew wiped out by crisis injury hits | 4,773 | 47.73% | 63.3% |
| Crew wiped out by suffocation | 1,453 | 14.53% | 19.3% |
| Course Error reaches 3 | 1,309 | 13.09% | 17.4% |

Total crew losses: 6,226 (62.26% of all games). No all-system-hulk losses were observed in
this final sample. Heat remains an indirect contributor through damage and lost capability,
not a standalone defeat condition.

### Most common terminal triggers

These identify the final event, not the complete causal history of a cascading failure.
Oxygen deaths are attributed to Consume even when the final RE-ENTRY card is already visible.

| Trigger | Lost games |
|---|---:|
| Oxygen depletion during Consume | 1,453 |
| RE-ENTRY | 608 |
| GNC FINAL ALIGNMENT | 394 |
| CREW FATIGUE | 335 |
| PRECISION NAVIGATION | 324 |
| NAVIGATION DRIFT | 282 |
| THRUSTER MISFIRE | 256 |
| DEBRIS FIELD | 251 |
| RE-ENTRY VECTOR TRIM | 247 |
| CREW ILLNESS | 208 |
| RADIATION STORM | 193 |
| CHUTE & RECOVERY DEPLOY | 189 |

The JSON reports also contain every encountered crisis's count and failure rate. A high card
failure rate does not imply a high defeat rate: direct-route burns often fail but their shorter
journey still improves survival. RE-ENTRY failure is survivable unless its injuries finish off
the crew.

## Mortality regression fixed

During the severity sweep, `injureCrew` could return early when no living crew remained,
bypassing its defeat check if the injury effect had unused hits. This allowed impossible
all-dead victories. The early return is now a break, ensuring the defeat check always runs.
Both baseline and tuned results include this fix. All pre-fix severity-sweep results were
discarded. No deliberate all-dead score is counted as a success.

`tools/test-game.cjs` verifies excess injury hits declare defeat, shelter absorbs hits,
injured crew cannot act, patch/repair spending works, odd output rounds down, either OR arm
resolves successfully, and power redlining is blocked after a SCRAM. Identical seeds produce
identical simulation reports.

## Reproduce

```sh
node tools/test-game.cjs
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage --commitment-cost 0.5 --flat-injuries
# Same engine, remove only the shipped failure additions:
node tools/simulate.cjs --games 3000 --seed-start 1000000 --policy salvage --commitment-cost 0.5 --baseline
```

Experimental CLI flags add further penalties to the shipped profile. Use `--baseline` first
when reproducing the original tuning sweep. Raw snapshots (with engine SHA-256 hashes) are
in `docs/simulations/`: `best-baseline.json`, `best-holdout.json`, `best-final.json`,
`policy-comparison.json`, and `commitment-sweep.json`.
