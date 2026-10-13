# Seeded crew roster and capability specialists

## Run roster

Draw crew **once at the start of each game**, using the run seed:

- Always aboard: **Commander, Systems Engineer, Doctor**, plus **one Mission Specialist**
  selected from [seven mission characters](mission-specialists.md).
- Draw **two distinct crew** without replacement from the ten System Specialists below.

Exactly six crew are aboard. The other eight specialist templates do not supply abilities, take
injuries or score points. The roster persists through all crises, route burns and phases; nobody
is substituted when injured or killed. Restarting with the same seed recreates the same roster
and opening game state. Changing seeds varies the pair.

| Capability | System Specialist |
|---|---|
| Power | Reactor Technician |
| Thrust | Propulsion Engineer |
| Control | Pilot |
| Engineering | Engineer |
| Navigation | Navigator |
| Signal | Communications Officer |
| Detection | Sensor Specialist |
| Life Support | Life Support Technician |
| Cooling | Thermal Engineer |
| Protection | Safety Officer |

There is one System Specialist per remaining capability. The Doctor remains a separate,
always-present crew member: heal one injured crewmate, or add free +2 Life Support if nobody is injured.
Compute/Medical specialists were removed with their capabilities; see [Capability simplification](capability-simplification.md).

## Specialist action

Each healthy System Specialist can add **+2 to one drawn, committed system instance** per crisis:

1. Commit a matching system at Normal, Redline or Sacrifice.
2. Click the specialist's **Assign +2** button.
3. Click the highlighted system card.

You can also select the specialist **before** choosing a mode: clicking Normal, Redline or
Sacrifice on a matching system commits it and completes the pending assignment in one click.
Uncommitted cards with a legal matching mode are highlighted, but do not produce output until
a mode is chosen. Clicking their card body alone leaves the selection pending.

The selected commitment must actually produce that capability. Merely having a specialist
aboard does not add free capability output. For example, Propulsion Engineer can boost a
Thruster's Normal or Sacrifice Thrust, but not its Control/Navigation Redline mode.
After the [capability rebalance](capability-rebalance.md), specialists can also boost matching
secondary outputs: the Navigator may target Main Engine or Thrusters, the Communications Officer
may target Sensors or Fabricator, and so on. After [distribution smoothing](capability-distribution.md),
Safety Officer may target Habitat and Pilot may target Batteries at Normal/Redline (not its Power-only Sacrifice).
Service Module Sacrifice can receive Engineer's bonus, but not Cooling or Life Support bonuses.
Blueprint name does not restrict assignment.

The +2 is added **after** damaged Normal output is halved. A damaged Thruster's one Thrust
halves to zero, but a healthy Propulsion Engineer can still add two: its Normal blueprint does
produce Thrust. Systems Engineer full-Normal restoration and a specialist bonus can stack.
Two different specialists can target the same multi-capability card, each increasing only their
own capability. With constructed duplicates, one specialist boosts one instance, not all copies.

The crew use is consumed when a valid target is selected, not when targeting is opened. Invalid
cards do not waste the action, and targeting can be cancelled before assignment. Once assigned,
the specialist cannot move to another system that crisis. Uncommitting or changing to a mode
without that capability removes the output bonus, but does not refund the crew use. Returning
to a matching commitment on the original target restores its assigned bonus.

The bonus does not change a system's generated Heat, passive Oxygen drain, construction,
sacrifice side effects, Redline damage or Sacrifice destruction. Extra Cooling and Navigation
still benefit from the ordinary surplus cooling/course-correction rules. A Fabricator constructing a system has no capability
output and is not an eligible target. A newly constructed card must first enter a future hand.

The Engineer retains his passive extra matching component on cannibalisation **only while aboard
and healthy**, whether or not his active +2 was already used that crisis. Runs without Engineer
receive the ordinary yields. Pilot and Engineer no longer provide free-standing +2 bonuses.

## Implementation and checks

`CREW_DEFS` contains the four core-role templates; the Mission slot is replaced with one seeded
selection from `MISSION_SPECIALISTS`. `SYSTEM_SPECIALISTS` has one role for each key in `CAPS`.
`newGame()` samples the mission character and two capability specialists before creating the run. `drawFive()` resets
uses and system-specific assignments, but never redraws the roster or restores crew health.

`systemOutput()` is shared by totals, output previews and simulator mode evaluation. It applies
assigned bonuses only to the relevant committed instance/mode. UI headings, log, role tooltips,
target highlights and help describe the six-person roster and targeting rules.

The response solver searches legal committed systems and adds each healthy unused specialist's
bonus once if a matching mode exists. Modes with damaged output rounded to zero remain searchable
when a specialist can make them useful. Previously assigned bonuses are preserved in snapshot
continuations. Fabrication planning remains outside the current automated policy.

```sh
node tools/test-crew.cjs
node tools/test-game.cjs
node tools/test-fabrication.cjs
node tools/test-simulation.cjs
```

Crew tests cover 256 seeds, all ten capabilities and all three commitment modes; roster
persistence/restart; invalid targets, absent/injured/dead crew; stacking and damage rounding;
constructed copies; Engineer yields; unchanged mode consequences and delegated UI clicks.
A 1,000-game simulation with sampled recovery continuations also verifies solver/engine agreement.
These are correctness checks, **not a new win-rate calibration**. Older balance snapshots predate
this roster change and cannot describe the current game's difficulty.
