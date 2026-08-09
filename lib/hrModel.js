// ---- Home Run probability model ----
// Treats a batter's HR count in a single game as Poisson-distributed, so
// P(HR >= 1) = 1 - e^-lambda. Lambda (expected HR in the next game) blends two
// signals: recent-form HR rate per at-bat, and full-season HR pace. Recent form
// reacts fast but is noisy over just a handful of games; season pace is stable but
// slow to reflect a real hot/cold shift. Blending both, rather than picking one,
// keeps a two-game heater from overwhelming a full season of evidence (or vice versa).

const EXPECTED_AB_PER_GAME = 4.2; // rough MLB-average at-bats for a batter who starts a full game
const RECENT_WEIGHT = 0.4; // recent form gets a real say, but season pace anchors the blend against small-sample noise

export function recentHrRate(games) {
  const ab = games.reduce((sum, g) => sum + g.ab, 0);
  const hr = games.reduce((sum, g) => sum + g.hr, 0);
  return ab > 0 ? hr / ab : 0;
}

export function seasonHrRate(seasonHr, seasonGames) {
  return seasonGames > 0 ? seasonHr / seasonGames : null;
}

export function hrLambda(batter) {
  const recentLambda = recentHrRate(batter.recentGames) * EXPECTED_AB_PER_GAME;
  const seasonRate = seasonHrRate(batter.seasonHr, batter.seasonGames);
  if (seasonRate === null) return recentLambda;
  return RECENT_WEIGHT * recentLambda + (1 - RECENT_WEIGHT) * seasonRate;
}

export function hrProbability(lambda) {
  return Math.max(0, Math.min(0.99, 1 - Math.exp(-lambda)));
}

export function pct(x) {
  return Math.round(x * 100);
}

export function classifyHrThreat(batter) {
  const recentHr = batter.recentGames.reduce((sum, g) => sum + g.hr, 0);
  if (recentHr > 0) return { key: "on_fire", text: "🔥 On Fire", tone: "amber" };

  const seasonRate = seasonHrRate(batter.seasonHr, batter.seasonGames);
  if (seasonRate === null) return { key: "unproven", text: "❔ Unproven", tone: "slate" };

  const pace162 = seasonRate * 162;
  if (pace162 >= 35) return { key: "elite", text: "🎯 Elite Power", tone: "purple" };
  if (pace162 >= 20) return { key: "solid", text: "⚖️ Solid Power", tone: "green" };
  if (pace162 >= 10) return { key: "average", text: "➖ Average Power", tone: "slate" };
  return { key: "cold", text: "🧊 Cold", tone: "slate" };
}

export const HR_LABELS = [
  { key: "on_fire", text: "🔥 On Fire" },
  { key: "elite", text: "🎯 Elite Power" },
  { key: "solid", text: "⚖️ Solid Power" },
  { key: "average", text: "➖ Average Power" },
  { key: "cold", text: "🧊 Cold" },
  { key: "unproven", text: "❔ Unproven" },
];

export function hrWhyText(batter, label) {
  const last = batter.name.split(" ").slice(-1)[0];
  const recentHr = batter.recentGames.reduce((sum, g) => sum + g.hr, 0);
  const seasonRate = seasonHrRate(batter.seasonHr, batter.seasonGames);

  if (recentHr > 0) {
    return `${last} has ${recentHr} HR in the last ${batter.recentGames.length} games — the strongest signal in this model, so the projection leans up.`;
  }
  if (seasonRate !== null) {
    return `${last} is on a ${Math.round(seasonRate * 162)}-HR season pace but hasn't gone deep in the last ${batter.recentGames.length} games, so the projection blends toward the season number.`;
  }
  return `${last} has no season HR total on record, so this projection relies on the recent at-bats alone.`;
}

export function projectHr(batter) {
  const lambda = hrLambda(batter);
  const probability = hrProbability(lambda);
  const label = classifyHrThreat(batter);
  return { lambda, probability, label, why: hrWhyText(batter, label) };
}
