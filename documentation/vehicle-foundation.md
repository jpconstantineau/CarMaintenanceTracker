# Local vehicle foundation

Ticket: `.scratch/first-usable-version-build/issues/01-create-and-reopen-vehicles.md`.

## Public module interfaces

Runtime stays vanilla ES modules. `docs/app.js` wires Interface to Storage; no build step or runtime dependencies. Tests cross the same public interfaces as the screens.

| Module | Interface and invariants |
| --- | --- |
| History (`history.js`) | `createCollection()`, `getVehicle(collection, id)`, `saveVehicle(collection, details, id?)`, `removeVehicle(collection, id)`, `validateCollection(collection)`. Creation requires name and `odometerUnit` (`km`/`mi`); other details default to unknown/empty. Operations return a new collection; reads return a detached vehicle. Invalid operations throw an actionable `ValidationError` with an optional field, without changing the input. Updates retain IDs and creation time; removals retain tombstones. |
| Calculations (`calculations.js`) | `summarizeVehicle(collection, id)` returns the vehicle, explicit unavailable mileage and history evidence. Pure, no persistence, DOM, network or implicit evaluation date. Vehicle age never becomes an observation. Later record tickets extend these outputs with factual evidence. |
| Storage (`storage.js`) | `serialize(collection)` / `deserialize(json)` share History validation. `createLocalStorage({indexedDB?, databaseName?})` returns `load()` / `save(snapshot)`. Load returns null only for a genuinely empty store. Save resolves `{revision}` only on transaction completion; rejects on abort or stale revision. Callers await saves, retain editable state on rejection, and use the returned revision for the next save. |
| Interface (`interface.js`) | `start(document, storage)` loads and presents the local collection, manages native form interactions, focus, selection and save status. Domain validation and summaries stay behind their modules. The storage dependency is the seam for controlled failures; production uses real IndexedDB. A failed initial read blocks new collection writes. |

The modules provide depth through complete operations: callers do not coordinate individual IndexedDB requests, mutate record arrays or invent missing-history rules. Typed-event, import/merge and Gist methods belong to later working slices, not placeholder callable actions in this release.

## Portable format and local persistence

Version 1 uses `{format: "car-maintenance-tracker", schemaVersion: 1, id, vehicles, records, tombstones}`. Collection, vehicle, and deletion identities are UUID v4. Vehicle details retain name, original odometer units, optional make/model/year/notes, and ISO creation/edit timestamps. Unknown year is null; unknown optional text is empty. No current mileage, computed forecast, credential, account association, or selected-vehicle setting goes in portable JSON.

`records` is the extension point for factual typed records. This release supports an empty list. Adding a kind requires a full validator in History, its reference/unit/date-precision invariants, public operations, and serialization/storage fixtures. Unsupported kinds, versions and fields are refused rather than projected away. Future schema changes must explicitly migrate older collections before validation and add non-destructive fixture coverage. Preserve IDs, raw values, deletion markers and unknowns. Never delete/recreate the database to ship a feature.

IndexedDB namespace `car-maintenance-tracker`, database version 1, object store `workspace`, key `active` holds `{json, selectedVehicleId, revision}`. Schema version and database version are distinct. The entire local snapshot commits atomically; selected-vehicle changes also commit. A revision comparison in the same read/write transaction refuses stale-tab overwrites. This is not a cross-device synchronization protocol. A conflict retains the current form and asks the owner to compare using another tab before reloading.

The preceding published scaffold (repository commit `5d517fa9ea696f8265577c228d5fa0a9014b973b`) only held transient arrays, with no IndexedDB/localStorage/sessionStorage writes and no supported durable format. There is no legacy durable data to migrate and no database reset. `tests/fixtures/collection-v1.json` establishes the baseline for future releases; browser coverage opens it in real IndexedDB, adds another vehicle, and checks unchanged IDs, values and deletion markers. Unsupported stored versions remain untouched and block writes.

Details become recorded changes when the owner submits Create vehicle or Save changes. Each successful operation automatically saves locally; there is no separate collection-save step. Unsaved form edits are labeled, cancelable, and protected by a browser unload prompt where supported. The status distinguishes unsaved, saving, saved, and failed. Failure retains the form and allocated identity so retry does not create duplicates. Browser eviction/clearing site data can still remove local data; Gist sync and portable transfer arrive in later tickets.

## Verification and release workflow

Run `npm ci`, `npx playwright install chromium webkit`, then `npm run check` (on Linux use `--with-deps` when installing browsers). Node tests exercise domain/serialization interfaces. Browser tests exercise real IndexedDB, desktop Chromium (1280×900), phone Chromium and phone WebKit (390×844), plus a 320px overflow check. Browser profiles and screenshots live under ignored `test-results/`.

Pages was verified through GitHub's API as branch publishing from `main`, folder `/docs`. The existing GitHub Pages build/deployment workflow handles publication. The Check application workflow independently runs the tests on pushes and PRs. Complete local checks before pushing the publishing branch; branch publishing does not wait for that independent CI job.

Per-ticket delivery:

1. Inspect the diff and run the ticket's checks, including the established v1 persistence fixture. Integrate into `main` without dropping another ticket's work; only one completed ticket deploys at a time.
2. Commit and push `main`. Capture the full commit SHA.
3. Run `node scripts/verify-pages.mjs <full-SHA>` until it exits 0. Exit 2 means the build or CDN content is not yet the requested release. It verifies the configured source, successful Pages build commit, and every runtime asset against that Git commit. It also reports Actions run URLs/status. Credentials are read from Git's configured credential helper in memory and sent only to GitHub's API.
4. Wait for Check application and Pages deployment success. Then run the real-site journeys: in PowerShell, `$env:APP_URL='https://jpconstantineau.github.io/CarMaintenanceTracker/'; npm.cmd run test:browser -- --grep '@live'`. Test contexts have isolated local profiles and do not modify the owner's browser records.
5. Report the app URL, commit, successful deployment URL, tests and a short manual journey. Mark the ticket complete only after live verification. No Worker change is needed for this local-only slice.

References: [IndexedDB transaction completion](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event), [GitHub Pages branch publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
