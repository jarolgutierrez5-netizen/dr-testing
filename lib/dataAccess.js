// =====================================================================
// DATA ACCESS LAYER
// -----------------------------------------------------------------------
// Every model function and component reads data ONLY through these
// getters -- never by reaching into /data modules directly. That's the
// seam: right now each getter reads a static import from /data (same
// values the original artifact shipped), matching current behavior
// exactly. When live data is wired in (Big Balls API or the public MLB
// API, via the /api/* routes + TTL cache in lib/cache.js), each of these
// swaps to read from fetched/cached client state instead -- and nothing
// outside this module has to change.
// =====================================================================
import {
  PLAYER_LOGS, INJURY_STATUS,
  PITCHERS, PITCHER_SEASON_STATS,
  SEASON_STATS, SEASON_HR,
  TEAMS,
  RECENT_FORM,
  STARTERS, LINEUP_HANDEDNESS,
  PARK_NOTES, WEATHER_CONTEXT,
  SLATE,
} from "@/data";

export function getStandings() { return Object.values(TEAMS); }
export function getTeam(abbr) { return TEAMS[abbr]; }
export function getSlate() { return SLATE; }
export function getStarter(abbr) { return STARTERS[abbr]; }
export function getRecentForm(abbr) { return RECENT_FORM[abbr] || []; }
export function getLineupHandedness(abbr) { return LINEUP_HANDEDNESS[abbr]; }
export function getParkNote(abbr) { return PARK_NOTES[abbr]; }
export function getWeather(game) { return WEATHER_CONTEXT[game]; }
export function getBatterLogs() { return PLAYER_LOGS; }
export function getPitcherLogs() { return PITCHERS; }
export function getSeasonStats(name, year) { return SEASON_STATS[name]?.[year]; }
export function getSeasonHr(name) { return SEASON_HR[name]; }
export function getInjuryStatus(name) { return INJURY_STATUS[name]; }
export function getPitcherSeasonStats(name) { return PITCHER_SEASON_STATS[name]; }

// How much of a given card is backed by real, sourced data vs. pure sample/mock --
// a single glance-able signal instead of making someone read every pill to figure
// out how much to trust the number. Deliberately simple and conservative: only
// counts real, confirmed sources, never mock data.
export function dataConfidence(name) {
  const hasSeason = SEASON_STATS[name] !== undefined;
  const hasInjuryReport = INJURY_STATUS[name] !== undefined;
  if (hasSeason && hasInjuryReport) return { label: "Solid data", tone: "green" };
  if (hasSeason || hasInjuryReport) return { label: "Partial data", tone: "amber" };
  return { label: "Thin sample", tone: "slate" };
}

// Same idea as dataConfidence, for pitchers -- we don't have an injury feed for
// pitchers yet (only batters), so this only ever reaches "Partial" at best. That's
// an honest ceiling, not a bug: it reflects a real, currently-missing data source.
export function pitcherDataConfidence(name) {
  const hasSeason = PITCHER_SEASON_STATS[name] !== undefined;
  return hasSeason ? { label: "Partial data", tone: "amber" } : { label: "Thin sample", tone: "slate" };
}
