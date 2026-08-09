// ---- Home Run probability model ----
// Follows the plate-appearance framing from the HR Projection Model Guide:
//
//   P(1+ HR in game) = 1 - (1 - pHR/PA)^E[PA]
//
// pHR/PA (today's matchup-adjusted per-PA HR rate) is built in three steps:
//
//   1. Skill estimate: blend recent-form HR/PA with season HR/PA, each first
//      shrunk toward a league-average prior (guide section 5, "partial
//      pooling") so a hot week or a September call-up with almost no season
//      sample can't swing the projection on its own. This app has no Statcast
//      feed (barrel rate, exit velocity, launch angle -- guide section 1), so
//      HR/PA is the skill proxy; a real upgrade path is wiring those in.
//   2. Matchup factor: today's opposing pitcher/bullpen HR-rate-allowed,
//      folded into one multiplier (guide section 2). This app doesn't carry a
//      pitcher roster, so it's a per-batter mock field for today's matchup.
//   3. Park/weather factor: today's HR-friendliness multiplier (guide
//      section 3), also a per-batter mock field.
//
// E[PA] (guide section 4) is looked up from batting-order position -- this
// app doesn't model full team offensive context, just the lineup-spot effect
// on how many plate appearances a batter gets in a game.

const LEAGUE_AVG_HR_PA = 0.031; // ~1 HR per 32 PA, a rough modern MLB-wide rate
const RECENT_PRIOR_PA = 60;     // shrinkage strength for the recent-form sample
const SEASON_PRIOR_PA = 150;    // season totals are a much bigger sample already, so they need less pulling toward the prior
const RECENT_WEIGHT = 0.4;      // recent form still gets a real say once both are shrunk

// Expected PA by batting-order spot in a 9-inning game -- lower in the order
// bats less often. Stands in for the guide's fuller "team offensive quality /
// scoring environment" inputs, which this app doesn't model.
const EXPECTED_PA_BY_ORDER = { 4: 4.3, 5: 4.2, 6: 4.1, 7: 3.9, 8: 3.8, 9: 3.6 };

// Beta-Binomial shrinkage: pulls a small sample toward the league-average
// rate, with priorPa controlling how much weight the prior gets relative to
// the observed sample.
function shrink(hr, pa, priorPa) {
  return (hr + priorPa * LEAGUE_AVG_HR_PA) / (pa + priorPa);
}

export function recentHrPa(games) {
  const pa = games.reduce((sum, g) => sum + g.pa, 0);
  const hr = games.reduce((sum, g) => sum + g.hr, 0);
  return shrink(hr, pa, RECENT_PRIOR_PA);
}

export function seasonHrPa(seasonHr, seasonPa) {
  return shrink(seasonHr || 0, seasonPa || 0, SEASON_PRIOR_PA);
}

// Park/matchup-neutral skill estimate.
export function neutralHrPa(batter) {
  return RECENT_WEIGHT * recentHrPa(batter.recentGames) + (1 - RECENT_WEIGHT) * seasonHrPa(batter.seasonHr, batter.seasonPa);
}

// Today's matchup + park/weather multiplier on top of the neutral estimate.
export function contextFactor(batter) {
  return (batter.matchupFactor ?? 1) * (batter.parkWeatherFactor ?? 1);
}

export function expectedPa(battingOrder) {
  return EXPECTED_PA_BY_ORDER[battingOrder] ?? 3.8;
}

export function gameProbability(pHrPa, ePa) {
  return Math.max(0, Math.min(0.99, 1 - Math.pow(1 - pHrPa, ePa)));
}

export function pct(x) {
  return Math.round(x * 100);
}

// Guide section 6: two rankings -- raw probability (todayProbability) and a
// context opportunity score showing how much of today's number comes from
// the matchup/park/weather rather than the batter's own skill.
export function projectHr(batter) {
  const ePa = expectedPa(batter.battingOrder);
  const neutral = neutralHrPa(batter);
  const today = neutral * contextFactor(batter);

  const neutralProbability = gameProbability(neutral, ePa);
  const probability = gameProbability(today, ePa);

  return { probability, neutralProbability, opportunityScore: probability - neutralProbability };
}
