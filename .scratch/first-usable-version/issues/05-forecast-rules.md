# Specify forecast calculations and evidence requirements

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Parent: ../map.md
Blocked by: 02

## Question

What exact calculation and evidence rules make the agreed forecasts reproducible and explainable with sparse, approximate, and out-of-sequence records?

Specify oil-life trend fitting and the historical-interval fallback; per-tire installed mileage across swaps/rotations; inner/outer sample aggregation without assuming repeatable physical sample points; limiting-area and whole-tire-average forecasts; measurement noise, missing values, and insufficient evidence; date precision and ambiguous chronology; and calendar estimates for seasonal tire use. Specify how distance, depth, and time units affect calculations. Resolve these rules before implementation; use small worked examples or a prototype if needed.

Also specify fuel economy over complete full-to-full periods, partial fills and missing fueling records, weighted long-term averages, and unit conversions. Input choices are recorded in [Define vehicle and maintenance entry workflows](03-user-interactions.md).

Confirmed fueling inputs are odometer readings in the vehicle's chosen miles/kilometres, litres added, and full / partial / unknown tank-fill status. Outputs include prominent km/L alongside L/100 km, with optional US or Imperial MPG. The user wants to multiply litres added by km/L to estimate the distance represented by the added fuel. Specify the historical economy basis for this estimate, identify it as an estimate, and do not mislabel it as total remaining tank range.

Confirmed tread-depth input units are millimetres, 32nds of an inch, and thousandths of an inch (0.001 in). Preserve input units and use consistent conversions for calculations and comparisons; specify rounding so display precision does not change stored observations.

## Comments

### Tire summaries and fuel-economy windows

- The user accepted inner-edge, outer-edge, and whole-tire averages for each measurement session, and the shallowest measured reading on each edge for the limiting-wear forecast.
- Inner/outer averages describe uneven wear; shallowest inner/outer readings support estimating the first area to reach the threshold; the whole-tire average supports the comparison estimate. These are sampled-area trends, not matched physical measurement points between sessions.
- The user accepted showing both the overall recorded fuel-economy average and a recent average based on the last three complete full-to-full periods, or fewer when fewer are available.
- Calculate each combined km/L average as total distance divided by total consumed fuel across its included periods, not an unweighted mean of individual ratios. Use the recent average for estimated distance represented by litres added. Show the dates and number of supporting periods.

### Shared mileage evidence and incomplete fueling records

- The user explicitly expects dated fuelings without mileage and mileage readings without fueling information, such as maintenance events. Retain all of these as useful evidence in the same vehicle history.
- Build the vehicle's mileage timeline from recorded odometer readings across event types. A maintenance observation without fueling information is not a missing fueling record and does not imply any fuel was added.
- A dated partial/intermediate fueling with known litres does not need its own odometer reading to contribute volume between full-tank endpoints with known mileage, provided the chronology and fueling completeness are established.
- A known fueling whose litres are missing is distinct from a non-fueling event; do not silently treat unknown added fuel as zero.
- The user accepted simple interpolation of missing fueling mileage between known odometer readings before and after its date. Preserve the recorded mileage as unknown; label derived mileage and any resulting fuel-economy figures as estimated. If suitable surrounding readings do not exist, leave the estimate unavailable.
- Never silently copy an unrelated same-day event's mileage into a fueling or overwrite a missing recorded value with a derived estimate. An average that includes an estimated-distance period is itself an estimate.

### Accepted trend windows and seasonal forecasts

- The user accepted a straight-line oil-life trend using usable readings in the current oil-change interval, with the previously agreed median completed-interval fallback.
- The user accepted tire trends using the latest three usable measurement sessions, or two when only two exist, against distance actually accumulated on that tire. Show supporting readings, identify two-reading forecasts as limited evidence, and keep older history visible.
- The user accepted remaining installed mileage as the primary tire forecast. Approximate seasons/years remaining must use the tire's own seasonal use, not the vehicle's year-round rate. Omit the calendar estimate when supporting seasonal history is insufficient.

### Deterministic calculation rules

These details make the accepted behavior implementable. The user accepted the four final evidence defaults: complete edge coverage, two complete seasons, unavailable forecasts for non-declining trends, and the latest two suitable dated odometer readings for vehicle calendar estimates.

