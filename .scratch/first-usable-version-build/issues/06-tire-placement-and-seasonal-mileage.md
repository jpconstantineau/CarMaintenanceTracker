# 06: Track tire sets, swaps, rotations, and installed mileage

**What to build:** Create recognizable individual tires and sets, record their placement through seasonal swaps and rotations, and inspect time and distance at each position.

**Blocked by:** [Record and correct dated vehicle history](02-record-and-correct-history.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 3, 7; tire placement/baseline/mileage acceptance cases.

**User-story coverage:** 27, 28, 29, 30, 31, 32.

## Acceptance criteria

- [ ] Create tire/set identities, labels, brand/model, membership, and seasonal type where applicable. Preserve individual identity through movements.
- [ ] Offer the four-position assignment interaction for an incoming set and for rotations, sharing date/odometer defaults. Validate and apply complete assignments atomically.
- [ ] Retain initial observed placement for already-installed tires without fabricating original installation or prior mileage. Display known tracked distance distinctly from unknown lifetime distance.
- [ ] Derive per-position time and installed mileage across known periods; rotations preserve cumulative mileage, storage contributes zero, and unknown movement spans remain unknown.
- [ ] Handle exact/approximate dates and out-of-sequence corrections consistently; impossible placements require review and cannot silently become active.
- [ ] Represent seasonal-use periods separately from position periods and record evidence of complete seasons; rotations are not new seasons. This supplies the later seasonal-forecast contract.
- [ ] Provide vehicle tire summary and per-tire placement/history drill-down, with local persistence and typed schema/round-trip coverage.
- [ ] Test atomic four-tire swaps/rotations, stored summer tires during winter driving, unknown initial lifetime, gaps, approximate chronology, invalid duplicate placement, backfill corrections, and responsive interaction.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This slice needs the common history/timeline, not general maintenance configuration or oil calculations. Tire measurement and wear forecasting are separate subsequent user-visible slices.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

