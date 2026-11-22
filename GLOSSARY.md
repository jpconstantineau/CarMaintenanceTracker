# Vehicle Maintenance

Individuals retain maintenance, tire, and fueling history for their own vehicles to understand past use, fuel economy, and future maintenance needs.

## Language

**Maintenance item**:
A vehicle-specific category of maintenance being tracked, such as an engine air filter, cabin air filter, engine oil, or brakes. Items may come from common choices or be defined by the user.
_Avoid_: Consumable when referring to all tracked maintenance

**Vehicle**:
A car whose maintenance is tracked individually, including cars within the same household.
_Avoid_: Car profile

**Maintenance record**:
A record of completed maintenance on a vehicle, whether performed by its owner or a mechanic.
_Avoid_: Reminder, forecast

**Car action**:
Something done to or checked on a vehicle, such as fueling, changing oil, changing tires, replacing a filter, inspecting brakes, or reading the odometer.

**Check / inspection**:
A recorded inspection or measurement of a vehicle or maintenance item, which does not itself establish that maintenance was performed.
_Avoid_: Generic observation as an entry action, replacement

**Missing records**:
A known period for which a vehicle's service, fueling, or measurement records are unavailable; this does not assert that no work occurred.
_Avoid_: Gap as an unexplained user-facing label

**Maintenance history**:
The collected maintenance records for a vehicle.

**Vehicle history**:
The collected maintenance records, checks/inspections, tire movements, and fueling records associated with a vehicle.

**Fueling record**:
A record of fuel added to a vehicle, retaining the known date, odometer reading, quantity and its units (litres, US gallons, or Imperial gallons); some historical details may be unknown.
_Avoid_: Fuel consumed, since fuel added is not necessarily fuel consumed over the preceding distance

**Odometer reading**:
A dated measurement of the vehicle's displayed accumulated distance, whether recorded during fueling, maintenance, or another car check.
_Avoid_: Fueling mileage when referring to readings from all event types

**Fuel economy**:
The relationship between distance driven and fuel consumed, expressed as distance per volume (such as km/L) or volume per distance (such as L/100 km).

**Maintenance forecast**:
An estimate of the odometer reading or date when maintenance will next be needed, informed by maintenance history, mileage, elapsed time, or measured wear.
_Avoid_: Maintenance record, guarantee

**Tire**:
An individual tire whose tread measurements, positions on a vehicle, time at each position, and distance driven at each position are tracked over its lifetime.
_Avoid_: Wheel

**Tire set**:
A group of tires used together, such as a vehicle's summer or winter tires.

**Tread measurement**:
A dated measurement of a tire's remaining tread depth at a particular location on the tire.
_Avoid_: Thread measurement

**Tread measurement session**:
A dated set of tread-depth readings for one tire, intended to cover the innermost and outermost tread at top, front, bottom, and back; historical sessions may be incomplete.
The locations describe the tire's orientation within that session, not repeatable physical points across sessions.

**Whole-tire average tread depth**:
The arithmetic mean of the eight tread-depth readings collected for a tire during one measurement session.

**Tire swap**:
Replacing the tires currently installed on a vehicle with another set, such as changing from summer to winter tires.
_Avoid_: Rotation

**Tire rotation**:
Moving tires between positions on a vehicle.
_Avoid_: Swap

**Oil-life reading**:
The percentage of oil life remaining reported by the vehicle at a particular date and odometer reading.
_Avoid_: Oil level

**Oil-level reading**:
An observation of the amount or level of engine oil present, distinct from the vehicle's estimate of remaining oil life.
_Avoid_: Oil-life reading

**Oil top-up**:
Adding a recorded quantity of engine oil without performing an oil change.
_Avoid_: Oil change

**Completed oil-change interval**:
The period between two consecutive oil changes, with its elapsed time and distance driven.
_Avoid_: Recommended oil-change interval
