# 11: Set up Cloudflare and GitHub sign-in

**What to build:** Guide the owner through necessary Cloudflare/GitHub account steps, configure and deploy the authentication Worker and GitHub OAuth application, and complete a real session-only sign-in from the GitHub Pages frontend.

**Blocked by:** [Export, preview, and merge JSON backups](04-json-backup-and-merge.md), [Track oil use and forecast the next oil change](05-oil-history-and-forecasts.md), [Forecast remaining tire distance and seasons](08-tire-life-forecasts.md), [Use incomplete mileage in fueling estimates](10-fuel-economy-with-estimated-mileage.md)

**Dependency type:** User-requested phase gate: finish and deploy the local feature milestones before beginning cloud setup. The underlying technical prerequisite is the application shell, already transitive.

**Status:** ready-for-agent

**Source specification:** [CarMaintenanceTracker: first usable version](../../first-usable-version/spec.md). Relevant sections: Implementation Decisions 10–11; Worker/authentication and real-origin verification requirements.

**User-story coverage:** 57, 63, 64, 65, 67.

**Human participation:** Account access/verification, GitHub authorization, and protected credential entry; agent prepares the code, configuration, deployment workflow, and tests.

## Acceptance criteria

- [ ] Prepare the working Worker and browser login flow, configuration, and tests before asking the user for human-only setup actions. Recheck current official provider documentation while implementing.
- [ ] Include Cloudflare account access/creation and email verification assistance, Worker project/address configuration, GitHub OAuth application registration, exact frontend callback configuration, and the correct allowed frontend origin.
- [ ] Use the wizard skill only for human-only steps, with precise instructions and secure value capture; automate configuration that does not require human identity/consent. Keep public configuration and secret destinations explicit.
- [ ] Keep the client secret in a Cloudflare secret binding; request Gist access without repository scopes. Do not commit secrets or place them in vehicle JSON, redirect URLs, exports, or logs.
- [ ] Implement unpredictable OAuth state and S256 PKCE; verify callback state and exchange the code/verifier through a Worker that targets fixed GitHub auth endpoints and validates request method/input/origin.
- [ ] Implement session-only browser credential handling, sign-in status, sign-out, and expiry/revocation recovery while preserving local history. Do not create durable remembered credentials in IndexedDB/localStorage.
- [ ] Deploy the prepared authentication endpoint and relevant frontend login flow, then verify actual GitHub sign-in from the configured Pages origin. Record the public deployment details and verification result; mocks alone cannot complete this ticket.
- [ ] Test invalid callback state, invalid inputs/origin, denied authorization, failed/expired exchange, sign-out/reload/close behavior, and secret exclusion. Preserve the accepted shared-origin limitation without claiming namespaces provide isolation.
- [ ] Keep the Worker authentication-only: no vehicle database, general CORS proxy, Gist write coordinator, or Azure dependency.

- [ ] After this ticket's checks pass, integrate its changes through the repository workflow into the configured GitHub Pages publishing branch, commit and push to GitHub, wait for the Pages deployment to finish, and verify the published app at https://jpconstantineau.github.io/CarMaintenanceTracker/. A feature-branch push or local test alone does not complete the ticket.
- [ ] Verify that user records from preceding published versions remain usable. Include and test non-destructive migrations if this slice changes the persisted format; never reset IndexedDB, change stable identities, or discard earlier observations merely to ship the next feature.
- [ ] Report the live app URL, deployed commit/release evidence, and short steps the user can perform to test this slice. Complete each ticket only after its working feature is available live; coordinate a compatible Worker deployment when authentication code changes.

## Delivery after this ticket

Publish this slice independently after integration, wait for successful deployment, and hand the user a live feature to test. Parallel implementation is allowed, but shared-branch integration and deployment are serialized one completed ticket at a time. Preserve earlier releases' user data and keep previously delivered features working. Browser-local data remains per-device until Gist support is delivered; JSON import/export provides manual transfer once available.

## Scope and handoff

This ticket begins the cloud-integration phase after the locally testable feature milestones have shipped. Its listed blockers are an explicit user-requested release-order gate, not a claim that OAuth technically depends on oil, tires, or fuel economy. Human participation is required for account verification, authorizations, and protected credential steps. The local app and JSON backups remain usable while cloud setup proceeds.

Work from the source specification and [domain glossary](../../../GLOSSARY.md). Use the approved public-module testing approach and add meaningful tests with this slice; later release verification does not replace its own coverage. Preserve raw observations, stable identity, explicit unknowns, and date/unit precision as applicable. Any new record type must integrate with the shared validation and persistence/serialization contract. Apply purposeful-web-design when implementing HTML/CSS, and use the project's deep-module vocabulary when changing interfaces.

Consult the [platform research](../../first-usable-version/research/github-and-local-storage.md) for GitHub/Cloudflare constraints, and revalidate relevant official provider documentation during implementation.

The user approved this breakdown on 2026-11-21. This ticket is ready for implementation once its blockers are complete; the closed wayfinder decisions remain separate.

