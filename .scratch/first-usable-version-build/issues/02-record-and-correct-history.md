# 02: Record and correct dated vehicle history

**What to build:** Record odometer readings and general observations, enter several dated records together, inspect the vehicle history, and correct or remove old entries without losing unknowns or chronology.

**Blocked by:** [Create and reopen local vehicles](01-create-and-reopen-vehicles.md)

**Status:** complete

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 2–5; shared-evidence acceptance cases.

**User-story coverage:** 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 43, 49.

## Acceptance criteria

- [x] Provide a dated entry session with shared vehicle/date/odometer defaults and distinct editable records. Support odometer-only and general observations; absence of a reading is not zero.
- [x] Support exact day, month, or year precision, out-of-sequence creation, and multi-year history. Keep event date separate from edit metadata and do not invent days or service events.
- [x] Show latest known mileage with its date on the vehicle summary and drill into the history. Use readings from any event type through one mileage-evidence interface that later domain slices can extend.
- [x] Provide edit/removal through public History operations and retain identity/deletion information needed for later reconciliation. Changing one saved record must not silently alter sibling records entered in the same session.
- [x] Preserve partial records, mark known gaps by affected history type/span, and expose contradictory/ambiguous chronology for review. Repeated equal mileage evidence is not a false conflict; inconsistent evidence must not silently overwrite another reading.
- [x] Recompute affected summary/timeline results when records are backfilled, edited, or removed. An observed initial mileage does not imply original service history.
- [x] Extend validation, serialization, IndexedDB persistence, and tests for these record kinds, including approximate dates, unknown values, gaps, edits/deletions, and round-trip preservation.
- [x] Verify a phone/desktop user can record a session, inspect it, backfill an older observation, correct it, and reopen the unchanged factual history.

- [x] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [x] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [x] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Deliver generic dated observations and chronology here. Domain-specific forms and projections belong to the maintenance, oil, tire, and fueling slices. Establish the known-gap mechanism without requiring those later screens.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

## Verified release — 2026-11-21

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

Try it: Open or add a vehicle, choose **Record history**, enter a default date such as `2024-06` and mileage, then add an observation and an odometer reading. Override the older record's date/mileage, save, and inspect **View history**. Edit or remove one record and check the updated summary. Reopen the app to confirm the factual history returns. **Add known gap** records a missing history type/span without inventing readings or completed service. Data remains local to this browser/device until later transfer/Gist tickets.

