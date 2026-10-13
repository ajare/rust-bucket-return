# Crisis phase progression

The 72 normal crisis cards retain their curated phase placement. The original redistribution
kept requirements unchanged; the later [capability rebalance](capability-rebalance.md) updates
requirements and system outputs while preserving success rewards and base failure effects.
Final RE-ENTRY remains separate and unchanged, as do route requirements and journey lengths. Pools still use the run seed and are shuffled, not dealt in
an authored fixed order.

| Phase | Cards | Either/or | AND | Single capability | Identity |
|---|---:|---:|---:|---:|---|
| I — Accident | 36 | 33 (91.7%) | 0 | 3 | Flexible alternatives; a few focused emergencies |
| II — Transit | 18 | 3 (16.7%) | 9 | 6 | 83.3% strict requirements |
| III — Return | 18 | 2 (11.1%) | 12 | 4 | 88.9% strict requirements, higher loads |

OR means either complete arm suffices. AND means all listed capabilities must be met; a
single-capability card has only one requirement and no alternative. The UI explicitly joins
requirements with AND inside each arm and OR between alternatives. A live overall readiness
indicator uses the same predicate as resolution; one green chip does not imply that the whole
crisis succeeds. For example, Coolant Loop Rupture requires ENG 5 **AND** POW 3: either alone
causes no added Phase-II injury hits but adds one random system damage hit, while both together succeed without failure injuries.

## Placement

- **Phase I gains** all 15 lower-threshold transit OR variants: Solar Weather Watch, Ephemeris
  Update, Dust Strikes, Scrubber Saturation, Charge Controller Fault, Shipboard Cold, Flare
  Warning, Valve Chatter, Recycler Taste, Warm Bus, Static Storm, Scrubber Rattle, Feed Spool
  Snag, Space Adaptation and Sparse Debris. Distant Hail, Star Sighting, Sleep Deficit and
  Beacon Self-Test also move here: routine communications, navigation, watch and readiness
  checks fit the early emergency. The three remaining strict cards are Fire in the Avionics
  Bay, Gyroscope Fault and Battery Surge.
- **Phase II gains** Coolant Loop Rupture, Reactor Trip, Hull Micropuncture, Electrical Short,
  Cabin Pressure Drop and Computer Reboot Loop. Shield Hotspot and Bus Load Shed move here as
  pre-return preparation checks. Sensor Fault Alarm stays here, preserving its earlier requested
  placement and DET 5 OR CMP 5 requirement.
- **Phase III gains** Radiation Storm, Navigation Drift, CO₂ Accumulation, Life Support
  Contamination, Thermal Overload and Debris Field. Their narrow high thresholds and compound
  checks join the existing late-return crises. Atmospheric Interface, Heat Shield Stress,
  Re-entry Vector Trim, recovery deployment, GNC alignment, Coarse Trim Burn and First
  Turbulence remain late; re-entry is not narratively moved into the initial accident.

Examples of escalation: Coolant Seep (ENG 3 OR CLG 2) → Coolant Loop Rupture (ENG 5 AND POW 3)
→ Thermal Overload (CLG 6). Navigation moves from alternative fixes to demanding compound
checks such as Precision Navigation (NAV 6 AND CMP 4) and GNC Final Alignment
(CMP 5 AND NAV 4 AND CON 3).

Mean summed requirements in the cheapest arm are **2.86 / 5.72 / 7.56** across phases I/II/III.
That is a requirement-load proxy, not proof of optimal-player difficulty: hand availability,
capability rarity, damage, crew, fabrication and failure consequences all matter.

## Failure scaling and reproducibility

Placement is applied **before** existing balance additions. Moved cards receive the destination
phase's injury tier and immediate Heat/Oxygen/Course caps. The shipped playability compromise
uses nominal phase lengths 5/16/4 and, on the default Normal [difficulty](difficulty.md),
added injuries I 1/0, II 0/0, III 1/0, and one extra random
system damage hit on normal major failures (including explicitly major OR Fuel Line Blockage).
Route burns and final Re-entry retain their authored consequences. See [current balance](playability-compromise.md).
Original failure definitions and success
rewards are retained. The current air balance also adds one extra Oxygen drain on the first Consume
of Phase-II/III ongoing air penalties; ongoing rates and three-turn durations remain unchanged. For example, Hull Micropuncture now uses the Phase-II Oxygen-loss cap
of 3; Radiation Storm now has its original 2 plus 1 Phase-III injury hits. Fuel Line Blockage
keeps its explicit major failure tier despite being an OR card.

`CRISIS_PHASE_MOVES` in `index.html` defines the placement overlay on the authored card groups.
Each card appears exactly once. Same-seed restart reproduces the new layout, but old seeds'
previous crisis sequences are intentionally changed by the redistribution. Historical failure
control flags do not restore old placements. Earlier balance reports remain historical; this
change has not been tuned back to their win rates.

## Validation

`tools/test-phases.cjs` verifies all 72 unique cards, unchanged requirements/alternatives/rewards/
base failures against pre-placement definitions, exact phase compositions, increasing requirement
loads, destination failure scaling, thematic late-return placement, sufficient safe-route pools,
and 128 seeded restarts. Existing game, crew, construction, mission, post-mortem and simulation
suites also pass. `tools/test-requirements-ui.cjs` checks real Coolant Loop commitments at seed
410129881 (Engineering-only, Power-only and both), either arm of every OR card, and displayed
AND/OR readiness. Simulator JSON records phase-pool composition and IDs for provenance.

The automated policy still uses heuristic Mission powers and does not plan fabrication; a
simulation smoke test checks engine/solver agreement, not a calibrated balance claim.
