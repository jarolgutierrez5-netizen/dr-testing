// ---- Big Balls Sports Data API provider (server-only) ----
// NOT wired into any /api/* route yet -- lib/providers/index.js still points at the
// stub. This file exists so the interface is ready to flip on once a key is supplied
// and the endpoints/response shapes below are confirmed against the real API.
//
// Server-only by construction: this module is only ever imported from route handlers
// under app/api/*, never from a component. BIG_BALLS_API_KEY must be set as a
// server-side env var (.env.local, not NEXT_PUBLIC_*) so it's never bundled into
// client JS.
//
// TODO before flipping this on in lib/providers/index.js:
//   - Confirm real endpoint paths/params (placeholders below are guesses at a
//     plausible REST shape, not verified against real API docs).
//   - Confirm response shape and adjust the mapping to match fetchStandings/
//     fetchLiveScores/fetchPlayerStats's existing return shape so lib/dataAccess.js
//     and every component downstream don't need to change.
//   - Decide rate-limit handling (this provider is paid -- the TTL cache in
//     lib/cache.js is the main defense against burning through quota, but confirm
//     the provider's own rate limits against those TTLs).

const BASE_URL = "https://api.bigballssports.com/v1"; // placeholder -- confirm real base URL

function requireApiKey() {
  const key = process.env.BIG_BALLS_API_KEY;
  if (!key) throw new Error("BIG_BALLS_API_KEY is not set -- cannot call Big Balls Sports Data API");
  return key;
}

async function bbFetch(path) {
  const key = requireApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Big Balls Sports API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchStandings() {
  const raw = await bbFetch("/mlb/standings");
  // TODO: map raw's real shape into { standings, slate, source, fetchedAt }
  return { standings: raw.standings, slate: raw.slate, source: "bigballs", fetchedAt: new Date().toISOString() };
}

export async function fetchLiveScores() {
  const raw = await bbFetch("/mlb/live-scores");
  return { ...raw, source: "bigballs", fetchedAt: new Date().toISOString() };
}

export async function fetchPlayerStats() {
  const raw = await bbFetch("/mlb/player-stats");
  return { ...raw, source: "bigballs", fetchedAt: new Date().toISOString() };
}
