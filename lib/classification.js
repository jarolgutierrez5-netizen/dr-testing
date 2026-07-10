// ---- Classification / labeling logic ----
// Turns raw projections into the badges, tones, and "Why" copy shown in the UI.
// Blends real season data (via lib/dataAccess.js) with sample-window data where
// available, and falls back to sample-only tiers where no real season stat exists.
import { getSeasonHr, getWeather, getSeasonStats } from "./dataAccess";
import { pct } from "./projections";

export const METRIC_FORMAT = {
  ba: (v) => `.${Math.round(v * 1000).toString().padStart(3, "0")}`,
  woba: (v) => `.${Math.round(v * 1000).toString().padStart(3, "0")}`,
  slg: (v) => `.${Math.round(v * 1000).toString().padStart(3, "0")}`,
  hr: (v) => v,
  whiff: (v) => `${v}%`,
};

// Color is always "how good is this number for the BATTER's HR odds" -- applied the
// same way whether it's the pitcher's allowed-stat or the batter's own-stat, so the
// two sections read consistently at a glance.
export function metricColorClass(metric, value) {
  if (metric === "hr") return value >= 1 ? "text-amber-400" : "text-slate-500";
  if (metric === "whiff") {
    if (value <= 18) return "text-emerald-400"; // low whiff = good contact = good for batter
    if (value >= 30) return "text-rose-400";
    return "text-slate-300";
  }
  const goodBad = { ba: [0.280, 0.220], woba: [0.350, 0.290], slg: [0.470, 0.370] }[metric];
  if (!goodBad) return "text-slate-300";
  const [good, bad] = goodBad;
  if (value >= good) return "text-emerald-400";
  if (value <= bad) return "text-rose-400";
  return "text-slate-300";
}

// A pitch type shows a real advantage when the pitcher is genuinely vulnerable on it
// AND the batter is genuinely strong against it -- both sides have to show up. Used
// by every prop card (HR, Hits, RBIs, etc.), not just Home Runs.
export function pitchTypeAdvantage(pitcherSplit, batterStats) {
  const pitcherVulnerable = pitcherSplit.slg >= 0.470 || pitcherSplit.hr >= 2 || pitcherSplit.whiff <= 18;
  const batterStrong = batterStats.slg >= 0.470 || batterStats.hr >= 1 || batterStats.whiff <= 20;
  return pitcherVulnerable && batterStrong;
}

// Rolls the whole pitch mix into one overall read -- not just the single best pitch,
// but every pitch type weighted by how often the pitcher actually throws it. Compares
// the batter's usage-weighted SLG against the pitcher's usage-weighted SLG-allowed,
// with a smaller adjustment for whiff rate, since a pitch he rarely throws matters
// less than one he leans on.
export function matchupVerdict(matchupRows) {
  const totalUsage = matchupRows.reduce((s, r) => s + r.usagePct, 0) || 100;
  const weighted = (pick) => matchupRows.reduce((s, r) => s + (r.usagePct / totalUsage) * pick(r), 0);
  const batterSlg = weighted(r => r.batterStats.slg);
  const pitcherSlgAllowed = weighted(r => r.pitcherSplit.slg);
  const pitcherWhiff = weighted(r => r.pitcherSplit.whiff);
  const batterWhiff = weighted(r => r.batterStats.whiff);
  const score = (batterSlg - pitcherSlgAllowed) * 100 - (pitcherWhiff - batterWhiff) * 0.4;
  if (score >= 6) return { key: "batter", tone: "green", text: "Edge: Batter", batterSlg, pitcherSlgAllowed };
  if (score <= -6) return { key: "pitcher", tone: "amber", text: "Edge: Pitcher", batterSlg, pitcherSlgAllowed };
  return { key: "even", tone: "slate", text: "Even Matchup", batterSlg, pitcherSlgAllowed };
}

