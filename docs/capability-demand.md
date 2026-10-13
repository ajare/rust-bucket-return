# Crisis capability demand

Generated from the current `index.html` with `node tools/capability-demand.cjs --write`.
Requirements are identical across Easy, Normal and Hard. For the rebalance rationale and
simulation comparison, see [Capability rebalance](capability-rebalance.md).
The current ten-capability/sixteen-system rules are described in [Capability simplification](capability-simplification.md).
“Previous mentions” refers to the archived pre-rebalance engine, not the immediately preceding rules.

## Demand and baseline production

Counts cover 72 unique ordinary crisis definitions, not per-game draws. “Unavoidable” means
every OR arm requires that capability to resolve successfully, not that a failed card cannot
be survived. Each card is counted at most once per capability; counts overlap.
Normal output is the whole original operational fleet: no crew, damage, fabricated copies,
heat costs or five-card draw constraints.

| Capability | Previous mentions | Current mentions | Unavoidable | Phase I / II / III | Normal producers | Normal fleet output |
|---|---:|---:|---:|---|---:|---:|
| SIGNAL (SIG) | 6 | 20 | 9 | 9 / 6 / 5 | 3 | 5 |
| DETECTION (DET) | 6 | 18 | 6 | 11 / 4 / 3 | 3 | 5 |
| ENGINEERING (ENG) | 31 | 16 | 6 | 11 / 3 / 2 | 2 | 3 |
| COOLING (CLG) | 5 | 16 | 6 | 9 / 3 / 4 | 3 | 5 |
| LIFE SUPPORT (LFS) | 8 | 14 | 7 | 7 / 4 / 3 | 2 | 4 |
| NAVIGATION (NAV) | 3 | 13 | 4 | 6 / 3 / 4 | 3 | 5 |
| POWER (POW) | 32 | 12 | 6 | 6 / 5 / 1 | 4 | 8 |
| CONTROL (CON) | 10 | 10 | 7 | 4 / 2 / 4 | 2 | 3 |
| PROTECTION (PRO) | 8 | 8 | 4 | 2 / 2 / 4 | 2 | 3 |
| THRUST (THR) | 7 | 7 | 1 | 4 / 0 / 3 | 2 | 4 |

## System outputs

| System | Normal | Redline | Sacrifice |
|---|---|---|---|
| Main Reactor | POW 3 | POW 7 | POW 10 |
| Auxiliary Reactor | POW 2 AND CLG 1 | POW 4 AND CLG 2 | POW 6 AND CLG 3 |
| Batteries | POW 2 AND CON 1 | POW 5 AND CON 1 | POW 6 |
| Fuel Cells | POW 1 | POW 3 | POW 5 |
| Main Engine | THR 3 AND NAV 1 | THR 7 AND NAV 2 | THR 10 AND NAV 3 |
| Manoeuvring Thrusters | THR 1 AND CON 2 AND NAV 1 | CON 4 AND NAV 2 | THR 4 AND CON 6 AND NAV 3 |
| Navigation Computer | NAV 3 AND DET 1 | NAV 6 AND DET 2 | NAV 8 AND DET 3 |
| Communications | SIG 3 AND DET 1 | SIG 6 AND DET 2 | SIG 8 AND DET 3 |
| Life Support | LFS 3 | LFS 6 | LFS 8 |
| Thermal Control | CLG 3 | CLG 6 | CLG 8 |
| Sensors | DET 3 AND SIG 1 | DET 6 AND SIG 2 | DET 8 AND SIG 3 |
| Fabricator | ENG 2 AND SIG 1 | ENG 5 AND SIG 2 | ENG 4 AND SIG 3 |
| Radiation Shielding | PRO 2 | PRO 4 | PRO 6 |
| Cargo Bay | Passive only | Unavailable | Unavailable |
| Habitat | PRO 1 | PRO 2 | PRO 2 |
| Service Module | ENG 1 AND CLG 1 AND LFS 1 | ENG 4 AND CLG 2 AND LFS 2 | ENG 1 |

Heat, damage and Sacrifice side effects still apply; this table lists capability output only.

## Every ordinary crisis

### Phase 1: 36 cards

