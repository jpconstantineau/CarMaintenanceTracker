# 10: Use incomplete mileage in fueling estimates

**What to build:** Use suitable odometer observations from the whole vehicle history to estimate missing fueling mileage and extend fuel-economy calculations without changing the recorded facts.

**Blocked by:** [Record fueling and calculate measured fuel economy](09-fueling-and-measured-economy.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 4, 8; interpolation and approximate-date acceptance examples.

**User-story coverage:** 44, 45, 49.

## Acceptance criteria

- [ ] Use the nearest unambiguous recorded readings before/after a fueling date, regardless of their event kind. Interpolate only inside a supported span, not from derived anchors or by extrapolation.
- [ ] Preserve the fueling's recorded mileage as unknown. Display derived mileage separately and mark every dependent period/average/added-fuel result estimated.
- [ ] Do not automatically copy another event's same-day odometer or assume odometer-only maintenance implies fueling.
- [ ] With approximate dates, provide a defensible range where bounds/order permit it; otherwise explain why no point estimate exists. Reject contradictory/decreasing readings, zero-length spans, and unresolved chronology as anchors.
- [ ] Include periods whose inferred endpoint mileage is usable in recent/overall calculations with their estimate labels; still require full-status endpoints and complete fuel quantities.
- [ ] Recompute derived values when any supporting maintenance, fueling, or odometer event is backfilled, corrected, removed, or marked as a gap. Keep exports factual rather than replacing unknowns with predictions.
- [ ] Test day 0 at 100,000 km and day 30 at 100,600 km yielding day 10 at 100,200 km, plus missing bounds, same-day ambiguity, approximate dates, conflicting readings, and dependency-label propagation.
- [ ] Verify a user can inspect which observed events support an estimate and distinguish measured from estimated economy on phone and desktop.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Uses the shared mileage timeline already established by dated history and the full-to-full periods from fueling. No dependency on oil or tire features is required.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

