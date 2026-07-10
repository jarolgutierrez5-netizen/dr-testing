"use client";
import { useState, useEffect } from "react";
import { Pill, SectionIntro } from "./shared";
import { getBatterLogs, getPitcherLogs, dataConfidence, pitcherDataConfidence, getInjuryStatus } from "@/lib/dataAccess";
import { battingAgg, overProb, pct, pitcherK9 } from "@/lib/projections";
import { STAT_CONFIGS } from "@/lib/classification";
import { mockAdvancedPitchingMetrics, mockTeamKRate } from "@/lib/mockGenerators";
import { projectStrikeouts, computeKLine } from "@/lib/projections";
import { storage } from "@/lib/storage";

export function ParlayTab() {
  return (
    <div>
      <SectionIntro emoji="🔒🧾" label="Parlay Builds" note="Legs multiplied assuming independence — illustrative combos, not a wagering product." />
      <ParlayBuilder />
    </div>
  );
}

// Quick-start combos -- loading one populates the builder below with real legs you can
// then edit (remove one, add another) instead of being stuck with a fixed preset.
const PARLAY_PRESETS = [
  { title: "Contact Stack", legs: [["Freddie Freeman","hits"], ["Tommy Edman","hits"]] },
  { title: "Power + RBI", legs: [["Shohei Ohtani","hr"], ["Kyle Tucker","rbi"]] },
  { title: "Bases + Punchouts", legs: [["Max Muncy","tb"], ["Justin Wrobleski","k"]] },
];
const MAX_PARLAY_LEGS = 4;

// Builds one leg's full data using the exact same functions every other tab uses --
// no duplicate math living only in the parlay builder to drift out of sync with the
// real cards. Batter stats reuse STAT_CONFIGS; the pitcher K leg reuses the same
// projection/line/cushion engine as the Strikeouts tab.
function buildParlayLeg(name, statKey) {
  if (statKey === "k") {
    const pi = getPitcherLogs().find(x => x.name === name);
    if (!pi) return null;
    const k9Hint = pitcherK9(pi);
    const adv = mockAdvancedPitchingMetrics(pi.name, k9Hint);
    const oppKPct = mockTeamKRate(pi.opp);
    const projK = projectStrikeouts(adv.kPct, oppKPct);
    const { line } = computeKLine(projK);
    return {
      id: `${name}:k`, name, emoji: "🎯", statLabel: "Strikeouts", lineLabel: `Over ${line} K`,
      prob: overProb(projK, line), game: pi.game,
      confidence: pitcherDataConfidence(name), injury: getInjuryStatus(name),
    };
  }
  const cfg = STAT_CONFIGS[statKey];
  const p = getBatterLogs().find(x => x.name === name);
  if (!p || !cfg) return null;
  const agg = battingAgg(p);
  return {
    id: `${name}:${statKey}`, name, emoji: cfg.emoji, statLabel: cfg.label, lineLabel: `Over ${cfg.line}`,
    prob: overProb(cfg.lambda(agg), cfg.line), game: p.game,
    confidence: dataConfidence(name), injury: getInjuryStatus(name),
  };
}

