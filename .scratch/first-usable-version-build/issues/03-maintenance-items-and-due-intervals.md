# 03: Track maintenance items and due intervals

**What to build:** Configure maintenance items for each vehicle, retain replacement information and completed work, and see distance/time-based due status with drill-down to its supporting history.

**Blocked by:** [Record and correct dated vehicle history](02-record-and-correct-history.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 3–6; maintenance and interval acceptance cases.

**User-story coverage:** 5, 6, 15, 16, 17, 18, 19, 20.

## Acceptance criteria

- [ ] Offer common choices including engine/cabin air filters and custom items per vehicle. Suggested items must not imply every vehicle has them or a universal replacement interval.
- [ ] Edit item specifications, compatible part numbers, preferred brand, notes, and safe reference links; record service date, known mileage, part used, and optional cost.
- [ ] Distinguish completed qualifying work from inspections/observations. Keep multi-year history continuous, and do not reset an interval on inspection or calendar-year boundaries.
- [ ] Support history-only, distance/time interval, and the shared condition-setting contract required by specialized items. Require explicit user settings; preserve unknown last-service information.
- [ ] Show due mileage/date from the last qualifying service and configured interval. Either threshold can make a combined schedule due; uncertain dates produce defensible ranges or unavailable results.
- [ ] Add maintenance summary and item-history drill-down to the vehicle home; edits, removals, and backfills must recalculate the results.
- [ ] Extend typed validation and collection round trips, preserving references, identities, units, optional cost, and notes. Render imported text safely.
- [ ] Test item isolation by vehicle, optional history-only tracking, known/unknown baselines, multi-year/approximate dates, inspection versus replacement, and a complete create–record–review browser flow.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Specialized oil-life and tire-wear formulas are implemented in their own vertical slices. This ticket delivers usable general maintenance rather than an empty item catalog.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

