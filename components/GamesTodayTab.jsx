"use client";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Avatar, TeamBadge, Pill, SectionIntro, FormBars } from "./shared";
import { getSlate, getTeam, getStarter, getParkNote } from "@/lib/dataAccess";
import { projectGame, simulateGame, minutesUntilFirstPitch, formatGameTime, pct } from "@/lib/projections";
import { platoonRead } from "@/lib/projections";
import { CATEGORIES } from "@/data";
import { LOCK_WINDOW_MINUTES } from "@/lib/constants";

export function StarterCard({ abbr, opponent }) {
  const s = getStarter(abbr);
  if (!s) return null;
  const platoon = platoonRead(s.throws, opponent);
  return (
    <div style={{ background: "#0D1526" }} className="rounded-xl border border-slate-500/15 p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={s.name} hue={230} />
        <div className="min-w-0">
          <div className="font-display text-sm text-slate-50 truncate">{s.name}</div>
          <div className="font-body text-[11px] text-slate-400">{abbr} &middot; {s.throws}HP &middot; {s.w}-{s.l}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <Pill label="ERA" value={s.era.toFixed(2)} tone={s.era<3.5 ? "green" : s.era>4.5 ? "amber":"slate"} />
        <Pill label="WHIP" value={s.whip.toFixed(2)} />
        <Pill label="IP" value={s.ip.toFixed(1)} />
        <Pill label="K" value={s.k} tone="green" />
        <Pill label="BB" value={s.bb} />
        <Pill label="K/9" value={s.k9.toFixed(1)} />
        <Pill label="AVG vs" value={s.avg} />
        {platoon && <Pill label="Platoon" value={`${platoon.label} (${platoon.oppositeSide}/9 opp-hand)`} tone={platoon.tone} />}
      </div>
    </div>
  );
}

