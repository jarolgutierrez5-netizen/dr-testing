"use client";
import { useState, useMemo, useEffect } from "react";
import { Avatar, Pill, LabelBadge, HrTrend, MatchupPeriodPanel, ZoneGrid, PitchMixFootnote, PitchTable } from "./shared";
import { getStarter, getSeasonStats, getInjuryStatus, getSeasonHr, getWeather, dataConfidence } from "@/lib/dataAccess";
import { battingAgg, overProb, pct, wxPill } from "@/lib/projections";
import { classifyHr, hrWhyText, effectiveBatterSide, pitchTypeAdvantage, matchupVerdict, METRIC_FORMAT, zoneTone, zoneHeatTone } from "@/lib/classification";
import { mockMatchupHistory, mockPitcherArsenal, mockBatterVsPitch, mockZoneProfile, mockPitcherZoneAttack } from "@/lib/mockGenerators";

// forceOpen/rootRef exist for deep-linking here from elsewhere (e.g. clicking a
// tracked batter in Pitcher Report's Lineup tab -- see components/HrTab.jsx and
// components/DiamondLedger.jsx's focusPlayer wiring). forceOpen only ever flips
// open from false to true, once -- it never forces the card shut, so a manual
// collapse afterward isn't fought on the next render.
export function HrCard({ p, isFavorite, onToggleFavorite, forceOpen, rootRef }) {
  // Seeded directly from forceOpen (not set via an effect after mount) so the target
  // card renders already-expanded on its very first paint, instead of flashing
  // collapsed-then-open a tick later -- no window for a scroll-into-view to measure
  // the wrong (collapsed) height.
  const [open, setOpen] = useState(!!forceOpen);
  useEffect(() => { if (forceOpen) setOpen(true); }, [forceOpen]);
  const [tab, setTab] = useState("stats");
  const [statsYear, setStatsYear] = useState(2026);
  const [matchupPeriod, setMatchupPeriod] = useState("season");
  const a = battingAgg(p);
  const lambda = (a.hr / a.ab) * 4;
  const prob = overProb(lambda, 0.5);
  const seasonHr = getSeasonHr(p.name);
  const label = classifyHr(p, a);
  const oppSP = getStarter(p.opp);

  const yearStats = getSeasonStats(p.name, statsYear);
  const side = effectiveBatterSide(p.bats, oppSP?.throws);
  const injury = getInjuryStatus(p.name);
  const confidence = dataConfidence(p.name);

  // Everything below is deterministic given (player, opponent starter) -- expensive
  // enough (full arsenal, both zone grids, matchup history) that it shouldn't
  // re-run on every render, only when the matchup itself changes. Matters more once
  // this becomes real async data instead of instant seeded mock functions.
  const { matchup, matchupRows, topRow, anyFlagged, verdict, zoneProfile, pitcherZoneAttack } = useMemo(() => {
    const matchup = oppSP ? mockMatchupHistory(p.name, oppSP.name) : null;
    const arsenal = oppSP ? mockPitcherArsenal(oppSP.name) : [];
    const matchupRows = arsenal.map(row => {
      const pitcherSplit = side === "L" ? row.vsL : row.vsR; // defaults to vsR if side unknown
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
    <div ref={rootRef} style={{ background: "#111A2E" }} className={`rounded-2xl border ${a.hr > 0 ? "border-amber-400/30" : "border-slate-500/15"} overflow-hidden`}>
      <div onClick={() => setOpen(!open)} className="w-full text-left p-5 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={p.name} hue={a.hr > 0 ? 25 : 200} />
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
            <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">HR Probability</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {label && <LabelBadge text={label.text} tone={label.tone} />}
          <Pill label="2026 Season HR" value={seasonHr !== undefined ? seasonHr : "unconfirmed"} tone={seasonHr !== undefined ? "green" : "slate"} />
          <Pill label="Sample HR" value={a.hr} />
          <Pill label="Status" value={injury ? injury.status : "No report"} tone={injury ? injury.tone : "slate"} />
          <Pill label="Confidence" value={confidence.label} tone={confidence.tone} />
          {wxPill(p.game).map((wp, i) => <Pill key={i} {...wp} />)}
        </div>
        <div className="h-px bg-slate-500/15 my-4" />
        <p className="font-body text-[13px] text-slate-300 leading-relaxed">
          <span className="text-slate-50 font-semibold">Why: </span>
          {hrWhyText(p, a, label, seasonHr)} {getWeather(p.game)?.note}
        </p>
        <div className="mt-3"><HrTrend games={p.games} /></div>
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
                  {yearStats.avg !== undefined && <Pill label="AVG" value={`.${Math.round(yearStats.avg*1000).toString().padStart(3,"0")}`} />}
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
              <div className="flex flex-wrap gap-2">
                <Pill label="AVG (sample)" value={`.${Math.round((a.h/a.ab)*1000).toString().padStart(3,"0")}`} />
                <Pill label="ISO proxy" value={((a.totalBases-a.h)/a.ab).toFixed(3).slice(1)} />
                <Pill label="Sample AB" value={a.ab} />
              </div>
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
                      ? `${p.name.split(" ")[1]}'s clearest edge is on ${oppSP.name}'s ${topRow.pitch} — the pitcher allows a ${METRIC_FORMAT.slg(topRow.pitcherSplit.slg)} slugging on it (${topRow.pitcherSplit.whiff}% whiff), and ${p.name.split(" ")[1]} is at ${METRIC_FORMAT.slg(topRow.batterStats.slg)} SLG against that pitch type. That overlap (⚡ below) is the strongest HR signal in this matchup. `
                      : `No single pitch shows a strong overlap between ${oppSP.name}'s weaknesses and ${p.name.split(" ")[1]}'s strengths this matchup — the HR projection here leans more on season/recent form than a specific pitch-type edge. `}
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
              {matchup && (
                <>
                  <MatchupPeriodPanel matchup={matchup} period={matchupPeriod} setPeriod={setMatchupPeriod} />
                  <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-1 mt-4">Last 10 games (this season) — HR log</div>
                  {matchup.log.length === 0 ? (
                    <p className="font-body text-[12px] text-slate-500">No home runs in the last 10 games.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {matchup.log.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-500/15 px-3 py-2 font-body text-[12px]">
                          <span className="text-slate-300">{entry.daysAgo} days ago &middot; vs {entry.opp} &middot; {entry.pitch}</span>
                          <span className="text-slate-600 text-[10px]">Video not linked yet</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
