# Pre-reduction loss-cause analysis

**Archived baseline:** these runs precede the one-hit reduction to Phase-II/III injury additions.
See [the reduced-injury profile](reduced-injuries-profile.md) for the current rules and comparison.

## Main result

**Failed-crisis injury consequences are the dominant terminal cause of defeat.** In 10,000
current-engine games, they caused 7,487 of 9,196 losses (**81.42%**). Suffocation caused 981
(**10.67%**), and missed trajectory caused 728 (**7.92%**). No ship-hulk losses were observed.

There were **804 victories (8.04%)**; the simulator's 95% Wilson interval for win rate is
**7.52–8.59%**. This is a result for the selected automated policy, not optimal/human play.
No game rules were changed or retuned for this analysis.

| Terminal loss cause | Games | Share of defeats | Share of all games |
|---|---:|---:|---:|
| Crew extinction triggered by crisis injuries | 7,487 | 81.42% | 74.87% |
| Crew extinction triggered by suffocation during Consume | 981 | 10.67% | 9.81% |
| Course Error reaches 3 / trajectory missed | 728 | 7.92% | 7.28% |
| Ship reduced to a hulk | 0 | 0% | 0% |

The engine reports 8,468 total `CONTACT LOST — CREW LOST` games. Split those using the recorded
fatal injury source: 981 suffocation-triggered losses and 7,487 crisis-triggered losses. The
legacy JSON field `crewDeathsFromSuffocation` counts **games ending through suffocation**, not
individual crew deaths. These categories describe the final defeat trigger; they do not imply
that all earlier casualties had that same cause, or identify a counterfactual root cause.

## When losses occur

| Phase at defeat | Losses | Share of defeats |
|---|---:|---:|
| I | 2 | 0.02% |
| II | 1,381 | 15.02% |
| III | 7,813 | 84.96% |

The main late-game pressure is consistent with the actual mortality rules: hits first injure
healthy crew, then kill already-injured crew; healing can interrupt this accumulation. Phase III
adds 5 injury hits to major failures and 4 to minor failures, on top of original card effects.
This explains the mechanism but is not a controlled causal estimate of any one rule's effect.

## Most frequent fatal crisis cards

| Crisis delivering the terminal loss | Losses | Failures / encounters |
|---|---:|---:|
| Crew Fatigue | 554 | 860 / 895 (96.09%) |
| Life Support Contamination | 474 | 860 / 901 (95.45%) |
| Debris Field | 463 | 793 / 877 (90.42%) |
| GNC Final Alignment | 462 | 839 / 852 (98.47%) |
| Re-entry | 448 | 1,231 / 1,252 (98.32%) |

Crew Fatigue is the most frequent **individual crisis-card** terminal trigger. It requires
MED 5 AND LFS 3, and failure has 7 total injury hits under the current Phase-III balance.
Its 554 terminal losses are 6.02% of all defeats. GNC Final Alignment's trigger count can
include both trajectory and crew losses; card counts are not restricted to one loss category.

Oxygen depletion during Consume is the most frequent single named trigger (981), but it is
still much less common than the combined crisis-injury category (7,487). Per-card encounter
failure rates depend on the policy and deteriorated state reaching that card; they are not
state-independent difficulty rankings. Surviving a failed final Re-entry can still be a victory.

## Policy sensitivity checks

Two additional checks use the same first 2,000 seed indices:

| Policy / commitment cost | Games | Wins | Crisis-injury losses | Share of defeats |
|---|---:|---:|---:|---:|
| Salvage / 0.5 (main) | 10,000 | 804 | 7,487 | 81.42% |
| Salvage / 0.25 | 2,000 | 165 (8.25%) | 1,539 | 83.87% |
| Safe / 0.5 | 2,000 | 0 observed | 1,646 | 82.30% |

Injury-triggered defeat remains dominant. Safe is a different heuristic policy—not an isolated
route-only experiment—and its zero observed wins does not prove a true zero chance. These
2,000-game checks overlap the main run's seed indices and are not independent extra samples.

## Reproduction and scope

```sh
node tools/simulate.cjs --games 10000 --seed-start 2000000 --policy salvage --commitment-cost 0.5
node tools/simulate.cjs --games 2000 --seed-start 2000000 --policy salvage --commitment-cost 0.25
node tools/simulate.cjs --games 2000 --seed-start 2000000 --policy safe --commitment-cost 0.5
```

Actual run seeds are `Math.imul(2000000 + index, 2654435761) >>> 0`, not consecutive raw seeds.
No baseline, flat-injury, uncapped-track, experimental-profile or recovery-rollout flags were used.
The main run and checks assert response solver/engine agreement. Aggregate counts and current
engine hashes were also verified.

Raw results:
- `simulations/current-loss-causes.json`
- `simulations/current-loss-causes-cost-025.json`
- `simulations/current-loss-causes-safe.json`

Engine (`index.html`) SHA-256:
`3b244696ae37eca886ad6e25143f562fff35fbd62b7b9f8f278a9a49c355f01f`

Simulator SHA-256:
`a6e234e408dce47f3aa93e593a006b562f48b5dd584d9e0d1a02505849bae0c7`

These runs include the current phase redistribution, random mission/capability specialists,
operational-only cannibalisation, and current crisis requirements/AND–OR resolution. Fabrication
exists in the game but **the automated policy does not plan or use it**. It uses heuristic repairs,
mission timing and future planning; no claim of optimal full-game play is made. Fictional death
narratives are not used to classify losses. Older balance reports describe older rules.