export function GamesTodayTab({ setSection }) {
  const [expanded, setExpanded] = useState(null);
  const highlighted = ["LAD vs COL", "TB vs NYY", "MIL vs STL"]; // matchups with player props built out

  return (
    <div>
      <SectionIntro emoji="📊" label="Games Today" note="Win probability blends season record, starting pitcher quality, and home-field edge. Recent form, pace, and park context round it out — tap a card for the breakdown." />
      <div className="space-y-3">
        {getSlate().map((g,i) => {
          const label1 = `${g.away} vs ${g.home}`, label2 = `${g.home} vs ${g.away}`;
          const isBuilt = highlighted.includes(label1) || highlighted.includes(label2);
          const away = getTeam(g.away), home = getTeam(g.home);
          const homeWinProb = projectGame(g.away, g.home);
          const favHome = homeWinProb >= 0.5;
          const favAbbr = favHome ? g.home : g.away, favProb = pct(favHome ? homeWinProb : 1-homeWinProb);
          const projHomeNum = 3.9*(0.4+homeWinProb), projAwayNum = 3.9*(0.4+(1-homeWinProb));
          const projHome = projHomeNum.toFixed(1), projAway = projAwayNum.toFixed(1);
          const isOpen = expanded === i;
          const locked = minutesUntilFirstPitch(g) <= LOCK_WINDOW_MINUTES;
          const sim = isOpen ? simulateGame(projAwayNum, projHomeNum, `${g.away}@${g.home}`) : null;
          return (
            <div key={i} style={{ background: "#111A2E" }}
              className={`rounded-2xl border ${isBuilt ? "border-emerald-400/30" : "border-slate-500/15"} overflow-hidden ${locked ? "opacity-70" : ""}`}>
              <button onClick={()=>setExpanded(isOpen ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <TeamBadge abbr={g.away} />
                    <TeamBadge abbr={g.home} />
                  </div>
                  <div>
                    <div className="font-display text-base text-slate-50">{g.away} @ {g.home}</div>
                    <div className="font-body text-[12px] text-slate-400">{away.w}-{away.l} vs {home.w}-{home.l} &middot; {formatGameTime(g)}</div>
                  </div>
                </div>
                {locked ? (
                  <div className="flex items-center gap-1.5 text-slate-500" title={`Locked ${LOCK_WINDOW_MINUTES} minutes before first pitch`}>
                    <Lock size={14} />
                    <span className="font-body text-[10px] uppercase tracking-wider">Locked</span>
                  </div>
                ) : (
                  <div className="text-right">
                    <div className="font-display text-lg text-emerald-400 leading-none">{favProb}%</div>
                    <div className="font-body text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{favAbbr} favored</div>
                  </div>
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-500/10">
                  {locked && (
                    <div className="flex items-center gap-1.5 text-slate-400 mt-3">
                      <Lock size={12} />
                      <span className="font-body text-[11px]">Projection locked {LOCK_WINDOW_MINUTES} minutes before first pitch — frozen at {favProb}% {favAbbr}.</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Pill label="Proj Score" value={`${projAway}–${projHome}`} tone="green" />
                    <Pill label={`${g.away} Pace`} value={`${away.pace}W`} />
                    <Pill label={`${home.abbr} Pace`} value={`${home.pace}W`} />
                    <Pill label={`${g.away} Win%`} value={away.wp.toFixed(3).slice(1)} />
                    <Pill label={`${g.home} Win%`} value={home.wp.toFixed(3).slice(1)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-1">{g.away} recent form</div>
                      <FormBars abbr={g.away} />
                    </div>
                    <div>
                      <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-1">{g.home} recent form</div>
                      <FormBars abbr={g.home} />
                    </div>
                  </div>

                  {sim && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-[10px] text-slate-500 uppercase tracking-wider">
                          Monte Carlo Simulation &middot; {sim.iterations.toLocaleString()} runs
                        </span>
                        <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-slate-500/25 text-slate-400" title="Team-level runs per game, not a full plate-appearance simulation">
                          Simplified model
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Pill label={`Sim Win% (${home.abbr})`} value={`${pct(sim.homeWinPct)}%`} tone="green" />
                        <Pill label="Avg Total Runs" value={sim.avgTotal.toFixed(1)} />
                        <Pill label={`Over ${sim.line}`} value={`${pct(sim.overPct)}%`} />
                      </div>
                      <div className="space-y-1.5">
                        {sim.buckets.map((b, bi) => (
                          <div key={bi} className="flex items-center gap-2">
                            <span className="font-body text-[10px] text-slate-500 w-10 shrink-0">{b.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-slate-500/10 overflow-hidden">
                              <div className="h-full bg-emerald-400/60" style={{ width: `${b.pct}%` }} />
                            </div>
                            <span className="font-body text-[10px] text-slate-400 w-9 text-right">{b.pct}%</span>
                          </div>
                        ))}
                      </div>
                      <p className="font-body text-[11px] text-slate-500 mt-2">
                        Draws each team's runs from a Poisson distribution centered on the point projection above, {sim.iterations.toLocaleString()} times,
                        instead of a full lineup-by-lineup simulation. The {pct(sim.homeWinPct)}% sim win% is a variance check against the {favProb}% model win% above — close agreement means the model is stable, a big gap would be a signal to look closer.
                      </p>
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider">Probable Starters &middot; Season</div>
                      {(getStarter(g.away)?.mock || getStarter(g.home)?.mock) && (
                        <span className="font-body text-[9px] px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300">MOCK DATA</span>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <StarterCard abbr={g.away} opponent={g.home} />
                      <StarterCard abbr={g.home} opponent={g.away} />
                    </div>
                  </div>

                  {getParkNote(g.home) && (
                    <p className="font-body text-[12px] text-slate-400 mt-4">
                      <span className="text-slate-300 font-semibold">Park note: </span>{getParkNote(g.home)}
                    </p>
                  )}

                  <p className="font-body text-[13px] text-slate-300 leading-relaxed mt-3">
                    <span className="text-slate-50 font-semibold">Why: </span>
                    Season win% ({home.wp.toFixed(3).slice(1)} vs {away.wp.toFixed(3).slice(1)}) run through Log5, adjusted for each
                    starter's ERA against league average and a standard home-field edge, puts {favAbbr} at {favProb}%.
                    {isBuilt ? " Full player props are built for this matchup — jump straight there below." : " Player props aren't built for this matchup yet."}
                  </p>

                  {isBuilt && setSection && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {["hr","hits","rbi","tb","hrrbi","k","pitcher"].map(key => {
                        const c = CATEGORIES.find(c => c.key === key);
                        return (
                          <button key={key} onClick={() => setSection(key)}
                            className="font-body text-[11px] px-2.5 py-1 rounded-full border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 transition-colors">
                            {c.emoji} {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
