# CarMaintenanceTracker: first usable version

Status: ready-for-agent
Labels: ready-for-agent

This is the consolidated implementation specification produced from the completed wayfinder discussion. It replaces the earlier handoff index. Decision records retain rationale and research; this document defines the behavior to build and verify. Writing it does not implement the application or provision infrastructure.

## Problem Statement

An individual maintaining several personal or household vehicles needs a durable history of work, observations, tires, and fuelings. History may be sparse, entered annually, out of order, or begin on a 15-year-old vehicle without earlier records. Different events provide different evidence: maintenance may include mileage, a fueling may include litres without mileage, and tread sessions may be incomplete.

The user wants to understand past oil-change distances, forecast when reported oil life will reach 0%, estimate tires' remaining installed mileage, and assess uneven inner/outer wear. Seasonal tires accumulate distance only while installed and move between vehicle positions. Fuel economy should be understandable in km/L, including the approximate driving distance represented by fuel just added.

Phone and desktop must access the same records. Users keep their data in their own GitHub Gists, with local persistence and portable JSON supporting use without authentication. Missing information and uncertain forecasts must remain visible rather than becoming invented history.

## Solution

Build a vanilla HTML/CSS/JavaScript app hosted on GitHub Pages, with History, Calculations, Interface, and Storage modules in the browser. A small Cloudflare Worker provides GitHub authentication. Vehicle data remains in local IndexedDB and the user's Gist; the Worker needs no vehicle database.

Begin with vehicle selection/creation, followed by the selected vehicle's summary and drill-down into maintenance, tires, fueling, checks/inspections, and history. Entry starts with recognizable car actions: fuel up, change oil, change tires, other maintenance, check/inspect, or read the odometer. Every new action starts with blank date and odometer fields. Backfills, corrections, and removals recalculate affected outputs.

GitHub authentication and Gist load/save are primary first-version features. Automatically save locally, with explicit GitHub Load and Save actions. One app-managed secret Gist contains all vehicles in versioned JSON. Combine independent changes, ask about conflicts, and retain recoverable copies. Import/export uses that portable format.

Show forecasts with their evidence, dates, units, and limitations. Raw observations remain authoritative. Forecasts use explainable trends and configured thresholds, not inferred manufacturer schedules.

## User Stories

### Vehicles and navigation

1. As a vehicle owner, I want to select or create a vehicle on opening the app, so that I enter the correct vehicle's history.
2. As a vehicle owner, I want simple setup with a recognizable name, odometer units (km/mi), and fuel units (litres, US gallons, or Imperial gallons), so that I can enter familiar quantities without inventing identifying details.
3. As a vehicle owner, I want make, model, year, and notes hidden under Optional details during creation, so that I can add them when useful without a long initial form.
4. As a vehicle owner, I want separate histories and settings for multiple vehicles, so that their parts and forecasts are not mixed.
5. As a vehicle owner, I want a vehicle summary showing latest known mileage, upcoming maintenance, and missing evidence, so that I can see what needs attention.
6. As a vehicle owner, I want to drill into every summary area, so that I can inspect supporting history.
7. As a vehicle owner, I want phone entry and desktop review, so that I can work beside the car or at a computer.

### Historical entry and maintenance

8. As a vehicle owner, I want to choose a car action such as fueling, changing oil, changing tires, other maintenance, checking the car, or reading its odometer, so that the entry matches what I did.
9. As a vehicle owner, I want each new action's date and odometer to start blank and be entered independently, so that changing readings and dates are never copied from another record.
10. As a vehicle owner, I want the browser's native date picker and numeric odometer input, with explicit month/year precision available, so that ordinary entry is easy and approximate history stays honest.
11. As a vehicle owner, I want to enter events out of sequence, so that discovering old paperwork does not disrupt history.
12. As a vehicle owner, I want to start on a 15-year-old vehicle without prior records, so that I can begin with what I know.
13. As a vehicle owner, I want incomplete car-action records and a separate Mark missing records action in history, so that unknown facts stay unknown without making missing history a normal car action.
14. As a vehicle owner, I want to correct or remove mistaken records, so that affected totals and forecasts update.
15. As a vehicle owner, I want continuous multi-year item history, so that yearly recording does not reset long-lived parts.
16. As a vehicle owner, I want common maintenance-item choices and custom items per vehicle, so that I track applicable services and parts.
17. As a vehicle owner, I want specifications, part numbers, preferred brands, notes, and reference links, so that replacement information is available.
18. As a vehicle owner, I want service date, mileage when known, part used, and optional cost, so that DIY and mechanic work are documented.
19. As a vehicle owner, I want checks/inspections distinct from completed services, so that inspecting brakes or checking oil does not reset a replacement interval.
20. As a vehicle owner, I want distance/time/condition-based or history-only tracking, so that recording an item does not require forecasting it.

### Oil

