# GitHub Gists and local persistence: platform findings

Research date: 2026-11-21 (America/Regina). Scope: planning for a vanilla JavaScript app hosted on GitHub Pages. No credentials, services, Gists, or application code were created or changed.

Context: [Verify GitHub authentication and persistence platform constraints](../issues/06-storage-platform-facts.md). The user has accepted one app-managed Gist containing all vehicles in versioned JSON, automatic local saves, and explicit Load from GitHub / Save to GitHub actions. The user also chose to combine independent device changes, ask about conflicting edits to one record or edit/delete conflicts, and preserve local work. This report supplies platform facts; authentication and the residual simultaneous-write limitation remain to be settled.

## Authentication and hosting

GitHub Pages publishes static HTML/CSS/JavaScript. A token-exchange service would therefore be separate infrastructure, even if the frontend stays on Pages. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

| Choice | Documented capability | Consequence for this app |
| --- | --- | --- |
| User-supplied fine-grained PAT | Gist create/update accepts fine-grained PATs with **Gists user permission: write**. | Technically viable with direct REST calls from Pages. User creates and enters a token; this is not a GitHub sign-in button. |
| User-supplied classic PAT | A token with the **gist** scope can operate on the user's Gists. | Technically viable fallback; do not request repository scopes for this task. |
| OAuth app authorization code + PKCE | S256 PKCE is supported; token exchange still lists client_secret as required. | A small backend is the conservative route. Browser-only exchange is not established by these docs. |
| GitHub App user authorization | User tokens use app permissions; web exchange requires client_secret. | An alternative registered app plus exchange service; use a user token for personal Gists, not an installation-token assumption. |
| Device flow | Client ID, device code, grant type; no client secret in exchange. Requires enabling device flow. | Intended for constrained/headless clients. Browser CORS remains a separate question; do not assume this removes hosting needs. |

