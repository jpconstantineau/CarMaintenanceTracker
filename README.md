# CarMaintenanceTracker

A vanilla HTML/CSS/JavaScript app for personal vehicle maintenance history, hosted on [GitHub Pages](https://jpconstantineau.github.io/CarMaintenanceTracker/).

## Available now

- Create several vehicles with a name, miles/kilometres, and fuel units (litres, US gallons, or Imperial gallons).
- Expand Optional details for make, model, year and notes; rename vehicles without changing their Base36 timestamp IDs.
- Delete a vehicle and its history with confirmation, or switch between vehicles.
- Automatically save recorded details locally in IndexedDB and reopen the last selected vehicle.
- See honest missing-mileage/history states and recover from failed local saves without losing the open form.
- Choose System, Light or Dark in the header; the preference persists on this device.
- Record fueling, oil changes, tire changes, other maintenance, checks/inspections, and odometer readings.
- Enter each record's date and mileage independently, using native date pickers and numeric odometer inputs. Approximate month/year dates remain available.
- Backfill, correct, or remove individual records, review mileage conflicts, and mark missing records separately in history.
- Inspect dated mileage evidence and reopen factual history, including collections saved by the first release.
- Configure common or custom maintenance items, parts, specifications, brands and reference links per vehicle.
- Record linked services and inspections with optional parts/cost, and review distance/time due intervals with supporting item history. History-only tracking needs no schedule; condition settings are retained for later specialized measurements.

Vehicle details and history are stored in this browser on this device. Detailed oil/tire tracking and condition forecasts, fuel economy, JSON transfer and GitHub Gist sync are future tickets. The intended cloud storage remains the user's own GitHub Gist; authentication will use a small Cloudflare Worker.

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

After changing runtime files in `docs/`, run `npm run version:assets` and commit the updated module/stylesheet URLs. `npm run check` verifies their content-derived version before testing. This prevents a returning browser from combining newly deployed HTML with older cached JavaScript.

On Linux, install browsers with `npx playwright install --with-deps chromium webkit`. Tests cover the public module interfaces and real IndexedDB in desktop Chromium, phone Chromium and phone WebKit. The app itself has no runtime dependencies or build step.

## Design and delivery

- [First-version specification](.scratch/first-usable-version/spec.md) and [domain glossary](GLOSSARY.md)
- [Design guide](DESIGN.md) for themes, color, layout, typography and accessibility
- [Local module, persistence and release contracts](documentation/vehicle-foundation.md)
- [UI purpose and verification ledger](documentation/vehicle-ui-ledger.md)
- [History contracts and UI verification ledger](documentation/history.md)
- [Maintenance contracts and UI verification ledger](documentation/maintenance.md)
- [Implementation tickets](.scratch/first-usable-version-build/issues/01-create-and-reopen-vehicles.md)

GitHub Pages publishes `main` → `/docs`. Run the checks before integrating/pushing a ticket, then verify the deployed commit and assets with `node scripts/verify-pages.mjs <full-commit-SHA>` and run the browser journeys against the live site. The release contract documents this workflow. During early development the owner permits schema-version resets instead of migrations; disclose any reset in release notes. The current release retains earlier data.
