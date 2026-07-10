"use client";
import { useState, useMemo } from "react";
import { Avatar, Pill, LabelBadge, MatchupPeriodPanel, ZoneGrid, PitchMixFootnote, PitchTable } from "./shared";
import { getStarter, getSeasonStats, getInjuryStatus, getWeather, dataConfidence } from "@/lib/dataAccess";
import { battingAgg, overProb, pct, wxPill } from "@/lib/projections";
import { classifySampleStat, effectiveBatterSide, pitchTypeAdvantage, matchupVerdict, METRIC_FORMAT, zoneTone, zoneHeatTone } from "@/lib/classification";
import { mockMatchupHistory, mockPitcherArsenal, mockBatterVsPitch, mockZoneProfile, mockPitcherZoneAttack } from "@/lib/mockGenerators";

// Generic version of HrCard for the four sample-classified stats (Hits, RBIs, Total
// Bases, H+R+RBI). Reuses the exact same pitch/zone/matchup engine as HrCard --
// only the threshold, lambda, and label logic differ per cfg.
export function StatCard({ p, cfg, isFavorite, onToggleFavorite }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("stats");
  const [statsYear, setStatsYear] = useState(2026);
  const [matchupPeriod, setMatchupPeriod] = useState("season");
  const a = battingAgg(p);
  const lambda = cfg.lambda(a);
  const prob = overProb(lambda, cfg.line);
  const sampleVal = cfg.sampleVal(a);
  const label = cfg.classify ? cfg.classify(p, a) : classifySampleStat(sampleVal, cfg);
  const oppSP = getStarter(p.opp);
  const yearStats = getSeasonStats(p.name, statsYear);
  const side = effectiveBatterSide(p.bats, oppSP?.throws);
  const injury = getInjuryStatus(p.name);
  const confidence = dataConfidence(p.name);

  // Same reasoning as HrCard: deterministic given (player, opponent starter), too
  // expensive to redo on every tab switch or unrelated re-render.
  const { matchup, matchupRows, topRow, anyFlagged, verdict, zoneProfile, pitcherZoneAttack } = useMemo(() => {
    const matchup = oppSP ? mockMatchupHistory(p.name, oppSP.name) : null;
    const arsenal = oppSP ? mockPitcherArsenal(oppSP.name) : [];
    const matchupRows = arsenal.map(row => {
      const pitcherSplit = side === "L" ? row.vsL : row.vsR;
      const batterStats = mockBatterVsPitch(p.name, row.pitch, oppSP.throws);
      return { pitch: row.pitch, usagePct: row.usagePct, count: row.count, velo: row.velo, isPutaway: row.isPutaway, pitcherSplit, batterStats, flagged: pitchTypeAdvantage(pitcherSplit, batterStats) };
    });
    const topRow = matchupRows.length ? [...matchupRows].sort((x,y) => (y.pitcherSplit.slg + y.batterStats.slg) - (x.pitcherSplit.slg + x.batterStats.slg))[0] : null;
    const anyFlagged = matchupRows.some(r => r.flagged);
    const verdict = matchupRows.length ? matchupVerdict(matchupRows) : null;
    const zoneProfile = mockZoneProfile(p.name);
    const pitcherZoneAttack = oppSP ? mockPitcherZoneAttack(oppSP.name) : null;
    return { matchup, matchupRows, topRow, anyFlagged, verdict, zoneProfile, pitcherZoneAttack };
  }, [p.name, oppSP?.name, side]);

  return (
    <div style={{ background: "#111A2E" }} className={`rounded-2xl border ${label.key === "hot" ? "border-amber-400/30" : "border-slate-500/15"} overflow-hidden`}>
      <div onClick={() => setOpen(!open)} className="w-full text-left p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={p.name} hue={label.key === "hot" ? 25 : 200} />
            <div>
              <div className="font-display text-lg text-slate-50 leading-tight flex items-center gap-1.5">
                {p.name}
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(); }}
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  className={`text-sm leading-none transition-colors ${isFavorite ? "text-amber-300" : "text-slate-600 hover:text-slate-400"}`}>
                  {isFavorite ? "★" : "☆"}
                </button>
              </div>
              <div className="font-body text-[13px] text-slate-400">{p.team} · {p.pos} · {p.game}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-3xl text-emerald-400 leading-none">{pct(prob)}%</div>
            <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">{cfg.pctLabel}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <LabelBadge text={label.text} tone={label.tone} />
          {cfg.pills(a).map((pl, i) => <Pill key={i} {...pl} />)}
          <Pill label="Status" value={injury ? injury.status : "No report"} tone={injury ? injury.tone : "slate"} />
          <Pill label="Confidence" value={confidence.label} tone={confidence.tone} />
          {wxPill(p.game).map((wp, i) => <Pill key={i} {...wp} />)}
        </div>
        <div className="h-px bg-slate-500/15 my-4" />
        <p className="font-body text-[13px] text-slate-300 leading-relaxed">
          <span className="text-slate-50 font-semibold">Why: </span>
          {cfg.why(p, a, prob)} {getWeather(p.game)?.note}
        </p>
      </div>

      {open && (
        <div className="border-t border-slate-500/10 px-5 pb-5">
          <div className="flex gap-4 pt-4 font-body text-[12px]">
            {[["stats","Stats"],["pitchmix","Pitch Mix"],["matchup","Historical Matchup"]].map(([key,text]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`pb-2 border-b-2 transition-colors ${tab===key ? "border-emerald-400 text-emerald-300" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                {text}
              </button>
            ))}
          </div>

          {tab === "stats" && (
            <div className="mt-4">
              <div className="flex gap-2 mb-3">
                {[2026, 2025].map(yr => (
                  <button key={yr} onClick={() => setStatsYear(yr)}
                    className={`font-body text-[11px] px-3 py-1 rounded-full border transition-colors ${
                      statsYear===yr ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-slate-500/25 text-slate-400 hover:border-slate-400/40"
                    }`}>
                    {yr} Season
                  </button>
                ))}
              </div>
              {yearStats ? (
                <div className="flex flex-wrap gap-2">
                  {yearStats.avg !== undefined && <Pill label="AVG" value={METRIC_FORMAT.ba(yearStats.avg)} />}
                  {yearStats.h !== undefined && <Pill label="Hits" value={yearStats.h} />}
                  {yearStats.hr !== undefined && <Pill label="HR" value={yearStats.hr} tone="green" />}
                  {yearStats.rbi !== undefined && <Pill label="RBI" value={yearStats.rbi} />}
                  {yearStats.r !== undefined && <Pill label="Runs" value={yearStats.r} />}
                </div>
              ) : (
                <p className="font-body text-[12px] text-slate-500">No confirmed {statsYear} line for {p.name.split(" ")[1]} yet.</p>
              )}
              <div className="h-px bg-slate-500/15 my-4" />
              <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-2">Recent sample (2 games)</div>
              <div className="flex flex-wrap gap-2">{cfg.pills(a).map((pl, i) => <Pill key={i} {...pl} />)}</div>
            </div>
          )}

          {tab === "pitchmix" && (
            <div className="mt-4">
              {!oppSP ? (
                <p className="font-body text-[12px] text-slate-500">No probable opposing starter set for this matchup yet.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-[13px] text-slate-50 font-semibold">Matchup summary</span>
                    {verdict && <LabelBadge text={verdict.text} tone={verdict.tone} />}
                  </div>
                  <p className="font-body text-[13px] text-slate-300 leading-relaxed">
                    {anyFlagged && topRow
                      ? `${p.name.split(" ")[1]}'s clearest edge is on ${oppSP.name}'s ${topRow.pitch} — the pitcher allows a ${METRIC_FORMAT.slg(topRow.pitcherSplit.slg)} slugging on it (${topRow.pitcherSplit.whiff}% whiff), and ${p.name.split(" ")[1]} is at ${METRIC_FORMAT.slg(topRow.batterStats.slg)} SLG against that pitch type. `
                      : `No single pitch shows a strong overlap between ${oppSP.name}'s weaknesses and ${p.name.split(" ")[1]}'s strengths this matchup. `}
                    {verdict && (
                      verdict.key === "batter"
                        ? `Weighting every pitch by how often ${oppSP.name} actually throws it, this reads as ${p.name.split(" ")[1]}'s matchup to win — his usage-weighted ${METRIC_FORMAT.slg(verdict.batterSlg)} SLG outpaces the ${METRIC_FORMAT.slg(verdict.pitcherSlgAllowed)} ${oppSP.name} typically allows across that same mix.`
                        : verdict.key === "pitcher"
                        ? `Weighting every pitch by how often ${oppSP.name} actually throws it, this reads as ${oppSP.name}'s matchup to win — his stuff outperforms what ${p.name.split(" ")[1]} usually does against these same pitch types.`
                        : `Weighted across the full mix, this reads as an even matchup — neither side has a clear statistical edge once usage is accounted for.`
                    )}
                  </p>
                  <div className="h-px bg-slate-500/15 my-4" />

                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">
                      {oppSP.name}'s Top Pitches {side ? `vs ${side}HH` : "(batter hand unconfirmed — showing vs RHH)"}
                    </span>
                    <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">MOCK DATA</span>
                  </div>
                  <PitchTable rows={matchupRows} mode="pitcher" />

                  <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-1 mt-5">
                    {p.name.split(" ")[1]} vs These Pitches {oppSP.throws ? `(vs ${oppSP.throws}HP)` : ""}
                  </div>
                  <PitchTable rows={matchupRows} mode="batter" />

                  <div className="flex items-center justify-between mb-2 mt-5">
                    <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">Zone Breakdown</span>
                    <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">MOCK DATA</span>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="font-body text-[10px] text-slate-500 mb-1.5">{p.name.split(" ")[1]}'s Zone Fit — BA</div>
                      <ZoneGrid profile={zoneProfile} valueKey="ba" tone={zoneTone} format={METRIC_FORMAT.ba} />
                    </div>
                    <div>
                      <div className="font-body text-[10px] text-slate-500 mb-1.5">{oppSP.name}'s Zone Attack — Usage%</div>
                      <ZoneGrid profile={pitcherZoneAttack} valueKey="usagePct" tone={zoneHeatTone} format={(v) => `${v}%`} />
                    </div>
                  </div>

                  <PitchMixFootnote />
                </>
              )}
            </div>
          )}

          {tab === "matchup" && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">
                  {oppSP ? `Head-to-Head vs ${oppSP.name}` : "No probable opposing starter set"}
                </span>
                <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">MOCK DATA</span>
              </div>
              {matchup && <MatchupPeriodPanel matchup={matchup} period={matchupPeriod} setPeriod={setMatchupPeriod} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
