// ---- Live daily HR projections ----
// Pulls today's real MLB slate (schedule, probable pitchers, confirmed
// lineups, season + recent stats) from the official MLB Stats API, enriches
// with Baseball Savant Statcast data when available, applies park/weather
// context, and runs everything through lib/hrModel.js's probability formula.
//
// If a confirmed lineup or Statcast leaderboard isn't available, this
// degrades gracefully (skips that game, or skips the Statcast nudge) rather
// than inventing data -- MLB typically doesn't post official lineups until a
// few hours before first pitch, so it's normal for this to return fewer
// players earlier in the day.
import {
  getTodaysGames, getConfirmedLineup, getBattingStats, getPitchingStats,
  seasonHittingLine, recentHittingGames, seasonPitchingLine, todayIso,
} from "./mlbStatsApi";
import { PARK_FACTORS } from "./parkFactors";
import { getParkWeatherFactor } from "./weather";
import { getBatterStatcast, getPitcherStatcast } from "./savant";
import { neutralHrPa, contextFactor, expectedPa, gameProbability } from "./hrModel";

const LEAGUE_AVG_HR_PA = 0.031;
const PITCHER_PRIOR_PA = 150;

// Real season HR-per-PA-allowed, shrunk toward league average, optionally
// nudged by Savant's barrel rate allowed when we have it.
function pitcherMatchupFactor(pitchingLine, pitcherStatcast) {
  let rate = LEAGUE_AVG_HR_PA;
  if (pitchingLine?.battersFaced) {
    rate = (pitchingLine.hr + PITCHER_PRIOR_PA * LEAGUE_AVG_HR_PA) / (pitchingLine.battersFaced + PITCHER_PRIOR_PA);
  }
  let factor = rate / LEAGUE_AVG_HR_PA;
  if (pitcherStatcast?.barrelRateAllowed != null) {
    factor *= 1 + Math.max(-0.15, Math.min(0.15, ((pitcherStatcast.barrelRateAllowed - 8) / 8) * 0.15));
  }
  return Math.max(0.7, Math.min(1.6, factor));
}

// A small nudge on top of the season/recent HR-rate estimate from the
// batter's own contact quality, when Savant data is available.
function batterStatcastNudge(statcast) {
  if (!statcast) return 1;
  let nudge = 1;
  if (statcast.barrelRate != null) nudge *= 1 + Math.max(-0.12, Math.min(0.12, ((statcast.barrelRate - 8) / 8) * 0.12));
  if (statcast.hardHitRate != null) nudge *= 1 + Math.max(-0.06, Math.min(0.06, ((statcast.hardHitRate - 38) / 38) * 0.06));
  return nudge;
}

export async function getTodaysTopProjections(limit = 15) {
  const date = todayIso();
  const season = Number(date.slice(0, 4));
  const games = await getTodaysGames(date);
  if (!games.length) {
    return { date, players: [], gamesConsidered: 0, lineupsFound: 0, entriesEvaluated: 0 };
  }

  const lineupResults = await Promise.all(
    games.map(async (g) => ({ game: g, lineup: await getConfirmedLineup(g.gamePk).catch(() => null) }))
  );

  const entries = [];
  for (const { game, lineup } of lineupResults) {
    if (!lineup) continue;
    lineup.away?.forEach((p, i) =>
      entries.push({ batterId: p.id, name: p.fullName, team: game.away.abbr, opponent: game.home.abbr, park: game.home.abbr, battingOrderSlot: i + 1, pitcherId: game.home.probablePitcherId })
    );
    lineup.home?.forEach((p, i) =>
      entries.push({ batterId: p.id, name: p.fullName, team: game.home.abbr, opponent: game.away.abbr, park: game.home.abbr, battingOrderSlot: i + 1, pitcherId: game.away.probablePitcherId })
    );
  }

  const lineupsFound = lineupResults.filter((l) => l.lineup?.home || l.lineup?.away).length;
  if (!entries.length) {
    return { date, players: [], gamesConsidered: games.length, lineupsFound, entriesEvaluated: 0 };
  }

  const batterIds = entries.map((e) => e.batterId);
  const pitcherIds = [...new Set(entries.map((e) => e.pitcherId).filter(Boolean))];

  const [battingPeople, pitchingPeople, batterStatcast, pitcherStatcast] = await Promise.all([
    getBattingStats(batterIds, season),
    getPitchingStats(pitcherIds, season),
    getBatterStatcast(season),
    getPitcherStatcast(season),
  ]);

  // Pre-fetch weather per unique park so the main loop below is synchronous.
  const uniqueParks = [...new Set(entries.map((e) => e.park))];
  const weatherEntries = await Promise.all(
    uniqueParks.map(async (abbr) => {
      const park = PARK_FACTORS[abbr];
      if (!park) return [abbr, { factor: 1 }];
      return [abbr, await getParkWeatherFactor(park.lat, park.lon, date)];
    })
  );
  const weatherByPark = Object.fromEntries(weatherEntries);

  const projections = [];
  for (const e of entries) {
    const person = battingPeople[e.batterId];
    const seasonLine = seasonHittingLine(person);
    const recentGames = recentHittingGames(person, 5);
    if (!seasonLine && !recentGames.length) continue;

    const pitchingLine = seasonPitchingLine(pitchingPeople[e.pitcherId]);
    const pStatcast = pitcherStatcast?.[e.pitcherId];
    const bStatcast = batterStatcast?.[e.batterId];
    const park = PARK_FACTORS[e.park];
    const weather = weatherByPark[e.park] || { factor: 1 };

    const matchupFactor = pitcherMatchupFactor(pitchingLine, pStatcast) * batterStatcastNudge(bStatcast);
    const parkWeatherFactor = (park?.hrFactor ?? 1) * (weather.factor ?? 1);

    const liveBatter = {
      recentGames: recentGames.length ? recentGames : [{ pa: 0, hr: 0 }],
      seasonHr: seasonLine?.hr,
      seasonPa: seasonLine?.pa,
      matchupFactor,
      parkWeatherFactor,
    };

    const neutral = neutralHrPa(liveBatter);
    const today = neutral * contextFactor(liveBatter);
    const ePa = expectedPa(e.battingOrderSlot);

    projections.push({
      name: e.name,
      team: e.team,
      opponent: e.opponent,
      battingOrderSlot: e.battingOrderSlot,
      probability: gameProbability(today, ePa),
      neutralProbability: gameProbability(neutral, ePa),
      hasStatcast: !!(bStatcast || pStatcast),
      recentHr: recentGames.some((g) => g.hr > 0),
      powerRatio: neutral / LEAGUE_AVG_HR_PA,
      matchupFactor,
      parkWeatherFactor,
    });
  }

  projections.sort((a, b) => b.probability - a.probability);
  return {
    date,
    players: projections.slice(0, limit),
    gamesConsidered: games.length,
    lineupsFound,
    entriesEvaluated: projections.length,
  };
}
