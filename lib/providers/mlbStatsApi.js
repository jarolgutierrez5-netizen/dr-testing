// ---- Public MLB Stats API provider (server-only, unofficial) ----
// statsapi.mlb.com is free, no key required, but *unofficial and undocumented* -- no
// SLA, no stability guarantee. This implementation follows the endpoint shapes
// documented by community wrappers (e.g. toddrob99/MLB-StatsAPI) and general public
// reverse-engineering efforts, since there's no official spec.
//
// IMPORTANT: this could not be executed or verified from the sandbox this codebase
// was built in -- outbound egress to statsapi.mlb.com is blocked there by policy
// (confirmed via the agent proxy's connect_rejected log, not a response from MLB's
// API). It runs server-side on whatever this app is actually deployed to (e.g.
// Vercel), which has normal outbound internet access, so CORS is moot either way --
// the browser never talks to statsapi.mlb.com directly, only to our own /api/*
// routes. What's genuinely unverified is whether the shapes mapped below still match
// reality. If /api/standings comes back empty or malformed after deploying, that's
// the first thing to check -- capture the raw response and compare against the
// mapping in fetchStandings below.
//
// Currently wired in for standings + today's slate only (see lib/providers/index.js).
// Player-level data (season stats, injuries, starters, batter/pitcher logs) stays on
// the stub/static provider -- mapping those to real MLB person IDs for this specific
// tracked player pool is a separate, larger task.

const BASE_URL = "https://statsapi.mlb.com/api/v1";
const MLB_SPORT_ID = 1;
const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

async function mlbFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    // Revalidate on our own cadence (lib/cache.js), not Next's fetch cache.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`MLB Stats API error: ${res.status} ${res.statusText} (${path})`);
  return res.json();
}

// team.id -> abbreviation lookup. Needed because the standings endpoint's
// teamRecords[].team object doesn't include the abbreviation itself, only id/name.
async function fetchTeamAbbrMap() {
  const raw = await mlbFetch(`/teams?sportId=${MLB_SPORT_ID}`);
  const map = new Map();
  for (const t of raw.teams || []) map.set(t.id, t.abbreviation);
  return map;
}

export async function fetchStandings() {
  const [abbrMap, standingsRaw, scheduleRaw] = await Promise.all([
    fetchTeamAbbrMap(),
    mlbFetch(`/standings?leagueId=${AL_LEAGUE_ID},${NL_LEAGUE_ID}&standingsTypes=regularSeason`),
    mlbFetch(`/schedule?sportId=${MLB_SPORT_ID}`), // defaults to today's date, server-side
  ]);

  const standings = (standingsRaw.records || []).flatMap((division) =>
    (division.teamRecords || []).map((tr) => {
      const abbr = abbrMap.get(tr.team?.id) || tr.team?.abbreviation || tr.team?.name;
      const w = tr.leagueRecord?.wins ?? 0;
      const l = tr.leagueRecord?.losses ?? 0;
      const gp = w + l;
      const wp = gp > 0 ? w / gp : 0;
      return { name: tr.team?.name, abbr, w, l, gp, wp, pace: Math.round(wp * 162) };
    })
  ).filter((t) => t.abbr);

  const slate = (scheduleRaw.dates || []).flatMap((d) =>
    (d.games || []).map((g) => {
      const awayAbbr = abbrMap.get(g.teams?.away?.team?.id);
      const homeAbbr = abbrMap.get(g.teams?.home?.team?.id);
      return {
        away: awayAbbr,
        home: homeAbbr,
        gameDate: g.gameDate, // real ISO UTC timestamp
        time: g.gameDate
          ? new Date(g.gameDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
          : undefined,
        status: g.status?.detailedState,
      };
    })
  ).filter((g) => g.away && g.home);

  return { standings, slate, source: "mlb-stats-api", fetchedAt: new Date().toISOString() };
}

export async function fetchLiveScores() {
  const raw = await mlbFetch(`/schedule?sportId=${MLB_SPORT_ID}&hydrate=linescore`);
  return { games: raw.dates, source: "mlb-stats-api", fetchedAt: new Date().toISOString() };
}

export async function fetchPlayerStats() {
  throw new Error("mlbStatsApi.fetchPlayerStats not implemented -- requires per-player person-ID mapping, out of scope for now");
}