#### Shared evidence and dates

- Preserve raw records, units, date precision, and unknown values. Recalculate derived results after out-of-sequence entries, edits, or resolved deletions. Never write an interpolated value into the recorded observation.
- Represent month/year-only dates as bounded date ranges. Do not choose an invented day or silently order overlapping uncertain events. Use recorded odometer order where it resolves chronology consistently; otherwise withhold the affected duration or calculation and explain the ambiguity.
- Build the mileage timeline from all vehicle event types. For interpolation at an exact known date t, use the nearest unambiguous recorded readings (t0, m0), (t1, m1) enclosing t: m(t) = m0 + (m1 - m0) * (t - t0) / (t1 - t0). Do not extrapolate. Conflicting readings, a zero-length time interval, or unexplained odometer decreases make that span unusable. With approximate dates, show a defensible range if bounds are available; do not manufacture a precise point estimate.
- A user must be able to mark known gaps in fueling or tire-movement history; the app cannot infer that all unrecorded events did not happen. Missing litres on an actual fueling also marks an unusable fuel-consumption span. Ordinary maintenance observations do not create fuel gaps.
- Keep supporting date range, measurement count, observed-versus-estimated inputs, and unavailable reasons with each result. These are evidence descriptions, not statistical confidence guarantees. Results are anchored to the latest supporting observation, not an invented current odometer reading.

#### Tire mileage and summaries

- Derive installed distance by summing vehicle odometer differences across known installation/position periods. Rotations change position periods while retaining accumulated distance. Off-vehicle periods contribute zero distance. Unknown spans remain unknown, not zero.
- Tracking can begin with a tire already installed. Retain a dated observed placement as a tracking baseline without inventing its original installation date or prior mileage. Known distance since the baseline can support wear forecasts even when lifetime mileage is unknown. If a movement gap prevents establishing distance between measurement sessions, do not fit a trend across that gap.
- For a complete session, compute inner mean and minimum from four inner readings, outer mean and minimum from four outer readings, and whole-tire mean from all eight. Top/front/bottom/back are within-session sample labels only.
- Retain partial sessions, but use an edge in comparable summary/trend calculations only when all four readings for that edge exist. Require all eight readings for the whole-tire-average trend. Show partial readings without treating them as comparable complete samples.
- Normalize depth and distance for calculations; retain entered units. One mile is 1.609344 km; one inch is 25.4 mm. A reading expressed as N thirty-seconds is N * 25.4 / 32 mm; N thousandths is N * 0.0254 mm. Do not round stored or intermediate calculations to display precision.

#### Tire forecasts

- Fit each of the inner-minimum, outer-minimum, and whole-mean series independently to its latest three usable sessions (two if only two exist). A usable fit needs at least two distinct known accumulated-distance values. Use ordinary least squares with slope b = sum((x - mean(x)) * (y - mean(y))) / sum((x - mean(x))^2).
- For declining depth (b < 0), anchor to the latest usable measured depth d and the configured threshold h: remaining distance = max(0, (d - h) / -b). The earliest finite edge crossing governs the limiting-wear forecast; the whole-mean crossing is a separate comparison, not a recommendation to continue using a tire past the limiting threshold.
- If a latest measured edge is already at/below the threshold, show threshold reached regardless of whether a slope can be fit. For a flat/increasing trend, show no usable wear-rate estimate, not infinite tire life. If one edge is unavailable, label any result as partial coverage; do not claim the tire's earliest crossing is fully established.
- Show why the whole-mean and limiting-edge estimates differ; their distance difference is the estimated lifetime impact of uneven wear, not a guarantee that rotating will recover that mileage. Unknown prior mileage prevents a total-lifetime figure but does not erase a supported remaining-distance estimate.
- Require two complete observed seasonal-use periods of the same type with known installed distances. Rotations within a seasonal period do not create new seasons. Use median installed distance per complete season to express approximate seasons remaining. Express years only when dated history establishes the seasonal recurrence; do not invent future swap dates or use the vehicle's annual mileage for a stored tire.

#### Oil and other maintenance

