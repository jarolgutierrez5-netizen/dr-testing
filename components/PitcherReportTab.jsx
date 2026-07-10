"use client";
import { useState, useMemo } from "react";
import { Avatar, Pill, LabelBadge, SectionIntro, GameFilter, ZoneGrid } from "./shared";
import { getPitcherLogs, getPitcherSeasonStats, getInjuryStatus, getWeather, pitcherDataConfidence } from "@/lib/dataAccess";
import { wxPill, pitcherK9, pitcherWhip } from "@/lib/projections";
import { mockPitcherArsenal, mockPitcherZoneAttack, mockLineup, mockTeamKRate, mockPitcherHr9 } from "@/lib/mockGenerators";
import { arsenalGrade, pitchOutcomeLabel, metricColorClass, batterPlatoonRead, METRIC_FORMAT, zoneHeatTone, classifyPitcherHr9, PITCHER_HR9_LABELS } from "@/lib/classification";
import { LEAGUE_AVG_K_PCT } from "@/lib/constants";
import { useGameFilter } from "@/lib/hooks";

function PitcherReportCard({ pi, onSelectPlayer }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("season");
  const seasonStats = getPitcherSeasonStats(pi.name);
  const confidence = pitcherDataConfidence(pi.name);
  const injury = getInjuryStatus(pi.name); // no pitcher injury feed yet -- always "No report" for now, honestly
  // MOCK DATA -- no home-runs-allowed field exists anywhere in the pitcher data, so
  // unlike K/9 and WHIP (real, derived from the last-start line) this can't be a real
  // stat. Deterministically correlated with the pitcher's real ERA instead.
  const hr9 = mockPitcherHr9(pi.name, parseFloat(pi.era));
  const hr9Label = classifyPitcherHr9(hr9);

  // Deterministic given (pitcher, opponent) -- memoized so switching Season/Arsenal/
  // Command/Lineup tabs doesn't regenerate all four every time.
  const { arsenal, grade, zoneAttack, lineup, trackedCount, lineupKPct, topThreatName } = useMemo(() => {
    const arsenal = mockPitcherArsenal(pi.name);
    const grade = arsenalGrade(arsenal);
    const zoneAttack = mockPitcherZoneAttack(pi.name);
    const lineup = mockLineup(pi.opp);
    const trackedCount = lineup.filter(b => b.real).length;
    const lineupKPct = mockTeamKRate(pi.opp);
    const topThreatName = lineup.reduce((best, b) => (b.seasonHr !== undefined && (!best || b.seasonHr > best.seasonHr) ? b : best), null)?.name;
    return { arsenal, grade, zoneAttack, lineup, trackedCount, lineupKPct, topThreatName };
  }, [pi.name, pi.opp]);

  return (
    <div style={{ background: "#111A2E" }} className="rounded-2xl border border-slate-500/15 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={pi.name} hue={210} />
            <div>
              <div className="font-display text-lg text-slate-50">{pi.name}</div>
              <div className="font-body text-[13px] text-slate-400">{pi.team} · {pi.pos} · {pi.game}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-3xl text-purple-300 leading-none">{grade}</div>
            <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">Arsenal Grade</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Pill label="IP" value={pi.ip} />
          <Pill label="K" value={pi.k} tone="green" />
          <Pill label="BB" value={pi.bb} />
          <Pill label="H" value={pi.h} />
          <Pill label="ER" value={pi.er} />
          <Pill label="ERA (start)" value={pi.era} tone={parseFloat(pi.era)<3 ? "green":"amber"} />
          <Pill label="K/9 (start)" value={pitcherK9(pi).toFixed(1)} tone={pitcherK9(pi)>=10 ? "green" : pitcherK9(pi)<=7 ? "amber" : "slate"} />
          <Pill label="WHIP (start)" value={pitcherWhip(pi).toFixed(2)} tone={pitcherWhip(pi)<=1.10 ? "green" : pitcherWhip(pi)>=1.40 ? "amber" : "slate"} />
          <Pill label="HR/9 (mock)" value={hr9.toFixed(2)} tone={hr9Label.tone} />
          <LabelBadge text={hr9Label.text} tone={hr9Label.tone} />
          <Pill label="Pitches" value={pi.pitches} />
          <Pill label="Status" value={injury ? injury.status : "No report"} tone={injury ? injury.tone : "slate"} />
          <Pill label="Confidence" value={confidence.label} tone={confidence.tone} />
          {wxPill(pi.game).map((p,j) => <Pill key={j} {...p} />)}
        </div>
        <div className="h-px bg-slate-500/15 my-4" />
        <p className="font-body text-[13px] text-slate-300 leading-relaxed">
          <span className="text-slate-50 font-semibold">Report: </span>
          {pi.name.split(" ")[1]} worked {pi.ip} innings last start, allowing {pi.er} earned run{pi.er===1?"":"s"} on {pi.h} hits
          while striking out {pi.k} against {pi.bb} walk{pi.bb===1?"":"s"} — a {parseFloat(pi.era)<3 ? "strong" : "middling"} line
          heading into the next matchup vs {pi.opp}. {getWeather(pi.game)?.note}
        </p>
      </button>

      {open && (
        <div className="border-t border-slate-500/10 px-5 pb-5">
          <div className="flex gap-4 pt-4 font-body text-[12px]">
            {[["season","Season"],["arsenal","Arsenal"],["command","Command"],["lineup","Lineup"]].map(([key,text]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`pb-2 border-b-2 transition-colors ${tab===key ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                {text}
              </button>
            ))}
          </div>

          {tab === "season" && (
            <div className="mt-4">
              {seasonStats ? (
                <div className="flex flex-wrap gap-2">
                  {seasonStats.era !== undefined && <Pill label="Season ERA" value={seasonStats.era.toFixed(2)} tone={seasonStats.era < 3.5 ? "green" : "amber"} />}
                  {seasonStats.whip !== undefined && <Pill label="WHIP" value={seasonStats.whip.toFixed(2)} />}
                  {seasonStats.w !== undefined && <Pill label="W-L" value={`${seasonStats.w}-${seasonStats.l}`} />}
                  {seasonStats.ip !== undefined && <Pill label="Season IP" value={seasonStats.ip.toFixed(1)} />}
                  {seasonStats.k !== undefined && <Pill label="Season K" value={seasonStats.k} tone="green" />}
                </div>
              ) : (
                <p className="font-body text-[12px] text-slate-500">No confirmed 2026 season line for {pi.name.split(" ")[1]} yet.</p>
              )}
              <p className="font-body text-[11px] text-slate-500 mt-3">Real, sourced season stats — not mocked. Fields left off weren't confirmed by the source.</p>
            </div>
          )}

          {tab === "arsenal" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">Full Repertoire — season-long, both handedness combined</span>
                <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">MOCK DATA</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[440px]">
                  <thead>
                    <tr className="font-body text-[10px] text-slate-500 uppercase">
                      <th className="pb-1.5 font-normal">Pitch</th>
                      <th className="pb-1.5 font-normal text-right">Velo</th>
                      <th className="pb-1.5 font-normal text-right">Usage</th>
                      <th className="pb-1.5 font-normal text-right">SLG</th>
                      <th className="pb-1.5 font-normal text-right">Whiff%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arsenal.map((row, i) => {
                      const avg = { ba: (row.vsL.ba+row.vsR.ba)/2, woba: (row.vsL.woba+row.vsR.woba)/2, slg: (row.vsL.slg+row.vsR.slg)/2, hr: Math.round((row.vsL.hr+row.vsR.hr)/2), whiff: Math.round(row.avgWhiff) };
                      const label = pitchOutcomeLabel(avg, "pitcher");
                      const badgeTone = { amber: "border-amber-400/40 text-amber-300", green: "border-emerald-400/40 text-emerald-300", slate: "border-slate-500/30 text-slate-400" };
                      return (
                        <tr key={i} className="border-t border-slate-500/10">
                          <td className="py-1.5 font-body text-[12px] text-slate-200 whitespace-nowrap">
                            {row.pitch}
                            {row.isPutaway && <span className="ml-1.5 font-body text-[9px] px-1.5 py-0.5 rounded-full border border-purple-400/40 text-purple-300">🎯 Putaway</span>}
                            {label && <span className={`ml-1.5 font-body text-[9px] px-1.5 py-0.5 rounded-full border ${badgeTone[label.tone]}`}>{label.text}</span>}
                          </td>
                          <td className="py-1.5 font-body text-[12px] text-right text-slate-400">{row.velo.toFixed(1)}</td>
                          <td className="py-1.5 font-body text-[12px] text-right text-slate-400">{row.usagePct}%</td>
                          <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("slg", avg.slg)}`}>{METRIC_FORMAT.slg(avg.slg)}</td>
                          <td className={`py-1.5 font-body text-[12px] text-right ${metricColorClass("whiff", avg.whiff)}`}>{avg.whiff}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "command" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">Zone Attack — where he locates</span>
                <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">MOCK DATA</span>
              </div>
              <ZoneGrid profile={zoneAttack} valueKey="usagePct" tone={zoneHeatTone} format={(v) => `${v}%`} />
            </div>
          )}

          {tab === "lineup" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">Probable Lineup — {pi.opp}</span>
                <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">
                  {trackedCount > 0 ? `${trackedCount}/9 tracked` : "MOCK DATA"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Pill label="Lineup K%" value={`${lineupKPct.toFixed(1)}%`} tone={lineupKPct > LEAGUE_AVG_K_PCT ? "green" : "amber"} />
              </div>
              <div className="space-y-1.5">
                {lineup.map((b, i) => {
                  const platoon = batterPlatoonRead(pi.throws, b.bats);
                  const platoonTone = { green: "border-emerald-400/40 text-emerald-300", amber: "border-amber-400/40 text-amber-300" };
                  const isTopThreat = b.name === topThreatName;
                  const clickable = b.real && !!onSelectPlayer;
                  return (
                    <div key={i}
                      onClick={() => clickable && onSelectPlayer(b.name)}
                      title={clickable ? `Jump to ${b.name}'s HR projection` : undefined}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${isTopThreat ? "border-amber-400/40" : "border-slate-500/15"} ${clickable ? "cursor-pointer hover:border-emerald-400/40" : ""}`}>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-body text-[11px] text-slate-500 w-4">{b.order}</span>
                        <span className="font-body text-[12px] text-slate-200">{b.name}</span>
                        <span className="font-body text-[10px] text-slate-500">{b.pos} · {b.bats}HB</span>
                        {isTopThreat && <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full border border-amber-400/40 text-amber-300">🎯 Top Threat</span>}
                        {platoon && <span className={`font-body text-[9px] px-1.5 py-0.5 rounded-full border ${platoonTone[platoon.tone]}`}>{platoon.text}</span>}
                        {b.real && <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-400/40 text-emerald-300">✓ Tracked</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-body text-[11px] text-slate-400">
                          {b.seasonHr !== undefined ? `${b.seasonHr} HR` : b.real ? "HR unconfirmed" : "—"}
                        </span>
                        {clickable && (
                          <span className="font-body text-[10px] px-2 py-1 rounded-full border border-emerald-400/30 text-emerald-300">
                            HR Projection →
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="font-body text-[11px] text-slate-500 mt-3">
                {trackedCount > 0
                  ? `${trackedCount} of 9 hitters are ones we actually track elsewhere in the app (real name, bats, and season HR where confirmed) — the rest are placeholder names until a real lineup feed is wired in. Lineup K% and platoon reads are mock/estimated, same as the rest of this tab.`
                  : `No tracked batters on this roster yet — every name here is a placeholder until a real lineup feed is wired in.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sort keys use only fields every PITCHERS entry always has (last-start line, plus
// the K/9 and WHIP derived from it) or the deterministic mock arsenal grade -- never
// season stats, since those are missing for some pitchers (e.g. Gasser) and a sort
// that silently drops or misorders someone on missing data would be worse than no
// sort at all.
const PITCHER_SORT_OPTIONS = [
  { key: "none", label: "Sort: Grouped by Game" },
  { key: "era-asc", label: "ERA: Best to Worst" },
  { key: "k-desc", label: "Strikeouts: Most to Fewest" },
  { key: "k9-desc", label: "K/9: Highest to Lowest" },
  { key: "whip-asc", label: "WHIP: Best to Worst" },
  { key: "bb-asc", label: "Walks: Fewest to Most" },
  { key: "ip-desc", label: "Innings Pitched: Most to Fewest" },
  { key: "grade-asc", label: "Arsenal Grade: Best to Worst" },
  { key: "hr9-asc", label: "HR/9 (mock): Lowest to Highest" },
];

function sortPitchers(pitchers, sortKey) {
  const sorted = [...pitchers];
  switch (sortKey) {
    case "era-asc": return sorted.sort((a, b) => parseFloat(a.era) - parseFloat(b.era));
    case "k-desc": return sorted.sort((a, b) => b.k - a.k);
    case "k9-desc": return sorted.sort((a, b) => pitcherK9(b) - pitcherK9(a));
    case "whip-asc": return sorted.sort((a, b) => pitcherWhip(a) - pitcherWhip(b));
    case "bb-asc": return sorted.sort((a, b) => a.bb - b.bb);
    case "ip-desc": return sorted.sort((a, b) => b.ip - a.ip);
    case "grade-asc": return sorted.sort((a, b) =>
      arsenalGrade(mockPitcherArsenal(a.name)).localeCompare(arsenalGrade(mockPitcherArsenal(b.name))));
    case "hr9-asc": return sorted.sort((a, b) =>
      mockPitcherHr9(a.name, parseFloat(a.era)) - mockPitcherHr9(b.name, parseFloat(b.era)));
    default: return pitchers;
  }
}

export function PitcherReportTab({ onSelectPlayer }) {
  const { games, game, setGame, filtered } = useGameFilter(getPitcherLogs());
  const [sortBy, setSortBy] = useState("none");
  const [activeHr9Labels, setActiveHr9Labels] = useState(new Set());

  const toggleHr9Label = (key) => {
    setActiveHr9Labels(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // HR/9 tier filter (mock -- see classifyPitcherHr9) narrows the visible set;
  // separate from sortBy, which only reorders it.
  const hr9Filtered = activeHr9Labels.size === 0
    ? filtered
    : filtered.filter(pi => activeHr9Labels.has(classifyPitcherHr9(mockPitcherHr9(pi.name, parseFloat(pi.era))).key));

  // Groups starters by game so both sides of a matchup sit side by side. Some games
  // only have one tracked starter (no real last-start line for the other side yet) --
  // that shows as a single card rather than inventing a second one. Grouping only
  // applies when no sort is active -- picking a stat to sort by flattens into one
  // ranked list instead, since "side by side by game" and "ranked by stat" are two
  // different views of the same data, not something to reconcile into one layout.
  const gameOrder = [...new Set(hr9Filtered.map(pi => pi.game))];
  const grouped = gameOrder.map(g => ({ game: g, pitchers: hr9Filtered.filter(pi => pi.game === g) }));
  const sortedFlat = sortPitchers(hr9Filtered, sortBy);

  return (
    <div>
      <SectionIntro emoji="🧢" label="Pitcher Report" note="Full last-start line, real season stats where confirmed, and a mock arsenal/command breakdown for projected starters. Starters are grouped by game, side by side -- or sort by a stat to see them ranked." />
      <div className="flex flex-wrap items-center gap-3">
        <GameFilter games={games} value={game} onChange={setGame} />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="font-body text-[12px] border border-slate-500/25 text-slate-200 rounded-lg px-3 py-1.5 mb-5 focus:outline-none focus:border-emerald-400/50"
          style={{ colorScheme: "dark", backgroundColor: "#000000", color: "#EDE6D3" }}
        >
          {PITCHER_SORT_OPTIONS.map(o => (
            <option key={o.key} value={o.key} style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider mr-1">HR/9 (mock):</span>
        {PITCHER_HR9_LABELS.map(l => (
          <button key={l.key} onClick={() => toggleHr9Label(l.key)}
            className={`font-body text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
              activeHr9Labels.has(l.key) ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-slate-500/25 text-slate-400 hover:border-slate-400/40"
            }`}>
            {l.text}
          </button>
        ))}
        {activeHr9Labels.size > 0 && (
          <button onClick={() => setActiveHr9Labels(new Set())} className="font-body text-[11px] px-3 py-1.5 text-slate-500 hover:text-slate-300">
            Clear
          </button>
        )}
      </div>

      {sortBy === "none" ? (
        <div className="space-y-6">
          {grouped.map(({ game: g, pitchers }) => (
            <div key={g}>
              <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-2">{g}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                {pitchers.map((pi, i) => <PitcherReportCard key={i} pi={pi} onSelectPlayer={onSelectPlayer} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {sortedFlat.map((pi, i) => <PitcherReportCard key={i} pi={pi} onSelectPlayer={onSelectPlayer} />)}
        </div>
      )}
    </div>
  );
}
