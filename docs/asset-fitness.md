# Asset-only hand fitness

The **DEBUG** button immediately after **Restart Game** toggles `FITNESS 0.xxxx` in the header.
It starts off, updates after every rendered action/turn while enabled, and keeps its UI preference
across new games/restarts until the page reloads. Hover the value for normalized systems, crew
and component subtotals. Debug toggling does not reopen other modals.

“Hand” here means the **entire asset position**, not the five drawn system cards. This is an
explicit heuristic, **not calibrated win probability**, endgame points or a best-action oracle.
No game mechanics or automated-policy choices are changed.

## Formula

```text
fitness = clamp(0.55 × systems + 0.35 × crew + 0.10 × components, 0, 1)
```

Each subscore is normalized into [0,1]. Fitness is zero if no crew remain alive or no system
instances remain operational/damaged, using only those asset conditions—not game-over flags.

### Systems (55%)

For each of the 16 blueprints:

- Operational instance health = 1; damaged = 0.4; destroyed = 0.
- Single-copy types use their best surviving instance.
- Modular types use the best instance plus **0.25 × the second-best** instance, normalized by
  the target 1.25. Further copies add no credit, preventing duplicate spam from inflating fitness.
- A healthy replacement restores a lost original's contribution; obsolete wreckage is not an
  additional penalty. Operational plus damaged backups get partial redundancy credit.

The system subscore is the weighted mean of those blueprint qualities:

| Weight | Blueprints |
|---:|---|
| 3.5 | Life Support |
| 2.5 | Navigation Computer, Manoeuvring Thrusters, Fabricator |
| 2.0 | Main Engine, Communications, Thermal Control, Radiation Shielding |
| 1.5 | Main Reactor, Sensors |
| 1.2 | Batteries |
| 1.0 | Auxiliary Reactor, Service Module |
| 0.8 | Fuel Cells |
| 0.5 | Cargo Bay, Habitat |

Life Support sustains crew and its Sacrifice heals an injured crewmate; navigation/control and
construction preserve scarce options. Removed Main Computer/Medical Bay weights no longer enter normalization. The redundant power sources are individually less
valuable, and storage/light accommodation have low weight. Habitat now provides backup Protection,
but its existing 0.5 weight was retained during distribution smoothing; this heuristic was not
recalibrated to infer victory odds from the new output vectors. These are design judgments, not
learned coefficients. A fully healthy original fleet has room below maximum for backup capacity.

### Crew (35%)

Only the actual roster counts. Healthy = 1, injured = 0.4, dead = 0; use a weighted mean:
Doctor 2.0, Commander 1.3, Systems Engineer 1.3, Mission Specialist 1.2, each capability specialist
1.0. The Doctor's health receives more weight because it maintains the rest of the crew. Injured
crew retain value as living personnel but have lost their abilities. Healthy rosters normalize
to the same crew score regardless of which seeded capability pair was selected.

### Components (10%)

For each type, reserve quality is `min(max(quantity, 0) / 4, 1)`. Weights are Wiring 1.4,
Electronics 1.2, Power Cell 0.8, again taking a weighted mean. Four matching parts fund construction
or two permanent repairs. Separate type reserves reward diversity and missing repair options;
stock beyond four per type adds no score. Hoarding cannot compensate indefinitely for lost assets.

## Deliberately excluded

The evaluator reads **only** `systems`, `crew` and `components`, plus fixed static definitions
and weights. It does not inspect:

- Drawn systems, crisis identity/requirements, forecast, deck or pools.
- Modes, commitments, specialist assignments, patches, Systems Engineer boosts or crew-use flags.
- Turn, step, phase, distance, Heat, Oxygen, Course Error, ongoing penalties, mission-data flags,
  game-over/victory state, or whether a one-shot Mission power has been spent.

Thus changing the draw, spending a temporary ability, patching a card, advancing a phase or
changing a track cannot by itself change fitness. Permanent damage/repair, crew injury/healing,
construction, destruction and component spending/gains can. Construction need not always raise
fitness: it trades flexible parts for a specialized asset, and this heuristic is not an optimal
policy or a prediction of the current crisis's outcome.

## Implementation and tests

`FITNESS_CONFIG` holds all explicit weights/health values/caps. `handFitnessBreakdown(state)`
returns normalized parts, viability and value; `handFitness(state)` returns the scalar. Both are
pure. `debugFitness` is an unseeded UI preference outside `G`; `renderFitness()` computes the
readout only when visible, and normal `render()` refreshes it. No RNG calls or game-state writes.

```sh
node tools/test-fitness.cjs
```

Tests cover bounds/endpoints, fixed input getters rejecting any world/draw access, temporary
state independence, monotonic health loss with other assets fixed, critical weights, backups
and replacement restoration, typed spare saturation/diversity, 256 asset configurations, order
invariance, header placement, live display, accessibility state, pure toggles, modal preservation
and unchanged seeded RNG/restart. Existing game, phase, requirement UI, specialist UI, crew,
fabrication, mission, post-mortem and simulation suites also pass.
