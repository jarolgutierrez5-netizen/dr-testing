import { BATTERS } from "@/data";
import { projectHr, neutralHrPa, contextFactor, pct } from "@/lib/hrModel";

// Scoped to the 4-9 spots in the batting order on purpose -- cleanup and
// complementary bats, not leadoff/table-setter stars.
const LINEUP_SPOT_MIN = 4;
const LINEUP_SPOT_MAX = 9;
const LEAGUE_AVG_HR_PA = 0.031;

function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// 20-80 scouting-scale grade (baseball's standard convention): 50 is league
// average, scaled by how far the ratio sits from 1. Power uses a gentler
// scale than matchup since HR/PA ratios swing wider than context multipliers.
function scoutGrade(ratio, scale) {
  return Math.round(Math.max(20, Math.min(80, 50 + (ratio - 1) * scale)));
}

function contextBadge(factor) {
  if (factor >= 1.05) return { text: "Favorable", tone: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10" };
  if (factor <= 0.95) return { text: "Unfavorable", tone: "text-rose-300 border-rose-400/40 bg-rose-400/10" };
  return { text: "Neutral", tone: "text-slate-300 border-slate-500/30 bg-slate-500/10" };
}

export default function Home() {
  const rows = BATTERS
    .filter(b => b.battingOrder >= LINEUP_SPOT_MIN && b.battingOrder <= LINEUP_SPOT_MAX)
    .map(batter => {
      const factor = contextFactor(batter);
      return {
        batter,
        probability: projectHr(batter).probability,
        powerGrade: scoutGrade(neutralHrPa(batter) / LEAGUE_AVG_HR_PA, 40),
        matchupGrade: scoutGrade(factor, 100),
        badge: contextBadge(factor),
        onFire: batter.recentGames.some(g => g.hr > 0),
      };
    })
    .sort((a, b) => b.probability - a.probability);

  return (
    <main className="max-w-4xl mx-auto w-full px-4 py-10">
      <h1 className="font-display text-xl text-slate-50 mb-6 px-2">🔥 Home Run Model</h1>
      <div className="rounded-xl border border-slate-500/15 overflow-hidden">
        {rows.map(({ batter, probability, powerGrade, matchupGrade, badge, onFire }, i) => (
          <div
            key={batter.name}
            className={`grid grid-cols-[64px_28px_1fr_56px_56px_100px_32px] items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-500/10" : ""}`}
            style={{ backgroundColor: `rgba(16,185,129,${Math.min(0.22, probability * 1.1).toFixed(3)})` }}
          >
            <div className="font-display text-lg text-sky-400">{pct(probability)}%</div>
            <div className="text-slate-600 text-sm">☆</div>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-display text-[11px] text-white shrink-0"
                style={{ background: `linear-gradient(135deg, hsl(${onFire ? 25 : 200} 70% 45%), hsl(${(onFire ? 25 : 200) + 40} 70% 35%))` }}
              >
                {initials(batter.name)}
              </div>
              <div className="min-w-0">
                <div className="font-body text-[14px] text-slate-100 truncate">{batter.name}</div>
                <div className="font-body text-[11px] text-slate-500">{batter.team} · {batter.pos} · Bats {batter.battingOrder}th</div>
              </div>
            </div>
            <div className="font-display text-[13px] text-slate-300 text-center">{powerGrade}</div>
            <div className="font-display text-[13px] text-slate-300 text-center">{matchupGrade}</div>
            <span className={`font-body text-[11px] px-2 py-1 rounded-full border text-center ${badge.tone}`}>{badge.text}</span>
            <div className="text-center">{onFire ? "🔥" : ""}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
