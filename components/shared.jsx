"use client";
import { metricColorClass, pitchOutcomeLabel } from "@/lib/classification";
import { getRecentForm } from "@/lib/dataAccess";
import { TEAM_COLORS } from "@/data";

export function initials(name) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

export function Avatar({ name, hue }) {
  return (
    <div className="w-14 h-14 rounded-full flex items-center justify-center font-display text-sm text-white shrink-0"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${hue+40} 70% 35%))` }}>
      {initials(name)}
    </div>
  );
}

// Crest-style team badge (squared-off, team's real colors) -- distinct from the round
// player Avatar above, standing in for a team logo until real crest art is wired in.
export function TeamBadge({ abbr }) {
  const c = TEAM_COLORS[abbr] || { primary: "#334155", secondary: "#0B1220" };
  return (
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center font-display text-xs text-white shrink-0 border-2"
      style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`, borderColor: c.secondary }}
    >
      {abbr}
    </div>
  );
}

export function Pill({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-500/30 text-slate-300",
    green: "border-emerald-400/40 text-emerald-300",
    amber: "border-amber-400/40 text-amber-300",
    purple: "border-fuchsia-400/40 text-fuchsia-300",
  };
  return (
    <div className={`px-3.5 py-2 rounded-full border ${tones[tone]} font-display text-[13px] whitespace-nowrap`}>
      <span className="text-slate-400 font-body font-normal mr-1.5">{label}:</span>{value}
    </div>
  );
}

