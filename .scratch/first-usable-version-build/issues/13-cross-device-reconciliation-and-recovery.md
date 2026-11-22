# 13: Reconcile device changes and recover uncertain saves

**What to build:** Combine independent phone/desktop changes, resolve conflicting edits with both versions visible, and recover work after failed or uncertain cloud operations.

**Blocked by:** [Load and save a vehicle collection in GitHub Gists](12-load-and-save-gist.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 9; device merge, in-flight saves, recovery, and accepted concurrency limit.

**User-story coverage:** 59, 60, 61, 62, 63, 66.

## Acceptance criteria

- [ ] Use the shared base, current local state, and fresh remote collection for reconciliation by stable ID. Combine independent additions/changes and equal edits without duplicating records.
- [ ] Show conflicting same-record edits and edit/delete conflicts for user choice; retain both versions and validate the candidate through History before applying it. Never pick by timestamp alone.
- [ ] Treat retained deletion markers distinctly from absence in older copies. Handle missing ancestry conservatively without inventing deletions.
- [ ] Apply the same protection on explicit Load with unsaved changes and preserve local recoverable snapshots throughout review, cancellation, and failures.
- [ ] Demonstrate that edits arriving during a network request remain pending after that request succeeds. Advance baselines only for the snapshot actually confirmed.
- [ ] On an uncertain save result, inspect remote state and preserve retry/recovery options without silent duplication or overwrite. Expose recovery copies in a usable UI and preserve selected account/Gist separation.
- [ ] Serialize requests within a client and honor provider retry guidance. Document the accepted race between different clients' read and write; do not add a coordinated writer to the authentication Worker or promise atomic Gist saves.
- [ ] Test independent additions, equal/divergent edits, edit/delete, interrupted load/save, missing ancestry, account switch, in-flight edits, and recovery via public interfaces and a two-client browser scenario.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This completes the reconciliation behavior introduced by JSON imports and safely guarded in the initial Gist slice. Normal single-device cloud use remains independently demonstrable before this ticket.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

Consult the [platform research](../../first-usable-version/research/github-and-local-storage.md) for GitHub/Cloudflare constraints, and revalidate relevant official provider documentation during implementation.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

