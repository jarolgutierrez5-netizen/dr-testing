// Client-side fetchers passed into useLiveResource. Every one of these hits our own
// same-origin /api/* route handler -- never a live provider directly -- so the
// dedupe/backoff/visibility logic in lib/hooks.js is exercised against our real
// backend (TTL cache + route handler), not an inline fake promise.
export async function fetchLiveScoresClient() {
  const res = await fetch("/api/live-scores");
  if (!res.ok) throw new Error(`live-scores fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchStandingsClient() {
  const res = await fetch("/api/standings");
  if (!res.ok) throw new Error(`standings fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchPlayerStatsClient() {
  const res = await fetch("/api/player-stats");
  if (!res.ok) throw new Error(`player-stats fetch failed: ${res.status}`);
  return res.json();
}
