# Verify GitHub authentication and persistence platform constraints

Type: research
Labels: wayfinder:research
Status: resolved
Parent: ../map.md
Blocked by: none

## Question

Which currently documented GitHub authentication flows can support a vanilla JavaScript GitHub Pages app reading and writing a user's own Gists, and what platform constraints affect local persistence and safe cross-device saving?

Use official GitHub sources to verify OAuth/PKCE, client-secret and browser CORS requirements, device flow, applicable token types and Gist permissions, Gist visibility, discovery, revisions, and concurrent-update protection. Distinguish documented support from unverified assumptions. Consult MDN or browser standards for IndexedDB versus localStorage, persistence/eviction, and credential separation. Present concrete authentication choices and their hosting consequences; do not provision credentials or implement anything.

## Answer

Research completed 2026-11-21. See [GitHub Gists and local persistence: platform findings](../research/github-and-local-storage.md) for primary-source citations and the pinned Keyboard Layout Editor source comparison.

- Fine-grained PATs now support Gist writes with Gists user write permission; classic PATs can use gist scope. Both allow a manual-token static frontend. OAuth S256 PKCE is documented, but browser-only token exchange CORS remains unverified; a registered app with a trusted exchange service is the conservative sign-in route. KLE's source uses an Azure gatekeeper for that exchange.
- Secret Gists are URL-readable, not private. Discovery is paginated and should validate an app marker, schema, and account identity.
- GitHub explicitly excludes conditional unsafe requests unless an endpoint documents support; Gist PATCH provides no exception or expected revision. Baseline comparison/merge can detect prior changes, but cannot promise atomic cross-device writes. Preserve local work and distinguish local saving from confirmed GitHub saving.
- IndexedDB fits automatic structured local persistence; request durable storage but account for quota, eviction, private sessions, and user clearing. Keep credentials outside data/export formats. Other project pages under the same jpconstantineau.github.io origin share the browser-storage boundary.

Published and verified the report on [the throwaway research branch](https://github.com/jpconstantineau/CarMaintenanceTracker/tree/research/github-and-local-storage), commit [1d45bd36559ac7eb838d62a6854b96fa6bd010fe](https://github.com/jpconstantineau/CarMaintenanceTracker/commit/1d45bd36559ac7eb838d62a6854b96fa6bd010fe). [Published report](https://github.com/jpconstantineau/CarMaintenanceTracker/blob/research/github-and-local-storage/.scratch/first-usable-version/research/github-and-local-storage.md). No PR; never merge this research branch. The shared main checkout was not switched and no unrelated work was committed.

