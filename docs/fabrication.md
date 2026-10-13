# Fabrication and system copies

## How to use it

When an **operational Fabricator is in the current hand and uncommitted**, click **Fabricate a
system…**, choose a blueprint, and spend **4 components of that system's component type**.
The same catalog is accessible beside the component inventory; unavailable choices show why.
Every system's card, tooltip and tableau entry also shows its construction cost.

Construction is immediate and consumes that Fabricator's use for the current crisis: it produces
no capabilities, cannot switch to another mode, and cannot build again until a new response.
Damaged Fabricators must be repaired first; patching or a Systems Engineer boost is insufficient.
A drawn operational backup Fabricator may independently fabricate once in the same response.

The new system is operational and enters the **system pool**, not the current five-card hand and
not the crisis deck. It is eligible for every subsequent random draw, including route burns.
It cannot contribute capabilities before it is drawn. Its passive functions begin immediately,
and it can be hit by random ship damage even before its first draw.

## Blueprint costs and copy limits

"Multiple" has no fixed numerical limit: every additional copy still needs its own components
and a Fabricator use. "One surviving copy" counts both operational and damaged instances;
a separate replacement may be built after the last surviving instance is destroyed.

| System | Construction cost | Surviving copies |
|---|---|---|
| Main Reactor | 4× Power Cell | One |
| Auxiliary Reactor | 4× Power Cell | Multiple |
| Batteries | 4× Power Cell | Multiple |
| Fuel Cells | 4× Power Cell | Multiple |
| Main Engine | 4× Wiring | One |
| Manoeuvring Thrusters | 4× Wiring | Multiple |
| Navigation Computer | 4× Electronics | Multiple |
| Communications | 4× Electronics | One |
| Life Support | 4× Wiring | Multiple |
| Thermal Control | 4× Wiring | Multiple |
| Sensors | 4× Electronics | Multiple |
| Fabricator | 4× Wiring | Multiple |
| Radiation Shielding | 4× Wiring | Multiple |
| Cargo Bay | 4× Wiring | One |
| Habitat | 4× Wiring | One |
| Service Module | 4× Wiring | Multiple |

### Why these choices

The five single-copy installations represent the ship's central power/propulsion/antenna
and large structural spaces. The repeatable blueprints represent modular backups, stores,
workshops, sensor and control units, scrubbers, radiators and protective
panels. Fabricator backups are repeatable so losing the original need not permanently close
the construction mechanic. Newly made Fabricators never become available in the same hand,
so they cannot chain construction during that response.

## Independent instances

New cards are labeled `Sensors #2`, etc. Their damage, modes, patches, Systems Engineer boosts,
repairs and cannibalisation are independent. Destroying one copy removes only that instance
from the draw pool; its wreckage remains in the tableau. IDs are never recycled during a run.
All survivors are sampled uniformly without replacement, up to five per response, so two
copies of one blueprint can appear together and combine their outputs.

Named crisis damage targets an operational instance of its blueprint first, then a damaged
one if none is operational. It never silently targets the original wreckage when a replacement
exists. Named repair effects repair a damaged instance. Random damage, SCRAM and failed-route
engine damage include built instances.

Life Support uses the best surviving copy: any operational one holds the air, otherwise a
damaged one costs one Oxygen per Consume, otherwise drain is two. Extra scrubbers do not stack
passive Oxygen gains. Ongoing oxygen penalties remain independent.

Habitat remains single-copy even though it now supplies Protection at all three commitments.
Its Protection requires an active commitment; only its Sacrifice supplies the two-hit emergency shelter.
Service Module Sacrifice now supplies Engineering as well as Components. See [Capability distribution](capability-distribution.md).

A new operational engine or thruster can qualify the ship for recovery. Operational copies each
score one point, like other systems. Losing Cargo Bay permanently loses mission
data; constructing a replacement cannot resurrect it. Crew are never recreated by building a
system. Main Computer and Medical Bay were removed in [Capability simplification](capability-simplification.md).

## Tests and balance caveat

```sh
node tools/test-game.cjs
node tools/test-fabrication.cjs
node tools/test-simulation.cjs
```

The fabrication suite exercises all 16 costs, guards and five single-copy limits; independent
commitments, damage, repairs and destruction; future draws; multiple builders; passive Life
Support; targeted/random infrastructure; scoring; catalog rendering and delegated Build clicks.
Restart resets the pool to its initial 16 systems.

The simulator uses instance IDs and respects a Fabricator already committed to construction.
However, its current heuristic **does not plan or perform fabrication**. Its output explicitly
states that limitation; no new win-rate or death-spiral claim is made for fabrication-aware play.
Earlier reports are historical, and their engine hashes differ. Failure-profile flags do not
restore subsequent crisis placement/requirement changes or this new mechanic.
