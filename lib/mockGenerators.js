// ---- Mock data generators ----
// Everything here is MOCK DATA -- deterministically seeded (never Math.random) so
// numbers stay stable across renders, but not sourced from any real feed. Kept
// separate from lib/dataAccess.js and lib/projections.js so the mock-vs-real line
// stays structural: nothing in here is ever imported by a "real data" path, and the
// UI's MOCK DATA badges are driven by which module a value came through.
import { seededRandom, clamp } from "./random";
import {
  PITCH_TYPES, PITCH_VELO_BASE, LEAGUE_AVG_K_PCT, LEAGUE_AVG_SB_PER_G,
  LINEUP_POSITIONS, MOCK_SURNAMES, ZONE_ROWS, ZONE_COLS,
} from "./constants";
import { getBatterLogs, getSeasonHr } from "./dataAccess";

// Real per-pitcher plate-discipline data (SwStr%, Contact%, Z/O-Contact%, O-Swing%,
// fastball velo) needs Statcast/FanGraphs access we don't have. MOCK DATA, but
// deterministically correlated to each pitcher's real K/9 from their last start
// (not independently random) so a high-strikeout arm actually looks like one across
// every metric instead of contradicting itself.
export function mockAdvancedPitchingMetrics(pitcherName, k9Hint) {
  const rand = seededRandom(pitcherName + ":advK");
  const jitter = (spread) => (rand() - 0.5) * spread;
  const kPct = clamp(k9Hint * 2.7 + jitter(4), 14, 38);
  const swStrPct = clamp(6 + k9Hint * 0.7 + jitter(2), 6, 18);
  const contactPct = clamp(82 - (k9Hint - 8) * 1.8 + jitter(4), 64, 88);
  const zContactPct = clamp(contactPct + 8 + jitter(3), 68, 94);
  const oContactPct = clamp(contactPct - 15 + jitter(4), 38, 76);
  const oSwingPct = clamp(26 + (k9Hint - 8) * 0.8 + jitter(3), 20, 40);
  const vFA = clamp(92 + (k9Hint - 8) * 0.4 + jitter(1.5), 88, 99);
  const starts = 14 + Math.floor(rand() * 6);
  return { kPct, swStrPct, contactPct, zContactPct, oContactPct, oSwingPct, vFA, starts };
}

// Opposing lineup's season strikeout rate -- real teams strike out at meaningfully
// different rates, but we don't have that pulled live yet. MOCK DATA, seeded per team.
export function mockTeamKRate(teamAbbr) {
  const rand = seededRandom(teamAbbr + ":teamK");
  return clamp(LEAGUE_AVG_K_PCT + (rand() - 0.5) * 12, 16, 30);
}

// Team-level stolen base attempts per game -- gives Stolen Bases cards some real team
// context even when the individual tracked hitters show 0 in their own sample. MOCK
// DATA, seeded per team. League-average MLB team runs roughly 0.5-0.6 SB attempts/game.
export function mockTeamSbRate(teamAbbr) {
  const rand = seededRandom(teamAbbr + ":teamSB");
  return clamp(LEAGUE_AVG_SB_PER_G + (rand() - 0.5) * 0.9, 0.15, 1.35);
}

// Pitcher's arsenal: usage%, count thrown, velocity, and results allowed split by the
// handedness of the batter facing him (vsL / vsR). MOCK DATA -- no real Statcast access
// yet. Also flags the putaway pitch -- the one with the highest average whiff rate,
// a reasonable proxy for "what he goes to when he needs the swing-and-miss."
export function mockPitcherArsenal(pitcherName) {
  const rand = seededRandom(pitcherName + ":arsenal");
  const totalPitches = 700 + Math.floor(rand() * 400);
  let remaining = 100;
  const rows = PITCH_TYPES.map((pitch, i) => {
    const isLast = i === PITCH_TYPES.length - 1;
    const usagePct = isLast ? remaining : Math.max(8, Math.round(remaining * (0.25 + rand() * 0.3)));
    remaining -= usagePct;
    const count = Math.round((usagePct / 100) * totalPitches);
    const velo = PITCH_VELO_BASE[pitch] + (rand() - 0.5) * 3;
    const splitFor = () => ({
      ba: 0.180 + rand() * 0.16,
      woba: 0.260 + rand() * 0.16,
      slg: 0.310 + rand() * 0.28,
      hr: Math.floor(rand() * 4),
      whiff: Math.round(10 + rand() * 26),
    });
    const vsL = splitFor(), vsR = splitFor();
    return { pitch, usagePct, count, velo, vsL, vsR, avgWhiff: (vsL.whiff + vsR.whiff) / 2 };
  });
  const putawayPitch = rows.reduce((a, b) => (b.avgWhiff > a.avgWhiff ? b : a)).pitch;
  return rows.map(r => ({ ...r, isPutaway: r.pitch === putawayPitch }));
}

// Batter's results against a given pitch type, seeded on batter + pitch + the specific
// pitcher's throwing hand so the same batter can look different vs different arm angles.
export function mockBatterVsPitch(batterName, pitchType, pitcherThrows) {
  const rand = seededRandom(batterName + ":" + pitchType + ":vs" + pitcherThrows);
  return {
    pa: 8 + Math.floor(rand() * 40),
    ba: 0.180 + rand() * 0.20,
    woba: 0.260 + rand() * 0.20,
    slg: 0.300 + rand() * 0.35,
    hr: Math.floor(rand() * 5),
    whiff: Math.round(8 + rand() * 30),
  };
}

