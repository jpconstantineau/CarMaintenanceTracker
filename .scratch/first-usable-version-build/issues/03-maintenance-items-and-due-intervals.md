# 03: Track maintenance items and due intervals

**What to build:** Configure maintenance items for each vehicle, retain replacement information and completed work, and see distance/time-based due status with drill-down to its supporting history.

**Blocked by:** [Record and correct dated vehicle history](02-record-and-correct-history.md)

**Status:** complete

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 3–6; maintenance and interval acceptance cases.

**User-story coverage:** 5, 6, 15, 16, 17, 18, 19, 20.

## Acceptance criteria

- [x] Offer common choices including engine/cabin air filters and custom items per vehicle. Suggested items must not imply every vehicle has them or a universal replacement interval.
- [x] Extend Other maintenance with concrete actions such as Replace cabin filter or Service brakes and an item choice. Extend Check / inspect with a relevant item/check; do not require a generic observation before choosing what happened. Each separate action starts with blank native date and numeric odometer fields.
- [x] Edit item specifications, compatible part numbers, preferred brand, notes, and safe reference links; record service date, known mileage, part used, and optional cost.
- [x] Distinguish completed qualifying work from checks/inspections. Keep multi-year history continuous, and do not reset an interval on inspection or calendar-year boundaries. Earlier unassigned maintenance/check notes remain factual history; do not infer a qualifying item or service from free text.
- [x] Support history-only, distance/time interval, and the shared condition-setting contract required by specialized items. Require explicit user settings; preserve unknown last-service information.
- [x] Show due mileage/date from the last qualifying service and configured interval. Either threshold can make a combined schedule due; uncertain dates produce defensible ranges or unavailable results.
- [x] Add maintenance summary and item-history drill-down to the vehicle home; edits, removals, and backfills must recalculate the results.
- [x] Extend typed validation and collection round trips, preserving references, identities, units, optional cost, and notes. Render imported text safely.
- [x] Test item isolation by vehicle, optional history-only tracking, known/unknown baselines, multi-year/approximate dates, inspection versus replacement, and a complete create–record–review browser flow.

- [x] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [x] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [x] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Specialized oil-life and tire-wear formulas are implemented in their own vertical slices. This ticket delivers usable general maintenance rather than an empty item catalog.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

## Review — 2026-11-21

Fixed point: `b1144442fea2314ff74c5581a0242bfb7de341a5`. Implementation `7fd0b6e`; review fixes `f8d8088`.

### Standards

The review found two documented-standard issues: mixed-unit readings equal within conversion tolerance could falsely order overlapping services (P2), and the action field did not visibly state its conditional requirement (P3). It also identified duplicated chronology logic as a judgment-call smell. A shared chronology comparator now retains equivalent-reading ambiguity; the visible label states “required with item.” Regression cases reproduce the former defect and verify the correction. The follow-up reviewer confirmed both findings and the duplication concern resolved, with no remaining actionable standards findings.

### Spec

The review found two P2 issues: a contradiction involving a third mileage reading could improperly establish a calendar baseline, and the source specification's item-removal operation was absent. Chronology now refuses inferred odometer order when either service's mileage is contradictory while preserving order independently established by dates. Item removal has a native confirmation naming the item and linked record count, retains deletion identities, and preserves unrelated/unassigned history. Public-module and browser regressions cover both corrections. The follow-up reviewer confirmed both findings resolved, with no remaining actionable specification findings.

Final review counts: Standards 0 outstanding (2 violations and 1 smell resolved); Spec 0 outstanding (2 resolved).


## Verified release — 2026-11-21

- Live app: https://jpconstantineau.github.io/CarMaintenanceTracker/
- Reviewed runtime: [f8d80886b6b2b3ac93f3ea25abdcd28f87b5ad14](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/f8d80886b6b2b3ac93f3ea25abdcd28f87b5ad14), committed and pushed to main.
- [Pages deployment succeeded](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44989318848). Publishing remains main / docs; the build reports the release SHA, and all seven runtime assets match the commit. Content version: 313a75df76a0.
- [GitHub application checks passed](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44989319004). Local checks: 34 module tests and 83 browser tests passed; the existing WebKit forced-colors emulation test is skipped. Published-site checks: 45 successful journeys across desktop Chromium, phone Chromium and phone WebKit.
- Common/custom items, replacement details and safe links, linked services/inspections, optional parts/cost, history-only and explicit interval/condition settings, maintenance summary, item history and confirmed item/history deletion are implemented. Condition-specific measurements and forecasts remain in their specialized tickets.
- Schema 4 validates and preserves schemas 1–3, including IDs, units, unknowns, factual notes and deletion markers. No reset or authentication/Worker change. Cached v1 and v3 release upgrades pass; the v3 upgrade preserves earlier unassigned maintenance notes without inferring an item or service.
- The [module contracts and purpose/verification ledger](../../../documentation/maintenance.md) record calculation rules, review regressions, UI purposes, screenshots and remaining physical-device/screen-reader checks. No outstanding review findings.

Try it: Open a vehicle, choose **Add maintenance item**, pick **Cabin air filter**, and set your own distance and/or month interval (or leave **History only**). Save, choose **Replace Cabin air filter**, enter its date and known mileage, and save. Open the item details to see due mileage/date and **View item history**. Add an inspection; it does not reset the interval. Edit the completed service and reopen the app to see the recalculated result retained. Data remains local to this browser/device until later transfer/Gist tickets.
