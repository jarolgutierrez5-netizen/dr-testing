"use client";
import { useState } from "react";
import { PropCard, SectionIntro, GameFilter } from "./shared";
import { getPitcherLogs } from "@/lib/dataAccess";
import { projectStrikeouts, computeKLine, overProb, pct, wxPill, pitcherK9 } from "@/lib/projections";
import { mockAdvancedPitchingMetrics, mockTeamKRate } from "@/lib/mockGenerators";
import { LEAGUE_AVG_K_PCT, BF_PER_9, START_IP_ASSUMPTION } from "@/lib/constants";
import { useGameFilter } from "@/lib/hooks";

export function KTab() {
  const { games, game, setGame, filtered } = useGameFilter(getPitcherLogs());
  const [cushionSort, setCushionSort] = useState("none"); // 'none' | 'desc' | 'asc'

  const enriched = filtered.map(pi => {
    const k9Hint = pitcherK9(pi); // real, from last start -- seeds the mock advanced metrics
    const adv = mockAdvancedPitchingMetrics(pi.name, k9Hint);
    const oppKPct = mockTeamKRate(pi.opp);
    const projK = projectStrikeouts(adv.kPct, oppKPct);
    const { line, cushion } = computeKLine(projK);
    const prob = overProb(projK, line);
    return { pi, adv, oppKPct, projK, line, cushion, prob };
  });

  const sorted = cushionSort === "none" ? enriched
    : [...enriched].sort((a, b) => cushionSort === "desc" ? b.cushion - a.cushion : a.cushion - b.cushion);

  return (
    <div>
      <SectionIntro emoji="🎯" label="Strikeouts" />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <GameFilter games={games} value={game} onChange={setGame} />
        <select
          value={cushionSort}
          onChange={(e) => setCushionSort(e.target.value)}
          className="font-body text-[12px] border border-slate-500/25 text-slate-200 rounded-lg px-3 py-1.5 mb-5 focus:outline-none focus:border-emerald-400/50"
          style={{ colorScheme: "dark", backgroundColor: "#000000", color: "#EDE6D3" }}
        >
          <option value="none" style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>Sort by Cushion: Off</option>
          <option value="desc" style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>Cushion: High to Low</option>
          <option value="asc" style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>Cushion: Low to High</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {sorted.map(({ pi, adv, oppKPct, projK, line, cushion, prob }, i) => (
          <PropCard key={i} name={pi.name} sub={`${pi.team} · ${pi.pos} · ${pi.game}`}
            pctValue={pct(prob)} pctLabel="K Edge" hot={cushion >= 2.5}
            pills={[
              { label: "Line", value: `Over ${line} K`, tone: "green" },
              { label: "Proj K", value: projK.toFixed(1) },
              { label: "Cushion", value: `+${cushion.toFixed(1)}`, tone: cushion >= 2 ? "amber" : "slate" },
              { label: "K%", value: `${adv.kPct.toFixed(1)}%`, tone: "green" },
              { label: "SwStr%", value: `${adv.swStrPct.toFixed(1)}%` },
              { label: "Contact%", value: `${adv.contactPct.toFixed(1)}%` },
              { label: "Z-Contact%", value: `${adv.zContactPct.toFixed(1)}%` },
              { label: "O-Contact%", value: `${adv.oContactPct.toFixed(1)}%` },
              { label: "O-Swing%", value: `${adv.oSwingPct.toFixed(1)}%` },
              { label: "vFA", value: `${adv.vFA.toFixed(1)} mph` },
              { label: "ERA", value: pi.era },
              { label: "G", value: adv.starts },
              { label: `${pi.opp} K% Against`, value: `${oppKPct.toFixed(1)}%`, tone: oppKPct > LEAGUE_AVG_K_PCT ? "green" : "slate" },
              { label: "Last Start", value: `${pi.k} K in ${pi.ip} IP` },
              ...wxPill(pi.game),
            ]}
            explainer={<>
              <span className="text-slate-50 font-semibold">Why: </span>
              {pi.name.split(" ")[1]}'s {adv.kPct.toFixed(1)}% strikeout rate, projected over ~{START_IP_ASSUMPTION} innings ({(BF_PER_9*(START_IP_ASSUMPTION/9)).toFixed(0)} batters faced) and
              adjusted for {pi.opp}'s {oppKPct.toFixed(1)}% team strikeout rate (league average is {LEAGUE_AVG_K_PCT}%), projects to {projK.toFixed(1)} K.
              The posted line of {line} sits {cushion.toFixed(1)} strikeouts below that projection on purpose — a built-in cushion so the projection has room to clear it, not a coin-flip line.
            </>}
          />
        ))}
      </div>
      <p className="font-body text-[11px] text-slate-500 mt-2">
        K% (real, K/9-derived), SwStr%, Contact%, Z/O-Contact%, O-Swing%, and fastball velocity are MOCK DATA correlated to each pitcher's real last-start K rate — not independently random, but not pulled from Statcast either.
      </p>
    </div>
  );
}
