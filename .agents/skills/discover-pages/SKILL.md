---
name: discover-pages
description: Discover an application's page hierarchy, attribute displays, and user actions from an existing data model using ISA-101 multi-level hierarchy and Matt Pocock's grilling method.
---


You are conducting a structured discovery session to map a previously collected
**data model** into a complete **application page hierarchy**, including what
attributes are displayed and what actions users can perform on each page.

## Prerequisites

Before starting, locate (look for `DATA_MODEL.md`) or ask the user for the **existing data model** 
(entities, attributes, relationships, and derived metrics). If a codebase or
docs exist (e.g., `GLOSSARY.md`, Prisma/SQL schema, ERD, or design doc), read
them first so you never ask questions the data model already answers.

Look for a UI Design Philosophy document (look for `UI_DESIGN_PHILOSOPHY.md`) and read it to understand the intended interaction patterns, visual hierarchy, and user experience principles.

## Interview Protocol (Leveraging `grilling`)

Call the Skill tool with `"grilling"` :

1. **Ask in rounds (the frontier):** Only ask questions whose prerequisites are
   settled. Never ask about Level 3 form fields before Level 1 and Level 2
   navigation and user tasks are settled.
2. **Walk the tree branch-by-branch:** Resolve one visualization level or entity
   cluster before moving to the next.
3. **Challenge passivity:** If an entity or attribute has no clear user task,
   push back—ask whether it should be hidden, derived, or removed from the UI.
4. **Stop at ungrillable questions:** Do not grill visual layout, exact widget
   styling, or "one long form vs. multi-step wizard" feel. Flag those as
   `[PROTOTYPE]` and move on.
5. **Do not enter plan mode** until the frontier is empty and the coverage audit
   passes.

---

## ISA-101 Discovery Framework

Guide the interview through the four ISA-101 levels in order, mapping every
page back to the data model.

### Round 1: Scope, Roles & Level 1 (Overview / Span of Control)
*Goal: Establish the "big picture" status screen(s).*

- **ISA-101 Rule:** Level 1 shows the user's entire span of control—KPIs,
  current status, alerts/abnormal conditions, and recent trends. Avoid direct
  mutation controls here; use drill-downs instead.
- **Questions to settle:**
  - Who are the primary user roles, and does each role need a distinct Level 1
    overview?
  - Which entities represent the user's "span of control" (e.g., Fleet / All
    Vehicles)?
  - What top-level **status indicators, KPIs, and alerts** must be visible at a
    glance? Which data model attributes or derived calculations power them?
  - What are the primary drill-down paths from Level 1?

### Round 2: Level 2 (Unit / Task Workspaces)
*Goal: Identify the primary operational pages where normal user tasks happen.*

- **ISA-101 Rule:** Level 2 focuses on a single major unit/entity or core
  workflow, providing the context and controls needed for routine operations.
- **Questions to settle:**
  - Which core entities deserve their own Level 2 workspace (e.g., a single
    `Vehicle` dashboard, a `Maintenance` hub)?
  - For each Level 2 page:
    - Which **attributes** (direct or rolled-up from child entities) are
      displayed?
    - What **primary actions** can the user initiate here (e.g., "Log Refuel",
      "Schedule Service", "Mark Resolved")?
    - Which abnormal states or warnings surface here?

### Round 3: Level 3 (Detail & Action Views)
*Goal: Map granular entity inspection, creation, and editing.*

- **ISA-101 Rule:** Level 3 exposes the full detail of a single sub-entity,
  record, or control/action (e.g., a specific `RefuelEvent`, `TireSet`, or
  `ServiceRecord`).
- **Questions to settle:**
  - For each action identified in Level 2, does it require a dedicated Level 3
    page, a modal/drawer, or inline control?
  - For each entity/sub-entity detail view:
    - Which attributes are **read-only**, **editable**, **computed**, or
      **omitted**?
    - What validation rules, side effects, or state transitions occur when the
      user submits an action?
    - What parent/sibling navigation is required?

### Round 4: Level 4 (Diagnostics, Analytics & Support)
*Goal: Uncover predictive, historical, and troubleshooting pages.*

- **ISA-101 Rule:** Level 4 provides deep diagnostic, analytical, and
  supporting views—trends, anomaly detection, predictions, audit logs, and
  configuration/reference data.
- **Questions to settle:**
  - What **diagnostic or predictive questions** should the app answer (e.g.,
    expected tire lifetime, fuel mileage drop detection, cost-per-mile trends)?
  - Which historical entities and time-series attributes feed each diagnostic
    page?
  - What **thresholds, baselines, or rules** trigger warnings that bubble back
    up to Level 1 and Level 2?
  - What supporting/reference pages are needed (e.g., maintenance schedules,
    import/export, settings)?

---

## Mandatory Data-Model Coverage Audit

Before concluding, run a silent audit against the provided data model and grill
the user on any gaps:

1. **Orphaned Entities:** Any entity not displayed or mutated on any page.
2. **Orphaned Attributes:** Any attribute never shown, edited, or used in a
   calculation/alert.
3. **Missing Data:** Any KPI, alert, or Level 4 diagnostic that requires
   attributes *not yet in the data model* (flag these as data-model additions).
4. **Action Completeness:** Verify Create, Read, Update, Delete, and domain
   actions (e.g., Archive, Complete, Recalculate) for every entity.

---

## Final Output Format

Once the frontier is empty, output a structured specification (ready to hand off
to `to-spec` or implementation):

1. **Page Hierarchy Tree** (grouped by ISA-101 Levels 1–4, showing drill-down
   paths).
2. **Page Specifications** (for each page):
   - **Level & Route/Name**
   - **Primary Entity / Scope**
   - **Displayed Attributes** (with source `Entity.attribute` or formula)
   - **User Actions** (trigger, target entity, state change, destination)
   - **Drill-Downs / Navigation** (up to parent, down to child)
   - **Open `[PROTOTYPE]` Questions** (ungrillable UX items)
3. **Data Model Mapping & Gaps** (summary table of `Entity.attribute` → Pages,
   plus any newly discovered attributes needed for Level 1 KPIs or Level 4
   diagnostics).