21. As a vehicle owner, I want individual oil-change distances and historical statistics, so that I can see how long changes lasted.
22. As a vehicle owner, I want dated oil-life percentages and mileage, so that the app can estimate when the car will reach 0%.
23. As a vehicle owner, I want the car's actual 0% indication to remain the oil-change trigger, so that a generic schedule does not replace my practice.
24. As a vehicle owner, I want a labeled historical fallback when current readings are insufficient, so that previous intervals still help planning.
25. As a vehicle owner, I want low/normal/high oil-level observations with notes, so that level checks remain distinct from oil life.
26. As a vehicle owner, I want separate top-up litres, so that adding oil does not reset the oil-change interval.

### Tires

27. As a vehicle owner, I want individual tire identities, recognizable labels, brand/model, and set membership, so that history follows each tire.
28. As a vehicle owner, I want to assign an incoming set to four vehicle positions, so that seasonal swaps establish placement.
29. As a vehicle owner, I want rotations through the same position layout, so that I can record each tire's movement.
30. As a vehicle owner, I want time and distance at every position, so that I can relate use to wear.
31. As a vehicle owner, I want stored tires to accumulate zero driving distance, so that winter driving does not count against summer tires.
32. As a vehicle owner, I want a baseline for already-installed tires, so that unknown earlier mileage does not prevent tracking.
33. As a vehicle owner, I want eight tread readings per tire at inner/outer top/front/bottom/back, so that uneven wear is sampled.
34. As a vehicle owner, I want millimetres, 32nds, and thousandths of an inch, so that my gauge and old records can be used directly.
35. As a vehicle owner, I want partial tread sessions preserved, so that missing readings do not discard known measurements.
36. As a vehicle owner, I want edge averages and minima over time, so that uneven wear and changes following rotations are visible.
37. As a vehicle owner, I want remaining distance governed by the first edge forecast to reach my threshold, so that average depth does not conceal limiting wear.
38. As a vehicle owner, I want a separate whole-tire-average forecast, so that I can assess the estimated impact of uneven wear.
39. As a vehicle owner, I want calendar estimates based on that tire's seasonal use, so that off-vehicle periods are represented.
40. As a vehicle owner, I want older readings visible alongside recent-trend forecasts, so that I can inspect changes.

### Fueling and evidence

41. As a vehicle owner, I want Fuel up to record date, quantity in my chosen fuel units, and mileage when known, so that incomplete receipts remain useful and older units remain unchanged when I change vehicle setup.
42. As a vehicle owner, I want full/partial/unknown tank status, so that consumption can be measured between full tanks.
43. As a vehicle owner, I want all event types to supply mileage evidence, so that maintenance readings also help fueling calculations.
44. As a vehicle owner, I want missing fueling mileage interpolated between suitable recorded readings, so that incomplete history can support estimates.
45. As a vehicle owner, I want recorded and derived mileage distinguished, so that inferred values are not mistaken for measurements.
46. As a vehicle owner, I want recent and overall km/L and L/100 km, so that mental calculations and familiar comparisons are available.
47. As a vehicle owner, I want optional MPG with US/Imperial gallons identified, so that units are unambiguous.
48. As a vehicle owner, I want litres added multiplied by recent km/L, so that I can estimate distance represented by the added fuel.
49. As a vehicle owner, I want supporting dates, sample counts, estimate labels, and unavailable reasons, so that I understand the evidence.
50. As a vehicle owner, I want threshold reached, insufficient evidence, and unusable wear trends distinguished, so that missing evidence does not suggest unlimited life.

### Persistence and authentication

51. As a local user, I want automatic IndexedDB saves without an account, so that recorded history survives ordinary app revisits.
52. As a local user, I want storage failures visible, so that unsaved work is not reported as durable.
53. As a vehicle owner, I want complete JSON exports, so that I can back up or move my collection independently of GitHub.
54. As a vehicle owner, I want import previews of additions and conflicts, so that I understand changes before applying them.
55. As a vehicle owner, I want repeated imports to recognize existing record identities, so that history is not duplicated.
56. As a vehicle owner, I want full replacement to be separate and recoverable, so that restoring a file does not silently destroy work.
57. As a GitHub user, I want normal GitHub sign-in, so that I do not have to create and paste a personal token.
58. As a GitHub user, I want one secret Gist containing all vehicles, so that phone and desktop can use the same collection.
59. As a GitHub user, I want explicit Load/Save and separate local/GitHub status, so that I know which changes another device can access.
60. As a GitHub user, I want independent device changes combined, so that a fueling on one device does not erase maintenance on another.
61. As a GitHub user, I want conflicting edits and edit/delete conflicts shown for my choice, so that I control the resulting history.
62. As a GitHub user, I want local work preserved through conflicts and request failures, so that recovery remains possible.
63. As a GitHub user, I want expired/revoked access to prompt sign-in without losing data, so that auth failure does not cause data loss.
64. As a GitHub user, I want credentials excluded from collections and exports, so that backups do not share account access.
65. As a GitHub user, I want session-only access while vehicle data remains local, so that sign-in and data persistence are separate.
66. As a GitHub user, I want account/Gist changes to identify the selected collection, so that histories are not silently mixed.

### Project delivery