function ParlayBuilder() {
  const [legIds, setLegIds] = useState(PARLAY_PRESETS[0].legs.map(([n,s]) => `${n}:${s}`));
  const [loadedSaved, setLoadedSaved] = useState(false);
  const batterNames = getBatterLogs().map(p => p.name);
  const pitcherNames = getPitcherLogs().map(p => p.name);
  const [selPlayer, setSelPlayer] = useState(batterNames[0]);
  const [selStat, setSelStat] = useState("hits");

  // Load any saved build once on mount. Only overwrite the default preset if
  // something was actually saved -- an empty/missing key means first visit.
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("parlay_build");
        if (res) setLegIds(JSON.parse(res.value));
      } catch (e) { /* nothing saved yet -- normal on first visit */ }
      setLoadedSaved(true);
    })();
  }, []);
  // Save on every change, but not before the initial load above has run --
  // otherwise this would overwrite a saved build with the default preset for
  // one render before the load completes.
  useEffect(() => {
    if (!loadedSaved) return;
    storage.set("parlay_build", JSON.stringify(legIds)).catch(() => {});
  }, [legIds, loadedSaved]);

  const isPitcherSelected = pitcherNames.includes(selPlayer);
  const statOptions = isPitcherSelected
    ? [{ key: "k", label: "🎯 Strikeouts" }]
    : Object.entries(STAT_CONFIGS).map(([key, cfg]) => ({ key, label: `${cfg.emoji} ${cfg.label}` }));

  const legs = legIds.map(id => {
    const sep = id.lastIndexOf(":");
    return buildParlayLeg(id.slice(0, sep), id.slice(sep + 1));
  }).filter(Boolean);

  const combined = legs.length ? legs.reduce((acc, l) => acc * l.prob, 1) : 0;
  const gameSet = new Set(legs.map(l => l.game));
  const hasSameGameLegs = legs.length >= 2 && gameSet.size < legs.length;

  const addLeg = () => {
    const id = `${selPlayer}:${selStat}`;
    if (legs.length >= MAX_PARLAY_LEGS || legIds.includes(id)) return;
    setLegIds([...legIds, id]);
  };
  const removeLeg = (id) => setLegIds(legIds.filter(x => x !== id));
  const loadPreset = (preset) => setLegIds(preset.legs.map(([n,s]) => `${n}:${s}`));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {PARLAY_PRESETS.map((preset, i) => (
          <button key={i} onClick={() => loadPreset(preset)}
            className="font-body text-[11px] px-3 py-1.5 rounded-full border border-fuchsia-400/30 text-fuchsia-300 hover:bg-fuchsia-400/10 transition-colors">
            Load: {preset.title}
          </button>
        ))}
      </div>

      <div style={{ background: "#111A2E" }} className="rounded-2xl border border-fuchsia-400/25 p-5">
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-1">Player</div>
            <select value={selPlayer}
              onChange={(e) => { setSelPlayer(e.target.value); if (pitcherNames.includes(e.target.value)) setSelStat("k"); else if (selStat === "k") setSelStat("hits"); }}
              className="font-body text-[12px] border border-slate-500/25 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400/50"
              style={{ colorScheme: "dark", backgroundColor: "#000000", color: "#EDE6D3" }}>
              <optgroup label="Batters" style={{ backgroundColor: "#000000" }}>
                {batterNames.map(n => <option key={n} value={n} style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>{n}</option>)}
              </optgroup>
              <optgroup label="Pitchers" style={{ backgroundColor: "#000000" }}>
                {pitcherNames.map(n => <option key={n} value={n} style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>{n}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <div className="font-body text-[10px] text-slate-500 uppercase tracking-wider mb-1">Stat</div>
            <select value={selStat} onChange={(e) => setSelStat(e.target.value)}
              className="font-body text-[12px] border border-slate-500/25 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400/50"
              style={{ colorScheme: "dark", backgroundColor: "#000000", color: "#EDE6D3" }}>
              {statOptions.map(o => <option key={o.key} value={o.key} style={{ backgroundColor: "#000000", color: "#EDE6D3" }}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={addLeg} disabled={legs.length >= MAX_PARLAY_LEGS}
            className="font-body text-[12px] px-3 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            + Add Leg
          </button>
          <span className="font-body text-[11px] text-slate-500 pb-1.5">{legs.length}/{MAX_PARLAY_LEGS} legs</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="font-display text-lg text-slate-50">🔒 Your Build</div>
          <div className="text-right">
            <div className="font-display text-3xl text-fuchsia-300 leading-none">{legs.length ? pct(combined) : "—"}%</div>
            <div className="font-body text-[10px] tracking-wider text-slate-400 mt-1 uppercase">Parlay Hit %</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {legs.length === 0 && <p className="font-body text-[12px] text-slate-500">Add a leg above, or load a preset.</p>}
          {legs.map(l => (
            <div key={l.id} className="rounded-lg border border-slate-500/20 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] text-slate-200">{l.emoji} {l.name} <span className="text-slate-500">— {l.statLabel}, {l.lineLabel}</span></span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-300 font-display text-[13px]">{pct(l.prob)}%</span>
                  <button onClick={() => removeLeg(l.id)} className="text-slate-500 hover:text-rose-400 font-body text-[13px] leading-none px-1">×</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Pill label="Status" value={l.injury ? l.injury.status : "No report"} tone={l.injury ? l.injury.tone : "slate"} />
                <Pill label="Confidence" value={l.confidence.label} tone={l.confidence.tone} />
              </div>
            </div>
          ))}
        </div>

        {hasSameGameLegs && (
          <p className="font-body text-[11px] text-amber-300 mt-3">
            ⚠️ Two or more legs share the same game — real correlation between them isn't modeled, so this combined number leans more optimistic than reality if those outcomes tend to move together.
          </p>
        )}

        <div className="h-px bg-slate-500/15 my-4" />
        <p className="font-body text-[13px] text-slate-300 leading-relaxed">
          <span className="text-slate-50 font-semibold">Why: </span>
          Combined probability multiplies each leg's independent edge, computed with the exact same math as that player's own card elsewhere in the app — a simplifying v1 assumption on independence, not a separate calculation that could drift out of sync.
        </p>
        <p className="font-body text-[11px] text-slate-500 mt-2">
          These sample matchups (LAD vs COL, TB vs NYY) aren't part of today's live 13-game slate, so there's no real first-pitch time to lock legs against yet — Games Today's 15-minute lock will apply here too once a live schedule is wired in.
        </p>
      </div>
    </div>
  );
}