- Keep completed oil-change distances as differences between consecutive known oil-change odometer readings. Do not bridge a known missing oil-change interval. Show individual interval distances and their median.
- Fit oil-life percentage versus vehicle odometer over usable readings in the current known oil-change interval, using ordinary least squares and at least two distinct mileage values. For negative slope b and latest percentage p, remaining distance = max(0, p / -b); projected due odometer = latest reading's odometer + remaining distance. A recorded 0% means due regardless of available trend.
- If a usable current trend is unavailable, the historical fallback is last known oil-change odometer + median completed interval distance. Identify it as historical and show its sample count. Without a known last-change odometer, show historical interval statistics without inventing a due odometer. Do not infer a reset to 100% solely from an upward percentage reading or an oil top-up.
- Oil-level observations and top-ups remain history, not inferred oil-change events. No automatic oil-consumption forecast is required for the first version.
- For interval-based maintenance, next due mileage/date derives from the last qualifying completed service and its configured distance/time interval. When both are configured, either threshold can make it due. An inspection does not reset the interval. Unknown last-service facts leave the corresponding due estimate unknown.
- For approximate calendar estimates from remaining vehicle distance, use a positive driving rate supported by dated odometer observations and show that basis. Use the last two suitable unambiguous recorded readings at distinct dates; label it as a recent observed rate. If dates/rate are unsuitable, omit the date. Do not apply this vehicle rate to seasonal tire life.

#### Fuel economy

- A measured full-to-full period starts immediately after one confirmed full fill and ends immediately after the next confirmed full fill. Fuel consumed is the sum of all litres added after the opening fill through and including the closing fill; exclude the litres added at the opening fill.
- Intermediate partial or unknown-fill-status records with known litres still contribute volume; their mileage is not required if ordering and endpoint mileage are established. Only confirmed full fills serve as endpoints. A known missing fueling/volume prevents treating the enclosing period as complete.
- Distance is the closing odometer minus the opening odometer. Endpoints may use the accepted interpolation where available, but label the period and any dependent average estimated. A maintenance mileage observation without a confirmed fueling cannot itself establish a full-tank endpoint.
- Compute overall and last-three-period figures from sums of non-overlapping valid periods: km/L = total km / total litres; L/100 km = 100 * total litres / total km. Require positive totals for a usable driving-economy figure. Optional US/Imperial MPG must identify the gallon definition. Do not average individual period ratios without weighting.
- The quick added-fuel estimate is added litres * recent km/L. Identify the historical window and whether any supporting distance was estimated. This is distance represented by the added fuel, not remaining tank range.

#### Worked examples for implementation verification

- A known full fill at 100,000 km, an intermediate 20 L partial fill with no odometer, and a closing full fill of 30 L at 100,600 km give 600 / (20 + 30) = 12 km/L, or approximately 8.33 L/100 km. A maintenance reading within the span supports the timeline without adding fuel volume. Adding 25 L represents approximately 300 km at that recent economy.
- Recorded odometers of 100,000 km on day 0 and 100,600 km on day 30 give an estimated 100,200 km for a fueling on day 10. Preserve the missing recorded mileage and label any dependent economy estimated.
- Tire inner-minimum depths of 6, 5, and 4 mm at tracked installed distances of 0, 10,000, and 20,000 km give a slope of -0.0001 mm/km. With a user-chosen example threshold of 2 mm, remaining distance from the latest reading is 20,000 km. The example threshold is illustrative, not a recommended universal limit.
- Oil-life readings of 80% at 100,000 km and 40% at 104,000 km give -0.01 percentage points/km and 4,000 km remaining from the latest reading, projecting 0% at 108,000 km.

## Answer

The user accepted the forecast methods, recent-history windows, incomplete-data behavior, and final evidence defaults recorded above. Oil forecasts use the current interval's percentage trend with the labeled historical-interval fallback. Tire forecasts use recent installed-distance trends for edge minima and whole-tire averages, with separate evidence requirements for seasonal estimates. Fuel economy uses complete full-to-full periods and weighted totals, with accepted interpolation of missing mileage and explicit estimate labels.

All event types can supply mileage evidence. Raw observations, original units, date precision, and unknowns remain preserved; derived outputs are recalculated rather than stored as authoritative facts. The four worked examples were checked arithmetically during planning. Numerical verification and failure-case coverage must be implemented with the future Calculations module; no application code or tests were written as part of this decision.
