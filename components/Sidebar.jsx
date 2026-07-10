"use client";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { SportBadge } from "./shared";
import { SPORTS } from "@/data";

export function Sidebar({ sport, setSport, collapsed, setCollapsed, showTrackRecord, setShowTrackRecord }) {
  return (
    <div style={{ background: "#0D1526" }} className={`shrink-0 border-r border-slate-500/15 flex flex-col transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}>
      <div className={`flex items-center h-16 border-b border-slate-500/15 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <span className="font-display font-bold text-sm text-slate-50 tracking-wide">LEDGER</span>}
        <button onClick={()=>setCollapsed(!collapsed)} className="text-slate-500 hover:text-emerald-300 transition-colors">
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {!collapsed && <div className="font-body text-[10px] tracking-[0.2em] text-slate-600 px-2 mb-2">SPORTS</div>}
        {SPORTS.map(s => (
          <button
            key={s.key}
            onClick={()=>{ if (s.live) { setSport(s.key); setShowTrackRecord(false); } }}
            title={s.label}
            className={`flex items-center gap-3 rounded-lg px-2 py-2 font-body text-[13px] transition-colors ${collapsed ? "justify-center" : ""} ${
              sport===s.key && !showTrackRecord ? "bg-emerald-400/10 text-emerald-300"
              : s.live ? "text-slate-300 hover:bg-slate-500/10"
              : "text-slate-600 cursor-not-allowed"
            }`}
          >
            <SportBadge emoji={s.emoji} active={sport===s.key && !showTrackRecord} />
            {!collapsed && (
              <span className="flex-1 text-left">
                {s.label}
                {!s.live && <span className="ml-1.5 text-[9px] text-slate-600">SOON</span>}
              </span>
            )}
          </button>
        ))}

        {!collapsed && <div className="font-body text-[10px] tracking-[0.2em] text-slate-600 px-2 mb-2 mt-4">TOOLS</div>}
        <button
          onClick={() => setShowTrackRecord(true)}
          title="Track Record"
          className={`flex items-center gap-3 rounded-lg px-2 py-2 font-body text-[13px] transition-colors ${collapsed ? "justify-center" : ""} ${
            showTrackRecord ? "bg-emerald-400/10 text-emerald-300" : "text-slate-300 hover:bg-slate-500/10"
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display text-[11px] shrink-0 border ${showTrackRecord ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-300" : "border-slate-500/25 text-slate-400"}`}>📈</div>
          {!collapsed && <span className="flex-1 text-left">Track Record</span>}
        </button>
      </nav>
    </div>
  );
}
