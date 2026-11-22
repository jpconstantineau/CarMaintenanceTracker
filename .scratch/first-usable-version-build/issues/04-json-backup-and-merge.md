# 04: Export, preview, and merge JSON backups

**What to build:** Export a portable collection, import an app JSON file with a reviewable merge, and restore a collection through a separate recoverable replacement action.

**Blocked by:** [Record and correct dated vehicle history](02-record-and-correct-history.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 3, 9; import/export and reconciliation acceptance cases.

**User-story coverage:** 53, 54, 55, 56, 64.

## Acceptance criteria

- [ ] Export the versioned collection with IDs, units, explicit unknowns/date precision, settings, and retained deletion information. Never include credentials, authorization state, or local account/Gist bindings.
- [ ] Read and validate the entire app-exported input before mutating current data. Reject unsupported versions, malformed content, invalid types/references, and impossible tire placements once their types exist.
- [ ] Preview additions and differing versions of existing IDs. Merge independent records, deduplicate equal records, and ask for choices on differing content or edit/delete conflicts; without shared ancestry, absence is not deletion.
- [ ] Make repeated imports idempotent by stable record identity. Do not infer identity merely from matching vehicle names, dates, or labels.
- [ ] Preserve Base36 timestamp vehicle IDs and history references through rename/export/import. Surface divergent same-ID vehicles, including independent timestamp collisions, for review; do not silently combine their histories. Cover whole-vehicle cascade deletion markers as well as record deletions.
- [ ] Provide a separate complete-replacement action, retain and expose a usable recovery copy first, and abort replacement if that snapshot cannot be saved.
- [ ] Keep preview/reconciliation logic reusable at its public interface for later Gist merging, while delivering the complete local JSON workflow now.
- [ ] Exercise ordinary export/import, repeated imports, deletions, mismatched IDs, cancellation, invalid/newer schema, replacement recovery, and IndexedDB failures through public-interface and browser tests.
- [ ] Use the shared schema extension contract so domain slices add their new record validators and round-trip tests without rewriting the import UI. Support only implemented/recognized formats; do not promise legacy scaffold or spreadsheet conversion.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This slice requires the common factual-record/deletion contract from dated history, not completion of every future domain feature. Later domain tickets must extend the same portable format.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

