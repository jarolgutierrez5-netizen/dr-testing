"use client";
import { useState, useMemo } from "react";
import { Avatar, Pill, SectionIntro, GameFilter, ZoneGrid } from "./shared";
import { getPitcherLogs, getPitcherSeasonStats, getInjuryStatus, getWeather, pitcherDataConfidence } from "@/lib/dataAccess";
import { wxPill } from "@/lib/projections";
import { mockPitcherArsenal, mockPitcherZoneAttack, mockLineup, mockTeamKRate } from "@/lib/mockGenerators";
import { arsenalGrade, pitchOutcomeLabel, metricColorClass, batterPlatoonRead, METRIC_FORMAT, zoneHeatTone } from "@/lib/classification";
import { LEAGUE_AVG_K_PCT } from "@/lib/constants";
import { useGameFilter } from "@/lib/hooks";

function PitcherReportCard({ pi, setSection }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("season");
  const seasonStats = getPitcherSeasonStats(pi.name);
  const confidence = pitcherDataConfidence(pi.name);
  const injury = getInjuryStatus(pi.name); // no pitcher injury feed yet -- always "No report" for now, honestly

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
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isTopThreat ? "border-amber-400/40" : "border-slate-500/15"}`}>
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
                        {b.real && setSection && (
                          <button onClick={() => setSection("hr")} title={`View ${b.name}'s props`}
                            className="font-body text-[10px] px-2 py-1 rounded-full border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 transition-colors">
                            View Props →
                          </button>
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

export function PitcherReportTab({ setSection }) {
  const { games, game, setGame, filtered } = useGameFilter(getPitcherLogs());
  return (
    <div>
      <SectionIntro emoji="🧢" label="Pitcher Report" note="Full last-start line, real season stats where confirmed, and a mock arsenal/command breakdown for projected starters." />
      <GameFilter games={games} value={game} onChange={setGame} />
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((pi,i) => <PitcherReportCard key={i} pi={pi} setSection={setSection} />)}
      </div>
    </div>
  );
}
