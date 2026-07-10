// ---- Projection / probability model functions ----
// Transparent v1 models: Poisson for prop over/unders, Log5 + pitcher/bullpen/recent-
// form blending for game win%, and a simplified team-level Monte Carlo sim. All real
// math, applied to whatever data getStarter/getTeam/etc. currently return -- mock or
// real, the model doesn't care, which is the point of routing everything through
// lib/dataAccess.js.
import { clamp, seededRandom } from "./random";
import {
  BF_PER_9, START_IP_ASSUMPTION, LEAGUE_AVG_K_PCT, K_CUSHION_TARGET,
  LEAGUE_AVG_ERA, HOME_FIELD_EDGE, PITCHER_WEIGHT, RECENT_FORM_WEIGHT, RECENT_FORM_CAP,
  BULLPEN_WEIGHT, LEAGUE_AVG_RELIEF_ERA, SIM_ITERATIONS, LOCK_WINDOW_MINUTES,
} from "./constants";
import { getTeam, getStarter, getRecentForm, getLineupHandedness, getSlate, getWeather } from "./dataAccess";
import { CLOSERS } from "@/data";
import { mockCloser } from "./mockGenerators";

// Poisson helpers -- simple, transparent v1 model for "Over X.5" probabilities
export function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
export function poissonP(lambda, k) { return Math.exp(-lambda) * Math.pow(lambda, k) / fact(k); }
export function overProb(lambda, line) {
  const kMax = Math.floor(line);
  let cdf = 0;
  for (let i = 0; i <= kMax; i++) cdf += poissonP(lambda, i);
  return Math.max(0, Math.min(0.99, 1 - cdf));
}
export function pct(x) { return Math.round(x * 100); }

export function battingAgg(p) {
  const g = p.games.length;
  const sum = (k) => p.games.reduce((s, x) => s + (x[k] || 0), 0);
  const ab = sum("ab"), h = sum("h"), bb = sum("bb"), hr = sum("hr"), d2 = sum("d2"), rbi = sum("rbi"), r = sum("r");
  const singles = h - d2 - hr;
  const totalBases = singles * 1 + d2 * 2 + hr * 4;
  return { g, ab, h, bb, hr, d2, rbi, r, totalBases };
}

// Projects strikeouts for a probable start: K% (the "cleaner" measure per pitcher,
// since it normalizes for playing time the way K/9 doesn't) applied to an expected
// batters-faced count for a 6-inning outing, then scaled by how often the specific
// opposing lineup strikes out relative to league average.
export function projectStrikeouts(kPct, oppKPct) {
  const projectedBF = BF_PER_9 * (START_IP_ASSUMPTION / 9);
  const baseline = (kPct / 100) * projectedBF;
  return baseline * (oppKPct / LEAGUE_AVG_K_PCT);
}

// Sets the posted "Line" below the raw projection on purpose -- real prop lines carry
// a built-in cushion so the projection clears it comfortably rather than sitting right
// at a coin flip. Cushion is always shown alongside so nothing is hidden about how the
// line was derived from the projection.
export function computeKLine(projK) {
  const raw = projK - K_CUSHION_TARGET;
  const line = Math.max(0.5, Math.floor(raw) + 0.5);
  return { line, cushion: projK - line };
}

// Log5: transparent v1 method for head-to-head win probability from season win%
export function log5(pA, pB) {
  const num = pA - pA * pB, den = pA + pB - 2 * pA * pB;
  return den === 0 ? 0.5 : num / den;
}

export function getCloser(teamAbbr) { return CLOSERS[teamAbbr] || mockCloser(teamAbbr); }

// Blends a team's starter's ERA against league average into a win% multiplier.
// A starter right at league average leaves the team's win% unchanged.
export function pitcherFactor(starter) {
  if (!starter) return 1;
  return (1 - PITCHER_WEIGHT) + PITCHER_WEIGHT * (LEAGUE_AVG_ERA / starter.era);
}

// Same idea as pitcherFactor, but for the closer's ERA -- smaller weight than the
// starter since one reliever is a fraction of a bullpen, but real bullpen strength
// now has a seat at the table.
export function bullpenFactorFor(teamAbbr) {
  const closer = getCloser(teamAbbr);
  return (1 - BULLPEN_WEIGHT) + BULLPEN_WEIGHT * (LEAGUE_AVG_RELIEF_ERA / closer.era);
}

// Real data: average run differential over a team's last two games, scaled into a
// small win% nudge and capped so a single blowout can't dominate the projection.
export function recentFormFactor(abbr) {
  const form = getRecentForm(abbr);
  if (!form.length) return 0;
  const avgDiff = form.reduce((sum, g) => sum + (g.rf - g.ra), 0) / form.length;
  return clamp(avgDiff * RECENT_FORM_WEIGHT, -RECENT_FORM_CAP, RECENT_FORM_CAP);
}

