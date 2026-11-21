# CarMaintenanceTracker

CarMaintenanceTracker is a lightweight starter project for tracking car maintenance history over time.

## What this app is for

The app is intended to manage, per vehicle:

- General maintenance entries with date and mileage (for example oil changes)
- Tire lifecycle events (install/swap/rotation)
- Tire tread measurements over time (8 values per tire: inner and outer edges, 4 points each)
- Multiple cars, multiple tire sets, and other consumables

Data is planned to be loaded from and saved to a GitHub Gist in JSON format so users can keep a portable history.

## Repository prep status

This repository currently contains a minimal vanilla HTML/CSS/JS scaffold in `/docs` suitable for GitHub Pages.

Implemented now (placeholder level):

- Basic UI sections for gist sync, cars, maintenance entries, and tire measurement events
- Minimal in-browser state and JSON export draft
- Placeholder buttons for gist load/save flow

Not implemented yet:

- GitHub authentication and gist API integration
- Full data model validation and editing workflows
- Advanced reporting/forecasting based on tread wear measurements

## Run locally

Open `/docs/index.html` in a browser.

For GitHub Pages hosting, configure Pages to serve from the `docs` folder on your selected branch.
