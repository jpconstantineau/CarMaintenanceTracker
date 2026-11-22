# Define local, JSON, and GitHub Gist persistence

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Parent: ../map.md
Blocked by: 03, 06

## Question

How should the first version represent and preserve the user's history locally, in JSON files, and in their own GitHub Gists, including authentication, imports, saves, conflicts, and recovery?

Choose localStorage or IndexedDB, the versioned portable data representation, GitHub authentication compatible with the hosting constraints, Gist discovery/selection, and how to avoid data loss across these storage paths. GitHub authentication and Gist access are primary first-version requirements. Consult current authoritative GitHub documentation when resolving authentication and API facts.

The user explicitly requires phone and desktop to load/save the same history through Gists. Specify stale-data detection and edit-conflict behavior rather than assuming device synchronization follows automatically from a shared Gist.

## Comments

### Agreed organization and save behavior

- One app-managed Gist contains all vehicles and their histories in a versioned JSON document. JSON export provides a portable copy of the collection.
- Entries save automatically on the current device. Loading from and saving to GitHub are explicit actions in the first version.
- Show whether local changes have been saved to GitHub, including a state such as "Saved on this device; GitHub save pending."
- Loading and saving must account for unsaved local work and changes made from other devices. The accepted conflict behavior and remaining concurrency limitation are recorded below.
- The user suggested [Keyboard Layout Editor](https://github.com/ijprest/keyboard-layout-editor) as a useful reference. The completed platform research inspected its authentication, Gist handling, and editing approach, distinguishing historical implementation choices from current platform support.

### Cross-device merge behavior

- The user accepted combining independent changes from phone and desktop.
- If both devices edit the same record differently, or one deletes a record that the other edits, show both versions and ask the user to resolve the conflict.
- Preserve local work while resolving conflicts. Do not silently prefer the latest timestamp or overwrite a conflicting record.
- Stable record identity, a known shared base, and retained deletion information are required to distinguish independent additions, edits, and deletions. Field names and serialization layout are implementation details constrained by these requirements.
- This is the desired merge behavior when differences are detected, not a claim that Gist writes support atomic compare-and-swap. The platform research established the platform's concurrent-write limits.

### Local persistence and JSON import

- The user selected IndexedDB for working history, unsaved changes, and the last loaded GitHub version used as the merge baseline.
- GitHub saves and JSON exports remain necessary backup paths because browser storage can be cleared.
- Importing an app-exported JSON file normally merges it into the current collection, recognizing existing records by stable identifiers.
- Preview additions and conflicts before applying an import. Offer complete replacement as a separate action and retain a recovery copy before replacement.

### Platform evidence available

The [platform research decision](06-storage-platform-facts.md) is resolved. It establishes current authentication choices, secret-Gist visibility, storage constraints, and the limits of concurrent Gist writes. The user's resulting choices are recorded below.

### Authentication direction and visibility

- The user accepted a small authentication service alongside GitHub Pages. Its selected host and narrow role are recorded below.
- The user accepted an unlisted secret Gist with the explained URL-readable visibility. The intended dataset contains vehicle/maintenance information, not personal information; do not solicit owner identity, contact information, or other personal details in the default vehicle model. This is an intended data-minimization policy, not a claim that arbitrary vehicle identifiers, notes, or imported content can never identify a person.
- Vehicle records remain in the user's Gist and local IndexedDB. The authentication service does not require a maintenance database; its host and credential lifetime are specified below.

### Hosting selection

The user selected [Cloudflare Workers](https://developers.cloudflare.com/workers/) for the authentication endpoint, with the frontend on GitHub Pages and vehicle data in Gists/IndexedDB. Workers supports [encrypted secret bindings](https://developers.cloudflare.com/workers/configuration/secrets/), a [free tier](https://developers.cloudflare.com/workers/platform/pricing/), and a [workers.dev address for personal/hobby use](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/). Azure is not required. No account or Worker has been provisioned. The user requested guided Cloudflare account and Worker setup as part of future implementation; specify that requirement here without executing it.

### Planning scope and credential lifetime

- The user clarified that Cloudflare setup is part of the future project and is only being specified now through wayfinder. Do not provision accounts, register apps, create Workers, deploy services, or generate/run a setup wizard during this planning effort.
- The user accepted GitHub sign-in lasting only for the current browser session in the first version. Vehicle data persists locally between sessions; GitHub access requires signing in again. Credentials remain separate from vehicle records, JSON exports, and Gists.
- The setup execution ticket was closed as out of scope for this planning map. Its requirements remain part of the implementation handoff, not a prerequisite that must execute before planning can finish.

### Accepted first-version concurrency limit

- The user accepted fetching the latest Gist before a save, merging independent changes, resolving conflicts, and retaining recoverable local copies as sufficient for the first version.
- Two nearly simultaneous saves may still overwrite a remote version because Gist writes lack documented atomic compare-and-swap. This limitation was explicitly explained and accepted. Do not claim guaranteed loss-free concurrent remote writes or expand the authentication-only Worker into a save coordinator in this version.

## Answer

Keep one app-managed secret Gist per collection containing a versioned JSON document with all vehicles and their factual histories. Use the same portable representation for JSON exports. The intended data excludes personal information; secret Gists remain URL-readable. Credentials and authorization state are never part of vehicle JSON, exports, or imports.

Use IndexedDB for automatic local saves, pending work, recovery copies, and the last loaded remote baseline. Give records stable identifiers and retain deletion information for reconciliation; preserve date precision and distinguish event dates from edit metadata. Derived totals and forecasts remain recalculable. Namespace local collections and remote baselines by the selected account/Gist so switching accounts does not silently mix histories.

GitHub Load and Save are explicit, with visible local-versus-remote save status. Identify the app's Gist by format/marker and validate its contents; if more than one matching Gist exists, require selection. Merge independent changes against the shared baseline, ask about conflicting edits or edit/delete conflicts, and preserve local work. JSON imports preview and merge by default; full replacement is separate and retains a recovery copy. Invalid or unsupported data must not overwrite existing history.

Use a Cloudflare Worker for authentication alongside GitHub Pages, with session-only GitHub sign-in and local data retained between sessions. Guided Cloudflare/GitHub application setup and deployed-origin verification belong to future implementation, not this planning effort.

The user accepts the documented near-simultaneous-save race for the first version. Pre-save comparison/merge and recoverable local copies reduce the risk but are not atomic multi-device protection. No coordinating write service is required for this version.