| Crisis | Required capability output |
|---|---|
| FIRE IN THE AVIONICS BAY | ENG 5 |
| CO₂ BUILDUP | (LFS 6) OR (ENG 5) |
| GYROSCOPE FAULT | CON 4 |
| BATTERY SURGE | POW 5 |
| FUEL LINE BLOCKAGE | (ENG 5) OR (POW 7) |
| SMOKE IN THE WIRING LOOM | (ENG 3) OR (CLG 3) |
| COOLANT SEEP | (ENG 3) OR (CLG 2) |
| BUS BROWNOUT | (POW 4) OR (SIG 3) |
| SEAL DEGRADATION | (ENG 2) OR (THR 2) |
| FLICKERING BUS | (POW 3) OR (DET 2) |
| SCRUBBER OVERDRIVE | (LFS 2) OR (CLG 3) |
| WHEEL SPEED FAULT | (CON 2) OR (NAV 3) |
| SENSOR GLINT | (DET 2) OR (SIG 3) |
| CELL IMBALANCE | (POW 3) OR (CLG 2) |
| DOOR SEAL HISS | (ENG 2) OR (THR 2) |
| FUEL FILTER CLOG | (ENG 5) OR (CLG 5) |
| PATCHED FIRMWARE | (ENG 2) OR (SIG 2) |
| SOLAR WEATHER WATCH | (PRO 2) OR (DET 3) |
| EPHEMERIS UPDATE | (CON 3) OR (NAV 3) |
| DUST STRIKES | (DET 3) OR (THR 3) |
| SCRUBBER SATURATION | (LFS 3) OR (CLG 4) |
| CHARGE CONTROLLER FAULT | (POW 7) OR (SIG 5) |
| SHIPBOARD COLD | (LFS 2) OR (CLG 3) |
| FLARE WARNING | (PRO 3) OR (DET 3) |
| VALVE CHATTER | (CON 2) OR (NAV 3) |
| RECYCLER TASTE | (LFS 2) OR (DET 2) |
| WARM BUS | (CLG 2) OR (NAV 3) |
| STATIC STORM | (SIG 2) OR (DET 3) |
| SCRUBBER RATTLE | (ENG 3) OR (CLG 4) |
| FEED SPOOL SNAG | (ENG 2) OR (DET 2) |
| SPACE ADAPTATION | (LFS 3) OR (NAV 3) |
| SPARSE DEBRIS | (DET 2) OR (THR 3) |
| DISTANT HAIL | (SIG 3) OR (DET 3) |
| STAR SIGHTING | (NAV 3) OR (SIG 4) |
| SLEEP DEFICIT | (LFS 3) OR (SIG 3) |
| BEACON SELF-TEST | (SIG 2) OR (DET 3) |

### Phase 2: 18 cards

| Crisis | Required capability output |
|---|---|
| SENSOR FAULT ALARM | (DET 5) OR (SIG 5) |
| MICROMETEOROID IMPACT | DET 4 AND CON 2 |
| BATTERY DEGRADATION | POW 4 AND CLG 3 |
| CREW ILLNESS | LFS 5 |
| SOLAR FLARE | PRO 5 AND DET 3 |
| THRUSTER MISFIRE | CON 4 AND NAV 3 |
| SIGNAL INTERFERENCE | SIG 5 |
| OXYGEN SCRUBBER FAILURE | LFS 4 AND CLG 2 |
| FABRICATOR JAM | ENG 4 AND SIG 3 |
| ZERO-G ADAPTATION SICKNESS | LFS 4 |
| COOLANT LOOP RUPTURE | ENG 5 AND POW 3 |
| REACTOR TRIP | POW 6 |
| HULL MICROPUNCTURE | ENG 4 |
| ELECTRICAL SHORT | POW 4 AND SIG 2 |
| CABIN PRESSURE DROP | LFS 4 AND DET 2 |
| COMPUTER REBOOT LOOP | SIG 5 |
| SHIELD HOTSPOT | (PRO 3) OR (CLG 3 AND NAV 2) |
| BUS LOAD SHED | (POW 5) OR (SIG 3 AND NAV 2) |

### Phase 3: 18 cards

