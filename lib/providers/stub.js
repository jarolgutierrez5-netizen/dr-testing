// ---- Stub provider ----
// Fills the same interface every real provider (Big Balls Sports API,
// lib/providers/bigBallsSports.js; public MLB Stats API, lib/providers/mlbStatsApi.js)
// implements, but reads from the local /data modules instead of a network call.
//
// This is what /api/* routes are wired to today. It exists so the cache layer
// (lib/cache.js) and the three route handlers are fully buildable and testable
// before any real, paid or unverified API is wired in -- per the "build the backend
// before wiring any live call" requirement. Swapping a route to a real provider later
// is a one-line change (see lib/providers/index.js).
import { getStandings, getSlate } from "@/lib/dataAccess";
import { PLAYER_LOGS, PITCHERS, SEASON_STATS, PITCHER_SEASON_STATS, INJURY_STATUS } from "@/data";

// Small artificial delay so this behaves like a real network call under the cache/
// dedupe logic instead of resolving instantly every time.
function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }

export async function fetchStandings() {
  await delay(80 + Math.random() * 120);
  return { standings: getStandings(), slate: getSlate(), source: "stub", fetchedAt: new Date().toISOString() };
}

// Stands in for a live-scores/in-game-state feed. Nothing in the current UI reads
// this yet (LiveHeartbeat still uses its own inline demo fetcher) -- this exists so
// the /api/live-scores route and its 30s TTL are real and testable ahead of the
// LiveHeartbeat swap-over.
export async function fetchLiveScores() {
  await delay(50 + Math.random() * 150);
  return { tick: Date.now(), source: "stub", fetchedAt: new Date().toISOString() };
}

export async function fetchPlayerStats() {
  await delay(80 + Math.random() * 120);
  return {
    batters: PLAYER_LOGS,
    pitchers: PITCHERS,
    seasonStats: SEASON_STATS,
    pitcherSeasonStats: PITCHER_SEASON_STATS,
    injuryStatus: INJURY_STATUS,
    source: "stub",
    fetchedAt: new Date().toISOString(),
  };
}
