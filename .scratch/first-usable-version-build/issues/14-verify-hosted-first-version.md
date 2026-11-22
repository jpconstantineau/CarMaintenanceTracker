# 14: Verify the hosted first version across devices

**What to build:** Deliver a verified hosted first version with complete vehicle summaries, usable phone/desktop workflows, working real GitHub access, and documented setup/recovery procedures.

**Blocked by:** [Reconcile device changes and recover uncertain saves](13-cross-device-reconciliation-and-recovery.md)

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Testing Decisions: Release verification; Implementation Decisions 11.

**User-story coverage:** 5, 6, 7, 51, 52, 58, 59, 62, 63, 64, 65, 66, 67, 68.

**Human participation:** Real GitHub consent/test-account access as needed; provider account setup is already owned by the sign-in ticket.

## Acceptance criteria

- [ ] Verify every completed feature contributes its summary/detail and evidence states consistently, including missing history, old vehicles, fuel estimates, oil, tire placement, and uneven wear. Resolve integration defects without deferring each feature's own tests to this ticket.
- [ ] Run the full approved behavior suite and representative real browser journeys for phone and desktop, checking keyboard use, labels, responsive data entry, purpose/verification ledgers, and reviewable errors.
- [ ] Verify action-first entry for fueling, oil changes/checks, tire changes/rotations/tread measurements and other maintenance; native date/numeric odometer fields start blank per action. Check collapsed optional creation details, distinct fuel units, stable-ID rename and confirmed car deletion.
- [ ] Upgrade an existing browser with prior JavaScript/styles cached, without clearing its data, and verify both Record history and View history work. Ensure every transitive runtime asset uses the deployed content version.
- [ ] Deploy/verify the integrated frontend against the configured authentication Worker and designated test Gist, proving real authorization and discovery/create/load/update for the final collection schema.
- [ ] Exercise phone and desktop with independent edits, conflicting edits, deletions, load with local work, sign-out/new session, expired/revoked access, edits during save, and uncertain-response recovery.
- [ ] Verify complete JSON backup, idempotent import, previewed merge, recoverable replacement, and refusal of invalid/newer/truncated data using the final domain record set.
- [ ] Exercise denied/quota local storage, raw unknown/date-precision preservation, unit conversions, known gaps, and approximate forecasts. Confirm credentials are absent from exported data and logs.
- [ ] Provide reproducible public setup/deployment configuration and concise operating/recovery documentation, including user-only setup steps, the secret-Gist visibility model, and the accepted simultaneous-write limitation.
- [ ] Record actual validation evidence and any remaining limits against acceptance criteria; successful account provisioning or a token alone does not complete the release.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Follow the owner's early-development schema policy: a new data version may clear development data instead of migrating it; document any reset in release notes. If data is retained, preserve IDs and factual values and test supported versions. Ordinary save/load failures and incompatible imports must not clear data.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Keep previously delivered features working and follow the early-development schema policy above. Verify returning browsers with cached assets as well as fresh sessions. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This is final integration and deployed verification, not the first usable release or a deferred testing phase. Every preceding slice ships and is tested separately. Its direct blocker is completed cloud reconciliation; the local feature paths and setup are already transitive through the cloud-phase gate.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

Consult the [platform research](../../first-usable-version/research/github-and-local-storage.md) for GitHub/Cloudflare constraints, and revalidate relevant official provider documentation during implementation.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