// Generic prop card: name/context left, big % right, pill stats, explainer
export function PropCard({ name, sub, pctValue, pctLabel, pills, explainer, hot, grade }) {
  return (
    <div style={{ background: "#111A2E" }} className={`rounded-2xl border ${hot ? "border-amber-400/30" : "border-slate-500/15"} p-5 relative overflow-hidden`}>
      {hot && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-fuchsia-500" />}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} hue={hot ? 25 : 200} />
          <div>
            <div className="font-display text-lg text-slate-50 leading-tight">{name}</div>
            <div className="font-body text-[13px] text-slate-400">{sub}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-3xl text-emerald-400 leading-none">{pctValue}%</div>
          <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">{pctLabel}</div>
          {grade && <div className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 text-[10px] font-display">{grade}</div>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        {pills.map((p, i) => <Pill key={i} {...p} />)}
      </div>
      <div className="h-px bg-slate-500/15 my-4" />
      <p className="font-body text-[13px] text-slate-300 leading-relaxed">{explainer}</p>
    </div>
  );
}

export function SectionIntro({ emoji, label, note }) {
  return (
    <div className="mb-5">
      <h3 className="font-display text-2xl text-slate-50">{emoji} {label}</h3>
      {note && <p className="font-body text-slate-400 text-[13px] mt-1">{note}</p>}
    </div>
  );
}

// ---- Games Today: helpers ----
export function FormBars({ abbr }) {
  const games = getRecentForm(abbr);
  return (
    <div className="flex items-center gap-1.5">
      {games.map((g, i) => {
        const diff = g.rf - g.ra;
        const win = diff > 0;
        const h = Math.min(24, 6 + Math.abs(diff) * 2);
        return (
          <div key={i} title={`vs ${g.opp}: ${g.rf}-${g.ra}`} className="flex flex-col items-center justify-end" style={{ height: 28 }}>
            <div className="w-2.5 rounded-full" style={{ height: h, background: win ? "#34D399" : "#F87171" }} />
          </div>
        );
      })}
      <span className="font-body text-[10px] text-slate-500 ml-1">L2</span>
    </div>
  );
}

export function GameFilter({ games, value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="font-body text-[12px] border border-slate-500/25 text-slate-200 rounded-lg px-3 py-1.5 mb-5 focus:outline-none focus:border-emerald-400/50"
      style={{ colorScheme: "dark", backgroundColor: "#000000", color: "#EDE6D3" }}
    >
      <option value="all" style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>Sort by Game: All Games</option>
      {games.map(g => <option key={g} value={g} style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>{g}</option>)}
    </select>
  );
}

// Small visual: one dot per sample game, filled if that game had a HR. Distinct from
// FormBars (team win/loss) -- this tracks an individual event, not a result.
export function HrTrend({ games }) {
  return (
    <div className="flex items-center gap-1.5">
      {games.map((g, i) => (
        <div key={i} title={g.hr ? "Homered" : "No HR"}
          className={`w-2.5 h-2.5 rounded-full ${g.hr ? "bg-amber-400" : "bg-slate-600"}`} />
      ))}
      <span className="font-body text-[10px] text-slate-500 ml-1">last {games.length}</span>
    </div>
  );
}

export function LabelBadge({ text, tone }) {
  const tones = {
    amber: "bg-amber-400/15 border-amber-400/40 text-amber-300",
    purple: "bg-fuchsia-400/15 border-fuchsia-400/40 text-fuchsia-300",
    green: "bg-emerald-400/15 border-emerald-400/40 text-emerald-300",
    slate: "bg-slate-500/10 border-slate-500/30 text-slate-300",
  };
  return <span className={`font-body text-[11px] px-2.5 py-1 rounded-full border whitespace-nowrap ${tones[tone]}`}>{text}</span>;
}

// Season vs. All-Time toggle for head-to-head matchup stats -- shared by HrCard and
// StatCard so both "Historical Matchup" tabs behave identically.
export function MatchupPeriodPanel({ matchup, period, setPeriod }) {
  const stats = matchup[period];
  return (
    <>
      <div className="flex gap-2 mb-3">
        {[["season", "This Season"], ["allTime", "All Time"]].map(([key, text]) => (
          <button key={key} onClick={() => setPeriod(key)}
            className={`font-body text-[11px] px-3 py-1 rounded-full border transition-colors ${
              period === key ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-slate-500/25 text-slate-400 hover:border-slate-400/40"
            }`}>
            {text}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Pill label="AB vs SP" value={stats.ab} />
        <Pill label="Hits vs SP" value={stats.hits} />
        <Pill label="AVG vs SP" value={stats.ab > 0 ? `.${Math.round((stats.hits / stats.ab) * 1000).toString().padStart(3, "0")}` : "—"} />
        <Pill label="HR vs SP" value={stats.hr} tone={stats.hr > 0 ? "amber" : "slate"} />
      </div>
    </>
  );
}

export function ZoneGrid({ profile, valueKey, tone, format }) {
  return (
    <div className="inline-grid grid-cols-3 gap-1.5">
      {profile.flat().map((z, i) => {
        const t = tone(z[valueKey]);
        return (
          <div key={i} title={`${z.row}-${z.col}`}
            className={`w-16 h-16 rounded-lg border flex items-center justify-center ${t.bg} ${t.border}`}>
            <span className={`font-display text-sm ${t.text}`}>{format(z[valueKey])}</span>
          </div>
        );
      })}
    </div>
  );
}

// Explains every badge that can appear in the pitch-mix tables, once, at the end of
// the section, rather than relying on hover tooltips alone.
export function PitchMixFootnote() {
  return (
    <div className="mt-5 pt-3 border-t border-slate-500/10">
      <p className="font-body text-[11px] text-slate-500 leading-relaxed">
        <span className="text-slate-400 font-semibold">Label key — </span>
        🎯 <span className="text-slate-400">Putaway:</span> this pitcher's highest-whiff pitch, his likely two-strike weapon.{" "}
        ⚡ <span className="text-slate-400">Overlap:</span> the pitcher is genuinely exposed on this pitch AND the batter is genuinely strong against it.{" "}
        🔥 <span className="text-slate-400">HR Spot</span> / ⚠️ <span className="text-slate-400">Vulnerable:</span> strong SLG, multiple HR, or a low whiff rate on this pitch — a batter strength or a pitcher exposure.{" "}
        🧊 <span className="text-slate-400">Weak Spot</span> / 🛡️ <span className="text-slate-400">Strength:</span> weak average, high whiff, or low SLG on this pitch — a batter cold zone or a pitcher weapon.
      </p>
    </div>
  );
}

const METRIC_FORMAT_LOCAL = {
  ba: (v) => `.${Math.round(v * 1000).toString().padStart(3, "0")}`,
  woba: (v) => `.${Math.round(v * 1000).toString().padStart(3, "0")}`,
  slg: (v) => `.${Math.round(v * 1000).toString().padStart(3, "0")}`,
  hr: (v) => v,
  whiff: (v) => `${v}%`,
};

export function PitchTable({ rows, mode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[480px]">
        <thead>
          <tr className="font-body text-[10px] text-slate-500 uppercase">
            <th className="pb-1.5 font-normal">Pitch</th>
            {mode === "pitcher" && <th className="pb-1.5 font-normal text-right">Velo</th>}
            {mode === "pitcher" && <th className="pb-1.5 font-normal text-right">Usage</th>}
            {mode === "pitcher" && <th className="pb-1.5 font-normal text-right">Count</th>}
            {mode === "batter" && <th className="pb-1.5 font-normal text-right">PA</th>}
            <th className="pb-1.5 font-normal text-right">BA</th>
            <th className="pb-1.5 font-normal text-right">wOBA</th>
            <th className="pb-1.5 font-normal text-right">SLG</th>
            <th className="pb-1.5 font-normal text-right">HR</th>
            <th className="pb-1.5 font-normal text-right">Whiff%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const stats = mode === "pitcher" ? row.pitcherSplit : row.batterStats;
            const outcomeLabel = pitchOutcomeLabel(stats, mode);
            const badgeTone = { amber: "border-amber-400/40 text-amber-300", green: "border-emerald-400/40 text-emerald-300", slate: "border-slate-500/30 text-slate-400" };
            return (
              <tr key={i} className="border-t border-slate-500/10">
                <td className="py-1.5 font-body text-[12px] text-slate-200 whitespace-nowrap">
                  {row.flagged && <span className="mr-1" title="Overlap supports HR read">⚡</span>}
                  {row.pitch}
                  {row.isPutaway && (
                    <span className="ml-1.5 font-body text-[9px] px-1.5 py-0.5 rounded-full border border-purple-400/40 text-purple-300" title="Highest whiff rate in the arsenal -- his go-to when he needs the strikeout">
                      🎯 Putaway
                    </span>
                  )}
                  {outcomeLabel && (
                    <span className={`ml-1.5 font-body text-[9px] px-1.5 py-0.5 rounded-full border ${badgeTone[outcomeLabel.tone]}`}>
                      {outcomeLabel.text}
                    </span>
                  )}
                </td>
                {mode === "pitcher" && <td className="py-1.5 font-body text-[12px] text-right text-slate-400">{row.velo.toFixed(1)}</td>}
                {mode === "pitcher" && <td className="py-1.5 font-body text-[12px] text-right text-slate-400">{row.usagePct}%</td>}
                {mode === "pitcher" && <td className="py-1.5 font-body text-[12px] text-right text-slate-400">{row.count}</td>}
                {mode === "batter" && <td className="py-1.5 font-body text-[12px] text-right text-slate-400">{stats.pa}</td>}
                <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("ba", stats.ba)}`}>{METRIC_FORMAT_LOCAL.ba(stats.ba)}</td>
                <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("woba", stats.woba)}`}>{METRIC_FORMAT_LOCAL.woba(stats.woba)}</td>
                <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("slg", stats.slg)}`}>{METRIC_FORMAT_LOCAL.slg(stats.slg)}</td>
                <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("hr", stats.hr)}`}>{stats.hr}</td>
                <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("whiff", stats.whiff)}`}>{stats.whiff}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ComingSoon({ label }) {
  return (
    <div className="py-24 text-center">
      <div className="font-display text-4xl text-slate-500/30">{label}</div>
      <p className="font-body text-[11px] text-slate-500/50 mt-3">Same dashboard, next sport up. Not wired in yet.</p>
    </div>
  );
}

export function SportBadge({ emoji, active }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[16px] shrink-0 border ${
      active ? "bg-emerald-400/15 border-emerald-400/40" : "border-slate-500/25"
    }`}>
      {emoji}
    </div>
  );
}
