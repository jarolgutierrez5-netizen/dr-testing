// Real-data provider for the redesigned homepage (index.html), per its own
// INTEGRATION.md contract: define window.DiamondReportDataProvider before the
// page's inline script runs, and it uses this instead of the built-in preview
// mock. Loaded as its own <script> tag (before the inline script), same
// separation INTEGRATION.md already asks for re: not loading the legacy
// app.min.js on this page.
//
// This is MLB only. NFL and WNBA currently only have real PLAYER-level prop
// projections on this site (Anytime TD, Points/Rebounds/Assists/3PM/PRA,
// etc.) -- there is no real team-level win-probability/projected-score model
// for either sport, so this file does not invent one. NBA has no data
// pipeline in this project at all. Building those out is separate, larger
// work (a real per-sport win-probability model, same scope as the original
// NFL/WNBA player-prop build) -- not attempted here.
//
// The win-probability + projected-runs formula below is the SAME real model
// already live on the site (app.js's loadGameProps / window.drWinProbStore,
// the "Game Props"/FAVORED-pill model) -- same constants, same weights, same
// per-factor scoring -- so this isn't a second, divergent formula. What's
// intentionally left out of this first pass, all of which the live model
// itself already treats as optional/neutral-if-unavailable: recent-form
// blending (last-5-starts ERA/WHIP/K9), live weather, park factor, bullpen
// fatigue, and the sportsbook-line comparison. Each of those is a real
// follow-up enhancement, not a correctness gap in what's already computed --
// an honest first cut, not a finished model (same framing as app.js's own
// nflAnytimeTDProb comment).
(function () {
  const API_BASE = 'https://diamondreport.app/api/v1';
  const SEASON = new Date().getFullYear();

  async function fetchJSON(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchTodaySchedule() {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const data = await fetchJSON(`${API_BASE}/schedule?sportId=1&date=${today}&hydrate=team,probablePitcher&language=en`);
    const entry = (data.dates || []).find(d => d.date === today) || data.dates?.[0];
    const games = (entry && entry.games) || [];
    return games.slice().sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
  }

  async function fetchPitcherSeasonStat(pitcherId) {
    if (!pitcherId) return {};
    try {
      const data = await fetchJSON(`${API_BASE}/people/${pitcherId}?hydrate=stats(group=pitching,type=season,season=${SEASON})`);
      return data.people?.[0]?.stats?.[0]?.splits?.[0]?.stat || {};
    } catch (e) {
      return {};
    }
  }

  // Same league-average constants and weights as app.js's loadGameProps.
  const LEAGUE_AVG_TEAM_RUNS = 4.3;
  const LEAGUE_AVG_WHIP = 1.30, LEAGUE_AVG_K9 = 8.5, LEAGUE_AVG_HR9 = 1.20;

  function pitcherRunIndex(whip, k9, hr9) {
    const whipRatio = whip / LEAGUE_AVG_WHIP;
    const hr9Ratio = hr9 / LEAGUE_AVG_HR9;
    const k9Ratio = LEAGUE_AVG_K9 / Math.max(k9, 1);
    return (whipRatio * 0.5) + (hr9Ratio * 0.3) + (k9Ratio * 0.2);
  }

  function computeGameProjection(g, awayStats, homeStats) {
    const awayAbbr = g.teams.away.team.abbreviation;
    const homeAbbr = g.teams.home.team.abbreviation;
    const awayName = g.teams.away.team.name || awayAbbr;
    const homeName = g.teams.home.team.name || homeAbbr;

    const awayERA = parseFloat(awayStats.era) || 4.5;
    const homeERA = parseFloat(homeStats.era) || 4.5;
    const awayWHIP = parseFloat(awayStats.whip) || 1.3;
    const homeWHIP = parseFloat(homeStats.whip) || 1.3;
    const awayK9 = parseFloat(awayStats.strikeoutsPer9Inn) || 8;
    const homeK9 = parseFloat(homeStats.strikeoutsPer9Inn) || 8;
    const awayHR9 = parseFloat(awayStats.homeRunsPer9) || LEAGUE_AVG_HR9;
    const homeHR9 = parseFloat(homeStats.homeRunsPer9) || LEAGUE_AVG_HR9;

    let awayScore = 50, homeScore = 50;

    const eraDiff = awayERA - homeERA;
    const eraPts = Math.min(Math.abs(eraDiff) * 3, 10);
    if (eraDiff > 0) homeScore += eraPts; else if (eraDiff < 0) awayScore += eraPts;

    const whipDiff = awayWHIP - homeWHIP;
    const whipPts = Math.min(Math.abs(whipDiff) * 10, 6);
    if (whipDiff > 0) homeScore += whipPts; else if (whipDiff < 0) awayScore += whipPts;

    const k9Diff = homeK9 - awayK9;
    const k9Pts = Math.min(Math.abs(k9Diff) * 1.2, 5);
    if (k9Diff > 0) homeScore += k9Pts; else if (k9Diff < 0) awayScore += k9Pts;

    const awayRecord = g.teams.away.leagueRecord || {};
    const homeRecord = g.teams.home.leagueRecord || {};
    const awayW = parseInt(awayRecord.wins) || 0, awayL = parseInt(awayRecord.losses) || 0;
    const homeW = parseInt(homeRecord.wins) || 0, homeL = parseInt(homeRecord.losses) || 0;
    if ((awayW + awayL) >= 10 && (homeW + homeL) >= 10) {
      const awayWinPct = awayW / (awayW + awayL);
      const homeWinPct = homeW / (homeW + homeL);
      const recordDiff = awayWinPct - homeWinPct;
      const recordPts = Math.max(-18, Math.min(18, recordDiff * 60));
      if (recordPts >= 1) awayScore += recordPts;
      else if (recordPts <= -1) homeScore += Math.abs(recordPts);
    }

    const gameHourCDT = new Date(g.gameDate).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Chicago' });
    if (parseInt(gameHourCDT) < 17) homeScore += 2; // day game
    homeScore += 3; // home field

    const total = awayScore + homeScore;
    const awayPct = Math.round((awayScore / total) * 100);
    const homePct = 100 - awayPct;
    const diff = Math.abs(awayPct - homePct);
    const winner = awayPct > homePct ? 'away' : 'home';
    const winnerAbbr = winner === 'away' ? awayAbbr : homeAbbr;
    const winnerPct = winner === 'away' ? awayPct : homePct;

    // Projected runs -- same opposing-pitching-index approach as the live
    // model, bullpen ratio held neutral (1) since bullpen stats aren't
    // fetched in this first pass (the live model itself falls back toward
    // neutral whenever bullpen data is thin).
    const awayPitcherIndex = pitcherRunIndex(awayWHIP, awayK9, awayHR9);
    const homePitcherIndex = pitcherRunIndex(homeWHIP, homeK9, homeHR9);
    let awayRuns = LEAGUE_AVG_TEAM_RUNS * homePitcherIndex;
    let homeRuns = LEAGUE_AVG_TEAM_RUNS * awayPitcherIndex;
    if ((awayW + awayL) >= 10 && (homeW + homeL) >= 10) {
      const awayWinPct = awayW / (awayW + awayL);
      const homeWinPct = homeW / (homeW + homeL);
      awayRuns *= 1 + Math.max(-0.15, Math.min(0.15, (awayWinPct - 0.5) * 0.3));
      homeRuns *= 1 + Math.max(-0.15, Math.min(0.15, (homeWinPct - 0.5) * 0.3));
    }

    const status = g.status && g.status.abstractGameState;
    const dt = new Date(g.gameDate);
    const startTime = dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' });

    return {
      id: `mlb-${g.gamePk}`,
      sport: 'MLB',
      startTime,
      status: status === 'Live' ? 'live' : status === 'Final' ? 'final' : 'scheduled',
      away: { id: String(g.teams.away.team.id), abbr: awayAbbr, name: awayName },
      home: { id: String(g.teams.home.team.id), abbr: homeAbbr, name: homeName },
      projection: {
        awayScore: Math.round(awayRuns * 10) / 10,
        homeScore: Math.round(homeRuns * 10) / 10,
        edgeLabel: `${winnerAbbr} +${diff}%`,
        confidence: winnerPct,
      },
    };
  }

  async function loadDashboard() {
    const scheduleGames = await fetchTodaySchedule();
    const games = await Promise.all(scheduleGames.map(async g => {
      try {
        const awayPitcherId = g.teams.away.probablePitcher && g.teams.away.probablePitcher.id;
        const homePitcherId = g.teams.home.probablePitcher && g.teams.home.probablePitcher.id;
        const [awayStats, homeStats] = await Promise.all([
          fetchPitcherSeasonStat(awayPitcherId),
          fetchPitcherSeasonStat(homePitcherId),
        ]);
        return computeGameProjection(g, awayStats, homeStats);
      } catch (e) {
        console.error('Diamond Report: skipping a game whose projection failed to compute', g && g.gamePk, e);
        return null;
      }
    }));

    return {
      generatedAt: new Date().toISOString(),
      mode: 'live',
      games: games.filter(Boolean),
    };
  }

  window.DiamondReportDataProvider = { loadDashboard };
})();
