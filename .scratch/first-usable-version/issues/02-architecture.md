# Define the app's architecture and calculation responsibilities

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Parent: ../map.md
Blocked by: 01

## Question

How should the vanilla browser app organize its modules, factual history, and derived calculations so vehicle history, tire position mileage, and forecasts remain consistent when records are added or corrected?

Cover responsibilities and module interfaces; forecast calculation rules and insufficient-data behavior; nonrepeatable tread sample positions; separation of observed history from estimates; and the architectural role of persistence. Leave screen workflows and detailed GitHub Gist storage decisions for the later discussions requested by the user.

## Comments

### Agreed module structure and storage capabilities

- The user accepted browser-side calculations and four modules: History, Calculations, Interface, and Storage.
- History manages vehicles, individual tires, maintenance, measurements, tire movements, and validation of their relationships.
- Calculations derives installed mileage, time at each position, oil-change statistics, wear trends, and forecasts.
- Interface presents the information and handles user actions.
- Storage isolates persistence details from the other modules.
- Include JSON import/export and local persistence so the app can be used without authentication.
- Authenticated GitHub users can additionally load and save data in their own Gists. GitHub authentication is optional for using the app.
- localStorage versus IndexedDB, import behavior, local save behavior, and Gist access/conflict handling remain for the later interaction and storage discussions.

### Recorded facts and primary GitHub support

- The user confirmed that dated records are authoritative and that derived totals and forecasts must be recalculated when records change.
- GitHub authentication and loading/saving the user's own Gists are primary first-version requirements, not deferred work. Optional authentication means an account is not required for local/JSON use; it does not reduce the priority of GitHub support.
- Multiple vehicles are required. Include documentation of consumable information and replacement history, explicitly engine air filters and cabin air filters. Further consumable categories are under discussion.

### Configurable maintenance items

- The user accepted common maintenance-item choices plus custom items configured separately for each vehicle.
- Retain item information (specifications, compatible part numbers, preferred brand, notes, reference links) alongside service history (date, odometer reading, part used, optional cost).
- Support distance/time intervals, measured condition, and history-only tracking as applicable; forecasting is not required for every recorded item.
- Use specialized calculations for oil life and tires, with a shared record structure for other maintenance items.
- Suggested common categories include filters, fluids, brakes, ignition, belts, and other replacement items. Seed the starter choices from the discussed examples, including engine and cabin air filters; exact catalog wording is an implementation detail. Do not assume a suggested item is fitted to every vehicle or automatically assign a universal service interval.

### Forecast methods and incomplete history

- The user accepted straightforward, explainable trends with visible supporting readings.
- For oil, estimate remaining distance from the decline in oil-life percentage during the current oil-change interval. With insufficient readings, use the median distance of completed intervals as an explicitly historical estimate. If the last oil-change mileage is unknown, a historical interval length alone cannot establish a due odometer reading.
- For tires, use tread loss per distance actually driven on that tire, with separate limiting-area and whole-tire-average forecasts. Do not treat named sample locations as identical physical points between sessions. Detailed trend fitting and sample sufficiency rules still need specification before implementation.
- For other maintenance items, apply the configured distance/time interval from the last qualifying service.
- Show that an estimate is unavailable when the evidence does not support it.
- The user explicitly expects incomplete historical records, including tracking that begins on a 15-year-old vehicle with no prior history. Do not infer unrecorded services, original installation dates, or lifetime mileage of parts from the vehicle's age or odometer.
- Accept known observations and events while keeping missing facts unknown. Dependent totals and forecasts may be unavailable, or identified as estimates when explicit assumptions support them.
- Recording may occur approximately yearly, and individual maintenance items can span multiple years. Calendar-year boundaries must not reset an item's service history.

### Date precision, chronology, and observations

- The user accepted exact dates when known and explicit month/year precision for approximate historical dates, with uncertainty reflected in duration calculations and calendar forecasts.
- Events may be entered out of sequence. Entry order must not be treated as event chronology; adding or correcting historical events updates affected derived values. Where approximate dates leave chronology unresolved, do not silently invent an exact order.
- The user accepted separate observations/inspections and completed maintenance. Only the relevant completed service starts a new service interval. Tire rotations change the position period while retaining lifetime accumulated mileage.
- The user identified oil levels as a useful observation. Oil-level readings and oil-life percentages are distinct; recording either observation does not itself establish an oil change. The entry format for oil-level observations remains an interaction decision.

## Answer

Use four browser-side modules: History owns factual records and their relationships; Calculations derives mileage, durations, service statistics, and forecasts; Interface presents information and handles user actions; Storage handles local persistence, JSON files, and GitHub Gists. GitHub authentication and Gist loading/saving are primary first-version capabilities alongside unauthenticated local/JSON use.

Each vehicle has common or custom maintenance items with documentation and service history. Oil and tires receive specialized calculations. Dated facts are authoritative; adding, correcting, or backfilling records recalculates affected outputs. Accept incomplete history, tracking that begins late in a vehicle's life, and explicit date precision. Do not invent unknown past services or interpret recording order as chronology.

Separate observations from completed services, including oil-level readings versus oil-life readings. Preserve continuous multi-year history; an inspection does not reset a replacement interval, and a tire rotation does not reset accumulated tire mileage.

Initial forecasting uses explainable trends and explicitly identified historical estimates as described above, with unavailable estimates when evidence is insufficient. Exact fitting, date-uncertainty handling, and sample sufficiency rules require the separate forecast-rules decision. User workflows and storage mechanics follow as their own decisions.