67. As a project maintainer, I want guided Cloudflare and GitHub application setup during implementation, so that the authentication endpoint can be configured and verified.
68. As a project maintainer, I want reproducible examples and behavior tests at public module interfaces, so that future changes preserve agreed results.

### Vehicle management refinements

69. As a vehicle owner, I want to rename a car while keeping its stable identity and all linked history, so that its display name can change safely.
70. As a vehicle owner, I want to delete a car and its associated history after a clear confirmation, so that an unwanted car can be removed without affecting other vehicles.

## Implementation Decisions

### 1. Scope and current state

The original planning baseline was a small browser scaffold. Tickets 01 and 02 now provide local vehicles, dated car-action history, stable IDs, IndexedDB persistence and browser/module tests. Detailed maintenance items, oil forecasts, individual tires, fuel economy, portable transfer and GitHub integration remain subsequent slices; basic oil/tire/fueling entry does not complete those tickets.

Owner refinements from 2026-11-21 supersede the earlier shared-default and generic-entry design. During this early development stage, a new data version may clear development data instead of implementing migration. Document any reset in the release; migration is optional, not a blocker. This exception does not authorize clearing data because of ordinary read/write failures or incompatible imported/remote files.

Keep the product runtime vanilla HTML/CSS/JavaScript. Development/test tooling may be added without introducing a frontend framework. GitHub Pages hosts the frontend; Cloudflare hosts authentication only. Local persistence, portable JSON, and authenticated Gist access all belong to the first version.

### 2. Module interfaces

| Module | Public interface responsibilities | Required behavior |
| --- | --- | --- |
| History | Create/read/update/remove vehicles, items, tires, sets, factual events, and gap annotations; validate candidate changes/collections. | Stable identity, valid references, explicit unknowns, chronology independent of entry order, and valid tire placement. Invalid operations return actionable errors without partial mutation. |
| Calculations | Accept history, units, thresholds, and explicit evaluation inputs; return summaries, periods, forecasts, and evidence. | Deterministic outputs without DOM, persistence, network, or implicit wall-clock dependencies. Report partial/estimated/unavailable results instead of inventing facts. |
| Interface | Present selection, summaries, details, dated entry, validation, conflicts, and save/auth status; coordinate actions through module interfaces. | Keep domain/calculation rules out of screen handlers. Preserve input on failure and distinguish local durability from GitHub success. |
| Storage | Persist/retrieve local collections and baselines; validate/serialize portable data; plan/apply imports and merges; discover/load/save the selected Gist. | Keep credentials outside collections. Load/import cannot silently discard work. Storage/network failures preserve recoverable state and report outcomes. |

The Worker has a separate narrow HTTP interface for the authorization-code exchange. It does not own history, calculate forecasts, or coordinate Gist writes.

Keep public interfaces small and testable through complete behaviors. Local storage and Gist requests are real variable dependencies; isolate them where controlled failures are needed. Avoid adding pass-through modules solely for test structure.

### 3. Data model and invariants

Use one portable collection with an application format identifier, schema version, and stable collection identity. Exact field spelling is an implementation choice; these semantic records and relationships are required:

| Record | Information to preserve |
| --- | --- |
| Vehicle | Stable Base36 timestamp ID, recognizable name, odometer units and fuel units; optional make/model/year and notes. Mileage is a dated reading, not required at creation. |
| Maintenance item | Stable ID and owning vehicle; name/category; specifications, compatible parts, preferred brand, notes/links; tracking method and configured intervals/thresholds. |
| Tire and set | Stable individual/set IDs, recognizable labels, brand/model and membership; seasonal identity where applicable. Identity survives position changes. |
| Factual event | Stable ID, owning vehicle and applicable item/tire references, kind, date/precision, known odometer/units, notes, and kind-specific values. |
| Service/inspection | Item, action performed, part used, optional cost; qualifying completed service is distinct from inspection. |
| Oil observation/top-up | Oil-life percentage, oil-level status/notes, or added litres as distinct facts. Oil change is its own completed service. |
| Tire movement/baseline | Complete tire-to-position assignments with known date/mileage; distinguish installation/removal/rotation from initial observed placement. Seasonal periods are distinct from position periods. |
| Tread session | Tire, date, mileage evidence, depth units, and up to eight named samples: inner/outer at top/front/bottom/back. |
| Fueling | Date, fuel quantity and original units when known, odometer when known, full/partial/unknown tank status. |
| Missing-record annotation | Affected history type and span, allowing dependent calculations to be withheld without pretending that a car action occurred. |
| Edit/deletion metadata | Stable identity and sufficient change/deletion information for reconciliation. Edit time differs from event date. |

New vehicle IDs use the creation timestamp in milliseconds converted to Base36, assigned once and preserved on rename. Increment the timestamp value if it collides with a live or deleted ID in the current collection. Preserve existing IDs, including earlier UUID vehicle IDs, when retaining data. Other record identities remain globally unique. Timestamp IDs do not guarantee cross-device uniqueness: merging must surface conflicting same-ID vehicles and preserve both histories for resolution, never silently combine unrelated cars. Equal names/dates alone do not establish identity. Retain deletion markers; deleting a vehicle removes its associated records and marks each deletion without affecting other vehicles.