| Crisis | Required capability output |
|---|---|
| COMMUNICATIONS ACQUISITION | SIG 6 |
| PRECISION NAVIGATION | NAV 6 AND DET 4 |
| HEAT SHIELD STRESS | PRO 5 AND CLG 4 |
| RE-ENTRY VECTOR TRIM | CON 6 AND THR 4 |
| FINAL POWER SHUNT | POW 5 AND CLG 3 |
| CREW FATIGUE | LFS 5 AND SIG 3 |
| ATMOSPHERIC INTERFACE | CLG 5 AND PRO 4 |
| CHUTE & RECOVERY DEPLOY | ENG 5 AND SIG 3 |
| GNC FINAL ALIGNMENT | SIG 5 AND NAV 4 AND CON 3 |
| RECOVERY BEACON | SIG 4 AND DET 4 |
| COARSE TRIM BURN | (THR 3) OR (NAV 4) |
| FIRST TURBULENCE | (PRO 3) OR (THR 3) |
| RADIATION STORM | PRO 6 |
| NAVIGATION DRIFT | NAV 4 AND CON 4 |
| CO₂ ACCUMULATION | LFS 6 |
| LIFE SUPPORT CONTAMINATION | ENG 4 AND LFS 4 |
| THERMAL OVERLOAD | CLG 6 |
| DEBRIS FIELD | DET 4 AND CON 4 |

## Routes and final Re-entry

| Check | Requirement |
|---|---|
| INNER SYSTEM SLINGSHOT (direct burn) | THR 8 |
| DIRECT RETURN (direct burn) | THR 7 AND CON 4 |
| FINAL RE-ENTRY | CON 6 AND NAV 5 AND PRO 4 |

Safe routes have no capability check. Failing Re-entry can still yield emergency-landing victory.

## Reverse index

### POWER (POW)

- Phase 1: **BATTERY SURGE** — POW 5 [unavoidable]
- Phase 1: **FUEL LINE BLOCKAGE** — (ENG 5) OR (POW 7) [optional alternative]
- Phase 1: **BUS BROWNOUT** — (POW 4) OR (SIG 3) [optional alternative]
- Phase 1: **FLICKERING BUS** — (POW 3) OR (DET 2) [optional alternative]
- Phase 1: **CELL IMBALANCE** — (POW 3) OR (CLG 2) [optional alternative]
- Phase 1: **CHARGE CONTROLLER FAULT** — (POW 7) OR (SIG 5) [optional alternative]
- Phase 2: **BATTERY DEGRADATION** — POW 4 AND CLG 3 [unavoidable]
- Phase 2: **COOLANT LOOP RUPTURE** — ENG 5 AND POW 3 [unavoidable]
- Phase 2: **REACTOR TRIP** — POW 6 [unavoidable]
- Phase 2: **ELECTRICAL SHORT** — POW 4 AND SIG 2 [unavoidable]
- Phase 2: **BUS LOAD SHED** — (POW 5) OR (SIG 3 AND NAV 2) [optional alternative]
- Phase 3: **FINAL POWER SHUNT** — POW 5 AND CLG 3 [unavoidable]

### THRUST (THR)

- Phase 1: **SEAL DEGRADATION** — (ENG 2) OR (THR 2) [optional alternative]
- Phase 1: **DOOR SEAL HISS** — (ENG 2) OR (THR 2) [optional alternative]
- Phase 1: **DUST STRIKES** — (DET 3) OR (THR 3) [optional alternative]
- Phase 1: **SPARSE DEBRIS** — (DET 2) OR (THR 3) [optional alternative]
- Phase 3: **RE-ENTRY VECTOR TRIM** — CON 6 AND THR 4 [unavoidable]
- Phase 3: **COARSE TRIM BURN** — (THR 3) OR (NAV 4) [optional alternative]
- Phase 3: **FIRST TURBULENCE** — (PRO 3) OR (THR 3) [optional alternative]

### CONTROL (CON)

- Phase 1: **GYROSCOPE FAULT** — CON 4 [unavoidable]
- Phase 1: **WHEEL SPEED FAULT** — (CON 2) OR (NAV 3) [optional alternative]
- Phase 1: **EPHEMERIS UPDATE** — (CON 3) OR (NAV 3) [optional alternative]
- Phase 1: **VALVE CHATTER** — (CON 2) OR (NAV 3) [optional alternative]
- Phase 2: **MICROMETEOROID IMPACT** — DET 4 AND CON 2 [unavoidable]
- Phase 2: **THRUSTER MISFIRE** — CON 4 AND NAV 3 [unavoidable]
- Phase 3: **RE-ENTRY VECTOR TRIM** — CON 6 AND THR 4 [unavoidable]
- Phase 3: **GNC FINAL ALIGNMENT** — SIG 5 AND NAV 4 AND CON 3 [unavoidable]
- Phase 3: **NAVIGATION DRIFT** — NAV 4 AND CON 4 [unavoidable]
- Phase 3: **DEBRIS FIELD** — DET 4 AND CON 4 [unavoidable]