// 3x3 strike-zone BA profile (Up/Middle/Down x In/Middle/Away, from the batter's own
// view). MOCK DATA -- zone-level BA needs real Statcast location data we don't have.
// Wider spread than overall BA on purpose: zone profiles are naturally hot/cold.
export function mockZoneProfile(batterName) {
  const rand = seededRandom(batterName + ":zone");
  return ZONE_ROWS.map(row => ZONE_COLS.map(col => ({
    row, col, ba: 0.150 + rand() * 0.230,
  })));
}

// How the pitcher attacks the zone: usage% per location, 9 squares summing to ~100%.
// This is frequency, not good/bad-for-batter, so it gets its own single-hue intensity
// ramp instead of the green/red good-bad scale used for BA. MOCK DATA.
export function mockPitcherZoneAttack(pitcherName) {
  const rand = seededRandom(pitcherName + ":zoneattack");
  const raw = ZONE_ROWS.flatMap(row => ZONE_COLS.map(col => ({ row, col, weight: rand() })));
  const total = raw.reduce((s, z) => s + z.weight, 0);
  let rows = raw.map(z => ({ ...z, usagePct: Math.round((z.weight / total) * 100) }));
  // rounding can drift the sum off 100 by a point or two -- nudge the largest cell to fix it
  const drift = 100 - rows.reduce((s, z) => s + z.usagePct, 0);
  const biggest = rows.reduce((a, b) => (b.usagePct > a.usagePct ? b : a));
  biggest.usagePct += drift;
  return [0, 1, 2].map(r => rows.slice(r * 3, r * 3 + 3));
}

// Probable lineup the pitcher is facing. Blends in any batter we actually track for
// that team (real name, real bats hand, real season HR if confirmed) with mock
// fill-ins for the rest of the order -- most teams don't have 9 tracked batters, so
// the mock names use the same initials+surname convention as STARTERS_RAW. Each row
// carries `real: true/false` so the UI can flag which entries are actually tracked.
export function mockLineup(teamAbbr) {
  const rand = seededRandom(teamAbbr + ":lineup");
  const realPlayers = getBatterLogs().filter(p => p.team === teamAbbr);
  const usedSurnames = new Set();
  return Array.from({ length: 9 }, (_, i) => {
    if (i < realPlayers.length) {
      const rp = realPlayers[i];
      return { order: i + 1, name: rp.name, pos: rp.pos, bats: rp.bats || "?", real: true, seasonHr: getSeasonHr(rp.name) };
    }
    let surname;
    do { surname = MOCK_SURNAMES[Math.floor(rand() * MOCK_SURNAMES.length)]; } while (usedSurnames.has(surname));
    usedSurnames.add(surname);
    const initial = String.fromCharCode(65 + Math.floor(rand() * 26));
    const bats = rand() < 0.35 ? "L" : rand() < 0.9 ? "R" : "S";
    return { order: i + 1, name: `${initial}. ${surname}`, pos: LINEUP_POSITIONS[i], bats, real: false, seasonHr: undefined };
  });
}

// Career-level batter-vs-pitcher summary, split into this season vs. all-time, plus a
// last-10-games HR log. Separate mock concern from the pitch arsenal above -- this is
// "have they hit THIS pitcher," not "how do they do against THIS pitch type."
// All-time is built as season + additional prior-season at-bats, so it's always >=
// season rather than two independently-random numbers that could contradict each other.
export function mockMatchupHistory(name, opponentPitcherName) {
  const rand = seededRandom(name + ":" + opponentPitcherName);
  const seasonAb = Math.floor(rand() * 12) + 3;
  const seasonHits = Math.floor(rand() * (seasonAb * 0.4));
  const seasonHr = rand() > 0.7 ? 1 : 0;

  const priorAb = Math.floor(rand() * 26);
  const priorHits = Math.floor(rand() * (priorAb * 0.32));
  const priorHr = Math.floor(rand() * (rand() > 0.6 ? 3 : 1));

  const season = { ab: seasonAb, hits: seasonHits, hr: seasonHr };
  const allTime = { ab: seasonAb + priorAb, hits: seasonHits + priorHits, hr: seasonHr + priorHr };

  const logCount = Math.floor(rand() * 3);
  const log = Array.from({ length: logCount }, (_, i) => ({
    daysAgo: 4 + Math.floor(rand() * 40) + i * 9,
    pitch: PITCH_TYPES[Math.floor(rand() * PITCH_TYPES.length)],
    opp: opponentPitcherName,
  }));
  return { season, allTime, log };
}

// Mock closer -- fictional name, same convention as STARTERS_RAW, used whenever
// data/starters.js's CLOSERS has no confirmed real entry for a team.
export function mockCloser(teamAbbr) {
  const rand = seededRandom(teamAbbr + ":closer");
  const surname = MOCK_SURNAMES[Math.floor(rand() * MOCK_SURNAMES.length)];
  const initial = String.fromCharCode(65 + Math.floor(rand() * 26));
  return {
    name: `${initial}. ${surname}`, throws: rand() < 0.7 ? "R" : "L",
    saves: 8 + Math.floor(rand() * 20), era: +(2.2 + rand() * 2.5).toFixed(2),
    blownSaves: Math.floor(rand() * 5), mock: true,
  };
}