Keep local account/Gist association, remote revision/baseline, pending state, and recovery snapshots separate from portable records. Exclude credentials and authorization state from vehicle JSON, exports, imports, and Gists. Derived caches are disposable; raw history and settings are authoritative.

Validate types, references, units, and numeric domains before committing changes. Odometers/depths are nonnegative; percentages are within 0–100; added fuel/oil quantities are positive when known. Missing is distinct from zero. Preserve useful partial history. Contradictory chronology remains inspectable and invalidates dependent calculations rather than silently rewriting readings.

A tire cannot occupy two active positions, and a position cannot contain two tires. Apply complete rotation/swap assignments atomically so valid exchanges are not rejected by an intermediate collision. Imported contradictory placements stay pending review.

Optional cost is descriptive; no spending-analysis feature is required. Item documentation is text and reference links, not binary attachment storage.

### 4. Dates, mileage, and units

Accept exact calendar dates and explicit month/year precision. Treat approximate dates as bounded ranges, not invented first-of-month/year observations. Order by recorded evidence, not creation time. Consistent odometer order may resolve chronology; ambiguous overlapping ranges or contradictory readings make affected calculations unavailable.

Each new car-action record starts with blank date and odometer fields, even when another record is open. Exact-date fields use native HTML type=date; odometer fields use type=number. Month/year precision is explicitly selectable. The selected vehicle and its unit settings may initialize ownership/units; date and mileage are actual event facts, not setup defaults. Changing one saved record does not silently change its siblings.

Build the vehicle mileage timeline from every event type. Maintenance without fueling information supplies mileage evidence, not a fill-up or fuel-history gap. Do not copy a separate same-day event's mileage automatically. Shared entry values become facts only when actually supplied or accepted by the user.

For a missing fueling mileage at exact date t, interpolate from the nearest suitable surrounding recorded points (t0, m0) and (t1, m1):
estimated mileage = m0 + (m1 − m0) × (t − t0) / (t1 − t0).
Require t0 < t < t1, consistent chronology, and no unexplained odometer decrease. Use recorded points, not derived points, as anchors. Do not extrapolate.

Keep recorded mileage unknown; label the derived value and dependent economy figures estimated. Approximate dates may yield a defensible range; otherwise withhold a point estimate. Conflicts and known gaps cannot be bridged silently.

Vehicles display miles or kilometres. Vehicle fuel units offer litres (initial selection), US gallons, and Imperial gallons, distinctly labelled. Each fueling retains its entered quantity and unit; changing setup affects new entries only. Normalize fuel quantities to litres for the economy formulas below. Oil top-ups use litres. Depth entry supports millimetres, counts of 32nds of an inch, and counts of thousandths of an inch when tread entry is implemented. Keep units next to their relevant car measurement rather than introducing unrelated setup fields. Retain original inputs/units and normalize for calculations. Exact conversions: 1 mile = 1.609344 km; 1 inch = 25.4 mm; N/32 inch = N × 25.4/32 mm; N thousandths = N × 0.0254 mm. Round displays only, not stored observations or intermediate arithmetic.

### 5. Interaction and configurable maintenance

Start at vehicle selection/creation. The vehicle home shows latest known mileage with date and supporting history, adding maintenance, tire and fueling summaries as their slices ship. Every available summary area leads to working details. Setup shows name, odometer units and fuel units; make/model/year/notes sit inside native Optional details, collapsed on creation and expanded on edit. Open the disclosure before focusing an invalid optional field. Keep stable IDs in the background. Offer confirmed deletion while editing an existing vehicle. Omit owner/contact information.

Dated entry supports completed work, inspections, oil changes, oil life, oil level, top-ups, tire movements/measurements, fueling, and standalone odometers. Support historical backfill and absent optional facts. Allow inspection/edit/removal with effects on history and pending changes visible.

Provide common choices and custom maintenance items. Starter choices cover engine/cabin/oil/fuel filters, applicable fluids, brakes, spark plugs, belts, wipers, batteries, and bulbs. These are choices, not assertions that every vehicle has them.

Tracking may use distance, elapsed time, measured condition, a relevant combination, or history only. Intervals/thresholds are user-configured; no universal service or tread-depth threshold is assumed. Tire-set defaults may prefill a tire setting, but its effective threshold must be visible.

Next due mileage/date is the last qualifying completed service plus the configured interval. Either threshold can make a combined distance/time schedule due. Inspections and calendar-year boundaries do not restart intervals. Unknown service facts leave dependent due estimates unknown. Preserve continuous multi-year history.

Inputs and results require labels, units, keyboard access, and understandable validation. Phone entry and desktop review both work. Apply purposeful-web-design during actual layout/CSS implementation, with a purpose/verification ledger for elements and styles. This specification sets workflows, not a fixed mockup.

### 6. Oil history and forecasts

The vehicle's actual 0% oil-life indication determines the user's oil change. Show distances between consecutive known oil changes, excluding known missing-change spans, together with individual intervals, their median, and sample count.

