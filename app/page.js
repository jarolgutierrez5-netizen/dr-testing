import { BATTERS } from "@/data";
import { projectHr, pct } from "@/lib/hrModel";

// Scoped to the 4-9 spots in the batting order on purpose -- cleanup and
// complementary bats, not leadoff/table-setter stars.
const LINEUP_SPOT_MIN = 4;
const LINEUP_SPOT_MAX = 9;

export default function Home() {
  const projected = BATTERS
    .filter(batter => batter.battingOrder >= LINEUP_SPOT_MIN && batter.battingOrder <= LINEUP_SPOT_MAX)
    .map(batter => ({ batter, projection: projectHr(batter) }))
    .sort((a, b) => b.projection.probability - a.projection.probability);

  return (
    <main className="max-w-md mx-auto w-full px-6 py-12">
      <h1 className="font-display text-xl text-slate-50 mb-6">🔥 Home Run Model</h1>
      <div className="divide-y divide-slate-500/10">
        {projected.map(({ batter, projection }) => (
          <div key={batter.name} className="flex items-center justify-between py-3">
            <div>
              <div className="font-body text-[15px] text-slate-100">{batter.name}</div>
              <div className="font-body text-[12px] text-slate-500">{batter.team} · Bats {batter.battingOrder}th</div>
            </div>
            <div className="font-display text-lg text-emerald-400">{pct(projection.probability)}%</div>
          </div>
        ))}
      </div>
    </main>
  );
}
