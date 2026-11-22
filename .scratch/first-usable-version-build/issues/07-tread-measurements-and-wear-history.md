# 07: Record tread measurements and inspect uneven wear

**What to build:** Enter full or partial eight-point tread sessions in the gauge's units, inspect inner/outer wear history, and configure the tire's visible tread threshold.

**Blocked by:** [Track tire sets, swaps, rotations, and installed mileage](06-tire-placement-and-seasonal-mileage.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 4, 7; tread coverage, units, and observed thresholds.

**User-story coverage:** 33, 34, 35, 36, 40, 49, 50.

## Acceptance criteria

- [ ] Capture inner/outer top/front/bottom/back samples for a named individual tire, with shared dated entry defaults and optional known mileage. Samples identify within-session locations, not matched physical points over time.
- [ ] Accept millimetres, 32nds of an inch, and thousandths of an inch; preserve original representations and use exact conversions without rounding stored/intermediate data.
- [ ] Retain partial sessions. Require all four samples for comparable edge mean/minimum and all eight for whole-tire mean; distinguish unavailable summaries from missing raw data.
- [ ] Allow a user-defined effective threshold per tire, optionally prefilled from its set; do not invent a universal depth limit. Any valid observed reading at/below threshold remains visible even in an incomplete session.
- [ ] Show dated raw readings, inner/outer means and minima, and whole-tire history alongside placement changes so uneven wear is inspectable; preserve older readings rather than reducing them to a current average.
- [ ] Support editing/deleting/backfilling measurements and update all available summaries through Calculations while retaining source dates and units.
- [ ] Extend shared validation and portable data round trips for measurements/settings, and maintain individual vehicle/tire association.
- [ ] Test equivalent 4/32 inch, 125 thousandths, and 3.175 mm readings; partial/full coverage, zero/invalid values, observed threshold crossing, non-identical physical sample points, and a phone/desktop eight-reading workflow.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Deliver measured wear inspection and threshold input here. Predicted remaining distance and seasons belong to the following forecast slice.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