Oil-life percentage is distinct from oil level. Oil-level checks use low/normal/high with notes; top-up litres are separate. Neither resets the change interval. Do not infer a change or a 100% reset from a top-up or an unexplained upward reading.

Fit usable percentage readings in the current oil-change interval against odometer using ordinary least squares. Require two distinct mileage values. For declining slope b and latest percentage p, remaining distance at that reading = max(0, p / −b); due odometer = that reading's odometer + remaining distance. Show support and flag two-reading estimates as limited. Recorded 0% indicates due without requiring a fit.

If tracking starts mid-interval, preserve observations without inventing the prior change. A current-segment fit is usable only where observations belong to one continuous oil interval without an unresolved reset or gap; identify its coverage. Unknown boundaries cannot be repaired by guessing a service.

If no usable current fit exists, use last known oil-change odometer + median completed interval distance as a labeled historical fallback, with its sample count. Without known last-change mileage, show statistics without an invented fallback due odometer. Actual 0% overrides a longer historical estimate.

For vehicle calendar estimates, use the positive driving rate between the latest two suitable unambiguous recorded odometers at distinct dates. Apply it to remaining distance as of the latest supported mileage/date and show the basis. Do not silently extend old history to an assumed present odometer. Unsuitable dates or nonpositive rate mean no calendar estimate. The actual oil-life reading remains the trigger.

### 7. Tire history and forecasts

Each tire retains identity, brand/model, measurements, and position history. Change tires expands into a seasonal swap that selects the incoming set and assigns individuals to front-left/front-right/rear-left/rear-right. One complete swap/rotation is a single action with its own explicitly entered date/mileage; separate tread measurements start blank. Rotations use that position layout. Earlier simple tire-change notes must not fabricate individual tire placements.

Sum known installed odometer differences for distance at each position. Rotation changes position periods, retaining accumulated distance. Off-vehicle distance is zero; unknown spans remain unknown. Time at position respects date precision and may be a range.

Already-installed tires can begin with an observed placement baseline. Distance since that baseline may support forecasts without implying original installation or known lifetime mileage. Do not fit across unknown movement spans. Complete seasonal-use periods are distinct from position periods and include any rotations.

Top/front/bottom/back are within-session sample labels, not repeatable physical points. Require four readings to compute a comparable edge mean/minimum and eight for a whole-tire mean. Preserve incomplete sessions and show their raw readings without treating them as complete samples.

Fit inner-minimum, outer-minimum, and whole-mean trends independently using the latest three usable sessions, or two if only two exist. Use actual known distance on the tire, not total vehicle mileage. Require two distinct distance values. Ordinary least squares uses:
b = Σ((x − mean(x)) × (y − mean(y))) / Σ((x − mean(x))²).

For declining depth slope b, latest usable depth d at installed distance x, and threshold h:
projected installed-distance crossing = x + max(0, (d − h) / −b).
Normalize all projected crossings to the same latest supported installed-distance reference before comparing remaining distances; source sessions can differ. Show each series' source date/coverage. Do not subtract invented present driving.

The earliest supported edge crossing governs limiting wear; the whole-mean crossing is a separate comparison. If an edge is unavailable, report partial coverage rather than claiming the tire's complete earliest crossing. A valid actual depth at/below threshold shows an observed crossing even if a session/fit is incomplete. Distinguish observed and projected crossings.

Flat/increasing depth trends yield no usable wear-rate estimate, not infinite life. Retain readings and explain the result. Older history stays visible. The whole-mean versus limiting-edge difference estimates uneven-wear impact; it does not diagnose camber, guarantee avoiding repairs, or promise rotations recover that distance.

Remaining installed mileage is primary. Require two complete recorded seasons of the same type with known installed distances for seasons remaining; divide remaining distance by median distance per complete season. Convert to approximate years only when dated history establishes recurrence. Do not use the car's annual rate for stored tires or invent future swap dates. Unknown prior mileage prevents total-lifetime mileage, but not necessarily remaining-distance estimates from a known segment.

### 8. Fuel economy

A full-to-full period begins immediately after a confirmed full fill and ends immediately after the next. Consumed fuel is all litres added after the opening fill through the closing fill, including intermediate partial/unknown-status additions. Exclude the opening fill's litres. Only confirmed full fills serve as endpoints.

Intermediate fuelings need no mileage when their order/litres are established. Mileage-only maintenance supplies timeline evidence, not tank endpoints. Missing fuelings or unknown consumed quantities invalidate the affected period. Unknown litres at the opening full fill do not invalidate its baseline role, because that quantity is excluded; unknown closing litres do. After a gap, a later confirmed full fill can establish a fresh baseline.

Distance is closing minus opening mileage. Accepted interpolation may supply missing endpoints, with dependent results labeled estimated. Never resolve chronology using entry order.

Show overall recorded economy across usable non-overlapping periods, and recent economy across the last three usable full-to-full periods (fewer when fewer exist). Divide sums of distance and fuel, not unweighted period ratios. Show dates/count and excluded gaps; overall does not imply unrecorded lifetime history.

