# Capability vocabulary: one flat set of twelve

The twelve-member vocabulary below is superseded by [ADR 0003](0003-ten-capabilities-sixteen-systems.md).
The flat-set distinction between capabilities, tracks and passives still applies.

The design PDF is internally inconsistent: §5 lists seven capabilities (Power, Engineering, Compute,
Thrust, Life Support, Control, Medical) while the §4 system table also produces Signal, Detection,
Navigation, Cooling, Protection, Storage, and Crew Capacity. Left unreconciled, every crisis card
would need an ad-hoc ruling on what a system's output "counts as".

**Decision:** the canonical Capability set is the flat union of what systems produce — Power, Thrust,
Control, Engineering, Compute, Navigation, Signal, Detection, Life Support, Medical, Cooling,
Protection. Crisis requirements may reference any of them; no mapping or aliasing exists between
capabilities. Heat, Oxygen, Course Error, and Distance Home are tracks, never capabilities. Storage
and Crew Capacity are passive traits, not capabilities.

**Considered options:** (a) the seven of §5 only, with Signal/Detection/Navigation folded into
Compute or Control — rejected because it makes Communications, Sensors, and the Navigation Computer
redundant with each other, violating the design principle that no system is obviously expendable;
(b) the flat union — chosen; (c) a two-tier system with "core" and "secondary" capabilities —
rejected as bookkeeping the PDF explicitly warns against (§21: bookkeeping should stay light).

**Consequences:** crisis requirements can target exactly one system's specialty (e.g. Signal 6 with
Communications destroyed is a real hole), which is the intended "delayed consequences" pressure of
§10. Any future capability addition is a content-breaking change: every crisis and system references
this set by name.
