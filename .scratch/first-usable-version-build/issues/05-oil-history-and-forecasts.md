# 05: Track oil use and forecast the next oil change

**What to build:** Record oil changes, life percentages, level checks, and top-ups; inspect achieved oil-change distances; and see supported 0%-life and calendar forecasts.

**Blocked by:** [Track maintenance items and due intervals](03-maintenance-items-and-due-intervals.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 6; oil and calendar acceptance examples.

**User-story coverage:** 21, 22, 23, 24, 25, 26, 49, 50.

## Acceptance criteria

- [ ] Provide dated oil-change, oil-life percentage, low/normal/high oil-level with notes, and top-up-litre entries using shared defaults and optional historical facts. These remain distinct record kinds.
- [ ] Compute completed intervals between consecutive known changes and show individual distances, median, and sample count; do not bridge a known missing-change span.
- [ ] Fit current continuous oil-life observations against mileage using the agreed straight-line rule and evidence requirements. Preserve unknown earlier service and withhold fits across unresolved resets/gaps.
- [ ] Show projected 0% odometer/remaining distance with supporting dates/readings. Recorded 0% makes oil due without a fit; inspection/top-up does not reset the interval or infer a 100% reading.
- [ ] Use the labeled historical-median fallback only with a known last-change odometer. Without the required baseline, show statistics without inventing a due mileage.
- [ ] Derive calendar estimates only from the latest two suitable dated odometers with a positive rate, showing the basis; do not invent a present odometer or override the car's actual oil-life trigger.
- [ ] Add summary and oil-history drill-down, preserve raw readings/units/unknowns in validation and round trips, and recalculate after edits, gaps, or backfills.
- [ ] Verify the 80% at 100,000 km / 40% at 104,000 km example projects 108,000 km, plus insufficient data, flat/increasing readings, 0%, missing changes, fallback, level/top-up distinction, and a complete browser entry/review flow.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Requires general maintenance's qualifying-service and item-history contracts; it does not require GitHub setup or tire/fueling features.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

