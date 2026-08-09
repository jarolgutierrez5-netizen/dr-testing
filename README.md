# HR Model

A minimal [Next.js](https://nextjs.org) app around a single feature: projecting a
batter's probability of hitting a home run in his next game.

## The model

`lib/hrModel.js` treats a game's HR count as Poisson-distributed, so
`P(HR >= 1) = 1 - e^-lambda`. The expected value `lambda` blends two signals:

- **Recent form** — HR rate per at-bat over the last few games, scaled to an
  expected at-bat count for a full game.
- **Season pace** — HR total divided by games played this season.

Recent form reacts fast but is noisy over a handful of games; season pace is
stable but slow to reflect a real hot/cold shift. Blending both (weighted
60% season / 40% recent) keeps a short heater from overwhelming a full
season of evidence, and vice versa. A batter who already homered recently is
labeled "On Fire" outright — that's the strongest signal available and skips
straight to the top of the model's read.

Batter data lives in `data/batters.js` (mock data for now — `recentGames`
and `seasonHr`/`seasonGames` per player).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the projections,
sorted by HR probability.
