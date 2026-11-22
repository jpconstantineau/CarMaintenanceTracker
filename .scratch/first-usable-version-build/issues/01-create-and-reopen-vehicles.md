# 01: Create and reopen local vehicles

**What to build:** Create or select a personal vehicle, edit its identifying information, and reopen it with local data intact. Establish the module and persistence contracts through this usable flow, replacing the scaffold's transient vehicle list.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 1–5, 9; Testing Decisions.

**User-story coverage:** 1, 2, 3, 4, 7, 51, 52, 68.

## Acceptance criteria

- [ ] Keep the runtime vanilla HTML/CSS/JavaScript and provide the vehicle selection/create screen followed by a selected-vehicle summary. Creation requires only a recognizable name and miles/kilometres; make/model/year/notes are optional.
- [ ] Allow several vehicles, editing their identifying details and switching between them without mixing data. An old vehicle with no historical readings is a valid collection; display missing mileage/history honestly.
- [ ] Establish stable collection/record IDs, the application format/schema version, the shared validated serialization contract, and extension points for later typed records. Preserve factual values rather than persisting forecasts as authoritative data.
- [ ] Establish the four agreed module interfaces and initialize IndexedDB, using the highest useful public interfaces. Do only the refactoring necessary for this working slice; no separate framework migration.
- [ ] Automatically save recorded changes locally and prove that reopening restores the selected collection. Display local-save success only after the transaction completes; on failure preserve editable work and expose the failure.
- [ ] Create the test harness and representative phone/desktop browser coverage for creation, editing, multiple-vehicle isolation, reopening, and storage failure. Exercise real IndexedDB in browser integration coverage.
- [ ] Make labels, keyboard access, responsive entry, and validation usable; apply purposeful-web-design and retain its required purpose/verification ledger for the actual UI.

- [ ] Verify or establish the repository's GitHub Pages publishing source and a reliable per-ticket deployment/verification path. Publish this first local-vehicle slice with working controls; clearly distinguish later unavailable features from usable actions.
- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This is the foundation slice, not a standalone schema/tooling ticket. It establishes the collection contract later slices extend. GitHub authentication is not needed to complete local use.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

