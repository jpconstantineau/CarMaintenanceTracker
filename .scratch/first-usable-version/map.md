# Define the first usable CarMaintenanceTracker

Labels: wayfinder:map
Status: resolved

## Destination

Agree on a specification for the first usable version: its purpose, architecture, user interactions, and data persistence, with enough decisions recorded to guide implementation.

## Notes

- Discuss purpose, then architecture, then user interaction, then data storage, in that order.
- Planning only; implementation is outside this effort.
- The subsequent /to-spec synthesis is published as the [consolidated implementation specification](spec.md), with ready-for-agent status. These closed wayfinder tickets remain the decision provenance; fresh implementation tickets should reference the consolidated spec.
- Use wayfinder, grilling, and domain-modeling. Use purposeful-web-design when discussing HTML layout or CSS.
- Repository constraints: vanilla HTML/CSS/JS and GitHub Pages hosting. The user has clarified that local persistence and JSON import/export support unauthenticated use, with optional GitHub authentication for loading and saving in the user's own Gist account. The architecture ticket holds this decision's detail.
- Local Markdown tracker is the default because no tracker configuration was found. Child decision tickets live in `issues/` using the bundled local tracker's conventions.
- Use codebase-design for architecture discussions.
- GitHub authentication and Gist loading/saving are primary first-version requirements. Local persistence and JSON files are additional supported ways to use the app; GitHub work is not deferred.
- The user selected Cloudflare Workers for authentication. Specify the future account/Worker/GitHub application setup and guided assistance, but perform no setup or deployment in this planning effort. The prematurely created execution ticket is closed out of scope.

## Decisions so far

- [Define the app's purpose and forecast behavior](issues/01-purpose-and-forecasts.md): Personal vehicle history, oil-life forecasts, individual tire tracking with uneven-wear and whole-tire-average lifetime estimates, and fueling history for fuel economy.
- [Define the app's architecture and calculation responsibilities](issues/02-architecture.md): Four modules, factual history with recalculated results, configurable items, optional-account use with primary Gist support, and incomplete/backfilled records with explicit date precision.
- [Define vehicle and maintenance entry workflows](issues/03-user-interactions.md): Vehicle selection followed by a vehicle summary, shared dated entry sessions, tire assignments and measurement units, oil checks/top-ups, and fueling with km/L.
- [Verify GitHub authentication and persistence platform constraints](issues/06-storage-platform-facts.md): Current authentication choices, KLE's exchange service, secret-Gist visibility, IndexedDB suitability, and the absence of documented atomic Gist conflict protection; cited report published on a throwaway research branch.
- [Define local, JSON, and GitHub Gist persistence](issues/04-storage.md): IndexedDB autosave, explicit saves to one secret Gist, merging with recovery copies, JSON import/export, Cloudflare authentication, session-only sign-in, and the accepted simultaneous-save limitation.
- [Specify forecast calculations and evidence requirements](issues/05-forecast-rules.md): Oil and tire trends, sampled-edge and whole-tire summaries, seasonal estimates, weighted fuel economy, mileage interpolation, and explicit insufficient-evidence behavior.

## Not yet specified

- None remaining for the agreed first-version specification. All in-scope decision tickets are resolved; the [consolidated specification](spec.md) is ready for implementation ticket planning.

## Out of scope

- Implementing the application during this planning effort.
- [Prepare Cloudflare and GitHub authentication setup](issues/07-cloudflare-setup.md): Account creation, app registration, Worker provisioning, and deployment belong to the future implementation project; the user explicitly confirmed that we are only specifying them now.
- Comparing retired and current tire sets in the first version; the user deferred this capability to a future version. Context: [Define the app's purpose and forecast behavior](issues/01-purpose-and-forecasts.md).
