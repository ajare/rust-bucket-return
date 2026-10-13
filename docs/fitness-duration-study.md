# Lower fitness, longer games: simulation study

**Implementation status:** the playability compromise is now [shipped and verified](playability-compromise.md).
This page retains the original study's historical baseline and experimental results. Its modifier
commands target that archived engine, not the current release.

## Result

The strongest useful combination is **more voyage time for attrition, more system wear, and
fewer added crew injuries**. Damage alone lowers fitness but does not meaningfully extend games;
injury relief alone extends survival slightly but raises fitness. Together with a longer transit,
they let a badly degraded ship stay playable much longer.

There is **no unique optimum** without choosing a trade-off between fitness and turns. If victory
is unconstrained, the two-objective frontier includes almost-unwinnable marathons. During the study, no gameplay
balance or fitness weights were changed in `index.html`; all rule modifications below were
headless experiments. The compromise was subsequently approved and shipped.

## Measurement and controls

- Fixed fitness evaluator: 55% systems, 35% crew, 10% components, exactly the DEBUG calculation.
- Sample once **before player actions at each ordinary crisis**, including opening and Re-entry.
  Exclude route choices/burns and terminal snapshots. Killing the crew cannot reduce the average
  by adding a terminal zero; short failed runs do not get fictitious later turns.
- Primary fitness objective: mean of each game's mean sampled fitness, equally weighting games.
  A turn-weighted mean is also recorded and gives similar results.
- Primary duration: number of ordinary **playable crisis responses** sampled. This is not route
  clicks, route-burn responses, animation time, hypothetical distance, or the engine's legacy
  `meanTurns` field. Existing journey-stage and all-response statistics remain available.
- Report turns at fitness **≤0.6** as an additional measure of time spent degraded, not a recovery
  probability or diagnosis of inevitable death. The threshold is fixed, not fitted to results.
- Fixed policy: salvage, commitment cost 0.5. The actual inline engine resolves actions and checks
  the exhaustive response solver's totals. Mission timing, repairs and future planning remain
  heuristic; **fabrication is not planned or used**. This is not optimal/human performance.

Screened **51 distinct rule settings**, with 500 matched games per profile. Three sweeps contain
54 profile runs including repeated controls/anchor settings. Screen seed indices start at
2,000,000. A separate 10,000-game baseline replay on that range reproduced the archived shipped
profile exactly: **5,032 wins**, identical loss/trigger counts and duration means. Instrumentation
did not change the game outcomes.

Seven finalist/control profiles were then run on **10,000 held-out seed indices starting at
2,100,000**. They do not overlap the screening range. Actual seeds in all runs are
`Math.imul(seedStart + index, 2654435761) >>> 0`. Different rule outcomes change subsequent RNG
consumption and decisions; matching initial seeds does not freeze later paths.

## Held-out results: 10,000 games each

Lengths below are **nominal Phase I / II / III deck sizes**. Existing direct burns subtract two
cards on success or one on failure; safe routes add two, subject to unique-pool bounds. Re-entry
is additional. An injury reduction of two removes up to two **added** late-phase hits, never
original card injuries: II additions become **0/0**, III **1/0**, I stays **1/0**. Final Re-entry,
air rules and track caps are unchanged.

| Profile | Nominal lengths | Extra random damage per major failure | Starting parts/type | Mean fitness | Mean ordinary turns | Turns ≤0.6 | Wins |
|---|---|---:|---:|---:|---:|---:|---:|
| Shipped baseline | 5 / 6 / 4 | 0 | 2 | **0.77575** | **12.952** | 1.506 | **48.56%** |
| Playability compromise | 5 / 16 / 4 | +1 | 2 | **0.66092** | **22.062** | 7.290 | **33.66%** |
| More heavily worn | 5 / 16 / 4 | +2 | 2 | **0.62023** | **21.317** | 8.550 | **18.97%** |
| Long return | 5 / 16 / 12 | +1 | 2 | **0.64832** | **22.776** | 8.004 | **0.11%** |
| Low-fitness finalist | 5 / 16 / 8 | +1 | 0 | **0.60614** | **22.371** | 9.100 | **2.22%** |
| Extended opening | 16 / 16 / 8 | +1 | 2 | **0.69310** | **32.373** | 8.675 | **1.99%** |
| Maximum-length screen finalist | 36 / 16 / 16 | 0 | 2 | **0.73894** | **47.801** | 7.934 | **0.02%** |

All experimental rows use the two-hit late injury reduction. "Extra damage" stacks on existing
normal major-failure damage effects; OR Fuel Line Blockage retains its explicit major tier.

