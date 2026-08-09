# HR Model

A [Next.js](https://nextjs.org) app that projects, for today's real MLB slate,
each confirmed lineup batter's probability of hitting a home run.

## How it works

`P(1+ HR in game) = 1 - (1 - pHR/PA)^E[PA]` (`lib/hrModel.js`). `pHR/PA` blends
a batter's recent-form and season HR-per-plate-appearance rate (each shrunk
toward a league-average prior so small samples don't dominate) with a
matchup/park/weather multiplier; `E[PA]` comes from the batter's confirmed
batting-order spot.

Everything feeding that formula is live, pulled fresh on every page request
by `lib/liveProjections.js`:

- **`lib/mlbStatsApi.js`** — today's schedule, probable pitchers, confirmed
  starting lineups, and season/recent player stats, via the free, official
  [MLB Stats API](https://statsapi.mlb.com) (no key required).
- **`lib/savant.js`** — best-effort Statcast enrichment (barrel rate,
  exit velocity, hard-hit rate) from Baseball Savant's unofficial leaderboard
  export. Savant has no supported public API, so this degrades silently to
  "no Statcast nudge" if it fails or changes shape.
- **`lib/parkFactors.js`** — a static, hand-compiled table approximating each
  park's HR tendency (not scraped live — park factors are slow-moving).
- **`lib/weather.js`** — live temperature/wind at each ballpark via
  [Open-Meteo](https://open-meteo.com) (free, no key), as a small HR-carry
  nudge.

The page (`app/page.js`) is a dynamic (`force-dynamic`) Server Component, so
it never gets frozen into a build artifact — each request re-runs the
pipeline, with each underlying fetch controlling its own cache/revalidate
window. It shows the top 15 batters league-wide by projected probability,
across every game with a confirmed lineup posted. MLB typically doesn't post
lineups until a few hours before first pitch, so it's normal to see fewer (or
zero) players early in the day.

## Known limitations

- No confirmed lineup yet for a game = that game's batters aren't evaluated
  (no guessing at unconfirmed batting orders).
- Statcast enrichment is best-effort and optional; the core projection always
  works from official MLB Stats API data alone.
- Park factors are a static approximation, not a live year-precise table.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
