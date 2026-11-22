# 12: Load and save a vehicle collection in GitHub Gists

**What to build:** Use the signed-in account to select/create one secret Gist for all vehicles, explicitly load and save it, and see which snapshot is saved locally versus on GitHub.

**Blocked by:** [Set up Cloudflare and GitHub sign-in](11-cloudflare-github-sign-in.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 9–10; Gist discovery, ownership, format and save-status requirements.

**User-story coverage:** 58, 59, 62, 63, 66.

## Acceptance criteria

- [ ] Discover matching app Gists with pagination and recognizable format markers; validate ownership and contents. Ask the user to select if multiple matches exist, and remember association by numeric GitHub account/Gist identity.
- [ ] Create a secret Gist only through an explicit Save when none is selected; include the complete supported versioned collection. State its unlisted/URL-readable visibility in the relevant interaction.
- [ ] Provide explicit Load and Save controls and distinct local/GitHub pending/success/failure states. Reuse validated portable data and local import-preview operations.
- [ ] Capture the loaded remote revision/content baseline. Fetch current remote content before writes. In this slice, safely stop and preserve both copies if remote changes or local/remote divergence need the later reconciliation workflow; never silently overwrite them.
- [ ] Preserve unsaved local work on Load and require an explicit review/choice before replacing it. Account/Gist switches must not silently mix collections or upload another account's work.
- [ ] Preserve data on auth expiry, networking failure, missing Gists, malformed/newer schema, and truncated responses. Fetch complete supported content or refuse; avoid sending credentials to arbitrary imported URLs.
- [ ] Bind a save result to the exact transmitted snapshot so later edits remain pending. Keep uncertain outcomes recoverable and do not silently create replacement Gists or retry destructive writes.
- [ ] Verify actual discovery/create/read/update against intentionally designated test data and the deployed origin; add controlled-response tests for pagination, wrong ownership, invalid/truncated content, revoked access, and failures.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

Complete safe single-device cloud use here. Divergence is explicitly blocked with retained copies until the next ticket adds the full cross-device merge experience; this is not permission for an unsafe temporary overwrite path.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

Consult the [platform research](../../first-usable-version/research/github-and-local-storage.md) for GitHub/Cloudflare constraints, and revalidate relevant official provider documentation during implementation.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