The held-out baseline win rate differs from the earlier 50.32% because this is a new seed range,
not a rules change. On this sample, the playability compromise produces **70.33% more playable
turns**, **14.80% lower mean fitness**, and almost **4.84×** as many low-fitness turns.

Paired approximate 95% intervals versus the same-seed held-out baseline:

- Compromise: fitness change **−0.11482 [−0.11557, −0.11408]**; turns change
  **+9.1095 [+9.0746, +9.1444]**.
- Heavier wear: fitness **−0.15552 [−0.15637, −0.15467]**; turns
  **+8.3650 [+8.3267, +8.4033]**.
- Low-fitness finalist: fitness **−0.16961 [−0.17039, −0.16882]**; turns
  **+9.4187 [+9.3701, +9.4673]**.

These intervals describe finite-sample policy results, not human play or uncertainty about
unmodeled strategies. The four non-compromise frontier rows trade lower fitness against more
turns. The compromise/heavier-wear rows are **not** two-objective Pareto winners: their advantage
is much more credible victory rates, which would be an additional design constraint.

## Which knobs matter?

### 1. Transit length: the main duration lever

In the initial 500-game screen, increasing II from 6 to 10 gave **15.92 turns / 0.7411 fitness**;
II=14 gave **17.65 / 0.7175**, without other changes, versus **13.01 / 0.7742** baseline.
It gives damaged systems and depleted spares time to accumulate. II has enough pressure to
wear the ship down without immediately applying the heavier III injury tier.

### 2. Replace some crew lethality with system wear

Adding +1 random system damage on major failures alone gave **12.98 / 0.7542**; +2 gave
**12.98 / 0.7330**. Lower fitness, essentially no duration gain. Reducing late injuries alone
raised mean fitness to **0.7939** (one hit) or **0.8019** (two), with only **13.28–13.30 turns**.

The interaction matters: II=14, +1 damage, two fewer added late hits gave **20.73 / 0.6786** in
the screen. Crew survive long enough to operate a collapsing fleet. On held-out runs the
compromise's Phase-III sampled system subscore is **0.272**, versus **0.654** baseline; crew is
**0.484**, versus **0.622**. Its Phase-III overall fitness is **0.340**, versus **0.613**.

Avoid escalating wear without bound: the heavier-wear finalist has **2,335 ship-hulk losses**,
versus **18** for the compromise. Ship extinction becomes the bottleneck even with softer
crew penalties.

### 3. Longer return quickly destroys victory prospects

For II=16/+1 wear/−2 late hits, the 500-game screen showed III=4 → **22.11 turns**, III=6 →
**22.61**, III=8 → **22.76**, III=12/16 → **22.79**. Additional scheduled cards mostly go unplayed
because the game ends first. The held-out long-return variant wins only **11/10,000** games.
This is observed rarity, not proof of zero possible recovery.

### 4. Longer opening buys many turns but dilutes the low-fitness experience

Increasing I to 16 or 36 genuinely increases played turns, as the held-out extended/max-length
rows demonstrate. But most of those added turns have comparatively high fitness: 47.8 total
turns in the max-length finalist contain only 7.9 turns ≤0.6, compared with 9.1 in the much
shorter low-fitness finalist. More time is not automatically more time feeling crippled.

### 5. Starting spares are a secondary lever, partly direct metric arithmetic

Starting with one or zero of each part gave **0.7509 / 0.7304 fitness** and **13.02 / 13.04 turns**
in the screen. This mostly lowers reserves and repair flexibility, not duration. Some fitness
improvement is mechanical: parts account for 10% of the score. It can also change cannibalisation
and later system condition. Zero starting spares plus long return is a frontier point, but has
only a 2.22% held-out win rate; it is not an automatically better gameplay design.

### 6. Repair pricing is weak in this policy

Costs 3 or 4 instead of 2 barely moved screen fitness (**0.7719 / 0.7722**) or duration
(**12.99 / 12.98**). Do not use repair inflation as the primary tool. The policy only repairs
selected critical systems; other resource heuristics are not reoptimized for custom prices,
so this is not a universal claim that repair cost cannot matter.

### 7. Safe routes alone are not a substitute

Holding the salvage solver fixed but selecting safe routes gave **15.71 turns / 0.7509 fitness**
and **1.6% wins** on the screen. More exposure to the old late injury pressure is much less useful
than combining longer transit with softer crew penalties.

## Suggested next balance experiment

If victories should remain reasonably attainable, try this **first**, not the near-zero-win
frontier extremes:

- `BASE_DECK = {1:5, 2:16, 3:4}`.
- Phase-II added injuries **0/0**, Phase-III **1/0**; I unchanged at **1/0**.
- **+1 `damageRandom`** on normal major failures, stacking with authored effects.
- Preserve two starting components/type, repair cost 2, original injuries, final Re-entry,
  three-turn air penalties with initial drain, rewards, requirements, routes and track caps.

This was the evidence-backed starting point; it has since been **approved, shipped and verified**. If minimizing fitness is more important
than retaining a ~34% simulated win rate, the heavier-wear option lowers mean fitness further.
If victory truly does not constrain the objective, choose among the frontier rows instead;
there is no honest single recommendation without a fitness/turn trade-off or a minimum win rate.

A 2,000-game held-out commitment-cost-0.25 check reproduced the main direction:

| Profile | Mean fitness | Ordinary turns | Wins |
|---|---:|---:|---:|
| Baseline | 0.77398 | 12.947 | 48.35% |
| Compromise | 0.65982 | 22.008 | 33.30% |
| Low-fitness finalist | 0.60361 | 22.407 | 1.80% |

These seeds overlap the held-out main sample, not independent extra evidence. No recovery
rollouts were run, so duration/low-fitness counts alone do not establish death-spiral inevitability
or how long genuinely recoverable tension lasts. Fabrication-aware/human play could materially
change long-voyage results.

## Reproduction and raw data

```sh
node tools/fitness-study.cjs --games 500
node tools/fitness-study.cjs --mode neighbors --games 500
node tools/fitness-study.cjs --mode lengths --games 500

# Held-out control
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows

# Playability compromise; add --damage 2 for the heavier-wear variant
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows --phase-lengths 5,16,4 --damage 1 --late-injury-reduction 2

# Low-fitness frontier finalist
node tools/simulate.cjs --games 10000 --seed-start 2100000 --policy salvage --commitment-cost 0.5 --fitness-rows --phase-lengths 5,16,8 --damage 1 --late-injury-reduction 2 --starting-components 0
```

For the remaining finalists use the table's lengths/damage/spares with the same late reduction
and base command against the archived engine. To reproduce the sensitivity use `--games 2000 --commitment-cost 0.25`.
The simulator also accepts `--repair-cost 3` and `--route-policy safe`, defaulting to shipped
prices and the original policy route choice. Changed phase lengths are bounded by unique card
pools; existing route deck clamps still apply.

`docs/simulations/fitness-duration-screen.json`, `...-neighbors.json`, `...-lengths.json` preserve
all screen settings, summaries and raw reports. `...-baseline.json` is the 10,000-game old-range
replay; `...-heldout-{baseline,balanced,worn,longest,lowest,extended,maxlength}.json` preserve the
seven validations; `...-heldout-summary.json` contains paired intervals/Pareto labels. The
`...-cost025-{baseline,balanced,lowest}.json` files preserve the policy check. Per-game matched
rows make comparisons auditable without storing entire game states. Raw JSON is compacted for
storage, preserving every field and value.

Engine SHA-256 (unchanged throughout the study):
`71dc647071f2541eae2a6e018a33feeb760690acfdd8dad57ac70529dc6f5e38`

Simulator snapshot used for the archived study SHA-256:
`28d3188a42934dc457ee82526b2fb2bc4dbd78085b055b83e6c20f2864fb8255`

The exact study snapshots are preserved as `docs/simulations/fitness-duration-simulator.cjs.txt`
and `docs/simulations/fitness-duration-engine.html.txt` (both hash verified). Copy them to
`tools/simulate.cjs` and `index.html` in a separate workspace with the recovery helper to reproduce
the historical rules and source hashes. Do not apply these modifier commands on top of the newly
shipped compromise: it already includes the longer transit, softer injuries and extra major wear. The current tool subsequently received a defaults-preservation fix:
unspecified phase lengths/spares inherit the engine rather than hardcoded values. That changes
the simulator hash/metadata, not these current-engine outcomes; matching per-game rows were
verified against the archived replay. This protects future shipped balance edits from being
silently overwritten by experiment defaults.

Validation checks reconcile per-game samples, rows, aggregate duration, loss/trigger counts and
engine/snapshot simulator hashes for every archived report. All ten regression suites pass, including fitness
purity/RNG invariance and simulation recovery-probe isolation; probes cannot contaminate the new
fitness statistics. No synthetic terminal zeros, changed fitness weights or shipped rule changes during the study;
the subsequent approved implementation is documented separately.