Display km/L prominently alongside L/100 km. For positive totals: km/L = total km / total litres; L/100 km = 100 × total litres / total km. Optional MPG identifies US/Imperial gallons. Any estimated distance makes its dependent average estimated. Unusable zero/negative totals produce an explanation, not division-by-zero output.

Added-fuel distance = added litres × recent km/L, with the supporting window and evidence label. It is distance represented by added fuel, not total tank range; remaining tank contents are unknown.

### 9. Persistence, imports, and reconciliation

Autosave valid recorded changes in IndexedDB, retaining working history, pending changes, the remote baseline, and recovery copies. Report local success only after the transaction succeeds. On denial/quota/failure, preserve in-memory work/input where possible, show failure, and permit export. Browser persistence may be requested; eviction or clearing remains possible.

One app-managed secret Gist contains a recognizable versioned JSON document with all vehicles. Secret means unlisted but URL-readable, as accepted for intended non-personal data. Authenticate, paginate discovery, validate ownership/format, remember selection by numeric account identity, and ask if multiple matching Gists exist. Create only on explicit Save when no Gist is selected; a failed load must not silently create a replacement.

Load and Save preserve local work. Before saving, fetch the latest remote collection and reconcile against the shared baseline by stable record ID:

- Unchanged on one side, changed on the other: retain the change.
- Independent additions or changes to different records: combine.
- Identical changes to a record: retain one result.
- Different changes to the same record, including edit/delete: show versions and require a choice.
- No shared ancestry: do not infer deletion from absence; preview additions and review differing versions of existing IDs.

Validate the candidate through History before applying. Preserve versions during resolution. Retained deletion information distinguishes deletion from absence in older files. Do not resolve by last-edit timestamp or guess identity from labels.

Track the snapshot actually sent by an in-flight save. Its success does not mark later edits saved; those remain pending. On uncertain outcomes preserve local work and inspect remote state before retrying or creating anything. Serialize one client's requests and honor rate-limit/retry guidance.

The user accepts the race in nearly simultaneous device saves: Gist writes lack documented atomic compare-and-swap. Pre-save merging, local recovery copies, and Gist history reduce loss and support recovery, but are not an atomic cross-device guarantee. The authentication Worker does not coordinate saves.

Exports preserve format/version, IDs, settings, units, date precision, and deletion information. Import app-exported JSON, validate fully, preview additions/conflicts, and merge by default. Reimport is idempotent by ID. Full replacement is separate and first retains a recovery copy; abort if that cannot succeed. Invalid references, malformed data, or unsupported newer versions cannot overwrite history. Support only the schema versions explicitly implemented; migration of early development versions is optional under the owner's reset allowance above. Arbitrary spreadsheets and the scaffold's incomplete draft format are not assumed compatible.

Expired/revoked auth, failed networking, wrong account, missing Gist, malformed data, and truncated responses must not clear history or silently overwrite remote data. Fetch complete supported content or refuse; never treat truncated content as complete. Keep credentials off arbitrary URLs found in imports. Account/Gist changes explicitly select collection/baseline and cannot silently upload another account's work.

### 10. GitHub sign-in and Cloudflare contract

Use a registered GitHub OAuth application with a Cloudflare Worker for authorization-code exchange. Request Gist access without repository scopes. The frontend performs authorized Gist REST requests directly. The Worker calls fixed GitHub auth endpoints, not user-supplied proxy targets.

Generate unpredictable state and an S256 PKCE challenge/verifier in the browser. Start GitHub authorization using the registered callback. Validate returned state before sending the code/verifier through the Worker. Configure client identity, exact callback, and allowed frontend origin; keep the client secret in a Cloudflare secret binding. Validate method, input, and allowed origin; return controlled errors. Origin checking does not replace state/PKCE validation. Keep tokens/secrets out of redirect URLs, logs, and vehicle records.

The Worker returns the required token result over HTTPS. It has no vehicle database, synchronization coordinator, or general-purpose cross-origin proxy. Origin matching is scheme/host/port, not the project URL path. Render imported notes as untrusted text and validate reference links.

Sign-in is session-only, without remember-me. Keep credentials and temporary state/verifier in session-scoped browser handling, separate from vehicle persistence; the app must not establish a durable login across browser sessions. Clear credentials on sign-out and reauthenticate on expiry/revocation. New sessions require sign-in while local history remains available. Do not persist access/refresh tokens in IndexedDB/localStorage. Ending local sign-in differs from revoking the GitHub grant. Verify the chosen session mechanism's reload, close/reopen, and sign-out behavior during implementation; do not promise that browser-session cleanup revokes the GitHub authorization itself.

The existing Pages origin is shared with other projects on the same host. Storage namespaces prevent collisions, not same-origin script access. A separate IndexedDB store or session storage is not a secure enclave. A dedicated domain was not selected and is not required.

### 11. Setup obligations

