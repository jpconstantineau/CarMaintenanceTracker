# Define the app's purpose and forecast behavior

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

Who is the first version for, what maintenance history and observations must it retain, and what should its maintenance and tire-life forecasts tell that person?

## Comments

### Agreed during initial charting

- The planning destination is an agreed specification for the first usable version.
- The primary user is an individual maintaining their own vehicles, potentially several household cars, with records for both DIY work and visits to a mechanic.
- The core purpose includes maintenance history and forecasting when maintenance will next be needed from history, mileage, elapsed time, and measured condition as applicable. Specific calculation rules still need to be defined.
- Forecasts should include due odometer readings and approximate calendar dates when sufficient data exists, and accommodate time-based maintenance.
- The user changes oil when the vehicle reports 0% oil life remaining. Generic fixed oil-change intervals must not replace this behavior.
- Show the distance achieved between completed oil changes. The user has many years of dated oil-change mileage history.
- Allow dated oil-life percentage readings with odometer readings. Use these alongside completed oil-change history to estimate when the current oil-life reading will reach 0%; the actual vehicle reading determines when the user changes the oil.
- Tire tracking and tire-life forecasts are part of the first version. The user has summer-tire tread history and swaps between summer and winter sets, with rotations.
- Each tire has a persistent identity. Track its position on the vehicle, time at each position, and distance accumulated at each position. Only installed distance counts toward that tire's mileage.
- Forecast each tire using its own tread measurements and accumulated distance against a user-chosen tread-depth threshold. Retain brand and model; do not assume a common wear rate across brands or tire positions.
- A tread measurement session includes eight readings per tire: innermost and outermost tread at top, front, bottom, and back.
- Uneven inner/outer wear is central to the user's purpose. The user wants to understand wear associated with camber and whether position changes make wear more even over the tire's life. The app's observations and estimates do not establish the mechanical cause of wear or guarantee that suspension work can be avoided.
- Comparing retired and current tire sets is deferred to a future version.

### Purpose questions settled in the final exchange

- Top/front/bottom/back are not repeatable physical points between measurement sessions. Calculations must not treat identically named readings as measurements of an identical physical point over time.
- The user confirmed that the area expected to reach the tread-depth threshold first should govern the tire's remaining-distance forecast, and also requested a whole-tire average to help assess how uneven wear affects expected lifetime mileage.

Vocabulary: [Vehicle Maintenance glossary](../../../GLOSSARY.md).

## Answer

The first usable version serves an individual keeping maintenance history for several personal or household vehicles. It combines completed maintenance records with observations to show past service life and estimate future maintenance mileage and dates. The agreed details above define the purpose.

Oil changes follow the vehicle's 0% oil-life indication. Preserve completed oil-change intervals and dated oil-life percentage/odometer readings; use both to explain past interval lengths and estimate when the current oil life will reach zero.

Track every tire individually through seasonal installation, removal, and rotation, retaining vehicle position, time, and installed mileage at each position. Preserve eight tread readings per measurement session without assuming repeatable physical measurement points between sessions. Show inner/outer wear, whole-tire average tread depth, and remaining-distance estimates governed by the first area expected to reach the user's threshold. Include an average-based lifetime estimate for comparison so the effect of uneven wear can be understood; exact rules live in [Specify forecast calculations and evidence requirements](05-forecast-rules.md).

Use each tire's own history and retain brand/model. Comparisons between retired and current tire sets are deferred beyond the first version. Architecture, interaction design, and persistence are subsequent decisions; no implementation is authorized by this resolution.

### Scope addition during the interaction discussion

The user added fueling history to the first version: dates, odometer readings when known, and litres added, to support average fuel economy calculations. Input choices live in [Define vehicle and maintenance entry workflows](03-user-interactions.md); incomplete-data and calculation rules live in [Specify forecast calculations and evidence requirements](05-forecast-rules.md).
