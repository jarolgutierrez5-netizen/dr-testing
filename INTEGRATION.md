# Redesigned homepage integration

The root `index.html` is the redesigned multi-sport homepage. The previous production homepage is retained as `legacy-index.html` for reference while the new data wiring is completed.

## Current data mode

The homepage intentionally ships with preview data. Its inline `mockDashboard` object supplies the current matchup cards and projection board. A `PREVIEW DATA` badge and informational disclaimer remain visible so mock outcomes are not presented as live projections.

## Production data hook

Before the homepage's main inline script runs, define:

```js
window.DiamondReportDataProvider = {
  async loadDashboard() {
    return {
      generatedAt: new Date().toISOString(),
      mode: "live",
      games: []
    };
  }
};
```

Each game should contain `id`, `sport`, `startTime`, `status`, `away`, `home`, and `projection`. The page normalizes incoming data through `window.DiamondReportAdapters.normalizeDashboard` and automatically falls back to the embedded mock provider when no production provider is installed.

## Preserved project infrastructure

- Existing files in `data/`, `scripts/`, `src/`, `tests/`, and `.github/workflows/`
- Cloudflare static asset and scheduled-sync configuration in `wrangler.jsonc`
- AdSense verification and loader
- Existing About, Methodology, Track Record, Privacy, Terms, and Contact pages

Do not load the old `app.min.js` or `styles.min.css` on the redesigned homepage. They are tightly coupled to the legacy DOM and would conflict with the new interface. They remain in the repository for the legacy page and for reference during data-adapter work.
