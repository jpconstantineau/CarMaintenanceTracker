# 01: Create and reopen local vehicles

**What to build:** Create or select a personal vehicle, edit its identifying information, and reopen it with local data intact. Establish the module and persistence contracts through this usable flow, replacing the scaffold's transient vehicle list.

**Blocked by:** None (can start immediately).

**Status:** complete

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 1–5, 9; Testing Decisions.

**User-story coverage:** 1, 2, 3, 4, 7, 51, 52, 68, 69, 70.

## Acceptance criteria

- [x] Keep the runtime vanilla HTML/CSS/JavaScript and provide the vehicle selection/create screen followed by a selected-vehicle summary. Setup shows name, miles/kilometres and Fuel units (litres, US gallons, Imperial gallons). Make/model/year/notes remain under native Optional details, collapsed on creation and expanded on edit; validation reveals hidden invalid fields.
- [x] Allow several vehicles, editing their identifying details and switching between them without mixing data. An old vehicle with no historical readings is a valid collection; display missing mileage/history honestly.
- [x] Create new vehicle IDs from the current millisecond timestamp converted to Base36, resolve local collisions including deleted IDs, and preserve identity/history when renaming. Keep IDs out of the setup form.
- [x] Offer Delete vehicle from edit, with confirmation identifying the car and its associated history. Preserve other vehicles and retain deletion markers for the removed car and records.
- [x] Establish stable collection/record IDs, the application format/schema version, the shared validated serialization contract, and extension points for later typed records. Preserve factual values rather than persisting forecasts as authoritative data.
- [x] Establish the four agreed module interfaces and initialize IndexedDB, using the highest useful public interfaces. Do only the refactoring necessary for this working slice; no separate framework migration.
- [x] Automatically save recorded changes locally and prove that reopening restores the selected collection. Display local-save success only after the transaction completes; on failure preserve editable work and expose the failure.
- [x] Create the test harness and representative phone/desktop browser coverage for creation, editing, multiple-vehicle isolation, reopening, and storage failure. Exercise real IndexedDB in browser integration coverage.
- [x] Make labels, keyboard access, responsive entry, and validation usable; apply purposeful-web-design and retain its required purpose/verification ledger for the actual UI.

- [x] Verify or establish the repository's GitHub Pages publishing source and a reliable per-ticket deployment/verification path. Publish this first local-vehicle slice with working controls; clearly distinguish later unavailable features from usable actions.
- [x] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [x] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [x] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This is the foundation slice, not a standalone schema/tooling ticket. It establishes the collection contract later slices extend. GitHub authentication is not needed to complete local use.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

## Verified release — 2026-11-21

- Live app: https://jpconstantineau.github.io/CarMaintenanceTracker/
- Implementation commit: [a936278b51e7eb41b41fe3dcce66859100cabcfa](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/a936278b51e7eb41b41fe3dcce66859100cabcfa), integrated and pushed to `main`.
- Publishing source verified through GitHub API: `main` / `/docs`.
- [Pages deployment succeeded](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44977965799); the build reports the implementation SHA, and all seven runtime assets match the commit.
- [GitHub application checks passed](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44977966887). Local verification: 12 module tests and 30 browser tests. Published-site verification: 12 additional successful journeys across desktop Chromium, phone Chromium and phone WebKit.
- Coverage includes name/units-only creation, optional details, edits, independent vehicles, selected collection restoration, full browser restart, keyboard validation, long/literal text, real IndexedDB commit/abort/retry, stale-tab protection, v1 fixture preservation, and refusal to overwrite unsupported stored versions.
- The preceding scaffold had no persisted records; no migration or reset was needed. The permanent v1 fixture establishes compatibility coverage for the next release. No authentication/Worker code changed.
- [Module and release contracts](../../../documentation/vehicle-foundation.md) and [purpose/verification ledger](../../../documentation/vehicle-ui-ledger.md) are retained. Physical phone keyboard and real screen-reader testing remain human checks; automated emulation does not claim those checks.

Try it: Add a vehicle with a name and units, edit its optional details, then add a second vehicle through All vehicles. Switch back to the first vehicle, wait for “Saved on this device,” and close/reopen the browser. The selected vehicle and its details return. Missing mileage/history stays unknown. Data is local to this browser/device; Gist sync and JSON transfer are later tickets.