Implementing this specification includes guided Cloudflare account access/creation, Worker configuration, GitHub application registration, callback/secret configuration, deployment, and verification from the actual frontend origin. Only executing that setup during wayfinder was excluded; setup is part of the first-version project.

Prepare reproducible configuration and use the wizard skill for human-only verification/authorization steps. Automate other setup where possible. Keep credentials outside committed artifacts; retain public deployment values in project configuration. Revalidate provider requirements against current official documentation during setup. This specification-writing task creates no accounts, credentials, apps, or deployments.

## Testing Decisions

### Public interfaces and prior art

The scaffold has no current test suite or established test seam. The user approved testing the public interfaces using the same operations/results the UI consumes: history operations, known input/output forecast examples, storage/JSON/GitHub/Worker interfaces, and a small set of phone/desktop browser workflows. This confirms the testing approach below.

- **History:** exercise complete record operations, validation, and resulting history, including atomic tire assignments. Do not assert private helper calls or mirror internal mutation steps.
- **Calculations:** use factual histories with independently computed expected summaries, forecasts, evidence labels, and unavailable reasons. Avoid DOM/network/wall-clock dependencies. Verify recalculation after backfills and corrections.
- **Storage:** test round trips, preview/apply, baseline-aware merge, conflicts/deletions, durability, and failures through its public interface. Use actual IndexedDB in browser integration tests and controlled remote responses for Gist failure/race scenarios.
- **Worker authentication:** exercise HTTP behavior with controlled GitHub responses, invalid method/input/origin and exchange failures, and credential separation. Verify browser state/PKCE handling at its public login workflow. Real login from the deployed origin remains required; simulated responses alone do not prove it works.
- **Browser:** cover a small set of complete selection/create, multi-record entry, tire movement/measurement, fueling, import/export, and save/conflict workflows. Check representative phone/desktop layouts, keyboard access, labels, and status changes.

Use the highest meaningful interface for each behavior. Focused numerical tests supply precise feedback; browser tests verify journeys and persistence wiring without repeating every arithmetic branch. Choose a compatible harness during implementation; no testing framework is established by the current scaffold.

### Acceptance examples and edge cases

| Scenario | Expected observable result |
| --- | --- |
| Create a 15-year-old vehicle with no mileage or previous service records. | Name/units suffice; prior history stays unknown and future observations establish a baseline. |
| Rename a vehicle, then reopen it. | The Base36 timestamp ID and linked history remain unchanged; same-millisecond local creations receive distinct IDs. |
| Delete a vehicle with fueling and maintenance history. | Confirmation identifies the car and its history; Cancel preserves it; confirmed deletion leaves other vehicles untouched and retains deletion markers. |
| Add an oil change after entering another car action. | Its native date and numeric odometer inputs are blank, with no copied date or mileage. |
| Change setup from US gallons to litres after saving a fill-up. | The older fill-up retains its US-gallon quantity; only new entry units follow the new preference. |
| Create a car without optional identifying details. | Optional details stays collapsed; native keyboard expansion reveals make/model/year/notes, and invalid hidden fields reopen for correction. |
| Insert/correct an old service or tire movement. | Recompute chronology, installed distance, and forecasts; entry time does not determine order. |
| Approximate dates overlap ambiguously. | Preserve precision and show ranges/unavailable reasons rather than invented dates/order. |
| Add an inspection, oil-level check, or top-up. | History grows without resetting the replacement/oil-change interval. |
| Oil life is 80% at 100,000 km and 40% at 104,000 km. | Slope −0.01 percentage points/km; 4,000 km remain at that reading; 0% projects at 108,000 km, with limited-evidence label. |
| Oil life is recorded as 0% without enough points to fit. | Show the observed due state. |
| Current oil fit is unavailable; last-change mileage may also be unknown. | Use historical fallback only with its necessary baseline; otherwise show history without an invented due odometer. |
| Summer tires are removed while the car drives through winter. | Removed tires accumulate zero winter distance; unknown movement spans stay unknown. |
| Rotate four tires in one entry. | Apply valid complete assignments atomically without duplicate active placement or lost accumulated distance. |
| Inner minima are 6, 5, 4 mm at installed distances 0, 10,000, 20,000 km. | With an illustrative user-chosen 2 mm threshold: slope −0.0001 mm/km and 20,000 km remaining at the latest sample. This is not a default threshold. |
| Enter 4/32 inch, 125 thousandths, and 3.175 mm. | Values normalize equally while retaining original inputs/units. |
| One edge has three readings and the other four. | Retain all inputs; only the complete edge has comparable statistics; no complete whole-tire mean. Actual threshold crossings remain visible. |
| Depth is flat/increasing, or only one distinct mileage exists. | Explain why no usable wear-rate forecast exists; do not display unlimited life. |
| Edge and whole-mean series have different latest complete sessions. | Compare projected crossings at a common supported installed-distance reference and show coverage/source dates. |
| One versus two complete same-type seasons are available. | One cannot produce seasons remaining; two may support a labeled estimate. Rotations do not create seasons. |
| Full at 100,000 km, intermediate 20 L partial without mileage, then 30 L to full at 100,600 km. | 50 L over 600 km gives 12 km/L and about 8.33 L/100 km; opening-fill litres are excluded. |
| Maintenance mileage is recorded inside that fueling period. | It supplies timeline evidence without adding fuel or breaking the period. |
| Odometers are 100,000 km on day 0 and 100,600 km on day 30; fueling is on day 10. | Derived mileage 100,200 km; recorded mileage stays unknown and dependent figures are estimated. |
| A known fueling or consumed quantity is missing. | Exclude the affected period, not treat unknown as zero; a later full fill can establish a new baseline. |
| Usable periods cover 600 km/50 L and 100 km/20 L. | Combined economy is 700/70 = 10 km/L, not the unweighted mean of 12 and 5. |
| Add 25 L with recent economy 12 km/L. | Approximately 300 km represented by added fuel, not total tank range. |
| Local save fails or import data is invalid. | No false saved state, destructive partial import, or loss of recoverable work. |
| Import the same app JSON twice. | Existing IDs are recognized; no duplicate records. |
| Phone adds fueling and desktop adds a filter replacement. | Merge independent additions against the baseline. |
| Devices change one record differently or edit versus delete. | Show a conflict and preserve versions until the user's choice. |
| New edits occur during a GitHub save. | Only the sent snapshot is marked saved; later edits stay pending. |
| Save outcome is uncertain or auth expires. | Keep local work; inspect remote state or request sign-in rather than creating/overwriting silently. |
| Gist account differs, content is truncated, or schema is unsupported. | Validate/fetch complete supported data or refuse without replacing history. |
| Sign out and reopen. | Local history remains; a new GitHub session is needed; exports never contain credentials. |

