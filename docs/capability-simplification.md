# Capability simplification: ten capabilities, sixteen systems

The current engine removes **Compute / Main Computer** and **Medical / Medical Bay**.
Its supply was subsequently refined by [Capability distribution](capability-distribution.md);
that refinement preserves fleet output totals and all simplification rules below.
This reduces the capability vocabulary from 12 to 10 and initial blueprints from 18 to 16;
it does not remove two additional systems. All 72 crisis identities, phase placement,
OR-versus-strict tiers, routes, Re-entry, difficulty injury rules and non-Component success benefits remain.
Fixed Component success grants were subsequently replaced by [Surplus Rewards](surplus-components.md);
all other success benefits remain. The only changed failure target is Computer Reboot Loop: damage Communications rather than
the removed Main Computer. Its description now identifies the communications controller.

## Replacement checks

| Crisis | Current requirement |
|---|---|
| Patched Firmware | ENG 2 OR SIG 2 |
| Sensor Fault Alarm | DET 5 OR SIG 5 |
| Computer Reboot Loop | SIG 5 |
| Fabricator Jam | ENG 4 AND SIG 3 |
| Precision Navigation | NAV 6 AND DET 4 |
| GNC Final Alignment | SIG 5 AND NAV 4 AND CON 3 |
| Crew Illness | LFS 5 |
| Zero-G Adaptation Sickness | LFS 4 |
| Shipboard Cold | LFS 2 OR CLG 3 |
| Recycler Taste | LFS 2 OR DET 2 |
| Space Adaptation | LFS 3 OR NAV 3 |
| Sleep Deficit | LFS 3 OR SIG 3 |
| Crew Fatigue | LFS 5 AND SIG 3 |
| Life Support Contamination | ENG 4 AND LFS 4 |

Every changed arm retains its previous sum of thresholds. That preserves nominal loads,
not difficulty: producer availability and combined outputs still change decisions.
Medical remains a **forecast category**, not a quantified capability.

## Supply and support

- **Fabricator** inherits backup Signal: **1 / 2 / 3** at Normal / Redline / Sacrifice,
  alongside its existing Engineering output. Construction produces neither capability.
- **Control backup** originally moved to Navigation Computer at Normal. The subsequent
  distribution refinement moves **CON 1 to Batteries at Normal and Redline**, offsetting
  Thrusters' Redline by one. Thrusters retain CON 6 at Sacrifice; Batteries Sacrifice is Power-only.
- **Service Module** gains **LFS 1 / 2 / none**, alongside Engineering/Cooling. This provides
  a second source for the expanded support checks, but **never protects Oxygen during Consume**.
  Service Sacrifice now provides ENG 1 plus three Components (no Cooling/Life Support),
  redistributed from Fabricator's original ENG 5 Sacrifice, now ENG 4.
- **Doctor** heals an injured crewmate first; if nobody is injured, she supplies **+2 LFS**.
  She cannot heal herself while injured. Crisis healing rewards and Adeyemi remain unchanged.
- **Life Support Sacrifice** heals one injured crewmate as well as restoring two Oxygen.
  Destroying that system still risks subsequent oxygen drain: this is not a free healing action.
- **Cargo Bay** alone stores Mission Data. Its destruction or failed Communications Acquisition
  permanently loses the data; rebuilding Cargo Bay cannot recover it.

The Computer Officer and Medical Technician are removed from the specialist pool. The run
still contains six crew: three fixed, one Mission Specialist, and two distinct specialists
from the ten-capability pool. Fabrication catalogue, modular-copy list, fitness normalization,
post-mortem and scoring use only the sixteen remaining blueprints. No component prices, opening
reserves, hand size, route rules or surviving-system fitness weights were retuned.

## Verification and balance caveat

All **18 regression suites** pass, including `tools/test-capability-simplification.cjs`.
Tests cover exact replacement checks, valid capability/system targets, relocated secondary
outputs, Doctor priority, Sacrifice healing, passive oxygen independence, removed-blueprint
construction rejection, Mission Data permanence, seed restart and UI targeting.
The simulator derives its capability vectors and loop bounds from the live engine rather
than hardcoding twelve dimensions.

A smoke run of **500 games per difficulty**, `salvage` policy, commitment cost 0.5,
seed indices starting at 2,200,000, produced:

| Difficulty | Wins | Mean ordinary playable responses |
|---|---:|---:|
| Easy | 61.2% | 22.702 |
| Normal | 52.4% | 22.462 |
| Hard | 15.0% | 19.426 |

```sh
node tools/simulate.cjs --games 500 --seed-start 2200000 --policy salvage --commitment-cost 0.5 --difficulty normal
# Repeat with --difficulty easy and --difficulty hard.
```

These are smoke checks, **not matched before/after balance estimates or human win rates**.
A subsequent [90,000-game balance study](simplification-balance.md) establishes a substantial
easing: Normal wins rise 40.84% → 51.56%. The Doctor and Service Module support buffs are major
levers; no gameplay retune has been applied.
The heuristic does not plan fabrication. Fewer cards, merged checks and a smaller specialist
pool can change difficulty materially; no claim of balance equivalence is made. Previous
seed outcomes and the results in the historical capability-rebalance report describe older
rules. The current complete demand/output map is [Capability demand](capability-demand.md).
