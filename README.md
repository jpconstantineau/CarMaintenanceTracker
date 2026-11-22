# CarMaintenanceTracker

CarMaintenanceTracker is a vanilla HTML/CSS/JavaScript app being developed to track personal vehicle maintenance, tire wear, and fueling history.

## Project specification

The [first-version specification](.scratch/first-usable-version/spec.md) consolidates the agreed user stories, architecture, calculations, persistence, authentication, and verification requirements. It is ready for implementation ticket planning. The [wayfinder map](.scratch/first-usable-version/map.md) preserves the decision history, and [GLOSSARY.md](GLOSSARY.md) defines the domain vocabulary.

The specification describes the intended first version; the current app remains the scaffold described below. Guided Cloudflare/GitHub setup is part of future implementation, not completed infrastructure.

## What this app is for

The app is intended to manage, per vehicle:

- Maintenance items, completed work, and observations with known dates and mileage
- Oil-change history, oil-life forecasts, oil-level checks, and top-ups
- Individual tire placement through seasonal swaps and rotations, with installed mileage and time at each position
- Eight-point tread measurement sessions and forecasts for uneven wear and whole-tire averages
- Fueling history and fuel economy, with km/L prominent alongside L/100 km
- Multiple vehicles, tire sets, and configurable maintenance items, including incomplete and backfilled history

The planned storage model combines IndexedDB autosave, portable JSON import/export, and explicit load/save to a user's own secret GitHub Gist. GitHub sign-in uses a small Cloudflare Worker; the frontend stays on GitHub Pages. The specification contains the accepted visibility and concurrent-save limitations.

## Repository prep status

This repository currently contains a minimal vanilla HTML/CSS/JS scaffold in `/docs` suitable for GitHub Pages.

Implemented now (placeholder level):

- Basic UI sections for gist sync, cars, maintenance entries, and tire measurement events
- Minimal in-browser state and JSON export draft
- Placeholder buttons for gist load/save flow

Not implemented yet:

- Durable local storage, JSON import/export workflows, and GitHub authentication/Gist integration
- The complete vehicle-linked data model, validation, and editing workflows
- Actual tire measurements, oil/tire forecasts, and fueling calculations
- Cloudflare/GitHub application provisioning and an automated test harness

## Run locally

Open `/docs/index.html` in a browser.

For GitHub Pages hosting, configure Pages to serve from the `docs` folder on your selected branch.
