# End-of-run post-mortem

Both victory and defeat screens show a post-mortem below the existing outcome/score. The
**Post-mortem** header button reopens it after closing the modal to inspect the wreckage.

## Ship damage bill

Every original and fabricated system instance is listed independently, with final condition,
recorded cause/timing of damage or destruction, and a component estimate:

- Operational: no outstanding repair valuation.
- Damaged: **2 matching components**, even if temporarily patched or supported by crew.
- Destroyed: **4 matching components** of replacement value.

Totals separate repairs and replacements, then show the gross bill, current spares and
additional components needed by type (never a negative deficit). No money, resource charges,
score penalties or new mechanics are introduced.

This values every listed loss, including cannibalised/sacrificed instances and wrecks whose
blueprint has since been rebuilt. It is not a guaranteed legal fabrication plan: single-copy
limits, Fabricator availability and whether the ship can be recovered still matter.

## Crew outcomes

All six actual roster members appear, including the seeded mission character and capability
specialists. Survivors are healthy or injured; on defeat they are described as **alive at last
contact**, not assumed dead or safely back on Earth.

Deaths include a specific, authored fictional reconstruction for each crisis: smoke inhalation,
electrocution, CO₂ poisoning, radiation injury, infection, impact trauma and other mechanisms
matched to that card's scenario. The description is stored at death, not regenerated on reopening,
and consumes no gameplay RNG. It does not introduce extra simulated events or change outcomes.

The recorded fatal injury source, named crisis when applicable, turn and phase, and previous
unhealed injury remain underneath the description. Suffocation narration also reflects the
current Life Support condition and active air-system penalties, captured before they expire. Suffocation is explicitly attributed to **Oxygen depletion during Consume**, not to an upcoming
crisis. Healing clears the previous injury record; a later injury
starts a new record. Dead crew are never resurrected by reporting.

Provenance is stored on crew/system instances, independent of the rolling 80-entry log. Random
and named system damage, failed burns, SCRAM, redlining, sacrifice and cannibalisation have
separate source labels. Permanent repairs clear outstanding damage; patches do not.

The report reads the final state rather than taking an early snapshot when defeat is first
triggered. If a fatal crisis also injures crew or damages systems after a trajectory failure,
the modal is refreshed after the complete consequence cascade, preserving the existing rules.

## Validation

`node tools/test-postmortem.cjs` covers both outcomes, victory with casualties, itemised totals,
spare offsets, duplicate instances, unchanged score/resources, complete crisis-description
coverage, narrative RNG isolation, log truncation, exact death
context, suffocation attribution, healing/repair cleanup, fatal cascades, reopening and restart.
Restart recreates a clean seeded run with no stale casualty or damage records.