### ENGINEERING (ENG)

- Phase 1: **FIRE IN THE AVIONICS BAY** — ENG 5 [unavoidable]
- Phase 1: **CO₂ BUILDUP** — (LFS 6) OR (ENG 5) [optional alternative]
- Phase 1: **FUEL LINE BLOCKAGE** — (ENG 5) OR (POW 7) [optional alternative]
- Phase 1: **SMOKE IN THE WIRING LOOM** — (ENG 3) OR (CLG 3) [optional alternative]
- Phase 1: **COOLANT SEEP** — (ENG 3) OR (CLG 2) [optional alternative]
- Phase 1: **SEAL DEGRADATION** — (ENG 2) OR (THR 2) [optional alternative]
- Phase 1: **DOOR SEAL HISS** — (ENG 2) OR (THR 2) [optional alternative]
- Phase 1: **FUEL FILTER CLOG** — (ENG 5) OR (CLG 5) [optional alternative]
- Phase 1: **PATCHED FIRMWARE** — (ENG 2) OR (SIG 2) [optional alternative]
- Phase 1: **SCRUBBER RATTLE** — (ENG 3) OR (CLG 4) [optional alternative]
- Phase 1: **FEED SPOOL SNAG** — (ENG 2) OR (DET 2) [optional alternative]
- Phase 2: **FABRICATOR JAM** — ENG 4 AND SIG 3 [unavoidable]
- Phase 2: **COOLANT LOOP RUPTURE** — ENG 5 AND POW 3 [unavoidable]
- Phase 2: **HULL MICROPUNCTURE** — ENG 4 [unavoidable]
- Phase 3: **CHUTE & RECOVERY DEPLOY** — ENG 5 AND SIG 3 [unavoidable]
- Phase 3: **LIFE SUPPORT CONTAMINATION** — ENG 4 AND LFS 4 [unavoidable]

### NAVIGATION (NAV)

- Phase 1: **WHEEL SPEED FAULT** — (CON 2) OR (NAV 3) [optional alternative]
- Phase 1: **EPHEMERIS UPDATE** — (CON 3) OR (NAV 3) [optional alternative]
- Phase 1: **VALVE CHATTER** — (CON 2) OR (NAV 3) [optional alternative]
- Phase 1: **WARM BUS** — (CLG 2) OR (NAV 3) [optional alternative]
- Phase 1: **SPACE ADAPTATION** — (LFS 3) OR (NAV 3) [optional alternative]
- Phase 1: **STAR SIGHTING** — (NAV 3) OR (SIG 4) [optional alternative]
- Phase 2: **THRUSTER MISFIRE** — CON 4 AND NAV 3 [unavoidable]
- Phase 2: **SHIELD HOTSPOT** — (PRO 3) OR (CLG 3 AND NAV 2) [optional alternative]
- Phase 2: **BUS LOAD SHED** — (POW 5) OR (SIG 3 AND NAV 2) [optional alternative]
- Phase 3: **PRECISION NAVIGATION** — NAV 6 AND DET 4 [unavoidable]
- Phase 3: **GNC FINAL ALIGNMENT** — SIG 5 AND NAV 4 AND CON 3 [unavoidable]
- Phase 3: **COARSE TRIM BURN** — (THR 3) OR (NAV 4) [optional alternative]
- Phase 3: **NAVIGATION DRIFT** — NAV 4 AND CON 4 [unavoidable]

### SIGNAL (SIG)

