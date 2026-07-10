// ---- Public MLB Stats API provider (server-only, unofficial) ----
// statsapi.mlb.com is a free but *unofficial, undocumented* public API -- no key,
// but also no SLA, no stability guarantee, and CORS behavior that has NOT been
// verified from this codebase (the sandboxed environment this project was built in
// has outbound network access to statsapi.mlb.com blocked by policy, so the request
// this file would need to make to prove it out couldn't be run here).
//
// Because every call goes through our own /api/* route handlers (server-side,
// Node fetch), CORS is actually moot for the browser -- the client never talks to
// statsapi.mlb.com directly, only to our same-origin API. What DOES need verifying
// before this is trusted in production:
//   1. Whether statsapi.mlb.com will serve non-browser (server-to-server) requests
//      at all, or blocks on User-Agent / rate / bot-detection grounds.
//   2. Actual uptime/latency under load -- there's no published SLA.
//   3. Whether the endpoint shapes below (guessed from public documentation efforts
//      like https://github.com/toddrob99/MLB-StatsAPI, not an official spec) are
//      still accurate -- unofficial APIs change without notice.
//
// TODO: run `curl -i https://statsapi.mlb.com/api/v1/schedule?sportId=1` (or
// equivalent) from an environment with open egress before flipping this on in
// lib/providers/index.js, and confirm the response shape below.

const BASE_URL = "https://statsapi.mlb.com/api/v1";

async function mlbFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`MLB Stats API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchStandings() {
  const raw = await mlbFetch("/standings?leagueId=103,104");
  // TODO: map MLB Stats API's real standings shape into { standings, slate, source, fetchedAt }
  return { standings: raw.records, slate: null, source: "mlb-stats-api", fetchedAt: new Date().toISOString() };
}

export async function fetchLiveScores() {
  const raw = await mlbFetch("/schedule?sportId=1&hydrate=linescore");
  return { games: raw.dates, source: "mlb-stats-api", fetchedAt: new Date().toISOString() };
}

export async function fetchPlayerStats() {
  throw new Error("mlbStatsApi.fetchPlayerStats not implemented -- requires per-player endpoint mapping, unverified");
}
