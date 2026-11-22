# Define vehicle and maintenance entry workflows

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Parent: ../map.md
Blocked by: 02

## Question

How should a user navigate multiple vehicles, enter and correct current or historical maintenance and observations, record tire swaps and rotations, maintain item documentation, and understand forecasts and missing data?

Include annual catch-up and quick entries, exact and approximate dates, out-of-sequence events, eight-reading tire sessions, oil-life and oil-level observations, and clear access to local/JSON/Gist storage actions. Use purposeful-web-design for layout decisions. Detailed persistence mechanics belong in the storage decision.

## Comments

### Vehicle navigation and dated entry sessions

- The starting screen is for selecting an existing vehicle or creating a new vehicle.
- Selecting a vehicle opens that vehicle's home page with a summary: latest known mileage, upcoming maintenance, and indications of insufficient information. Each vehicle area supports drilling into its details.
- The user accepted a dated entry session that prefills the vehicle, date, and odometer reading for several distinct services or observations, with the details editable. Support historical entries through the same flow. A typical session adds mileage and some observation.
- Clarified during forecast planning: odometer readings may be absent on dated fuelings, and maintenance events may provide mileage without fueling information. Entry and editing must retain either partial record without requiring unrelated fields.
- Fueling records are newly in scope; the purpose ticket contains the scope addition. Include them in the dated entry workflow.
- Phone and desktop must both support observations and access to the same history through GitHub Gist loading/saving. Do not assume Gist storage alone provides automatic real-time synchronization.

### Fueling and units

- The user accepted full / partial / unknown tank-fill status on fueling records. Use complete full-to-full periods, including recorded intervening partial fills, for fuel-economy calculations. Missing fueling records interrupt the calculation.
- The user accepted per-vehicle odometer units of miles or kilometres, fuel entry in litres, and fuel-economy display in L/100 km, with optional explicitly distinguished US or Imperial MPG.
- The user additionally prefers km/L for easy mental calculations of distance represented by fuel added. Make km/L prominent alongside L/100 km and support the calculation litres added multiplied by km/L. This estimates the distance represented by the added fuel, not total remaining range including unknown fuel already in the tank.

### Tread measurement units and tire movements

- The user accepted millimetres and 32nds of an inch, and added thousandths of an inch (0.001 in), for tread-depth entry. Preserve the entered units and convert for comparisons.
- The user accepted starting a seasonal swap by choosing the incoming tire set and assigning individual tires, using recognizable labels, to front-left, front-right, rear-left, and rear-right.
- The shared date and odometer reading establish the position changes; eight tread readings per tire can optionally be entered in that session. A rotation uses the same position layout to record where each tire moved.

### Vehicle creation and oil-level entries

- The user accepted requiring only a recognizable vehicle name and odometer units at creation. Make, model, year, and other identifying details are optional. Mileage is a dated observation rather than a mandatory creation field.
- The user accepted low / normal / high oil-level status with notes and a separate optional top-up quantity in litres. A top-up is distinct from an oil change and does not reset the oil-change interval.

## Answer

Start with vehicle selection or creation, then show the selected vehicle's summary with drill-down into maintenance, tires, fueling, and history. A dated entry session shares vehicle, date, and odometer details across distinct services and observations; support phone and desktop, historical backfill, explicit date precision, and incomplete records.

Vehicle setup requires only name and odometer units. Other identifying details are optional. Maintenance items retain their documentation and history. Oil entries distinguish oil-life percentage, oil-level status with notes, top-up litres, and an oil change.

Seasonal swaps select the incoming set and assign recognizable individual tires to four vehicle positions. Rotations use the same layout. Optional eight-reading tire sessions accept millimetres, 32nds, or thousandths of an inch, preserving input units.

Fueling records include litres, an odometer reading when known, and full / partial / unknown fill status. Present km/L prominently alongside L/100 km, with optional US/Imperial MPG. Show estimated distance represented by added fuel using an identified historical economy basis. Account for incomplete fueling history.

GitHub Gist loading/saving must let phone and desktop access the same records; the following persistence decision defines save behavior, authentication, and conflict handling. Exact calculation rules remain in the forecast ticket. Layout implementation and visual validation are outside this planning ticket.
