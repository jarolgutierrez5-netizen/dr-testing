// ---- MLB Stats API provider, routed through diamond-report's proxy (server-only) ----
// Rather than calling statsapi.mlb.com directly -- unverified from this codebase's
// sandbox, which has no outbound egress to it -- this calls
// https://diamondreport.app/api/v1/*, a Cloudflare Worker proxy that the diamond-report
// production site (jarolgutierrez5-netizen/diamond-report) already uses successfully
// in production for the exact same endpoints (standings/schedule/teams). Same request
// shapes (query params, hydrate strings) as that proven-working code, not a fresh
// guess. The endpoint paths and response shapes are still the real MLB Stats API's --
// diamond-report's Worker is a passthrough proxy, not a different API.
//
// IMPORTANT: this still could not be executed or verified from the sandbox this
// codebase was built in -- outbound egress to diamondreport.app is ALSO blocked there
// by policy (confirmed via the agent proxy's connect_rejected log). It runs
// server-side on whatever this app is actually deployed to (e.g. Vercel), which has
// normal outbound internet access. If /api/standings comes back empty or malformed
// after deploying, capture the raw response and compare against the mapping in
// fetchStandings below.
//
// Currently wired in for standings + today's slate only (see lib/providers/index.js).
// Player-level data (season stats, injuries, starters, batter/pitcher logs) stays on
// the stub/static provider -- mapping those to real MLB person IDs for this specific
// tracked player pool is a separate, larger task.

const BASE_URL = "https://diamondreport.app/api/v1";
const MLB_SPORT_ID = 1;
const AL_LEAGUE_ID = 103;
const NL_LEAGUE_ID = 104;

function currentSeason() {
  return new Date().getFullYear();
}

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
  const raw = await mlbFetch(`/teams?sportId=${MLB_SPORT_ID}&activeStatus=Y`);
  const map = new Map();
  for (const t of raw.teams || []) map.set(t.id, t.abbreviation);
  return map;
}

// Confirmed against production: /schedule with no `date` param returned the previous
// day's (already-final) games instead of today's -- its undocumented default doesn't
// line up with "today" in the way the docs implied. Passing today's date explicitly
// (the deploy server's UTC date, which matches US-Eastern/Central "today" for all but
// a few late-night hours) fixes it.
function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function fetchStandings() {
  const [abbrMap, standingsRaw, scheduleRaw] = await Promise.all([
    fetchTeamAbbrMap(),
    mlbFetch(`/standings?leagueId=${AL_LEAGUE_ID},${NL_LEAGUE_ID}&season=${currentSeason()}&standingsTypes=regularSeason`),
    mlbFetch(`/schedule?sportId=${MLB_SPORT_ID}&date=${todayIsoDate()}&hydrate=team,linescore&language=en`),
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
  const raw = await mlbFetch(`/schedule?sportId=${MLB_SPORT_ID}&date=${todayIsoDate()}&hydrate=team,linescore&language=en`);
  return { games: raw.dates, source: "mlb-stats-api", fetchedAt: new Date().toISOString() };
}

export async function fetchPlayerStats() {
  throw new Error("mlbStatsApi.fetchPlayerStats not implemented -- requires per-player person-ID mapping, out of scope for now");
}