// Per-row label for a single pitch type -- same underlying thresholds as
// metricColorClass (so the badge never contradicts the colored numbers next to it),
// just worded for whichever side owns the row. A batter row calls out his own hot/cold
// zones; a pitcher row calls out where he's exposed or where the pitch is a weapon.
export function pitchOutcomeLabel(stats, mode) {
  const strong = stats.slg >= 0.470 || stats.hr >= 2 || stats.whiff <= 18;
  const weak = stats.ba <= 0.220 || stats.whiff >= 30 || stats.slg <= 0.370;
  if (mode === "batter") {
    if (strong) return { text: "🔥 HR Spot", tone: "amber" };
    if (weak) return { text: "🧊 Weak Spot", tone: "slate" };
  } else {
    if (strong) return { text: "⚠️ Vulnerable", tone: "amber" };
    if (weak) return { text: "🛡️ Strength", tone: "green" };
  }
  return null;
}

// Single letter grade (A-F) synthesizing a whole pitch arsenal: higher average whiff
// rate and lower average SLG allowed (across both handedness splits) both push the
// grade up. 0.370 is used as the "neutral" SLG baseline, roughly league average.
export function arsenalGrade(arsenal) {
  const avgWhiff = arsenal.reduce((s, r) => s + r.avgWhiff, 0) / arsenal.length;
  const avgSlg = arsenal.reduce((s, r) => s + (r.vsL.slg + r.vsR.slg) / 2, 0) / arsenal.length;
  const score = avgWhiff - (avgSlg - 0.370) * 100;
  if (score >= 22) return "A";
  if (score >= 16) return "B";
  if (score >= 10) return "C";
  if (score >= 4) return "D";
  return "F";
}

// Switch hitters bat opposite the pitcher's throwing hand; unconfirmed batters fall back
// to a labeled default rather than a guess.
export function effectiveBatterSide(bats, pitcherThrows) {
  if (bats === "S") return pitcherThrows === "R" ? "L" : "R";
  return bats || null;
}

// Per-batter version of the same same-side/opposite-side platoon logic used for the
// aggregate lineup read in Games Today -- here applied to one specific hitter.
export function batterPlatoonRead(pitcherThrows, bats) {
  const side = effectiveBatterSide(bats, pitcherThrows);
  if (!side || !pitcherThrows) return null;
  return side === pitcherThrows
    ? { text: "Pitcher Edge", tone: "green" }
    : { text: "Batter Edge", tone: "amber" };
}

// Background/border/text classes for a zone square -- same good/bad-for-batter
// direction as metricColorClass, just rendered as a filled tile instead of text color.
export function zoneTone(ba) {
  if (ba >= 0.280) return { bg: "bg-emerald-500/25", border: "border-emerald-400/50", text: "text-emerald-100" };
  if (ba <= 0.220) return { bg: "bg-rose-500/25", border: "border-rose-400/50", text: "text-rose-100" };
  return { bg: "bg-slate-500/15", border: "border-slate-500/30", text: "text-slate-200" };
}

// Intensity ramp: higher usage = more saturated fill. Deliberately not green/red since
// "where a pitcher throws most" isn't inherently good or bad, just informative.
export function zoneHeatTone(usagePct) {
  if (usagePct >= 16) return { bg: "bg-fuchsia-500/40", border: "border-fuchsia-400/60", text: "text-fuchsia-50" };
  if (usagePct >= 11) return { bg: "bg-fuchsia-500/22", border: "border-fuchsia-400/40", text: "text-fuchsia-100" };
  if (usagePct >= 7) return { bg: "bg-slate-500/15", border: "border-slate-500/30", text: "text-slate-200" };
  return { bg: "bg-slate-500/5", border: "border-slate-500/15", text: "text-slate-400" };
}

// HR status label -- derived transparently from real data we already have (sample HR,
// confirmed season HR, weather/park context). Not every player gets a label; that's
// intentional, a forced label on thin data would be less honest than no label at all.
export function classifyHr(p, agg) {
  const seasonHr = getSeasonHr(p.name);
  if (agg.hr > 0) return { key: "on_fire", text: "🔥 On Fire", tone: "amber" };

  const weather = getWeather(p.game);
  const parkFavorsHitters = weather && !weather.tag.toLowerCase().includes("suppress");
  if (parkFavorsHitters && seasonHr !== undefined && seasonHr >= 10) {
    return { key: "batter_favored", text: "⚖️ Batter Favored", tone: "green" };
  }
  if (seasonHr !== undefined && seasonHr >= 18) return { key: "top_threat", text: "🎯 Top HR Threat", tone: "purple" };
  if (seasonHr !== undefined && seasonHr >= 10) return { key: "due", text: "⏳ Due", tone: "slate" };
  if (seasonHr !== undefined && seasonHr < 10) return { key: "drought", text: "🧊 Drought", tone: "slate" };
  return null;
}

