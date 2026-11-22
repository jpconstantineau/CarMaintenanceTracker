# CarMaintenanceTracker

A vanilla HTML/CSS/JavaScript app for personal vehicle maintenance history, hosted on [GitHub Pages](https://jpconstantineau.github.io/CarMaintenanceTracker/).

## Available now

- Create several vehicles with just a name and miles/kilometres.
- Edit optional make, model, year and notes, and switch between vehicles.
- Automatically save recorded details locally in IndexedDB and reopen the last selected vehicle.
- See honest missing-mileage/history states and recover from failed local saves without losing the open form.
- Choose System, Light or Dark in the header; the preference persists on this device.
- Record odometer readings, general observations, and known gaps, using exact dates or month/year precision.
- Enter several independent records with shared defaults; backfill, correct, or remove them and review mileage conflicts.
- Inspect dated mileage evidence and reopen factual history, including collections saved by the first release.

Vehicle details and history are stored in this browser on this device. Maintenance-item entry, tires, fueling, forecasts, JSON transfer and GitHub Gist sync are future tickets. The intended cloud storage remains the user's own GitHub Gist; authentication will use a small Cloudflare Worker.

## Run and test

Use Node.js 24 or newer. Serve over HTTP rather than opening index.html directly (the app uses ES modules).

```sh
npm ci
npm start
```

Open http://127.0.0.1:4173/.

```sh
npx playwright install chromium webkit
npm run check
```

On Linux, install browsers with `npx playwright install --with-deps chromium webkit`. Tests cover the public module interfaces and real IndexedDB in desktop Chromium, phone Chromium and phone WebKit. The app itself has no runtime dependencies or build step.

## Design and delivery

- [First-version specification](.scratch/first-usable-version/spec.md) and [domain glossary](GLOSSARY.md)
- [Design guide](DESIGN.md) for themes, color, layout, typography and accessibility
- [Local module, persistence and release contracts](documentation/vehicle-foundation.md)
- [UI purpose and verification ledger](documentation/vehicle-ui-ledger.md)
- [History contracts and UI verification ledger](documentation/history.md)
- [Implementation tickets](.scratch/first-usable-version-build/issues/01-create-and-reopen-vehicles.md)

GitHub Pages publishes `main` → `/docs`. Run the checks before integrating/pushing a ticket, then verify the deployed commit and assets with `node scripts/verify-pages.mjs <full-commit-SHA>` and run the browser journeys against the live site. The release contract documents this workflow and the non-destructive data compatibility requirements for subsequent tickets.
