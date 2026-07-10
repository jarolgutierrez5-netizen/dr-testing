"use client";
import { useState } from "react";
import { SectionIntro, GameFilter } from "./shared";
import { StatCard } from "./StatCard";
import { getBatterLogs } from "@/lib/dataAccess";
import { battingAgg } from "@/lib/projections";
import { STAT_CONFIGS, classifySampleStat, SAMPLE_STAT_LABELS } from "@/lib/classification";
import { useGameFilter, useFavorites } from "@/lib/hooks";

// Shared tab shell for the four sample-classified stats (Hits, RBIs, Total Bases,
// H+R+RBI) -- same structure as HrTab (filter row + label filtering + card grid),
// just parameterized by which STAT_CONFIGS entry drives it. Avoids four near-copies
// of the same 30 lines of boilerplate.
export function GenericStatTab({ cfgKey }) {
  const cfg = STAT_CONFIGS[cfgKey];
  const { games, game, setGame, filtered } = useGameFilter(getBatterLogs());
  const [activeLabels, setActiveLabels] = useState(new Set());
  const { favorites, toggleFavorite } = useFavorites();
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const toggleLabel = (key) => {
    setActiveLabels(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const classify = (p) => cfg.classify ? cfg.classify(p, battingAgg(p)) : classifySampleStat(cfg.sampleVal(battingAgg(p)), cfg);
  const labelOptions = cfg.labelOptions || SAMPLE_STAT_LABELS;

  const visible = filtered.filter(p => {
    if (favoritesOnly && !favorites.has(p.name)) return false;
    if (activeLabels.size === 0) return true;
    return activeLabels.has(classify(p).key);
  });

  return (
    <div>
      <SectionIntro emoji={cfg.emoji} label={cfg.label} />
      <GameFilter games={games} value={game} onChange={setGame} />

      <div className="flex flex-wrap gap-2 mb-5">
        {labelOptions.map(l => (
          <button key={l.key} onClick={() => toggleLabel(l.key)}
            className={`font-body text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
              activeLabels.has(l.key) ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-slate-500/25 text-slate-400 hover:border-slate-400/40"
            }`}>
            {l.text}
          </button>
        ))}
        <button onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`font-body text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
            favoritesOnly ? "border-amber-400/50 bg-amber-400/10 text-amber-300" : "border-slate-500/25 text-slate-400 hover:border-slate-400/40"
          }`}>
          ⭐ Favorites Only
        </button>
        {activeLabels.size > 0 && (
          <button onClick={() => setActiveLabels(new Set())} className="font-body text-[11px] px-3 py-1.5 text-slate-500 hover:text-slate-300">
            Clear
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {visible.map((p, i) => <StatCard key={i} p={p} cfg={cfg} isFavorite={favorites.has(p.name)} onToggleFavorite={() => toggleFavorite(p.name)} />)}
      </div>
    </div>
  );
}

export function HitsTab() { return <GenericStatTab cfgKey="hits" />; }
export function RbiTab() { return <GenericStatTab cfgKey="rbi" />; }
export function TbTab() { return <GenericStatTab cfgKey="tb" />; }
export function HrrbiTab() { return <GenericStatTab cfgKey="hrrbi" />; }
