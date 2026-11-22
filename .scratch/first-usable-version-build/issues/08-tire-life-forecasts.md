# 08: Forecast remaining tire distance and seasons

**What to build:** Show each tire's limiting-edge and whole-average remaining-distance forecasts, explain uneven-wear differences, and provide seasonal estimates only when supported.

**Blocked by:** [Record tread measurements and inspect uneven wear](07-tread-measurements-and-wear-history.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 7; tire trend, normalized-reference, and seasonal examples.

**User-story coverage:** 37, 38, 39, 40, 49, 50.

## Acceptance criteria

- [ ] Fit inner-minimum, outer-minimum, and whole-mean series independently over their latest three usable sessions, or two when only two exist, against actual known installed distance.
- [ ] Require distinct distance values, preserve partial/unknown coverage, and avoid fitting across a movement gap or treating top/front/bottom/back as matched physical points.
- [ ] Compute projected threshold crossings and normalize them to the same latest supported installed-distance reference before comparing remaining distances, because source sessions may differ.
- [ ] Use the earliest supported edge as limiting wear while displaying the whole-mean comparison separately. Identify incomplete edge coverage, source dates, sample counts, and two-reading limited evidence.
- [ ] Handle flat/increasing trends as no usable wear-rate estimate, not infinite life. Distinguish observed threshold crossings from projected ones, and show no invented current mileage or unknown lifetime total.
- [ ] Require two complete same-type seasons with known installed distances before estimating seasons remaining using median seasonal distance. Show years only with established recurrence; do not use the car's year-round mileage rate or count rotations as seasons.
- [ ] Integrate forecasts and evidence drill-down into tire and vehicle summaries, with updates after corrections/backfills and no promise of mechanical diagnosis or recovered life from rotations.
- [ ] Verify the 6/5/4 mm at 0/10,000/20,000 km example, unequal series source dates, incomplete edges, flat/increasing trends, observed crossing, missing lifetime mileage, one/two seasons, and a complete evidence-review browser flow.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This uses the tire placement and measurement contracts already delivered. It must not wait on oil forecasting merely to share a regression helper; internal reuse is an implementation choice.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

