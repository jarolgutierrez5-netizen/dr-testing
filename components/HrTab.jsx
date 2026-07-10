"use client";
import { useState, useRef, useEffect } from "react";
import { SectionIntro, GameFilter } from "./shared";
import { HrCard } from "./HrCard";
import { getBatterLogs } from "@/lib/dataAccess";
import { battingAgg } from "@/lib/projections";
import { classifyHr, HR_LABELS } from "@/lib/classification";
import { useGameFilter, useFavorites } from "@/lib/hooks";

// focusPlayer/onFocusHandled support deep-linking straight to one player's card --
// e.g. clicking a tracked batter in Pitcher Report's Lineup tab (see
// components/DiamondLedger.jsx's focusHrPlayer). The matching card force-opens and
// scrolls into view once; onFocusHandled then clears the focus so it doesn't fight a
// manual collapse or re-trigger on unrelated re-renders.
export function HrTab({ focusPlayer, onFocusHandled }) {
  const { games, game, setGame, filtered } = useGameFilter(getBatterLogs());
  const [activeLabels, setActiveLabels] = useState(new Set());
  const { favorites, toggleFavorite } = useFavorites();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const focusRef = useRef(null);

  useEffect(() => {
    if (!focusPlayer) return;
    // Give the target card's forceOpen effect a moment to expand before measuring
    // where to scroll -- scrolling against the collapsed height would land short.
    const t = setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      onFocusHandled && onFocusHandled();
    }, 150);
    return () => clearTimeout(t);
  }, [focusPlayer]);

  const toggleLabel = (key) => {
    setActiveLabels(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const visible = filtered.filter(p => {
    if (favoritesOnly && !favorites.has(p.name)) return false;
    if (activeLabels.size === 0) return true;
    const a = battingAgg(p);
    const label = classifyHr(p, a);
    return label && activeLabels.has(label.key);
  });

  return (
    <div>
      <SectionIntro emoji="🔥" label="Home Runs" />
      <GameFilter games={games} value={game} onChange={setGame} />

      <div className="flex flex-wrap gap-2 mb-5">
        {HR_LABELS.map(l => (
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
        {visible.map((p, i) => (
          <HrCard key={i} p={p} isFavorite={favorites.has(p.name)} onToggleFavorite={() => toggleFavorite(p.name)}
            forceOpen={p.name === focusPlayer} rootRef={p.name === focusPlayer ? focusRef : undefined} />
        ))}
      </div>
    </div>
  );
}
