"use client";
import { TeamBadge, Pill, SectionIntro } from "./shared";
import { getTeam, getSlate } from "@/lib/dataAccess";
import { getCloser, projectGame, pct } from "@/lib/projections";

// Teams we have any tracked player/pitcher data for -- the set worth showing closers
// for, since a save prop with zero other context on that team wouldn't fit the rest
// of the app's pattern of grounding things in a real matchup.
const SAVES_TRACKED_TEAMS = ["LAD", "COL", "TB", "NYY", "MIL", "STL"];

export function SavesTab() {
  return (
    <div>
      <SectionIntro emoji="🧤" label="Saves" note="Closer + bullpen data for tracked teams. Save probability leans on that team's real win probability where they're on today's actual slate." />
      <div className="grid lg:grid-cols-2 gap-4">
        {SAVES_TRACKED_TEAMS.map((abbr, i) => {
          const team = getTeam(abbr);
          const closer = getCloser(abbr);
          const slateGame = getSlate().find(g => g.away === abbr || g.home === abbr);
          const saveProb = slateGame
            ? (slateGame.home === abbr ? projectGame(slateGame.away, slateGame.home) : 1 - projectGame(slateGame.away, slateGame.home))
            : null;
          return (
            <div key={i} style={{ background: "#111A2E" }} className="rounded-2xl border border-slate-500/15 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TeamBadge abbr={abbr} />
                  <div>
                    <div className="font-display text-lg text-slate-50 leading-tight">{closer.name}</div>
                    <div className="font-body text-[13px] text-slate-400">{team.name} · Closer · {closer.throws}HP</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-3xl text-emerald-400 leading-none">{saveProb !== null ? pct(saveProb) : "—"}%</div>
                  <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">Save Opp. Chance</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Pill label="Season SV" value={closer.saves} tone="green" />
                <Pill label="Blown SV" value={closer.blownSaves} tone={closer.blownSaves >= 3 ? "amber" : "slate"} />
                <Pill label="ERA" value={closer.era.toFixed(2)} tone={closer.era < 3.0 ? "green" : "slate"} />
                <Pill label="Role" value={closer.mock ? "Mock" : "Real (confirmed)"} tone={closer.mock ? "slate" : "green"} />
              </div>
              <div className="h-px bg-slate-500/15 my-4" />
              <p className="font-body text-[13px] text-slate-300 leading-relaxed">
                <span className="text-slate-50 font-semibold">Why: </span>
                {closer.mock
                  ? `${abbr}'s closer here is a mock placeholder — real bullpen roles are volatile (committees, blown saves, trades), so this is a stand-in for the season stats, not a name to trust as today's actual closer.`
                  : `${closer.name} is the real, currently-confirmed closer for ${team.name} as of a live search — though even here, the role is described as "closer-by-committee," so it can shift.`}
                {" "}{saveProb !== null
                  ? `${abbr} is on today's real slate at a projected ${pct(saveProb)}% win probability — the closer's realistic save chance leans on the team actually winning a close game.`
                  : `${abbr} isn't on today's real 13-game slate, so there's no live win probability to tie a save chance to yet.`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
