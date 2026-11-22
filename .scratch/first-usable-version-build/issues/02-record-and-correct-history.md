# 02: Record and correct dated vehicle history

**What to build:** Record recognizable car actions (fueling, changing oil or tires, other maintenance, checks/inspections, and odometer readings), inspect the vehicle history, and correct or remove entries without losing unknowns or chronology.

**Blocked by:** [Create and reopen local vehicles](01-create-and-reopen-vehicles.md)

**Status:** complete

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 2–5; shared-evidence acceptance cases.

**User-story coverage:** 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 43, 49.

## Acceptance criteria

- [x] Offer Fuel up, Change oil, Change tires, Other maintenance, Check / inspect, and Odometer reading as primary entry actions. Each record's date and odometer starts blank; selected vehicle and unit preferences may initialize ownership/units. Absence of a reading is not zero.
- [x] Use native type=date for exact dates and type=number for odometers. Support explicit month/year precision, out-of-sequence creation, and multi-year history. Keep event date separate from edit metadata and do not invent days or service events.
- [x] Show latest known mileage with its date on the vehicle summary and drill into the history. Use readings from any event type through one mileage-evidence interface that later domain slices can extend.
- [x] Provide edit/removal through public History operations and retain identity/deletion information needed for later reconciliation. Changing one saved record must not silently alter sibling records entered in the same session.
- [x] Preserve partial car-action records and offer Mark missing records as a secondary history-review action, scoped by type/span. Expose contradictory/ambiguous chronology for review. Repeated equal mileage evidence is not a false conflict; inconsistent evidence must not silently overwrite another reading.
- [x] Fueling retains known quantity and original units (L, US gal, Imp gal), plus full/partial/unknown tank status. Setup preferences affect new entries, not older records. Simple oil/tire/maintenance entries retain date, mileage and notes pending their detailed slices.
- [x] Recompute affected summary/timeline results when records are backfilled, edited, or removed. An observed initial mileage does not imply original service history.
- [x] Extend validation, serialization, IndexedDB persistence, and tests for these record kinds, including approximate dates, unknown values, gaps, edits/deletions, and round-trip preservation.
- [x] Verify a phone/desktop user can choose car actions, inspect them, backfill older work or a check, correct it, and reopen the unchanged factual history. Verify both history buttons after upgrading with old assets cached; version all transitive runtime URLs.

- [x] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [x] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [x] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Deliver car-action entry and chronology here. Detailed maintenance items, oil-life/level/top-up forms, individual tire placement/tread tracking and fuel economy remain their own slices. Extend the existing actions when implementing those slices rather than adding duplicate generic entry routes. Missing-record annotations remain secondary history context.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

## Original release — 2026-11-21 (superseded UI)

- Live app: https://jpconstantineau.github.io/CarMaintenanceTracker/
- Implementation: `e985ea5`; review fixes and released runtime: [beeda98ab74eb9fd277ab64054e2391e66ca7b80](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/beeda98ab74eb9fd277ab64054e2391e66ca7b80), committed and pushed to `main`.
- [Pages deployment succeeded](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44984776273). Publishing source remains `main` / `/docs`; the Pages build reports the release SHA, and all seven published runtime assets match that commit.
- [GitHub application checks passed](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44984776421). Local verification: 21 module tests and 59 browser tests passed; the existing WebKit forced-colors emulation test is skipped. Published-site verification: 30 successful journeys across desktop Chromium, phone Chromium, and phone WebKit.
- Coverage includes shared defaults with per-record ownership/date/mileage overrides, partial observations, exact/month/year dates, out-of-sequence history, scoped gaps, unit preservation/conversion, repeated equal readings, contradictory/ambiguous chronology, independent edits, retained deletion identities, reopening, keyboard entry, 320px layout, 200% text, and real IndexedDB abort/retry without duplicate records.
- Schema 2 explicitly validates and migrates the preceding schema 1 collection. Vehicle values, stable IDs, unknowns, and existing deletion markers survive unchanged. The IndexedDB version/store/key is unchanged, with no reset. No authentication or Worker code changed.
- [History module contracts and purpose/verification ledger](../../../documentation/history.md) record the date representation, migration, public testing seams, every affected UI element/style, screenshots, and remaining physical-device/screen-reader checks.

### Standards review

Reviewed `git diff 09808df15f0a10346f720a849a8dd954dbeead6f...HEAD` against the repository standards. One P3 finding: repeated conflict pairs generated redundant warning paragraphs. The fix deduplicates visible messages per record while preserving supporting evidence. A regression reproduced six paragraphs for three conflicting records before the fix and verifies three after. The standards reviewer confirmed resolution; no additional actionable violations or smell findings.

### Spec review

Two P2 findings: a vehicle correction could be ignored when retrying a failed session save; equal mileage could hide unresolved overlapping approximate-date order. Corrections now retain record identity and validate the chosen vehicle through retry. Equal readings remain nonconflicting while uncertain date order is exposed and the summary lists candidate latest dates. Public-module and browser regressions cover both. The specification reviewer confirmed both fixes and found no introduced defect.

Final review counts: Standards 0 outstanding (1 resolved, P3); Spec 0 outstanding (2 resolved, P2).

## Verified car-action follow-up — 2026-11-21

- Released runtime: [ab4dfe0a444105a6da95679e5601b958eb2597cf](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/ab4dfe0a444105a6da95679e5601b958eb2597cf), committed and pushed to `main`.
- [Pages deployment succeeded](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44986982648); [application checks passed](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44986982713). All seven deployed runtime assets match the release; content version is `cf4ee93be591`.
- Local checks: 25 module tests and 71 browser tests passed; the existing WebKit forced-colors emulation test is skipped. Published-site checks: 39 successful desktop Chromium, phone Chromium and phone WebKit journeys.
- The reported inactive buttons were caused by current HTML using old cached modules. A regression reproduces the upgrade with actual earlier assets cached; content-versioned transitive URLs fix it without clearing browser data. Both history buttons were also verified in the owner's Chrome profile. The owner's open Fuel up draft was left untouched; verification used a separate tab.
- Car actions, blank native date/number fields, secondary missing-record annotations, vehicle deletion, L/US/Imperial fuel units, collapsed optional creation fields, and stable Base36 timestamp vehicle IDs are implemented. Schema 3 retains preceding data; no reset was needed.
- Standards review of `fd7a548...ab4dfe0`: 0 actionable findings. Spec review against the owner's refinements: 0 actionable findings.
- Reviewed all 14 remaining/completed ticket descriptions and updated the source stories, glossary, and [ticket plan](../ticket-plan.md#car-action-story-review--2026-11-21). Detailed maintenance, oil/tire tracking and fuel economy remain future work; their forms must extend the delivered car actions.

Try it: Open or add a vehicle, choose **Record history**, then **Change oil** or **Fuel up**. Enter that action's date and known mileage, save, and inspect **View history**. New actions start blank. Edit or remove one record and check the summary; reopen the app to confirm history returns. **Mark missing records** is available separately from history review. Vehicle setup offers fuel units, optional details, stable-identity renaming, and confirmed deletion. Data remains local until later transfer/Gist tickets.

