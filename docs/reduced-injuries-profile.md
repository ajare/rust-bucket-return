# First injury reduction: matched simulation profile

**Archived comparison:** the latest tuning reduces injuries once more and adds a small initial
Oxygen drain to later air failures. See [the current profile](injury-air-rebalance-profile.md).

## Shipped change

Remove **one additional injury hit from every normal Phase-II/III crisis failure**. Phase I,
original card injury hits, final Re-entry, all requirements/rewards, phase placements, routes,
track caps and ongoing penalties are unchanged.

| Phase | Previous major/minor additions | New additions |
|---|---|---|
| I | 1 / 0 | 1 / 0 |
| II | 3 / 2 | **2 / 1** |
| III | 5 / 4 | **4 / 3** |

These are additions, not final totals. Crew Illness is now 2 original + 2 = **4** hits; Crew
Fatigue and Radiation Storm are each 2 original + 4 = **6**. Coolant Loop Rupture is now **2**
hits. Final Re-entry still has its original **2** hits. The help panel and card totals reflect
this change; tests verify that each late normal card loses exactly one hit and no early card does.

## Main matched comparison

10,000 games per profile, seed-index start 2000000, salvage policy, commitment cost 0.5.
Actual seeds remain `Math.imul(2000000 + index, 2654435761) >>> 0`.

| Metric | Previous | Reduced injuries |
|---|---:|---:|
| Wins | 804 | **2,162** |
| Win rate | 8.04% | **21.62%** |
| Win-rate 95% Wilson interval | 7.52–8.59% | **20.82–22.44%** |
| Losses | 9,196 | **7,838** |
| Crisis-injury-triggered crew losses | 7,487 (81.42% of defeats) | **5,569 (71.05%)** |
| Suffocation-triggered crew losses | 981 (10.67%) | 1,057 (13.49%) |
| Missed trajectory | 728 (7.92%) | 1,212 (15.46%) |
| Ship reduced to a hulk | 0 | 0 |
| Mean losing journey stage | 11.279 | 12.072 |

The net gain is **1,358 victories**, or **+13.58 percentage points**. Total defeats fall by
14.77%, and crisis-injury defeats by **25.62%**. These are aggregate differences, not a claim
that the same 1,358 individual runs were all rescued without any newly introduced losses.

Crisis injuries remain the dominant final loss cause, but are substantially less dominant.
Suffocation and trajectory losses increase in absolute number as more games survive earlier
injury pressure; this does not establish that those mechanics independently became more severe.
The simulator reoptimizes its choices for the changed penalties. Fewer injury RNG calls can also
change later hands, so matching initial seeds does not freeze every subsequent random event.

## Loss phases and terminal cards

| Defeat phase | Previous | Reduced injuries |
|---|---:|---:|
| I | 2 | 2 |
| II | 1,381 | **136** |
| III | 7,813 | **7,700** |

Phase-II deaths fall by **90.15%**. Now **98.24% of defeats occur in Phase III**. Losses happen
about 0.79 journey stages later on average. No recovery-rollout study was run here, so this does
not establish whether late death spirals are shorter, longer or less inevitable.

Most frequent terminal triggers after the change:

| Trigger | Defeats |
|---|---:|
| Oxygen depletion during Consume | 1,057 |
| Re-entry | 916 |
| Crew Fatigue | 512 |
| Precision Navigation | 490 |
| GNC Final Alignment | 489 |
| Debris Field | 458 |
| Life Support Contamination | 425 |
| Navigation Drift | 407 |

Final Re-entry is now the most frequent **individual crisis-card** terminal trigger, despite
its injury penalty being unchanged. More games reach it: **3,078 vs 1,252** previously. A failed
Re-entry can still yield a surviving emergency-landing victory; requirement failure is not
synonymous with losing the game. Terminal-card rankings describe the final trigger, not all
contributing earlier damage or casualties.

## Alternative-policy checks

Repeat the earlier 2,000-game checks on the same first 2,000 seed indices:

| Policy | Previous wins | New wins | New share of defeats caused by crisis injuries |
|---|---:|---:|---:|
| Salvage, cost 0.25 | 165 (8.25%) | **445 (22.25%)** | 70.61% |
| Safe, cost 0.5 | 0 observed | **4 (0.20%)** | 72.95% |

These checks overlap the main run's seed indices, not independent extra samples. Safe differs
in more than route choice, so this is not a controlled route-only experiment. The small safe
win count also should not be treated as a precise estimate of human chances.

## Reproduction and provenance

```sh
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage --commitment-cost 0.5
node tools/simulate.cjs --games 2000 --seed-start 2000000 --policy salvage --commitment-cost 0.25
node tools/simulate.cjs --games 2000 --seed-start 2000000 --policy safe --commitment-cost 0.5
```

New raw files in `docs/simulations/`:
- `reduced-injuries-loss-causes.json`
- `reduced-injuries-loss-causes-cost-025.json`
- `reduced-injuries-loss-causes-safe.json`

Previous results are preserved in `current-loss-causes*.json` and
[the archived baseline report](loss-cause-analysis.md).

New `index.html` SHA-256:
`1603ea5cfe005b57ccac8fe5ebbf75d5c6749ef9deafaacdfc2e8c91d7c699ab`

Previous `index.html` SHA-256:
`3b244696ae37eca886ad6e25143f562fff35fbd62b7b9f8f278a9a49c355f01f`

The simulator is unchanged, SHA-256:
`a6e234e408dce47f3aa93e593a006b562f48b5dd584d9e0d1a02505849bae0c7`

All nine regression suites pass. Simulation response checks agree with actual engine totals;
loss/trigger/phase totals and engine hashes reconcile. No baseline, uncapped-track, experimental
profile or recovery flags were used. The automated policy remains heuristic and **does not
plan/use fabrication**. These results are not optimal-player or human-play win rates. Fictional
death descriptions are not used to classify losses; suffocation counts here are terminal games,
not individual crew deaths.
