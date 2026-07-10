"use client";
import { PropCard, SectionIntro, GameFilter } from "./shared";
import { getBatterLogs } from "@/lib/dataAccess";
import { mockTeamSbRate } from "@/lib/mockGenerators";
import { LEAGUE_AVG_SB_PER_G } from "@/lib/constants";
import { useGameFilter } from "@/lib/hooks";

export function SbTab() {
  const { games, game, setGame, filtered } = useGameFilter(getBatterLogs());
  return (
    <div>
      <SectionIntro emoji="🏃" label="Stolen Bases" note="Individual sample shows 0 attempts for this group; team-level attempt rate is shown for context. Line: Over 0.5 SB." />
      <GameFilter games={games} value={game} onChange={setGame} />
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((p,i) => {
          const teamSbRate = mockTeamSbRate(p.team);
          const oppSbRate = mockTeamSbRate(p.opp);
          return (
            <PropCard key={i} name={p.name} sub={`${p.team} · ${p.pos} · ${p.game}`}
              pctValue={4} pctLabel="SB Edge"
              pills={[
                { label:"Line", value:"Over 0.5 SB" },
                { label:"Sample SB", value:0 },
                { label:"Profile", value:"Low Steal" },
                { label:`${p.team} SB/G`, value: teamSbRate.toFixed(2), tone: teamSbRate > LEAGUE_AVG_SB_PER_G ? "green" : "slate" },
                { label:`${p.opp} SB/G Allowed`, value: oppSbRate.toFixed(2) },
              ]}
              explainer={<>
                <span className="text-slate-50 font-semibold">Why: </span>
                0 stolen base attempts in the last {p.games.length} games for {p.name.split(" ")[1]} — this group skews power over speed, so the individual edge here is a placeholder floor rather than a real signal.
                {" "}{p.team}'s team-level attempt rate ({teamSbRate.toFixed(2)}/game, mock) sits {teamSbRate > LEAGUE_AVG_SB_PER_G ? "above" : "below"} the league-average pace of {LEAGUE_AVG_SB_PER_G}/game — context for the roster, not a projection for {p.name.split(" ")[1]} specifically.
              </>}
            />
          );
        })}
      </div>
    </div>
  );
}
