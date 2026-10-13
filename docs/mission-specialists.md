# Random Mission Specialists

One Mission Specialist is selected uniformly from these seven at the start of each seeded run.
The crew still has six members: Commander, Systems Engineer, Doctor, that Mission Specialist,
and two distinct capability specialists. All selections persist through the journey. Restarting
the same seed recreates the same mission character, capability pair and opening state.

| Character | Field | Once-per-game ability |
|---|---|---|
| Dr. Chen | Astrophysics | Exact forecasts of all future crises, while sensors are available |
| Dr. Rahman | Materials Science | Gain 2 components of one chosen type |
| Dr. Ortega | Human Factors | Absorb the next 2 individual injury hits |
| Dr. Nasser | Flight Dynamics | Reduce Course Error by 1 and reveal the next queued crisis |
| Dr. Kim | Operations Research | Redraw available systems, keeping up to 2 |
| Dr. Voss | Environmental Science | Clear one chosen ongoing penalty and restore 1 Oxygen |
| Dr. Adeyemi | Space Medicine | Heal up to 2 injured crew, in roster order |

## Availability and choices

Mission powers require a healthy owner and an active crisis response, including a route burn.
Injured/dead owners cannot activate them. Once used, an ability remains spent after crew uses
reset at the next draw; healing its owner does not refresh it. No power resurrects dead crew.

Rahman opens a component-type chooser. Both components are of the selected type. Voss opens a
penalty chooser when any ongoing penalties exist; only the chosen entry is removed, even if
multiple penalties have identical keys. With no ongoing penalties, Voss can still restore
Oxygen if it is below six. Adeyemi heals the first two injured crew in roster order, including
the Doctor when she is among those two; otherwise only the earliest two are healed.

Opening or cancelling a choice dialog does not spend the ability. Invalid payloads likewise
spend nothing. Buttons show why an ability is unavailable. Powers that would do nothing are
blocked: healing with no injured crew, environmental recovery with full Oxygen/no penalties,
Nasser with no Course Error/no queued card, or Chen when no unknown forecasts remain.

Ortega's two hits stack with Habitat emergency protection and cover both crisis injuries and
suffocation. Each hit consumes one protection, not the entire crisis's injury total.

## Forecasts are not the ability-spent flag

Chen gives persistent exact forecasts, but sensor-blinding penalties still temporarily hide
them. Nasser reveals only the next queued card, even during sensor blindness. His one-card
reveal is cleared when that card becomes current; subsequent forecasts return to normal.
A route boundary with no queued crisis provides no new identity to reveal, though Course Error
can still be reduced. Course Error cannot drop below zero.

Using Rahman, Ortega, Kim, Voss or Adeyemi does **not** unlock exact forecasts. Generic one-shot
usage and forecast knowledge are stored separately; simulator future sampling preserves the
actual displayed next-card identity/category rather than mistaking any spent power for Chen.

## Kim's redraw

Kim can be used only before current system commitments or fabrication. Select zero, one or two
current cards to keep and confirm. Prefer fresh surviving instances for replacements; when too
few fresh cards exist, reuse discarded survivors only as necessary to fill a hand of up to five.
Every instance remains unique within the hand, and destroyed systems never return.

This is a **hand redraw, not a new crisis**: crew uses, health, Commander/Doctor bonuses, patches,
Systems Engineer boosts and specialist assignments are not reset. Discarded maintenance effects
may be wasted, so keep cards already supported by crew or patches. Temporary maintenance is
cleared at the next actual crisis draw, including on cards discarded during Kim's action.

Fabrication is tracked for the whole response. Even destroying/cannibalising the builder after
construction cannot permit a Kim redraw to pull the newborn Fabricator into the same response
and chain additional builds. Ordinary reversible mode commitments may be uncommitted before
using Kim, but already consumed crew actions are never refunded.

## Implementation and checks

`MISSION_SPECIALISTS` holds seven immutable character templates, all occupying the `spec` crew
slot. `newGame()` picks one using the run RNG. Ability guards and effects are centralized in
`missionReason()` / `useMission()`; resource, penalty and keep-card dialogs use the same guards.
Crew cards display the selected character's field, specific ability, availability and spent state.

```sh
node tools/test-missions.cjs
node tools/test-crew.cjs
node tools/test-game.cjs
node tools/test-fabrication.cjs
node tools/test-simulation.cjs
```

Tests exercise 512 seed selections, all seven effects and one-shot/health guards, choice/cancel
UI, duplicate penalty selection, forecast lifetime, Oxygen/Course limits, Doctor rescue, no
resurrection, redraw keeping/shortage behavior, preserved crew uses/maintenance, fabrication
anti-chaining and full seeded restart. Existing suites also pass.

The simulator uses simple one-shot heuristics: early Chen/Ortega/resources, injury healing,
dangerous Course Error correction, environmental recovery and Kim redraws for poor responses.
Its recovery probes respect actual forecast knowledge. A 1,000-game run with sampled continuations
checks solver/engine agreement; this is **not a new balance calibration or optimal-play claim**.
Mission timing/choices remain heuristic, and fabrication planning remains unimplemented.
