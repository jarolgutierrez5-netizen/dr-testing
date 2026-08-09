import { Avatar, Pill, LabelBadge, HrTrend } from "./shared";
import { pct } from "@/lib/hrModel";

export function HrCard({ batter, projection }) {
  const { lambda, probability, label, why } = projection;
  const recentHr = batter.recentGames.reduce((sum, g) => sum + g.hr, 0);

  return (
    <div style={{ background: "#111A2E" }}
      className={`rounded-2xl border ${recentHr > 0 ? "border-amber-400/30" : "border-slate-500/15"} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={batter.name} hue={recentHr > 0 ? 25 : 200} />
          <div>
            <div className="font-display text-lg text-slate-50 leading-tight">{batter.name}</div>
            <div className="font-body text-[13px] text-slate-400">{batter.team} · {batter.pos} · Bats {batter.battingOrder}th</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-3xl text-emerald-400 leading-none">{pct(probability)}%</div>
          <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">HR Probability</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <LabelBadge text={label.text} tone={label.tone} />
        <Pill label="2026 Season HR" value={batter.seasonHr !== undefined ? batter.seasonHr : "unconfirmed"} tone={batter.seasonHr !== undefined ? "green" : "slate"} />
        <Pill label="Sample HR" value={recentHr} />
        <Pill label="Model λ" value={lambda.toFixed(2)} />
      </div>

      <div className="h-px bg-slate-500/15 my-4" />
      <p className="font-body text-[13px] text-slate-300 leading-relaxed">
        <span className="text-slate-50 font-semibold">Why: </span>{why}
      </p>
      <div className="mt-3"><HrTrend games={batter.recentGames} /></div>
    </div>
  );
}