Sources for permission distinctions: [Gist REST endpoints](https://docs.github.com/en/rest/gists/gists), [OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps), [OAuth authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [GitHub App user tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app).

Fine-grained PAT support for Gists is explicitly documented now; advice that Gists necessarily require classic PATs is stale. Permission is at the user Gists level, not a documented grant to only this application's single Gist. A filename or stored Gist ID is application selection logic, not token isolation. [Gist REST endpoints](https://docs.github.com/en/rest/gists/gists)

GitHub recommends fine-grained PATs where possible, treats PATs as password-equivalent, and frames them as access on one's own behalf. A PAT entry option should be described honestly as manual personal API access, not OAuth. [Managing PATs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

### PKCE and CORS: separate facts

OAuth authorization documents S256 challenge/verifier parameters, state validation, no implicit grant, and lack of CORS preflight support in the authorization section. That preflight statement does **not** establish the response headers of every token/device endpoint. Device polling must respect the returned interval. New OAuth tokens can optionally expire with refresh tokens; expiry handling should not assume permanent credentials. [OAuth authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

GitHub's current security guidance explicitly recognizes public clients, including SPAs, that cannot keep a client secret confidential, and recommends PKCE for them. Thus “client_secret required” alone is **not** proof that GitHub forbids public clients. The same guidance discourages enabling device flow outside constrained environments, and recommends server-side protection of web-app tokens. [OAuth best practices](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)

The REST API at api.github.com documents CORS from any origin, including Authorization and PATCH. Its examples expose ETag and Link. This supports browser-to-Gist REST requests once a token exists. It does **not** establish equivalent support for github.com/login/oauth/access_token or github.com/login/device/code. [REST CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)

**Unverified:** an end-to-end browser-only OAuth or device exchange from the actual Pages origin. No authenticated browser experiment was performed. Avoid committing the product plan to that path without checking current endpoint behavior. A trusted exchange service is a concrete alternative; a generic public CORS proxy is not a suitable credential broker. This is an architectural recommendation, not a claim that all public-client exchanges are impossible.

## Gist visibility, discovery, and recovery

Secret Gists are unlisted, **not private**: anyone who obtains the URL can read them. Public Gists cannot be converted back to secret. Gists are Git repositories with inspectable history and can be cloned/forked. Consequently, removing a sensitive value from the latest JSON does not establish that it disappeared from history or copies. [Creating Gists](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists)

Documented mechanics: authenticated GET /gists lists the user's Gists and is paginated; GET /gists/{id} retrieves one; revision/commit endpoints expose prior versions. File content is truncated above one megabyte, with raw_url for retrieval; beyond ten megabytes Git cloning is needed. These are retrieval constraints, not a recommendation to design a large-file database. [Gist REST endpoints](https://docs.github.com/en/rest/gists/gists)

**Recommended application design:** use a stable marker filename and internal format identifier/schema version, remember the selected Gist ID per GitHub numeric user ID, validate ownership and format when loading, and paginate discovery. If multiple matching Gists exist, ask the user to choose; if none exists, create only during an explicit save. Do not pick the first Gist or create replacements after every network error. GitHub specifically recommends numeric user IDs instead of mutable usernames. [Identity guidance](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)

## Concurrent saves are the important limitation

GitHub explicitly states that conditional unsafe requests (including PATCH) are unsupported unless an endpoint documents an exception. The Gist update endpoint provides no such exception, expected revision, or base-SHA parameter. Its PATCH updates named files while leaving omitted files alone. **Do not promise atomic compare-and-swap via If-Match on Gist PATCH.** [REST conditional requests](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api#use-conditional-requests), [Gist update](https://docs.github.com/en/rest/gists/gists#update-a-gist)

The general CORS allow-list includes If-Match, but accepting a header through browser preflight is not a guarantee that a particular endpoint enforces it. [REST CORS](https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests)

**Inference for the chosen single-JSON design:** reading the remote revision before Save can detect a previously completed competing edit, but another device can still save between that read and this PATCH. A timestamp or revision inside the JSON does not close that race. Re-reading after writing also cannot prove that a later writer will not overwrite it.

**Implementation direction consistent with the user's conflict decision:** retain the last-loaded remote revision and a durable local copy, fetch before explicit saves, merge independent changes against that baseline, pause for overlapping edits or edit/delete conflicts, preserve both versions for user-directed reconciliation, and distinguish local-save success from GitHub-save success. Keep a local snapshot until the remote result is known; preserve later edits made during an in-flight save. This reduces loss and supports recovery but is not an atomic multi-device guarantee. Stronger guarantees would require a different write protocol or a single coordinating writer that controls every write, neither supplied by the documented Gist PATCH contract. Explicit Load also needs a policy for locally modified data.

GitHub recommends serial API requests and rate-limit backoff. A local queue helps one client but is not a cross-device lock. [REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)

## Local persistence and credentials

| Storage | Platform fact | Suggested role |
| --- | --- | --- |
| IndexedDB | Asynchronous, transactional, structured objects and indexes. | Vehicle records, maintenance history, remote baseline and unsent local state. |
| localStorage | Synchronous string key/value storage, shared by same-origin documents, survives browser reopening. | Small non-sensitive preferences if useful. |
| sessionStorage | Scoped by origin and tab; cleared when that tab closes. | Temporary authorization state if that flow requires it. |

Sources: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).

Browser storage defaults to best effort and can be evicted. navigator.storage.persist() requests protection from automatic eviction, but browsers can deny it and users can still clear data. Private browsing usually discards storage when the private session ends. Quota failures must be handled; localStorage is approximately 5 MiB per origin, while IndexedDB limits vary. Local-only data is not a backup or cross-device sync. [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

Origin isolation is scheme/host/port, **not path**. Therefore this project's default Pages URL shares a browser-storage origin with other projects at https://jpconstantineau.github.io/. Namespaced keys prevent accidental collisions, not access by another page on that origin. A dedicated domain/origin would change that boundary. [Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)

**Recommended credential separation:** exclude tokens, refresh tokens and authorization state from vehicle JSON, Gists, exports, import files, and logs. A separate IndexedDB store is organizational separation, not a secure enclave against same-origin scripts. Consider in-memory credentials by default for a manual-PAT version; remembering a token is a distinct product/security decision. A backend session can keep GitHub credentials out of frontend persistence. Do not treat sessionStorage or a JavaScript-readable cookie as protection against compromised page scripts. This recommendation follows the origin boundary above and GitHub's token-storage guidance. [OAuth best practices](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app)

## Keyboard Layout Editor reference

Inspected ijprest/keyboard-layout-editor at **580b916084e69e600b2144b0217c8b1d9710daa0**, the master head reported by GitHub during research (September 2024). This is source inspection, not a test of the deployed site.

- **Authentication:** the popup requests gist scope and checks returned state; the callback calls an Azure-hosted gatekeeper to exchange the authorization code. The token is then stored in a JavaScript-accessible cookie and attached to REST requests. KLE therefore demonstrates a frontend plus external exchange service, not browser-only OAuth. [kb.js login](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/kb.js#L1633-L1695), [oauth.html broker](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/oauth.html#L20-L39).
- **Save/load:** explicit Save creates a Gist or PATCHes the selected one. Files include layout JSON and optional styles/notes. Loading reads recognized filenames; the saved-layout picker filters .kbd.json files. [Save](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/kb.js#L106-L190), [load](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/kb.js#L634-L663), [picker](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/kb.js#L1747-L1766).
- **Local edits:** in-memory undo/redo and a dirty flag drive unsaved-navigation warnings; the warning suggests a bookmarked permalink. No IndexedDB/localStorage autosave appears in the inspected kb.js. The save callback clears dirty unconditionally after success, which is not a sufficient model for edits made while a request is in flight. [Local edit state](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/kb.js#L719-L770), [save callback](https://github.com/ijprest/keyboard-layout-editor/blob/580b916084e69e600b2144b0217c8b1d9710daa0/kb.js#L173-L185).

**Applicability:** adopt the clear explicit cloud actions, app-file recognition and visible failure state as interaction ideas. Add the user's requested automatic durable local saves, format validation, pagination, account separation, in-flight edit tracking and conflict handling. Do not copy historical authentication details as a current recipe: the inspected login has no PKCE, uses Math.random() in state construction, and places tokens in a readable cookie. Current GitHub documentation above governs a new implementation. No claim is made about the security configuration or availability of KLE's external service.

## Remaining decisions and verification

1. Manual fine-grained PAT versus a registered OAuth/GitHub App with an exchange service.
2. Acceptance of secret-Gist URL visibility for the intended maintenance data.
3. Credential lifetime/remembering and what sign-out does to locally stored records.
4. Details of the accepted merge policy: stable record identities, retained deletions, conflicting Load, uncertain Save outcome, account switch, and acceptance or mitigation of the remaining simultaneous-write race.
5. Whether origin sharing is acceptable or the app needs its own domain.

Before implementation is called complete, validate the chosen authentication from the deployed origin; exercise pagination, expired/revoked tokens, corrupt/unsupported JSON, storage denial/quota, edits during a save, and two-device conflicts. This research deliberately did not provision credentials or mutate a Gist to probe undocumented behavior.

## Artifact provenance

Research artifact only; intended to remain on the throwaway research/github-and-local-storage branch, never merged. Base verified against origin/main: 29bcdba6823bf611e7e0ac092a506e3f0a6d6150 in jpconstantineau/CarMaintenanceTracker. The shared working checkout was not switched.
