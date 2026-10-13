# Rust Bucket Return

A solo survival card game: a deep-space vessel suffers a catastrophic accident and the player
dismantles it, system by system, to bring the crew home. Implemented as a single self-contained
`index.html`. Source design: `docs/crippled_spaceship_game_design.pdf`.

## Language

### Commitment levels

**Normal**:
Using a system at its modest, repeatable effect. The system remains operational.
_Avoid_: standard use, basic action

**Redline**:
Using a system at its powerful effect. The system is flipped to damaged afterwards.
_Avoid_: overload, emergency use (the PDF's "Emergency" column)

**Sacrifice**:
Using a system at its exceptional one-off effect. The system is permanently destroyed.
_Avoid_: burn, scrap (scrapping for parts is Cannibalise, not Sacrifice)

**Cannibalise**:
Deliberately destroying an operational system outside of its effect to gain Components for repairs elsewhere.
Distinct from Sacrifice: no effect is produced, only parts.
_Avoid_: salvage, recycle

### Systems and construction

**System Blueprint**:
A kind of ship system, defining its capabilities, component type and whether multiple surviving copies are permitted.
_Avoid_: system card (ambiguous with an individual copy)

**System Instance**:
One individual copy of a System Blueprint, with its own condition and commitment. A replacement is a new instance, not restored wreckage.
_Avoid_: duplicate (when referring to a specific copy)

**System Pool**:
The surviving System Instances eligible to become available for a crisis response. Separate from the deck of Crisis cards.
_Avoid_: deck (without specifying systems or crises)

**Fabricate**:
Construct a new operational System Instance using the Fabricator and typed Components. Unlike Repair or Patch, this creates a new system rather than restoring an existing instance.
_Avoid_: rebuild (ambiguous with restoring wreckage), craft

### System states

**Operational**:
A system at full function; may be used at Normal, Redline, or Sacrifice.

**Damaged**:
A system degraded by a Redline or a crisis; may be used at half Normal value or Sacrificed, never Redlined.

**Destroyed**:
A System Instance permanently removed from play; remains visible in the tableau as wreckage. Fabrication can create a separate replacement, but cannot restore that instance.
_Avoid_: lost, broken, dead

**Patch**:
A one-shot restoration: a damaged system acts at full Normal value for one crisis. Costs 1 Component.
_Avoid_: quick fix, temporary repair

**Repair**:
A permanent restoration of a damaged system to operational. Costs 2 Components of the system's type.
_Avoid_: fix, mend

**Component**:
A spare part token, typed Electronics, Wiring, or Power Cell. Spent on Patches, Repairs and Fabrication; gained through Cannibalising, Surplus Rewards and other effects.
_Avoid_: spare part (ambiguous with the un-typed "spares" in the PDF), resource

**Surplus Reward**:
Random typed Components earned from a successful response, one per point left after meeting one complete requirement arm. For OR checks, unused output toward either arm counts, including partial alternatives; shared Capabilities count once and unrelated output earns nothing.
_Avoid_: fixed success grant, automatic loot

**Asset Fitness**:
A normalized heuristic of the condition of the whole System Pool, Run Roster and typed Components, independent of drawn cards and journey state. Not a probability of victory or the final mission score.
_Avoid_: draw quality, win probability

### Capabilities

**Capability**:
One of ten quantified things systems produce during a crisis response: Power, Thrust, Control,
Engineering, Navigation, Signal, Detection, Life Support, Cooling, Protection.
Crisis requirements are expressed only in Capabilities.
_Avoid_: resource, stat, skill

### Tracks

**Heat**:
A 0–5 track of thermal load, raised by using power systems and lowered by surplus Cooling. At 5 the
reactor scrams.
_Avoid_: temperature

**Oxygen**:
A 0–6 track drained each turn unless Life Support is operational. At 0, crew start dying.
_Avoid_: air, O2 track as a capability — Oxygen is never a Capability

**Course Error**:
A 0–3 track of navigational deviation. At 3 the ship is lost.
_Avoid_: drift, deviation

**Distance Home**:
The count of crises remaining before Earth; the principal game clock. Reduced by route decisions.
_Avoid_: progress, turns remaining

### Structure

**Crisis**:
A card demanding a combination of Capabilities, with a persistent Failure consequence and sometimes
a Success benefit.
_Avoid_: mission, event, encounter

**Phase**:
One of three escalating crisis decks: I ACCIDENT, II TRANSIT, III RETURN.
_Avoid_: act, chapter, stage

**Route Decision**:
A push-your-luck trajectory choice at a Phase boundary: a Safe route adds journey cards; a Direct
route removes them but demands an immediate Thrust check.
_Avoid_: path, trajectory card (the choice is the thing)

**Forecast**:
The revealed category (but not identity) of the next Crisis.
_Avoid_: preview, hint

**Ongoing Penalty**:
A persistent per-turn effect created by a failed Crisis, lasting a fixed number of turns unless cleared.
_Avoid_: debuff, status effect

### Crew

**Run Roster**:
The six crew aboard for the entire journey: three fixed crew, one randomly selected Mission Specialist and two randomly selected System Specialists. Injuries and deaths do not draw replacements.
_Avoid_: crew hand (implies a per-crisis redraw)

**Mission Specialist**:
A scientist or mission expert with a unique once-per-game intervention, selected for the entire run. Distinct from System Specialists' recurring capability bonuses.
_Avoid_: specialist (without identifying mission or system)

**System Specialist**:
A crew member dedicated to one Capability, who adds +2 to a committed System Instance producing that Capability. Distinct from the fixed-role Mission Specialist and Systems Engineer.
_Avoid_: specialist (without identifying system or mission)

**Crew states**:
Healthy, Injured (ability lost), Dead. A second injury kills.
_Avoid_: wounded, hurt, KO'd

**Mission Data**:
A scoring flag lost if Cargo Bay is destroyed, or Communications Acquisition fails.
_Avoid_: science points, objective
