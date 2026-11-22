# 04: Export, preview, and merge JSON backups

**What to build:** Export a portable collection, import an app JSON file with a reviewable merge, and restore a collection through a separate recoverable replacement action.

**Blocked by:** [Record and correct dated vehicle history](02-record-and-correct-history.md)

**Status:** complete

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 3, 9; import/export and reconciliation acceptance cases.

**User-story coverage:** 53, 54, 55, 56, 64.

## Acceptance criteria

- [x] Export the versioned collection with IDs, units, explicit unknowns/date precision, settings, and retained deletion information. Never include credentials, authorization state, or local account/Gist bindings.
- [x] Read and validate the entire app-exported input before mutating current data. Reject unsupported versions, malformed content, invalid types/references, and impossible tire placements once their types exist.
- [x] Preview additions and differing versions of existing IDs. Merge independent records, deduplicate equal records, and ask for choices on differing content or edit/delete conflicts; without shared ancestry, absence is not deletion.
- [x] Make repeated imports idempotent by stable record identity. Do not infer identity merely from matching vehicle names, dates, or labels.
- [x] Preserve Base36 timestamp vehicle IDs and history references through rename/export/import. Surface divergent same-ID vehicles, including independent timestamp collisions, for review; do not silently combine their histories. Cover whole-vehicle cascade deletion markers as well as record deletions.
- [x] Provide a separate complete-replacement action, retain and expose a usable recovery copy first, and abort replacement if that snapshot cannot be saved.
- [x] Keep preview/reconciliation logic reusable at its public interface for later Gist merging, while delivering the complete local JSON workflow now.
- [x] Exercise ordinary export/import, repeated imports, deletions, mismatched IDs, cancellation, invalid/newer schema, replacement recovery, and IndexedDB failures through public-interface and browser tests.
- [x] Use the shared schema extension contract so domain slices add their new record validators and round-trip tests without rewriting the import UI. Support only implemented/recognized formats; do not promise legacy scaffold or spreadsheet conversion.

- [x] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [x] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [x] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This slice requires the common factual-record/deletion contract from dated history, not completion of every future domain feature. Later domain tickets must extend the same portable format.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

## Review — 2026-11-21

Fixed point: `66c37ded6bcd4ef1eb6019e1bcf3a78f3136c9ec`. Initial implementation: `8ce72cb`.

### Standards

The reviewer identified one P2 violation of DESIGN.md's linked, nearby validation requirement: missing conflict choices were reported only at page level. Each unanswered group now has a nearby error linked to all its radios through aria-describedby and aria-invalid, with feedback cleared when answered or covered by a whole-branch choice. A red-before-green browser regression verifies the accessible description and clearing behavior. Follow-up review confirmed it resolved, with no new standards or substantive smell findings.

### Spec

The reviewer identified one P2 separation problem: a valid file with a merge-only ID collision also lost access to complete replacement. Independent schema validation now remains separate from compatibility with the current collection. A valid but unmergeable file lists its contents, explains the conflict and permits recoverable replacement; invalid files permit neither action. A red-before-green browser regression verifies replacement and the retained original recovery copy. Follow-up review confirmed it resolved, with no new specification findings.

Final review counts: Standards 0 outstanding (1 resolved); Spec 0 outstanding (1 resolved).

## Verified release — 2026-11-21

- Live app: https://jpconstantineau.github.io/CarMaintenanceTracker/
- Reviewed release: [88ca7cbb2f0b7ac04dd006bcc7a99338682814b1](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/88ca7cbb2f0b7ac04dd006bcc7a99338682814b1), committed and pushed to main.
- [Pages deployment succeeded](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44991163694); publishing remains main / docs. The deployed build reports the release SHA, and all seven runtime assets match that commit. Content version: `a1d139dcd575`.
- [GitHub application checks passed](https://github.com/jpconstantineau/CarMaintenanceTracker/actions/runs/44991164631). Final local checks: 40 module tests, 101 browser tests, syntax checks and asset validation passed; the existing WebKit forced-colors emulation case is skipped. All 51 published-site journeys passed across desktop Chromium, phone Chromium and phone WebKit.
- Delivered complete JSON export, full validation, review/cancel, idempotent merge by stable identity, explicit version/deletion/vehicle-collision choices, and separate recoverable replacement. Recovery remains downloadable after reload. Real IndexedDB abort and stale-write tests preserve original data and expose retry/export.
- Schema remains 4 with supported versions 1–3 retained through the existing validated conversion. No data reset, credential-bearing export, authentication change or Worker deployment. Cached v1, v3 and immediately preceding v4 runtime upgrades all pass without clearing browser data.
- [Backup contracts and UI verification ledger](../../../documentation/backups.md) records the public interface, conflict/cascade behavior, settings and precision preservation, every added UI element/style, screenshots and remaining physical-device/screen-reader checks.

Try it: Choose **JSON backups**, then **Export JSON**. Select the downloaded file and choose **Preview import**; it should show no additions or conflicts. Choose **Merge import** and repeat to confirm no duplicates. To transfer data, import that file in another browser/device. For a full restore, review the file and use **Replace entire collection**; **Download recovery copy** retrieves the previous collection, which can be reviewed and imported again. Local history remains per-device until Gist support is delivered.

