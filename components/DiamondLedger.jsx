"use client";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { LiveHeartbeat } from "./LiveHeartbeat";
import { useLiveResource } from "@/lib/hooks";
import { fetchStandingsClient } from "@/lib/apiFetchers";
import { setLiveData } from "@/lib/liveStore";
import { TTL } from "@/lib/ttl";
import { GamesTodayTab } from "./GamesTodayTab";
import { HrTab } from "./HrTab";
import { HitsTab, RbiTab, TbTab, HrrbiTab } from "./GenericStatTab";
import { SbTab } from "./SbTab";
import { KTab } from "./KTab";
import { PitcherReportTab } from "./PitcherReportTab";
import { SavesTab } from "./SavesTab";
import { ParlayTab } from "./ParlayTab";
import { TrackRecordView } from "./TrackRecordView";
import { ComingSoon } from "./shared";
import { CATEGORIES, SPORTS } from "@/data";

export default function DiamondLedger() {
  const [sport, setSport] = useState("mlb");
  const [section, setSection] = useState("games");
  const [collapsed, setCollapsed] = useState(true);
  const [showTrackRecord, setShowTrackRecord] = useState(false);

  // Hydrates lib/liveStore.js from /api/standings (real MLB Stats API data, TTL-cached
  // server-side). Updating the store synchronously during render -- rather than in a
  // useEffect -- means every getStandings/getTeam/getSlate call in this render pass
  // (including in children rendered below) already sees the fresh data, instead of
  // lagging one tick behind. Safe here because it's an idempotent overwrite of a plain
  // module variable, not a state update that could trigger a render loop.
  const { data: liveStandings } = useLiveResource("standings-hydrate", fetchStandingsClient, { intervalMs: TTL.standings });
  if (liveStandings) setLiveData(liveStandings);

  const TABS = {
    games: <GamesTodayTab setSection={setSection} />, hits: <HitsTab />, hr: <HrTab />, rbi: <RbiTab />, tb: <TbTab />,
    sb: <SbTab />, hrrbi: <HrrbiTab />, k: <KTab />, pitcher: <PitcherReportTab setSection={setSection} />, saves: <SavesTab />, parlay: <ParlayTab />,
  };

  return (
    <div style={{ background: "#0B1220" }} className="min-h-screen text-slate-100 flex">
      <Sidebar sport={sport} setSport={setSport} collapsed={collapsed} setCollapsed={setCollapsed} showTrackRecord={showTrackRecord} setShowTrackRecord={setShowTrackRecord} />

      <div className="flex-1 min-w-0">
        <div className="border-b border-slate-500/15">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between font-body text-[11px] tracking-[0.2em] text-slate-500 mb-4">
              <span>DIAMOND LEDGER &middot; PROP PROJECTIONS</span>
              <span className="flex items-center gap-4">
                <LiveHeartbeat />
                <span>SAMPLE SLATE: LAD vs COL</span>
              </span>
            </div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.05] text-slate-50">
              MLB <span className="text-emerald-400">Projections</span>
            </h1>
          </div>
        </div>

        {showTrackRecord ? (
          <TrackRecordView onBack={() => setShowTrackRecord(false)} />
        ) : sport !== "mlb" ? (
          <div className="max-w-7xl mx-auto px-6"><ComingSoon label={SPORTS.find(s=>s.key===sport).label} /></div>
        ) : (
          <>
            <div className="max-w-7xl mx-auto px-6 pt-6">
              <div className="grid grid-cols-6 gap-2 pb-3 font-body text-[12px] sm:text-[13px]">
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={()=>setSection(c.key)}
                    className={`px-2 py-2 rounded-full border transition-colors text-center truncate ${
                      section===c.key ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/10" : "border-slate-500/20 text-slate-300 hover:border-slate-400/40"
                    }`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
              {TABS[section]}
            </div>
          </>
        )}

        <div className="max-w-7xl mx-auto px-6 pb-10 pt-4 border-t border-slate-500/10 font-body text-[10px] text-slate-600">
          Projections are a transparent v1 model (Poisson on recent-form rates), not a betting product. Data reflects the most recent pull.
        </div>
      </div>
    </div>
  );
}
