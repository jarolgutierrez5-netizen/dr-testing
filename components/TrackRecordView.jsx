"use client";
import { useState, useEffect } from "react";
import { getBatterLogs, getPitcherLogs } from "@/lib/dataAccess";
import { battingAgg, overProb, pct, projectStrikeouts, computeKLine } from "@/lib/projections";
import { STAT_CONFIGS } from "@/lib/classification";
import { mockAdvancedPitchingMetrics, mockTeamKRate } from "@/lib/mockGenerators";
import { storage } from "@/lib/storage";

// ---- Track Record ----
// Honest by construction: there is no fabricated history here. The log starts empty
// and only grows from real "Log Today's Projections" snapshots taken going forward,
// with outcomes marked manually until real game results are wired in. A fake accuracy
// history would be worse than no history at all -- it's the one thing in this app
// that would actively damage trust if it were invented and someone noticed.
function buildTodaysProjectionSnapshot() {
  const entries = [];
  const batters = getBatterLogs();
  // HR isn't in STAT_CONFIGS -- it uses its own lambda (same one HrCard computes:
  // sample HR rate scaled to a 4-AB game) rather than the config-driven engine the
  // other four stats share, so it's logged separately here with the matching line/emoji.
  batters.forEach(p => {
    const agg = battingAgg(p);
    const prob = overProb((agg.hr / agg.ab) * 4, 0.5);
    entries.push({ id: `${Date.now()}-${p.name}-hr-${Math.random().toString(36).slice(2,7)}`, loggedAt: new Date().toISOString(), player: p.name, statKey: "hr", statLabel: "🔥 Home Runs", lineLabel: "Over 0.5", projectedProb: prob, outcome: null });
  });
  ["hits", "rbi", "tb", "hrrbi"].forEach(key => {
    const cfg = STAT_CONFIGS[key];
    batters.forEach(p => {
      const agg = battingAgg(p);
      const prob = overProb(cfg.lambda(agg), cfg.line);
      entries.push({ id: `${Date.now()}-${p.name}-${key}-${Math.random().toString(36).slice(2,7)}`, loggedAt: new Date().toISOString(), player: p.name, statKey: key, statLabel: `${cfg.emoji} ${cfg.label}`, lineLabel: `Over ${cfg.line}`, projectedProb: prob, outcome: null });
    });
  });
  getPitcherLogs().forEach(pi => {
    const k9Hint = (pi.k / pi.ip) * 9;
    const adv = mockAdvancedPitchingMetrics(pi.name, k9Hint);
    const oppKPct = mockTeamKRate(pi.opp);
    const projK = projectStrikeouts(adv.kPct, oppKPct);
    const { line } = computeKLine(projK);
    entries.push({ id: `${Date.now()}-${pi.name}-k-${Math.random().toString(36).slice(2,7)}`, loggedAt: new Date().toISOString(), player: pi.name, statKey: "k", statLabel: "🎯 Strikeouts", lineLabel: `Over ${line} K`, projectedProb: overProb(projK, line), outcome: null });
  });
  return entries;
}

export function TrackRecordView({ onBack }) {
  const [log, setLog] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("track_record_log");
        if (res) setLog(JSON.parse(res.value));
      } catch (e) { /* empty on first visit -- expected, not an error */ }
      setLoaded(true);
    })();
  }, []);
  useEffect(() => {
    if (!loaded) return;
    storage.set("track_record_log", JSON.stringify(log)).catch(() => {});
  }, [log, loaded]);

  const logToday = () => setLog([...buildTodaysProjectionSnapshot(), ...log]);
  const markOutcome = (id, outcome) => setLog(log.map(e => e.id === id ? { ...e, outcome } : e));
  const clearLog = () => { if (confirm("Clear the entire track record log? This can't be undone.")) setLog([]); };

  const marked = log.filter(e => e.outcome !== null);
  const hits = marked.filter(e => e.outcome === "hit");
  const hitRate = marked.length ? hits.length / marked.length : null;
  const avgProjected = marked.length ? marked.reduce((s,e) => s + e.projectedProb, 0) / marked.length : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-2xl text-slate-50">📈 Track Record</h2>
        <button onClick={onBack} className="font-body text-[12px] text-slate-400 hover:text-slate-200">← Back to projections</button>
      </div>
      <p className="font-body text-[13px] text-slate-400 mb-6 max-w-2xl">
        This is a real, honest ledger, not a highlight reel — it starts empty and only grows from projections you actually log going forward.
        There's no invented history here; a fake accuracy record would be worse than having none. Mark outcomes as real games finish to build a genuine calibration check over time.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={logToday} className="font-body text-[12px] px-4 py-2 rounded-lg border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 transition-colors">
          + Log Today's Projections ({getBatterLogs().length * 5 + getPitcherLogs().length} entries)
        </button>
        {log.length > 0 && (
          <button onClick={clearLog} className="font-body text-[12px] px-4 py-2 rounded-lg border border-slate-500/25 text-slate-400 hover:text-rose-400 hover:border-rose-400/40 transition-colors">
            Clear Log
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div style={{ background: "#111A2E" }} className="rounded-xl border border-slate-500/15 p-4">
          <div className="font-display text-2xl text-slate-50">{log.length}</div>
          <div className="font-body text-[11px] text-slate-500 uppercase tracking-wider mt-1">Total Logged</div>
        </div>
        <div style={{ background: "#111A2E" }} className="rounded-xl border border-slate-500/15 p-4">
          <div className="font-display text-2xl text-slate-50">{avgProjected !== null ? `${pct(avgProjected)}%` : "—"}</div>
          <div className="font-body text-[11px] text-slate-500 uppercase tracking-wider mt-1">Avg Projected (marked)</div>
        </div>
        <div style={{ background: "#111A2E" }} className="rounded-xl border border-slate-500/15 p-4">
          <div className="font-display text-2xl text-slate-50">{hitRate !== null ? `${pct(hitRate)}%` : "—"}</div>
          <div className="font-body text-[11px] text-slate-500 uppercase tracking-wider mt-1">Actual Hit Rate</div>
        </div>
      </div>
      {marked.length > 0 && (
        <p className="font-body text-[11px] text-slate-500 mb-6">
          Well-calibrated projections have Avg Projected and Actual Hit Rate close together — a big gap in either direction is a real signal to revisit the model, not just noise.
        </p>
      )}

      {log.length === 0 ? (
        <p className="font-body text-[13px] text-slate-500">No entries yet. Click "Log Today's Projections" to start the record.</p>
      ) : (
        <div className="space-y-1.5">
          {log.map(e => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-500/15 px-3 py-2">
              <div className="font-body text-[12px] text-slate-300">
                <span className="text-slate-200">{e.player}</span> — {e.statLabel} {e.lineLabel}
                <span className="text-slate-600 ml-2">{new Date(e.loggedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[13px] text-emerald-300">{pct(e.projectedProb)}%</span>
                {e.outcome === null ? (
                  <div className="flex gap-1">
                    <button onClick={() => markOutcome(e.id, "hit")} className="font-body text-[10px] px-2 py-1 rounded-full border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10">Hit</button>
                    <button onClick={() => markOutcome(e.id, "miss")} className="font-body text-[10px] px-2 py-1 rounded-full border border-rose-400/30 text-rose-400 hover:bg-rose-400/10">Miss</button>
                  </div>
                ) : (
                  <span className={`font-body text-[10px] px-2 py-1 rounded-full border ${e.outcome === "hit" ? "border-emerald-400/40 text-emerald-300" : "border-rose-400/40 text-rose-400"}`}>
                    {e.outcome === "hit" ? "✓ Hit" : "✗ Miss"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