- Phase 1: **BUS BROWNOUT** — (POW 4) OR (SIG 3) [optional alternative]
- Phase 1: **SENSOR GLINT** — (DET 2) OR (SIG 3) [optional alternative]
- Phase 1: **PATCHED FIRMWARE** — (ENG 2) OR (SIG 2) [optional alternative]
- Phase 1: **CHARGE CONTROLLER FAULT** — (POW 7) OR (SIG 5) [optional alternative]
- Phase 1: **STATIC STORM** — (SIG 2) OR (DET 3) [optional alternative]
- Phase 1: **DISTANT HAIL** — (SIG 3) OR (DET 3) [optional alternative]
- Phase 1: **STAR SIGHTING** — (NAV 3) OR (SIG 4) [optional alternative]
- Phase 1: **SLEEP DEFICIT** — (LFS 3) OR (SIG 3) [optional alternative]
- Phase 1: **BEACON SELF-TEST** — (SIG 2) OR (DET 3) [optional alternative]
- Phase 2: **SENSOR FAULT ALARM** — (DET 5) OR (SIG 5) [optional alternative]
- Phase 2: **SIGNAL INTERFERENCE** — SIG 5 [unavoidable]
- Phase 2: **FABRICATOR JAM** — ENG 4 AND SIG 3 [unavoidable]
- Phase 2: **ELECTRICAL SHORT** — POW 4 AND SIG 2 [unavoidable]
- Phase 2: **COMPUTER REBOOT LOOP** — SIG 5 [unavoidable]
- Phase 2: **BUS LOAD SHED** — (POW 5) OR (SIG 3 AND NAV 2) [optional alternative]
- Phase 3: **COMMUNICATIONS ACQUISITION** — SIG 6 [unavoidable]
- Phase 3: **CREW FATIGUE** — LFS 5 AND SIG 3 [unavoidable]
- Phase 3: **CHUTE & RECOVERY DEPLOY** — ENG 5 AND SIG 3 [unavoidable]
- Phase 3: **GNC FINAL ALIGNMENT** — SIG 5 AND NAV 4 AND CON 3 [unavoidable]
- Phase 3: **RECOVERY BEACON** — SIG 4 AND DET 4 [unavoidable]

### DETECTION (DET)

- Phase 1: **FLICKERING BUS** — (POW 3) OR (DET 2) [optional alternative]
- Phase 1: **SENSOR GLINT** — (DET 2) OR (SIG 3) [optional alternative]
- Phase 1: **SOLAR WEATHER WATCH** — (PRO 2) OR (DET 3) [optional alternative]
- Phase 1: **DUST STRIKES** — (DET 3) OR (THR 3) [optional alternative]
- Phase 1: **FLARE WARNING** — (PRO 3) OR (DET 3) [optional alternative]
- Phase 1: **RECYCLER TASTE** — (LFS 2) OR (DET 2) [optional alternative]
- Phase 1: **STATIC STORM** — (SIG 2) OR (DET 3) [optional alternative]
- Phase 1: **FEED SPOOL SNAG** — (ENG 2) OR (DET 2) [optional alternative]
- Phase 1: **SPARSE DEBRIS** — (DET 2) OR (THR 3) [optional alternative]
- Phase 1: **DISTANT HAIL** — (SIG 3) OR (DET 3) [optional alternative]
- Phase 1: **BEACON SELF-TEST** — (SIG 2) OR (DET 3) [optional alternative]
- Phase 2: **SENSOR FAULT ALARM** — (DET 5) OR (SIG 5) [optional alternative]
- Phase 2: **MICROMETEOROID IMPACT** — DET 4 AND CON 2 [unavoidable]
- Phase 2: **SOLAR FLARE** — PRO 5 AND DET 3 [unavoidable]
- Phase 2: **CABIN PRESSURE DROP** — LFS 4 AND DET 2 [unavoidable]
- Phase 3: **PRECISION NAVIGATION** — NAV 6 AND DET 4 [unavoidable]
- Phase 3: **RECOVERY BEACON** — SIG 4 AND DET 4 [unavoidable]
- Phase 3: **DEBRIS FIELD** — DET 4 AND CON 4 [unavoidable]

### LIFE SUPPORT (LFS)