export const HR_LABELS = [
  { key: "on_fire", text: "🔥 On Fire" },
  { key: "top_threat", text: "🎯 Top HR Threat" },
  { key: "batter_favored", text: "⚖️ Batter Favored" },
  { key: "due", text: "⏳ Due" },
  { key: "drought", text: "🧊 Drought" },
];

// Explains the HR projection in terms of the label that was actually assigned --
// keeps the "Why" text and the badge telling the same story instead of two models.
export function hrWhyText(p, agg, label, seasonHr) {
  const last = p.name.split(" ")[1];
  if (label?.key === "on_fire") return `${last} already went deep in the last ${agg.g} games — the strongest signal we have, so this projection leans up.`;
  if (label?.key === "top_threat") return `${last} is on a ${seasonHr}-HR season pace, an elite power profile even without a homer in this small sample.`;
  if (label?.key === "due") return `${last} has ${seasonHr} HR this season but nothing in the last ${agg.g} games — a real power bat that's simply been quiet lately.`;
  if (label?.key === "drought") return `${last} has just ${seasonHr} HR this season and none recently — the underlying power output here is limited.`;
  if (label?.key === "batter_favored") return `${last} gets a park/weather boost tonight on top of a real power profile.`;
  return `${last} has no confirmed season HR total and nothing in the recent sample, so this stays a low, data-thin projection.`;
}

export function classifySampleStat(value, cfg) {
  if (value >= cfg.hotAt) return { key: "hot", text: "🔥 Hot Hand", tone: "amber" };
  if (value <= cfg.coldAt) return { key: "cold", text: "🧊 Cold", tone: "slate" };
  return { key: "steady", text: "➖ Steady", tone: "green" };
}

// Hits: blends real season AVG in (where confirmed) the same way classifyHr blends
// season HR pace -- a hot sample always wins, then season quality tiers the rest.
export function classifyHits(p, a) {
  if (a.h >= 3) return { key: "hot", text: "🔥 Hot Hand", tone: "amber" };
  const avg = getSeasonStats(p.name, 2026)?.avg;
  if (avg !== undefined) {
    if (avg >= 0.280) return { key: "high_avg", text: "🎯 High Average", tone: "purple" };
    if (avg <= 0.230) return { key: "cold_season", text: "🧊 Cold Season", tone: "slate" };
    return { key: "steady", text: "➖ Steady", tone: "green" };
  }
  return classifySampleStat(a.h, STAT_CONFIGS.hits);
}

// RBIs: same idea using real season RBI count where confirmed. Thresholds are a rough
// full-season pace read (~90 games in), not a precise model.
export function classifyRbi(p, a) {
  if (a.rbi >= 2) return { key: "hot", text: "🔥 Hot Hand", tone: "amber" };
  const rbi = getSeasonStats(p.name, 2026)?.rbi;
  if (rbi !== undefined) {
    if (rbi >= 45) return { key: "elite_pace", text: "🎯 Elite Pace", tone: "purple" };
    if (rbi <= 20) return { key: "cold_season", text: "🧊 Cold Season", tone: "slate" };
    return { key: "steady", text: "➖ Steady", tone: "green" };
  }
  return classifySampleStat(a.rbi, STAT_CONFIGS.rbi);
}

export const SAMPLE_STAT_LABELS = [
  { key: "hot", text: "🔥 Hot Hand" },
  { key: "steady", text: "➖ Steady" },
  { key: "cold", text: "🧊 Cold" },
];

