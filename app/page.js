import { getTodaysTopProjections } from "@/lib/liveProjections";
import { pct } from "@/lib/hrModel";

// Force per-request rendering rather than static generation at build time --
// this page depends on "today," so it must never get frozen into a build
// artifact. Each underlying fetch (see lib/mlbStatsApi.js etc.) sets its own
// next.revalidate window, which is what actually controls freshness/caching.
export const dynamic = "force-dynamic";

function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// 20-80 scouting-scale grade (baseball's standard convention): 50 is league
// average, scaled by how far the ratio sits from 1. Power uses a gentler
// scale than matchup since HR/PA ratios swing wider than context multipliers.
function scoutGrade(ratio, scale) {
  return Math.round(Math.max(20, Math.min(80, 50 + (ratio - 1) * scale)));
}

// battingOrderSlot is always 1-9, so no need for the general ordinal-suffix
// edge cases (11th/12th/13th) that a wider range would require.
function ordinal(n) {
  return n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
}

function contextBadge(factor) {
  if (factor >= 1.05) return { text: "Favorable", tone: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" };
  if (factor <= 0.95) return { text: "Unfavorable", tone: "text-rose-300 border-rose-400/40 bg-rose-400/10" };
  return { text: "Neutral", tone: "text-slate-300 border-slate-500/30 bg-slate-500/10" };
}

export default async function Home() {
  let data;
  let error = null;
  try {
    data = await getTodaysTopProjections(15);
  } catch (err) {
    data = { players: [], gamesConsidered: 0, lineupsFound: 0, entriesEvaluated: 0 };
    error = err.message;
  }

  if (!data.players.length) {
    return (
      <main className="max-w-md mx-auto w-full px-6 py-12">
        <h1 className="font-display text-xl text-slate-50 mb-6">🔥 Home Run Model</h1>
        <p className="font-body text-[13px] text-slate-400">
          {error
            ? `Couldn't load today's games (${error}).`
            : data.gamesConsidered === 0
            ? "No MLB games found for today."
            : `No confirmed lineups posted yet (${data.gamesConsidered} games today) — MLB usually posts these a few hours before first pitch. Check back closer to game time.`}
        </p>
      </main>
    );
  }

  const rows = data.players.map((p) => {
    const combinedFactor = p.matchupFactor * p.parkWeatherFactor;
    return {
      ...p,
      powerGrade: scoutGrade(p.powerRatio, 40),
      matchupGrade: scoutGrade(combinedFactor, 100),
      badge: contextBadge(combinedFactor),
    };
  });

  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-10">
      <h1 className="font-display text-xl text-slate-50 mb-6 px-2">🔥 Home Run Model</h1>
      <div className="rounded-xl border border-slate-500/15 overflow-hidden">
        {rows.map(({ name, team, opponent, battingOrderSlot, probability, powerGrade, matchupGrade, badge, recentHr, hasStatcast }, i) => (
          <div
            key={`${name}-${team}`}
            className={`grid grid-cols-[64px_28px_1fr_56px_56px_100px_32px] items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-500/10" : ""}`}
            style={{ backgroundColor: `rgba(16,185,129,${Math.min(0.22, probability * 1.1).toFixed(3)})` }}
          >
            <div className="font-display text-lg text-sky-400">{pct(probability)}%</div>
            <div className="text-slate-600 text-sm">☆</div>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-display text-[11px] text-white shrink-0"
                style={{ background: `linear-gradient(135deg, hsl(${recentHr ? 25 : 200} 70% 45%), hsl(${(recentHr ? 25 : 200) + 40} 70% 35%))` }}
              >
                {initials(name)}
              </div>
              <div className="min-w-0">
                <div className="font-body text-[14px] text-slate-100 truncate">{name}</div>
                <div className="font-body text-[11px] text-slate-500">{team} · vs {opponent} · Bats {ordinal(battingOrderSlot)}</div>
              </div>
            </div>
            <div className="font-display text-[13px] text-slate-300 text-center">{powerGrade}</div>
            <div className="font-display text-[13px] text-slate-300 text-center">{matchupGrade}</div>
            <span className={`font-body text-[11px] px-2 py-1 rounded-full border text-center ${badge.tone}`}>{badge.text}</span>
            <div className="text-center" title={hasStatcast ? "Statcast-enriched" : undefined}>{recentHr ? "🔥" : ""}</div>
          </div>
        ))}
      </div>
      <p className="font-body text-[10px] text-slate-600 mt-4 px-2">
        Live via MLB Stats API{data.players.some((p) => p.hasStatcast) ? " + Baseball Savant" : ""} · {data.entriesEvaluated} batters evaluated across {data.lineupsFound}/{data.gamesConsidered} games with posted lineups. Refreshes automatically.
      </p>
    </main>
  );
}
