# 02: Record and correct dated vehicle history

**What to build:** Record odometer readings and general observations, enter several dated records together, inspect the vehicle history, and correct or remove old entries without losing unknowns or chronology.

**Blocked by:** [Create and reopen local vehicles](01-create-and-reopen-vehicles.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 2–5; shared-evidence acceptance cases.

**User-story coverage:** 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 43, 49.

## Acceptance criteria

- [ ] Provide a dated entry session with shared vehicle/date/odometer defaults and distinct editable records. Support odometer-only and general observations; absence of a reading is not zero.
- [ ] Support exact day, month, or year precision, out-of-sequence creation, and multi-year history. Keep event date separate from edit metadata and do not invent days or service events.
- [ ] Show latest known mileage with its date on the vehicle summary and drill into the history. Use readings from any event type through one mileage-evidence interface that later domain slices can extend.
- [ ] Provide edit/removal through public History operations and retain identity/deletion information needed for later reconciliation. Changing one saved record must not silently alter sibling records entered in the same session.
- [ ] Preserve partial records, mark known gaps by affected history type/span, and expose contradictory/ambiguous chronology for review. Repeated equal mileage evidence is not a false conflict; inconsistent evidence must not silently overwrite another reading.
- [ ] Recompute affected summary/timeline results when records are backfilled, edited, or removed. An observed initial mileage does not imply original service history.
- [ ] Extend validation, serialization, IndexedDB persistence, and tests for these record kinds, including approximate dates, unknown values, gaps, edits/deletions, and round-trip preservation.
- [ ] Verify a phone/desktop user can record a session, inspect it, backfill an older observation, correct it, and reopen the unchanged factual history.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Deliver generic dated observations and chronology here. Domain-specific forms and projections belong to the maintenance, oil, tire, and fueling slices. Establish the known-gap mechanism without requiring those later screens.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