### Release verification

Completion requires passing behavior tests, usable main workflows on phone/desktop, and real authorization plus Gist discovery/create/load/update verified from the deployed frontend against intentionally designated test data. Check revoked/expired access, storage failure, approximate dates, known gaps, conflict review, in-flight edits, and recovery. Document the accepted simultaneous-save limitation without claiming atomic protection.

Verify rendered layout and accessibility against user tasks using purposeful-web-design. Test consequential behavior/failures, not every reversible cosmetic edit or internal implementation step. Preserve evidence of real deployed checks: creating an account or obtaining a token is not sufficient proof of end-to-end load/save.

## Out of Scope

- Implementing/provisioning during this specification-writing task. The eventual implementation includes guided authentication setup.
- Comparing retired and current tire sets as a first-version feature; retaining individual tire history remains required.
- Repair-shop/fleet workflows, shared multi-user editing roles, and centralized vehicle-data hosting.
- Automatic GitHub synchronization or an atomic multi-device write coordinator. Local autosave and explicit cloud actions are required.
- Persistent remembered sign-in, Azure hosting, browser-only OAuth experiments as the primary flow, and mandatory personal-token entry.
- Encrypted/private cloud storage or personal-information management; secret Gist visibility is the accepted model.
- Manufacturer schedule lookup, universal replacement thresholds, mechanical diagnosis, or guaranteed avoidance of suspension work.
- Arbitrary spreadsheet/receipt parsing, binary attachments, and assumed migration of the scaffold's incomplete draft format.
- Push notifications, live telemetry, total tank-range estimation, and automatic oil-consumption forecasting.

## Further Notes

### Publication and provenance

Published to the repository's local Markdown tracker as ready-for-agent. Closed wayfinder records are decision tickets, not completed implementation tasks. The next phase is /to-tickets: create fresh deliverable tickets and dependencies rather than repurposing the closed decision records.

The [wayfinder map](map.md) indexes the decisions; the [domain glossary](../../GLOSSARY.md) defines vocabulary. Provenance remains in the [purpose](issues/01-purpose-and-forecasts.md), [architecture](issues/02-architecture.md), [interaction](issues/03-user-interactions.md), [storage](issues/04-storage.md), and [calculation](issues/05-forecast-rules.md) decisions. The [setup scope record](issues/07-cloudflare-setup.md) was closed because execution belonged after planning, not because setup was completed or removed from the project.

The [platform research](research/github-and-local-storage.md) supplies cited constraints and the Keyboard Layout Editor comparison. Its [published branch](https://github.com/jpconstantineau/CarMaintenanceTracker/tree/research/github-and-local-storage) is a research artifact, not an implementation branch to merge. Primary references include [GitHub OAuth authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [Gist endpoints](https://docs.github.com/en/rest/gists/gists), [conditional-request limits](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api#use-conditional-requests), and [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/). Revalidate platform behavior during setup.

### Synthesis clarifications

The contract explicitly distinguishes optional fueling mileage from missing consumed litres; initial tire placement from original installation; partial current oil history from invented prior changes; and model source dates from a shared comparison reference. It also makes import validation precede replacement and ties save success to the actual transmitted snapshot. These are consistency rules supporting the agreed behavior.

Module filenames, internal field spelling, test-runner choice, exact visual styling, and deployed Worker/application names are implementation choices within these contracts. The user explicitly approved the testing-interface approach during specification review.
