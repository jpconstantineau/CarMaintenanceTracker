# 05: Track oil use and forecast the next oil change

**What to build:** Record oil changes, life percentages, level checks, and top-ups; inspect achieved oil-change distances; and see supported 0%-life and calendar forecasts.

**Blocked by:** [Track maintenance items and due intervals](03-maintenance-items-and-due-intervals.md)

**Status:** complete

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 6; oil and calendar acceptance examples.

**User-story coverage:** 21, 22, 23, 24, 25, 26, 49, 50.

## Acceptance criteria

- [x] Extend Change oil and offer concrete Read oil life, Check oil level, and Top up oil actions. Record oil-life percentage, low/normal/high level with notes, and top-up litres as distinct facts. Each separate action starts with a blank native date field and numeric odometer field; incomplete historical facts remain supported.
- [x] Reuse the existing oil-change history and preserve its identity when adding item-specific details. Do not create a second oil change merely to attach a maintenance item, or infer oil-life/level values from earlier notes.
- [x] Compute completed intervals between consecutive known changes and show individual distances, median, and sample count; do not bridge a known missing-change span.
- [x] Fit current continuous oil-life observations against mileage using the agreed straight-line rule and evidence requirements. Preserve unknown earlier service and withhold fits across unresolved resets/gaps.
- [x] Show projected 0% odometer/remaining distance with supporting dates/readings. Recorded 0% makes oil due without a fit; inspection/top-up does not reset the interval or infer a 100% reading.
- [x] Use the labeled historical-median fallback only with a known last-change odometer. Without the required baseline, show statistics without inventing a due mileage.
- [x] Derive calendar estimates only from the latest two suitable dated odometers with a positive rate, showing the basis; do not invent a present odometer or override the car's actual oil-life trigger.
- [x] Add summary and oil-history drill-down, preserve raw readings/units/unknowns in validation and round trips, and recalculate after edits, gaps, or backfills.
- [x] Verify the 80% at 100,000 km / 40% at 104,000 km example projects 108,000 km, plus insufficient data, flat/increasing readings, 0%, missing changes, fallback, level/top-up distinction, and a complete browser entry/review flow.

- [x] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [x] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [x] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Requires general maintenance's qualifying-service and item-history contracts; it does not require GitHub setup or tire/fueling features.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

## Review — 2026-11-22

Fixed point: `80d1272923cc7ff54e1b0a4eaea07768392e3a9c`. Initial implementation: `e27091f`. Reviewed release: `6a88bc3`.

### Standards

No documented-standard breaches or meaningful baseline smells. The follow-up extraction of a private mileage-summary helper preserves the public interface and keeps evidence scoping within Calculations. Reviewer confirmed zero outstanding findings.

### Spec

One P2 was identified and resolved: unrelated mileage conflicts years before a known oil change suppressed a clean current interval's fit and calendar estimate. Current-interval and calendar support checks now examine the evidence on which each result depends, while earlier warnings remain visible in vehicle history. A red-before-green public-interface regression verifies the 108,000 km projection and 2025-03-29 calendar result with an unrelated old conflict. Reviewer confirmed the fix and zero remaining findings.

Final review counts: Standards 0 outstanding; Spec 0 outstanding (1 resolved).

## Verified release — 2026-11-22

- Live app: https://jpconstantineau.github.io/CarMaintenanceTracker/
- Reviewed release: [6a88bc3f8e139e15539c7d8c37a1e11822e468c0](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/6a88bc3f8e139e15539c7d8c37a1e11822e468c0), committed and pushed to main.
- [Pages deployment succeeded](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/45054772739), publishing main / docs. The build reports the release SHA and all seven published runtime assets match it. Content version: `5690864654b3`.
- [GitHub application checks passed](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/45054773180). Final local checks: 50 module tests, 110 browser tests, JavaScript syntax and asset-version checks passed; one existing WebKit forced-colors emulation case is skipped. All 57 published-site journeys passed across desktop Chromium, phone Chromium and phone WebKit.
- Delivered separate life, level and top-up entry, enriched existing oil-change records, completed-distance statistics, current-segment OLS forecasts, actual-zero due status, labelled median fallback and supported recorded-mileage calendar estimates. Editing/backfilling/removing facts recalculates results; inspections/top-ups never reset oil intervals.
- Schema 5 validates and retains supported versions 1–4 with original IDs, items, observations, units, date precision, notes and unknowns. No data reset. Cached preceding runtime upgrades, including attaching old oil changes to items, pass without duplication or inferred life readings. No authentication change or Worker deployment is involved.
- [Oil contracts and UI purpose/verification ledger](../../../documentation/oil.md) documents the module interfaces, evidence rules, schema conversion, added HTML/CSS, screenshots and remaining physical-device/screen-reader checks.

Try it: Choose a vehicle, then **Oil history and forecast**. Use **Read oil life** twice: 80% on 2025-01-01 at 100,000 km and 40% on 2025-02-10 at 104,000 km. Return to the oil details to see 108,000 km projected 0%, 4,000 km remaining at the second reading, limited two-reading evidence and an estimated 2025-03-22 calendar date. Add a level check or top-up and confirm neither resets the interval. Use **View oil records** to correct the latest percentage to 0; the summary should show observed due after reload. JSON backups preserve these facts for manual transfer between devices until Gist support is delivered.