// Blends season win% with starting-pitcher quality, bullpen strength, real recent
// form, and a standard home-field edge. Transparent v1 -- next real upgrade needs a
// live data feed for quantified park factors and advanced metrics like wOBA/FIP.
export function projectGame(awayAbbr, homeAbbr) {
  const away = getTeam(awayAbbr), home = getTeam(homeAbbr);
  const awaySP = getStarter(awayAbbr), homeSP = getStarter(homeAbbr);

  const awayAdjWp = clamp(away.wp * pitcherFactor(awaySP) * bullpenFactorFor(awayAbbr) + recentFormFactor(awayAbbr), 0.03, 0.97);
  const homeAdjWp = clamp(home.wp * pitcherFactor(homeSP) * bullpenFactorFor(homeAbbr) + recentFormFactor(homeAbbr), 0.03, 0.97);

  const homeProb = log5(homeAdjWp, awayAdjWp) + HOME_FIELD_EDGE;
  return clamp(homeProb, 0.03, 0.97);
}

// Parses a "11:35 AM CDT" slate time against today's date in the browser's local time.
// v1 simplification: treats the label as local time rather than converting from CDT,
// since we don't have real UTC kickoff timestamps yet -- fine for a same-region demo,
// worth fixing once a real schedule feed with proper timestamps is wired in.
export function parseGameTime(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
}

export function minutesUntilFirstPitch(timeStr) {
  return (parseGameTime(timeStr) - new Date()) / 60000;
}

// Our tracked sample matchups (LAD vs COL, TB vs NYY) are historical box scores, not
// necessarily on today's actual slate -- LAD isn't playing today, for instance. This
// only returns a lock state when the player's game label genuinely matches a game on
// today's real SLATE; otherwise it says so honestly instead of faking a countdown.
export function getGameLockInfo(gameLabel) {
  const match = getSlate().find(g => `${g.away} vs ${g.home}` === gameLabel || `${g.home} vs ${g.away}` === gameLabel);
  if (!match) return { scheduled: false, locked: false };
  return { scheduled: true, locked: minutesUntilFirstPitch(match.time) <= LOCK_WINDOW_MINUTES, time: match.time };
}

// Platoon read: pitcher's throwing hand vs. the opponent's expected lineup mix.
// Switch hitters always choose the side that favors them, so they count as "opposite".
export function platoonRead(pitcherThrows, opponentAbbr) {
  const h = getLineupHandedness(opponentAbbr);
  if (!h) return null;
  const oppositeSide = pitcherThrows === "R" ? h.L + h.S : h.R + h.S;
  const edge = oppositeSide >= 6 ? "amber" : oppositeSide <= 3 ? "green" : "slate";
  const label = oppositeSide >= 6 ? "Batters favored" : oppositeSide <= 3 ? "Pitcher favored" : "Even";
  return { oppositeSide, tone: edge, label };
}

export function wxPill(game) {
  const w = getWeather(game);
  return w ? [{ label: "Park/WX", value: w.tag, tone: w.tone }] : [];
}

// ---- Monte Carlo game simulation ----
// A simplified version of the technique real projection sites (e.g. Ballpark Pal)
// use: instead of one point-estimate win% and score, draw each team's runs from a
// Poisson distribution (mean = their expected runs from projectGame) across many
// simulated games, then report the resulting distribution. This is honestly a much
// lighter model than a real plate-appearance-by-plate-appearance simulator -- no
// lineups, no innings, just team-level runs-per-game draws -- so it's labeled
// "simplified" everywhere it appears rather than overclaiming a full game engine.

// Knuth's algorithm: draws a random integer from a Poisson(lambda) distribution
// using a supplied uniform random source instead of Math.random(), so simulations
// stay seeded/reproducible like everything else mock in this app.
export function poissonSample(lambda, rand) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rand(); } while (p > L);
  return k - 1;
}

export function simulateGame(awayLambda, homeLambda, seedKey) {
  const rand = seededRandom(seedKey + ":sim");
  let homeWins = 0;
  const totals = [];
  for (let i = 0; i < SIM_ITERATIONS; i++) {
    let awayRuns = poissonSample(awayLambda, rand);
    let homeRuns = poissonSample(homeLambda, rand);
    if (awayRuns === homeRuns) {
      // Extra innings aren't modeled -- break ties with a coin flip weighted
      // slightly toward the team with the higher run expectancy.
      const homeEdge = homeLambda / (homeLambda + awayLambda);
      if (rand() < homeEdge) homeRuns++; else awayRuns++;
    }
    if (homeRuns > awayRuns) homeWins++;
    totals.push(awayRuns + homeRuns);
  }
  const avgTotal = totals.reduce((s, t) => s + t, 0) / SIM_ITERATIONS;
  const line = Math.round((awayLambda + homeLambda) * 2) / 2; // nearest 0.5, matches the point projection
  const overCount = totals.filter(t => t > line).length;
  const buckets = [
    { label: "0-4", count: totals.filter(t => t <= 4).length },
    { label: "5-7", count: totals.filter(t => t >= 5 && t <= 7).length },
    { label: "8-10", count: totals.filter(t => t >= 8 && t <= 10).length },
    { label: "11+", count: totals.filter(t => t >= 11).length },
  ];
  return {
    iterations: SIM_ITERATIONS,
    homeWinPct: homeWins / SIM_ITERATIONS,
    avgTotal,
    line,
    overPct: overCount / SIM_ITERATIONS,
    buckets: buckets.map(b => ({ ...b, pct: Math.round((b.count / SIM_ITERATIONS) * 100) })),
  };
}
