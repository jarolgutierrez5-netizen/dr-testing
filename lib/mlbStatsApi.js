// ---- MLB Stats API client ----
// Free, official, no API key required (https://statsapi.mlb.com) -- the same
// public data source that powers MLB.com's live scores, schedules, and box
// scores. Used here for today's games, probable pitchers, confirmed batting
// orders, and player stats.

const BASE = "https://statsapi.mlb.com/api/v1";

async function getJson(url, revalidateSeconds) {
  const res = await fetch(url, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) throw new Error(`MLB Stats API ${res.status} for ${url}`);
  return res.json();
}

// MLB's own "today" runs on US Eastern time, not the server's UTC clock.
export function todayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// Today's regular-season games with probable starters.
export async function getTodaysGames(date) {
  const url = `${BASE}/schedule?sportId=1&date=${date}&hydrate=team,probablePitcher`;
  const data = await getJson(url, 1800);
  const games = (data.dates || []).flatMap((d) => d.games || []);
  return games
    .filter((g) => g.gameType === "R")
    .map((g) => ({
      gamePk: g.gamePk,
      gameDate: g.gameDate,
      home: {
        id: g.teams.home.team.id, name: g.teams.home.team.name, abbr: g.teams.home.team.abbreviation,
        probablePitcherId: g.teams.home.probablePitcher?.id ?? null,
      },
      away: {
        id: g.teams.away.team.id, name: g.teams.away.team.name, abbr: g.teams.away.team.abbreviation,
        probablePitcherId: g.teams.away.probablePitcher?.id ?? null,
      },
    }));
}

// Confirmed starting lineup (batting order) for one game. Returns null for a
// side with no lineup posted yet -- MLB typically posts these only a few
// hours before first pitch, so this is expected to be null for a lot of the
// day rather than treated as an error.
export async function getConfirmedLineup(gamePk) {
  const url = `${BASE}/game/${gamePk}/boxscore`;
  const data = await getJson(url, 900);
  const side = (team) => {
    const order = team?.battingOrder;
    if (!order || !order.length) return null;
    return order
      .map((id) => {
        const p = team.players?.[`ID${id}`];
        return p ? { id, fullName: p.person.fullName } : null;
      })
      .filter(Boolean);
  };
  return { home: side(data.teams?.home), away: side(data.teams?.away) };
}

async function getBulkStats(ids, group, types, season) {
  if (!ids.length) return {};
  const unique = [...new Set(ids)];
  const chunks = [];
  for (let i = 0; i < unique.length; i += 40) chunks.push(unique.slice(i, i + 40));

  const results = {};
  await Promise.all(
    chunks.map(async (chunk) => {
      const url = `${BASE}/people?personIds=${chunk.join(",")}&hydrate=stats(group=[${group}],type=[${types.join(",")}],season=${season})`;
      const data = await getJson(url, 1800);
      for (const person of data.people || []) results[person.id] = person;
    })
  );
  return results;
}

export function getBattingStats(ids, season) {
  return getBulkStats(ids, "hitting", ["season", "gameLog"], season);
}

export function getPitchingStats(ids, season) {
  return getBulkStats(ids, "pitching", ["season"], season);
}

export function seasonHittingLine(person) {
  const block = person?.stats?.find((s) => s.type?.displayName === "season" && s.group?.displayName === "hitting");
  const split = block?.splits?.[0]?.stat;
  if (!split) return null;
  return { hr: split.homeRuns ?? 0, pa: split.plateAppearances ?? 0 };
}

// Last n games from this season's game log, oldest-to-newest sliced to the
// most recent n.
export function recentHittingGames(person, n = 5) {
  const block = person?.stats?.find((s) => s.type?.displayName === "gameLog" && s.group?.displayName === "hitting");
  const splits = block?.splits || [];
  return splits.slice(-n).map((s) => ({ pa: s.stat.plateAppearances ?? 0, hr: s.stat.homeRuns ?? 0 }));
}

export function seasonPitchingLine(person) {
  const block = person?.stats?.find((s) => s.type?.displayName === "season" && s.group?.displayName === "pitching");
  const split = block?.splits?.[0]?.stat;
  if (!split) return null;
  return { hr: split.homeRuns ?? 0, battersFaced: split.battersFaced ?? null };
}