- Phase 1: **CO₂ BUILDUP** — (LFS 6) OR (ENG 5) [optional alternative]
- Phase 1: **SCRUBBER OVERDRIVE** — (LFS 2) OR (CLG 3) [optional alternative]
- Phase 1: **SCRUBBER SATURATION** — (LFS 3) OR (CLG 4) [optional alternative]
- Phase 1: **SHIPBOARD COLD** — (LFS 2) OR (CLG 3) [optional alternative]
- Phase 1: **RECYCLER TASTE** — (LFS 2) OR (DET 2) [optional alternative]
- Phase 1: **SPACE ADAPTATION** — (LFS 3) OR (NAV 3) [optional alternative]
- Phase 1: **SLEEP DEFICIT** — (LFS 3) OR (SIG 3) [optional alternative]
- Phase 2: **CREW ILLNESS** — LFS 5 [unavoidable]
- Phase 2: **OXYGEN SCRUBBER FAILURE** — LFS 4 AND CLG 2 [unavoidable]
- Phase 2: **ZERO-G ADAPTATION SICKNESS** — LFS 4 [unavoidable]
- Phase 2: **CABIN PRESSURE DROP** — LFS 4 AND DET 2 [unavoidable]
- Phase 3: **CREW FATIGUE** — LFS 5 AND SIG 3 [unavoidable]
- Phase 3: **CO₂ ACCUMULATION** — LFS 6 [unavoidable]
- Phase 3: **LIFE SUPPORT CONTAMINATION** — ENG 4 AND LFS 4 [unavoidable]

### COOLING (CLG)

- Phase 1: **SMOKE IN THE WIRING LOOM** — (ENG 3) OR (CLG 3) [optional alternative]
- Phase 1: **COOLANT SEEP** — (ENG 3) OR (CLG 2) [optional alternative]
- Phase 1: **SCRUBBER OVERDRIVE** — (LFS 2) OR (CLG 3) [optional alternative]
- Phase 1: **CELL IMBALANCE** — (POW 3) OR (CLG 2) [optional alternative]
- Phase 1: **FUEL FILTER CLOG** — (ENG 5) OR (CLG 5) [optional alternative]
- Phase 1: **SCRUBBER SATURATION** — (LFS 3) OR (CLG 4) [optional alternative]
- Phase 1: **SHIPBOARD COLD** — (LFS 2) OR (CLG 3) [optional alternative]
- Phase 1: **WARM BUS** — (CLG 2) OR (NAV 3) [optional alternative]
- Phase 1: **SCRUBBER RATTLE** — (ENG 3) OR (CLG 4) [optional alternative]
- Phase 2: **BATTERY DEGRADATION** — POW 4 AND CLG 3 [unavoidable]
- Phase 2: **OXYGEN SCRUBBER FAILURE** — LFS 4 AND CLG 2 [unavoidable]
- Phase 2: **SHIELD HOTSPOT** — (PRO 3) OR (CLG 3 AND NAV 2) [optional alternative]
- Phase 3: **HEAT SHIELD STRESS** — PRO 5 AND CLG 4 [unavoidable]
- Phase 3: **FINAL POWER SHUNT** — POW 5 AND CLG 3 [unavoidable]
- Phase 3: **ATMOSPHERIC INTERFACE** — CLG 5 AND PRO 4 [unavoidable]
- Phase 3: **THERMAL OVERLOAD** — CLG 6 [unavoidable]

### PROTECTION (PRO)

- Phase 1: **SOLAR WEATHER WATCH** — (PRO 2) OR (DET 3) [optional alternative]
- Phase 1: **FLARE WARNING** — (PRO 3) OR (DET 3) [optional alternative]
- Phase 2: **SOLAR FLARE** — PRO 5 AND DET 3 [unavoidable]
- Phase 2: **SHIELD HOTSPOT** — (PRO 3) OR (CLG 3 AND NAV 2) [optional alternative]
- Phase 3: **HEAT SHIELD STRESS** — PRO 5 AND CLG 4 [unavoidable]
- Phase 3: **ATMOSPHERIC INTERFACE** — CLG 5 AND PRO 4 [unavoidable]
- Phase 3: **FIRST TURBULENCE** — (PRO 3) OR (THR 3) [optional alternative]
- Phase 3: **RADIATION STORM** — PRO 6 [unavoidable]

## Interpreting demand

Navigation also corrects Course Error through three surplus NAV on non-route responses.
Surplus Cooling offsets system-use heat. Thrust is needed for direct burns. Life Support
has a ship-system oxygen passive independent of LFS output. Explicit requirement counts
therefore are not actual use frequencies or supply/demand balance ratios. Phase pools are
36/18/18 but nominal lengths are 5/16/4; routes and early defeat change exposure.

Engine SHA-256: `75f3907a2d22ccb5d2b470dcfcb0940256dd4a0e2162bbd6fa95045fcb2cc6ef`.
