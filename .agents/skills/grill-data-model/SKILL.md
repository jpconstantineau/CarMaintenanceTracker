---
name: grill-data-model
description: >
  Relentlessly interview the user to discover a complete, unambiguous software
  data model—entities, relationships, attributes, types, and invariants—using
  frontier-based grilling rounds. Use during software design before writing
  schemas or migrations.
---

Call the Skill tool twice, for "grilling" and "domain-modeling".

Apply all rules below on top of it.

## Core Rules

1. **Ask in frontier rounds.** Each round contains only questions whose
   prerequisites are already settled. Never ask about attribute types for an
   entity whose existence or boundaries are still undecided.
2. **Respect the phase order.** Do not advance to the next phase for a branch
   until the current phase's frontier for that branch is empty:
   - **Phase 1:** Entities & Boundaries
   - **Phase 2:** Relationships & Lifecycles
   - **Phase 3:** Attributes, Types & Invariants
   - **Phase 4:** Synthesis
3. **Check the codebase first.** If a repository exists, inspect existing
   schemas, types, migrations, or domain docs before asking the user anything
   the code already answers.
4. **Surface hidden entities.** Actively probe for concepts users often collapse
   into columns:
   - **Events / Logs** (things that happen at a point in time, e.g., a refill,
     a maintenance action, a status change)
   - **Measurements / Readings** (discrete or continuous observations over time)
   - **Catalogs vs. Instances** (e.g., a `PartType` in a catalog vs. a physical
     `Part` installed on a specific `Car`)
   - **State vs. History** (do we only care about the current value, or every
     historical value?)
5. **Challenge vagueness.** If the user gives an ambiguous answer (e.g., "track
   oil level" or "store volume"), grill for the exact semantics: discrete enum
   vs. numeric measurement, units, precision, and edge cases.
6. **Keep scope owned by the user.** If the user says "out of scope" or "I don't
   know yet," record it explicitly as an exclusion or open assumption and move
   on—do not invent requirements.

---

## Phase 1: Entities & Boundaries

Goal: Identify every distinct noun and event in the domain.

In your frontier rounds, probe for:
- **Core subjects / aggregates:** What are the primary things being managed?
- **Sub-components & consumables:** What belongs to them? Are items tracked
  individually (serialized instances) or by type/quantity?
- **Events & actions:** What happens to these things over time? (Refills,
  replacements, inspections, services)
- **Measurements & observations:** Are there readings taken independently of
  actions? (e.g., checking oil level without changing oil)
- **Actors / external context:** Do we need to track *who* performed an action
  or *where* it happened (e.g., driver, mechanic, station), or is that out of
  scope?

Exit condition: Every candidate entity is confirmed, merged, or explicitly
excluded.

---

## Phase 2: Relationships & Lifecycles

Goal: Map how every confirmed entity connects and changes over time.

For each entity pair on the frontier, probe for:
- **Cardinality & optionality:** `1:1`, `1:N`, `M:N`? Can the child exist
  without the parent?
- **Ownership & deletion:** If a parent is deleted/archived, what happens to
  children and historical events?
- **Temporal & historical semantics:**
  - Is a relationship point-in-time (append-only event) or mutable state?
  - Can an instance move between parents (e.g., a part moved to another car)?
  - Do two events relate to each other (e.g., an oil change resetting a
    maintenance interval)?
- **Polymorphism vs. explicit tables:** Should similar concepts (e.g., `Part`
  and `Consumable`, or different maintenance events) share a table/supertype or
  remain distinct entities?

Exit condition: Every relationship has defined cardinality, optionality, and
lifecycle behavior.

---

## Phase 3: Attributes, Types & Invariants

Goal: Nail down the exact fields, types, units, and business rules for every
entity.

For each entity on the frontier, probe for:
- **Identifiers:** Surrogate ID (UUID/integer) vs. natural key (e.g., VIN,
  serial number)?
- **Exact data types & precision:**
  - Money / volume / weight: exact `decimal(p,s)` vs. integer minor units vs.
    float?
  - Time: `date` only, `timestamp` with timezone (`timestamptz`), or local time?
  - Discrete values: fixed `enum` (list every value), bounded integer scale, or
    free text?
- **Units:** Are units fixed and canonical (e.g., always liters and km), or
  user-selectable (requiring a unit column or conversion on write)?
- **Nullability & defaults:** Which fields are required at creation vs.
  optional?
- **Invariants & constraints:**
  - Uniqueness constraints (single or composite)
  - Monotonicity or range rules (e.g., `volume > 0`, `mileage >= previous
    mileage`—and what if someone backdates a log?)
- **Derived vs. stored:** Which values should be computed on read (e.g., fuel
  economy, current mileage) vs. cached/stored?

Exit condition: Every attribute has a concrete type, nullability, and unit (if
applicable), and all cross-field/cross-row invariants are documented.

---

## Phase 4: Synthesis

Once the frontier is completely empty across all three phases, output the final
data model to `DATA_MODEL.md` with:

1. **Entity-Relationship Summary** (concise list or Mermaid `erDiagram`)
2. **Entity Definitions** — one table per entity with:
   `Attribute | Type | Nullable | Constraints / Units | Notes`
3. **Key Invariants & Business Rules** (e.g., backdated mileage handling,
   append-only logs)
4. **Explicitly Out of Scope / Open Assumptions**