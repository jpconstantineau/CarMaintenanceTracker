# 09: Record fueling and calculate measured fuel economy

**What to build:** Record dated fuel additions with full/partial/unknown status and optional mileage, then see recent/overall economy from complete periods and distance represented by added fuel.

**Blocked by:** [Record and correct dated vehicle history](02-record-and-correct-history.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 8; full-to-full, weighted-economy, and added-fuel examples.

**User-story coverage:** 41, 42, 43, 46, 47, 48, 49.

## Acceptance criteria

- [ ] Capture litres when known, odometer when known, and full/partial/unknown status in the dated workflow. Accept incomplete historical fuelings without confusing them with mileage-only maintenance observations.
- [ ] Build confirmed full-to-full periods using known endpoint mileage. Sum additions after the opening fill through the closing fill; include intermediate partial/unknown-status additions without requiring their mileages.
- [ ] Exclude opening-fill litres; allow their quantity to be unknown if the opening full status/mileage is known. A missing consumed quantity or marked fueling gap invalidates the affected period; a later confirmed full fill can establish a new baseline.
- [ ] Calculate overall recorded and recent last-three-period economy from total distance divided by total fuel, with fewer recent periods when fewer exist. Show supporting dates/count and excluded gaps.
- [ ] Present km/L prominently with L/100 km, optional explicitly US/Imperial MPG, and added litres multiplied by recent km/L. Do not describe that as total tank range.
- [ ] Display unavailable or partial evidence instead of division-by-zero values or invented quantities. Leave missing endpoint mileage for the next interpolation slice while retaining the records.
- [ ] Integrate fueling/economy summary and history drill-down, with typed validation, exact unit conversion, local persistence/round trips, and recomputation on edits/backfills.
- [ ] Verify 20 L partial plus 30 L closing full over 600 km gives 12 km/L; 600 km/50 L plus 100 km/20 L combines to 10 km/L; 25 L at 12 km/L represents 300 km. Cover gaps, unknown status, opening/closing quantities, and responsive entry/review.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

A complete useful economy flow is possible with measured endpoints. Interpolation is a distinct following slice, not a reason to block all fueling history or basic economy.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