// Config-driven engine for the four remaining prop stats (Hits, RBIs, Total Bases,
// H+R+RBI). Hits and RBIs now blend in real season data where we have it (season AVG
// for Hits, season RBI for RBIs) the same way HR uses season HR pace -- Total Bases
// and H+R+RBI stay sample-based since no real season totals exist for those combined
// stats for anyone in this pool.
export const STAT_CONFIGS = {
  hits: {
    key: "hits", emoji: "⚾", label: "Hits", line: 0.5, pctLabel: "Hits Edge",
    lambda: (a) => (a.h / a.ab) * 4,
    sampleVal: (a) => a.h, hotAt: 3, coldAt: 0,
    classify: (p, a) => classifyHits(p, a),
    labelOptions: [
      { key: "hot", text: "🔥 Hot Hand" }, { key: "high_avg", text: "🎯 High Average" },
      { key: "steady", text: "➖ Steady" }, { key: "cold_season", text: "🧊 Cold Season" }, { key: "cold", text: "🧊 Cold" },
    ],
    pills: (a) => [
      { label: "AVG (sample)", value: METRIC_FORMAT.ba(a.h / a.ab) },
      { label: "Sample", value: `${a.h}-${a.ab}` },
    ],
    why: (p, a, prob) => `${p.name.split(" ")[1]} is hitting ${METRIC_FORMAT.ba(a.h/a.ab)} over the last ${a.g} games (${a.h}-for-${a.ab}), projecting to ${pct(prob)}% for a hit.`,
  },
  rbi: {
    key: "rbi", emoji: "💰", label: "RBIs", line: 0.5, pctLabel: "RBI Edge",
    lambda: (a) => a.rbi / a.g,
    sampleVal: (a) => a.rbi, hotAt: 2, coldAt: 0,
    classify: (p, a) => classifyRbi(p, a),
    labelOptions: [
      { key: "hot", text: "🔥 Hot Hand" }, { key: "elite_pace", text: "🎯 Elite Pace" },
      { key: "steady", text: "➖ Steady" }, { key: "cold_season", text: "🧊 Cold Season" }, { key: "cold", text: "🧊 Cold" },
    ],
    pills: (a) => [
      { label: "Sample RBI", value: a.rbi },
      { label: "Per Game", value: (a.rbi / a.g).toFixed(2) },
    ],
    why: (p, a, prob) => `${p.name.split(" ")[1]} has driven in ${a.rbi} run${a.rbi===1?"":"s"} across the last ${a.g} games, projecting to ${pct(prob)}% for Over 0.5 RBI.`,
  },
  tb: {
    key: "tb", emoji: "💎", label: "Total Bases", line: 1.5, pctLabel: "TB Edge",
    lambda: (a) => a.totalBases / a.g,
    sampleVal: (a) => a.totalBases, hotAt: 4, coldAt: 0,
    labelOptions: null, // falls back to SAMPLE_STAT_LABELS -- no real season TB data exists to tier on
    pills: (a) => [
      { label: "Sample TB", value: a.totalBases },
      { label: "Per Game", value: (a.totalBases / a.g).toFixed(2) },
    ],
    why: (p, a, prob) => `${p.name.split(" ")[1]} is averaging ${(a.totalBases/a.g).toFixed(2)} total bases per game, projecting to ${pct(prob)}% for Over 1.5 TB.`,
  },
  hrrbi: {
    key: "hrrbi", emoji: "📈", label: "Hits + Runs + RBI", line: 1.5, pctLabel: "H+R+RBI Edge",
    lambda: (a) => (a.h + a.r + a.rbi) / a.g,
    sampleVal: (a) => a.h + a.r + a.rbi, hotAt: 4, coldAt: 0,
    labelOptions: null, // falls back to SAMPLE_STAT_LABELS -- no real combined-stat season data exists
    pills: (a) => [
      { label: "Sample Total", value: a.h + a.r + a.rbi },
      { label: "Per Game", value: ((a.h+a.r+a.rbi)/a.g).toFixed(2) },
    ],
    why: (p, a, prob) => `${p.name.split(" ")[1]} is combining for ${((a.h+a.r+a.rbi)/a.g).toFixed(2)} hits+runs+RBI per game recently, projecting ${pct(prob)}% for Over 1.5.`,
  },
};
