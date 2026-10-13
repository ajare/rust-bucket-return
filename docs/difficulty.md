# Easy / Normal / Hard

Three run-level presets change **only added crew injury hits on normal crisis failures**.
**Normal retains the previous playability compromise's injury preset.** It is the default for
missing or invalid difficulty parameters. The [capability rebalance](capability-rebalance.md)
updates requirements and system outputs equally on all levels.

| Difficulty | Phase I major/minor | Phase II major/minor | Phase III major/minor |
|---|---:|---:|---:|
| Easy | 0 / 0 | 0 / 0 | 0 / 0 |
| **Normal** | **1 / 0** | **0 / 0** | **1 / 0** |
| Hard | 1 / 0 | 1 / 0 | 2 / 1 |

These are **additional hits**, not total card injuries or probabilities. Authored injuries still
apply: Crew Illness totals 2/2/3 on Easy/Normal/Hard; Crew Fatigue and Radiation Storm total
2/3/4. A minor Phase-III crisis with no original injuries adds 0/0/1. Fuel Line Blockage retains
its explicitly major OR tier. No random injury-probability roll was added.

Unchanged on every level:
- Shared crisis requirements/system outputs, success rewards, authored injury/damage effects and phase placement.
- Nominal decks 5/16/4 and existing direct/safe route rules.
- One extra random system damage on major failures, track caps and air penalties.
- Suffocation's one injury hit per zero-Oxygen Consume, shelter/healing behavior and fatal overshoot.
- Final Re-entry's two injury hits and two random destructions on failure.
- Starting components, costs, crew/mission/specialist/fabrication rules and asset fitness weights.

Easy is not immunity from injuries or loss. Hard is deliberately punishing, particularly during
the long transit; the heuristic comparison below shows a large difficulty gap.

## Selecting and replaying

The header's labeled **Difficulty** selector offers Easy, Normal and Hard. Choosing a different
level opens a confirmation: **Start [level] — same seed** or **Cancel**. The active selector stays
at the current run's level until a new page/run starts. Merely selecting, viewing the confirmation
or cancelling does not mutate gameplay, spend RNG or silently rebalance a hand.

Confirmation reloads the same seed with the selected preset. New Game chooses a new seed while
preserving difficulty. Restart Game preserves both seed and difficulty. Header share/replay text
and the post-mortem identify the active level. Help displays the preset table and selected additions.

```text
index.html?seed=17&difficulty=easy
index.html?seed=17&difficulty=normal
index.html?seed=17&difficulty=hard
```

Difficulty is fixed at page initialization, before normal crisis balance is applied. Restart does
not stack or reapply modifiers. Different difficulty outcomes can change later draws/decisions,
so matching a seed across levels does not guarantee the same future sequence.

## Simulation validation

```sh
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows --difficulty normal
# Change --difficulty to easy or hard for the other profiles.
node tools/test-difficulty.cjs
```

### Current capability-rebalanced rules

10,000 matched games per level, with the command above:

| Difficulty | Wins | Mean ordinary playable turns | Mean per-game fitness |
|---|---:|---:|---:|
| Easy | **50.06%** | 22.5236 | 0.66548 |
| Normal | **40.84%** | 22.2814 | 0.66573 |
| Hard | **6.50%** | 18.3759 | 0.67544 |

Raw current results: `docs/simulations/capability-rebalance-{easy,normal,hard}.json`.
See [Capability rebalance](capability-rebalance.md) for matched before/after intervals and source hashes.
These are heuristic results without fabrication planning/use, not human/optimal win rates.

### Historical difficulty-selector release

The following 10,000 matched games per level predate the capability rebalance:

| Difficulty | Wins | Mean ordinary playable turns | Mean per-game fitness |
|---|---:|---:|---:|
| Easy | **44.08%** | 22.3223 | 0.65995 |
| Normal | **33.66%** | 22.0617 | 0.66092 |
| Hard | **2.79%** | 17.7198 | 0.67964 |

**At the selector release, Normal reproduced the old 10,000-game profile exactly**: all fitness rows/aggregates, win/loss
counts, triggers, failed-crisis counts and duration distributions. The new UI, metadata and
Normal preset lookup introduce no gameplay RNG calls.

These are heuristic-policy results, not optimal/human win rates. No fabrication planning/use or
recovery probes are included. Hard's higher mean fitness is not evidence of greater strength:
many games end earlier, before as much fleet attrition accumulates. Easy's slightly lower mean
fitness likewise reflects changed trajectories/duration, not a change to the evaluator.

Raw results: `docs/simulations/difficulty-{easy,normal,hard}.json`. Normal's prior reference is
`playability-compromise-profile.json`. Fitness sampling is unchanged: pre-action ordinary crises,
no route choices/burns or terminal-zero padding.

Source hashes for these historical runs:
- Engine: `815eef7b68e3a2369ea61f6ea9e723190a147b5aba655c426513b9ae4c77559a`
- Simulator: `eb53121d335df6ca2ae8234de4b0147189932096f7aec09fe2e5b2f6d7884db5`

Tests cover all 72 cards across levels, untouched non-injury effects/BASE_FAILURES/requirements/
rewards/routes/Re-entry, suffocation, same-seed restart, identical initial crew/draws, unchanged
same-state fitness, URL fallback, explicit confirmation/cancel, navigation preservation, selected
Help/post-mortem labels, and headless difficulty selection. Existing regression suites pass.

The simulator's experimental controls still add to/override the selected preset where applicable;
choose the desired difficulty explicitly when combining them. Old studies retain their recorded
engine snapshots/rules. Do not treat their historical modifier commands as the current defaults.
